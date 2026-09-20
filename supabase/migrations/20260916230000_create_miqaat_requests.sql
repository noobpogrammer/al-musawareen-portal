-- Migration: Create miqaat_requests table for availability workflow

CREATE TABLE IF NOT EXISTS public.miqaat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    miqaat_name TEXT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    notes TEXT,
    created_by TEXT,
    member_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.miqaat_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select miqaat requests for authenticated"
ON public.miqaat_requests FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow all for admin and authorized hr miqaat requests"
ON public.miqaat_requests FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' 
            OR (hr_permissions IS NOT NULL AND (hr_permissions->>'assignCoverage')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' 
            OR (hr_permissions IS NOT NULL AND (hr_permissions->>'assignCoverage')::boolean = true)
        )
    )
);

CREATE POLICY "Allow member response update miqaat requests"
ON public.miqaat_requests FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
