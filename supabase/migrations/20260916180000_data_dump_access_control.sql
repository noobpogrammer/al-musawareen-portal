-- 1. Ensure members table has hr_permissions and roles columns
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS hr_permissions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT NULL;

-- 2. Create Data Dump tracking table
CREATE TABLE IF NOT EXISTS public.data_dumps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    its_number TEXT NOT NULL REFERENCES public.members(its_id) ON DELETE CASCADE,
    event_name TEXT,
    date DATE,
    zone TEXT,
    card_received BOOLEAN NOT NULL DEFAULT false,
    card_received_at TIMESTAMP WITH TIME ZONE,
    card_received_by TEXT,
    card_copied BOOLEAN NOT NULL DEFAULT false,
    card_copied_at TIMESTAMP WITH TIME ZONE,
    card_copied_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on data_dumps table
ALTER TABLE public.data_dumps ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Allow read data dumps" ON public.data_dumps;
DROP POLICY IF EXISTS "Allow write data dumps" ON public.data_dumps;
DROP POLICY IF EXISTS "Allow admin and authorized hr select data dumps" ON public.data_dumps;
DROP POLICY IF EXISTS "Allow admin and authorized hr write data dumps" ON public.data_dumps;

-- 5. Create RLS Policies for data_dumps
-- Read policy: Admin and authorized HR users with manageDataDump permission (or coordinator role)
CREATE POLICY "Allow admin and authorized hr select data dumps" 
ON public.data_dumps FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' 
            OR (hr_permissions IS NOT NULL AND (hr_permissions->>'manageDataDump')::boolean = true)
        )
    )
);

-- Write policy (Insert, Update, Delete): Only Admin and authorized HR users with manageDataDump permission
CREATE POLICY "Allow admin and authorized hr write data dumps" 
ON public.data_dumps FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' 
            OR (hr_permissions IS NOT NULL AND (hr_permissions->>'manageDataDump')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' 
            OR (hr_permissions IS NOT NULL AND (hr_permissions->>'manageDataDump')::boolean = true)
        )
    )
);
