-- Migration: Phase 1A.1 Authorization & Least-Privilege RLS Cleanup

-- 1. Explicitly configure execute privileges on RPC functions
REVOKE ALL ON FUNCTION public.respond_to_assignment(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_assignment(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_to_assignment(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.respond_to_miqaat_request(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_miqaat_request(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_to_miqaat_request(UUID, TEXT, TEXT) TO authenticated;

-- 2. Restrict Assignments Read RLS to Least-Privilege
DROP POLICY IF EXISTS "Allow read assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow select assignments for authorized users" ON public.assignments;

CREATE POLICY "Allow select assignments for authorized users"
ON public.assignments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role IN ('admin', 'coordinator')
            OR (m.hr_permissions IS NOT NULL AND (
                (m.hr_permissions->>'assignCoverage')::boolean = true OR
                (m.hr_permissions->>'viewAssignments')::boolean = true
            ))
            OR (public.assignments.assigned_users IS NOT NULL AND m.its_id = ANY(public.assignments.assigned_users))
        )
    )
);

-- 3. Restrict Miqaat Requests Read RLS to Least-Privilege
DROP POLICY IF EXISTS "Allow select miqaat requests for authenticated" ON public.miqaat_requests;
DROP POLICY IF EXISTS "Allow select miqaat requests for authorized users" ON public.miqaat_requests;

CREATE POLICY "Allow select miqaat requests for authorized users"
ON public.miqaat_requests FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role IN ('admin', 'coordinator')
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'assignCoverage')::boolean = true)
            OR (public.miqaat_requests.member_responses IS NOT NULL AND public.miqaat_requests.member_responses ? m.its_id)
        )
    )
);

-- 4. Restrict Assignment Notifications Read RLS to Admin and Authorized HR
DROP POLICY IF EXISTS "Allow read notifications" ON public.assignment_notifications;
DROP POLICY IF EXISTS "Allow admin and authorized hr read notifications" ON public.assignment_notifications;

CREATE POLICY "Allow admin and authorized hr read notifications"
ON public.assignment_notifications FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid() 
        AND (
            m.role IN ('admin', 'coordinator')
            OR (m.hr_permissions IS NOT NULL AND (
                (m.hr_permissions->>'assignCoverage')::boolean = true OR
                (m.hr_permissions->>'viewAssignments')::boolean = true
            ))
        )
    )
);
