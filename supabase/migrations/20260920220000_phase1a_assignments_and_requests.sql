-- Migration: Phase 1A - Assignments, Miqaat Requests, Notifications & Secure RPCs

-- 1. Extend Assignments Table with member_decline_reasons
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS member_decline_reasons JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Extend Assignment Notifications Table with decline_reason
ALTER TABLE public.assignment_notifications
ADD COLUMN IF NOT EXISTS decline_reason TEXT DEFAULT NULL;

-- 3. Ensure Shot Reports unique constraint on (assignment_id, its_number)
ALTER TABLE public.shot_reports
DROP CONSTRAINT IF EXISTS unique_shot_report_assignment_its;

ALTER TABLE public.shot_reports
ADD CONSTRAINT unique_shot_report_assignment_its
UNIQUE (assignment_id, its_number);

-- 4. Secure RPC: respond_to_miqaat_request
CREATE OR REPLACE FUNCTION public.respond_to_miqaat_request(
    target_request_id UUID,
    response_status TEXT,
    decline_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    calling_user_id UUID;
    calling_its TEXT;
    target_req RECORD;
    new_resp JSONB;
    updated_responses JSONB;
    now_iso TEXT;
    return_data JSONB;
BEGIN
    -- 1. Require authenticated user
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- 2. Validate response_status
    IF response_status NOT IN ('accepted', 'declined') THEN
        RAISE EXCEPTION 'Invalid response status. Must be accepted or declined.';
    END IF;

    -- 3. Resolve auth.uid() -> members.its_id
    SELECT its_id INTO calling_its
    FROM public.members
    WHERE id = calling_user_id;

    IF calling_its IS NULL OR calling_its = '' THEN
        RAISE EXCEPTION 'Member profile not found for current user.';
    END IF;

    -- 4. Load the target miqaat request
    SELECT * INTO target_req
    FROM public.miqaat_requests
    WHERE id = target_request_id;

    IF target_req IS NULL THEN
        RAISE EXCEPTION 'Miqaat request not found.';
    END IF;

    -- 5. Verify current ITS exists in member_responses
    IF target_req.member_responses IS NULL OR NOT (target_req.member_responses ? calling_its) THEN
        RAISE EXCEPTION 'User % is not requested for this Miqaat.', calling_its;
    END IF;

    -- 6. Construct updated response for this member
    now_iso := to_char(timezone('utc'::text, now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    
    new_resp := jsonb_build_object(
        'itsNumber', calling_its,
        'status', response_status,
        'respondedAt', now_iso
    );

    IF response_status = 'declined' AND decline_reason IS NOT NULL AND trim(decline_reason) <> '' THEN
        new_resp := new_resp || jsonb_build_object('declineReason', trim(decline_reason));
    END IF;

    -- 7. Update member_responses JSONB object
    updated_responses := jsonb_set(
        COALESCE(target_req.member_responses, '{}'::jsonb),
        ARRAY[calling_its],
        new_resp,
        true
    );

    -- 8. Persist update to public.miqaat_requests
    UPDATE public.miqaat_requests
    SET member_responses = updated_responses,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_request_id;

    -- 9. Return updated row as JSON
    SELECT to_jsonb(r) INTO return_data
    FROM public.miqaat_requests r
    WHERE r.id = target_request_id;

    RETURN return_data;
END;
$$;

-- 5. Secure RPC: respond_to_assignment
CREATE OR REPLACE FUNCTION public.respond_to_assignment(
    target_assignment_id UUID,
    response_status TEXT,
    decline_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    calling_user_id UUID;
    calling_its TEXT;
    calling_name TEXT;
    target_as RECORD;
    updated_statuses JSONB;
    updated_reasons JSONB;
    notif_title TEXT;
    notif_msg TEXT;
    now_iso TIMESTAMPTZ;
    return_data JSONB;
BEGIN
    -- 1. Require authenticated user
    calling_user_id := auth.uid();
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- 2. Validate response_status
    IF response_status NOT IN ('accepted', 'declined') THEN
        RAISE EXCEPTION 'Invalid response status. Must be accepted or declined.';
    END IF;

    -- 3. Resolve auth.uid() -> members.its_id and full_name
    SELECT its_id, full_name INTO calling_its, calling_name
    FROM public.members
    WHERE id = calling_user_id;

    IF calling_its IS NULL OR calling_its = '' THEN
        RAISE EXCEPTION 'Member profile not found for current user.';
    END IF;

    -- 4. Load the target assignment
    SELECT * INTO target_as
    FROM public.assignments
    WHERE id = target_assignment_id;

    IF target_as IS NULL THEN
        RAISE EXCEPTION 'Assignment not found.';
    END IF;

    -- 5. Verify current ITS is in assigned_users
    IF target_as.assigned_users IS NULL OR NOT (calling_its = ANY(target_as.assigned_users)) THEN
        RAISE EXCEPTION 'User % is not assigned to this coverage task.', calling_its;
    END IF;

    -- 6. Update member_statuses
    updated_statuses := jsonb_set(
        COALESCE(target_as.member_statuses, '{}'::jsonb),
        ARRAY[calling_its],
        to_jsonb(response_status),
        true
    );

    -- 7. Update member_decline_reasons
    updated_reasons := COALESCE(target_as.member_decline_reasons, '{}'::jsonb);
    IF response_status = 'declined' AND decline_reason IS NOT NULL AND trim(decline_reason) <> '' THEN
        updated_reasons := jsonb_set(
            updated_reasons,
            ARRAY[calling_its],
            to_jsonb(trim(decline_reason)),
            true
        );
    ELSE
        -- If accepted, remove prior decline reason if present
        updated_reasons := updated_reasons - calling_its;
    END IF;

    -- 8. Persist update to public.assignments
    UPDATE public.assignments
    SET member_statuses = updated_statuses,
        member_decline_reasons = updated_reasons
    WHERE id = target_assignment_id;

    -- 9. Create atomic notification in public.assignment_notifications
    IF target_as.topics IS NOT NULL AND jsonb_typeof(target_as.topics) = 'array' AND jsonb_array_length(target_as.topics) > 0 THEN
        SELECT string_agg(elem::text, ', ') INTO notif_title
        FROM jsonb_array_elements_text(target_as.topics) AS elem;
    ELSE
        notif_title := COALESCE(target_as.zone, 'Coverage Task');
    END IF;

    IF response_status = 'accepted' THEN
        notif_msg := COALESCE(calling_name, 'Member') || ' confirmed ' || notif_title || ' coverage.';
    ELSE
        notif_msg := COALESCE(calling_name, 'Member') || ' declined ' || notif_title || ' coverage' ||
            CASE WHEN decline_reason IS NOT NULL AND trim(decline_reason) <> '' THEN ' (' || trim(decline_reason) || ')' ELSE '' END ||
            ' — 1 slot needs reassignment.';
    END IF;

    now_iso := timezone('utc'::text, now());

    INSERT INTO public.assignment_notifications (
        assignment_id,
        its_number,
        member_name,
        assignment_title,
        action,
        decline_reason,
        timestamp,
        read
    ) VALUES (
        target_assignment_id,
        calling_its,
        COALESCE(calling_name, calling_its),
        notif_msg,
        response_status,
        CASE WHEN response_status = 'declined' THEN trim(decline_reason) ELSE NULL END,
        now_iso,
        false
    );

    -- 10. Return updated assignment row as JSON
    SELECT to_jsonb(a) INTO return_data
    FROM public.assignments a
    WHERE a.id = target_assignment_id;

    RETURN return_data;
END;
$$;

-- 6. RLS Policy Updates & Security Tightening

-- Drop overly broad member update policy on miqaat_requests
DROP POLICY IF EXISTS "Allow member response update miqaat requests" ON public.miqaat_requests;

-- Drop overly broad write policy on assignment_notifications
DROP POLICY IF EXISTS "Allow write notifications" ON public.assignment_notifications;

-- Create policy for Admin and authorized HR to manage notifications (mark read, etc.)
DROP POLICY IF EXISTS "Allow admin and authorized hr manage notifications" ON public.assignment_notifications;

CREATE POLICY "Allow admin and authorized hr manage notifications" 
ON public.assignment_notifications FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role IN ('admin', 'coordinator')
            OR (hr_permissions IS NOT NULL AND (
                (hr_permissions->>'assignCoverage')::boolean = true OR
                (hr_permissions->>'viewAssignments')::boolean = true
            ))
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role IN ('admin', 'coordinator')
            OR (hr_permissions IS NOT NULL AND (
                (hr_permissions->>'assignCoverage')::boolean = true OR
                (hr_permissions->>'viewAssignments')::boolean = true
            ))
        )
    )
);

-- Ensure execute grants on RPCs
GRANT EXECUTE ON FUNCTION public.respond_to_miqaat_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_assignment(UUID, TEXT, TEXT) TO authenticated;
