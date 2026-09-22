-- Create coverage_requests table for public community organizations requesting event coverage
CREATE TABLE IF NOT EXISTS public.coverage_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    event_name TEXT NOT NULL,
    event_date DATE,
    location TEXT,
    coverage_type TEXT NOT NULL CHECK (coverage_type IN ('photography', 'videography', 'both')),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'accepted', 'declined', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coverage_requests ENABLE ROW LEVEL SECURITY;

-- 1. Public insert policy (unauthenticated visitors and registered users can submit requests)
CREATE POLICY "Public and users can insert coverage requests"
    ON public.coverage_requests
    FOR INSERT
    WITH CHECK (true);

-- 2. Authenticated Admin and Coordinator view policy
CREATE POLICY "Admins and coordinators can view coverage requests"
    ON public.coverage_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members
            WHERE members.id = auth.uid()
            AND (members.role = 'admin' OR members.role = 'coordinator')
        )
    );

-- 3. Authenticated Admin and Coordinator update policy
CREATE POLICY "Admins and coordinators can update coverage requests"
    ON public.coverage_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.members
            WHERE members.id = auth.uid()
            AND (members.role = 'admin' OR members.role = 'coordinator')
        )
    );
