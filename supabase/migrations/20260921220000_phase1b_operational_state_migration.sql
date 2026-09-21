-- Migration: Phase 1B Operational State Migration (Sharaf Allocations, Events, Miqaats, Zones, Topics, App Settings)

-- 1. Create App Settings Table for Global Portal Configuration (e.g. Safar Mode)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Indexes and Constraints
ALTER TABLE public.data_dumps
    DROP CONSTRAINT IF EXISTS unique_sharaf_allocation_its_number;

ALTER TABLE public.data_dumps
    ADD CONSTRAINT unique_sharaf_allocation_its_number
    UNIQUE (sharaf_allocation_id, its_number);

CREATE INDEX IF NOT EXISTS idx_sharaf_allocations_its_number ON public.sharaf_allocations (its_number);
CREATE INDEX IF NOT EXISTS idx_data_dumps_sharaf_allocation_id ON public.data_dumps (sharaf_allocation_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_miqaats_name_lower ON public.miqaats (LOWER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_zones_name_lower ON public.zones (LOWER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_name_lower ON public.topics (LOWER(TRIM(name)), LOWER(TRIM(category)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_sharaf_events_name_lower ON public.sharaf_events (LOWER(TRIM(name)));

-- 3. Prevent Deleting Default Sharaf Event Types
CREATE OR REPLACE FUNCTION public.prevent_delete_default_sharaf_event()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_default = true THEN
        RAISE EXCEPTION 'Cannot delete default Sharaf event type: %', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_default_sharaf_event ON public.sharaf_events;
CREATE TRIGGER trg_prevent_delete_default_sharaf_event
BEFORE DELETE ON public.sharaf_events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_default_sharaf_event();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miqaats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharaf_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharaf_allocations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- A. App Settings Policies
DROP POLICY IF EXISTS "Allow authenticated read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin and authorized hr write app_settings" ON public.app_settings;

CREATE POLICY "Allow authenticated read app_settings"
ON public.app_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin and authorized hr write app_settings"
ON public.app_settings FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
);

-- B. Miqaats Policies
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.miqaats;
DROP POLICY IF EXISTS "Allow admin write" ON public.miqaats;
DROP POLICY IF EXISTS "Allow authenticated read miqaats" ON public.miqaats;
DROP POLICY IF EXISTS "Allow admin and authorized hr manage miqaats" ON public.miqaats;

CREATE POLICY "Allow authenticated read miqaats"
ON public.miqaats FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin and authorized hr manage miqaats"
ON public.miqaats FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
);

-- C. Zones Policies
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.zones;
DROP POLICY IF EXISTS "Allow admin write" ON public.zones;
DROP POLICY IF EXISTS "Allow authenticated read zones" ON public.zones;
DROP POLICY IF EXISTS "Allow admin and authorized hr manage zones" ON public.zones;

CREATE POLICY "Allow authenticated read zones"
ON public.zones FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin and authorized hr manage zones"
ON public.zones FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
);

-- D. Topics Policies
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.topics;
DROP POLICY IF EXISTS "Allow admin write" ON public.topics;
DROP POLICY IF EXISTS "Allow authenticated read topics" ON public.topics;
DROP POLICY IF EXISTS "Allow admin and authorized hr manage topics" ON public.topics;

CREATE POLICY "Allow authenticated read topics"
ON public.topics FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin and authorized hr manage topics"
ON public.topics FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'systemSettings')::boolean = true)
        )
    )
);

-- E. Sharaf Events Policies
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.sharaf_events;
DROP POLICY IF EXISTS "Allow admin write" ON public.sharaf_events;
DROP POLICY IF EXISTS "Allow authenticated read sharaf_events" ON public.sharaf_events;
DROP POLICY IF EXISTS "Allow admin and authorized hr manage sharaf_events" ON public.sharaf_events;

CREATE POLICY "Allow authenticated read sharaf_events"
ON public.sharaf_events FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin and authorized hr manage sharaf_events"
ON public.sharaf_events FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'manageSharaf')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'manageSharaf')::boolean = true)
        )
    )
);

-- F. Sharaf Allocations Policies
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.sharaf_allocations;
DROP POLICY IF EXISTS "Allow individual insert/update" ON public.sharaf_allocations;
DROP POLICY IF EXISTS "Allow admin write allocations" ON public.sharaf_allocations;
DROP POLICY IF EXISTS "Allow select sharaf_allocations for authorized users" ON public.sharaf_allocations;
DROP POLICY IF EXISTS "Allow admin and authorized hr write sharaf_allocations" ON public.sharaf_allocations;

CREATE POLICY "Allow select sharaf_allocations for authorized users"
ON public.sharaf_allocations FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'manageSharaf')::boolean = true)
            OR (m.its_id = public.sharaf_allocations.its_number)
        )
    )
);

CREATE POLICY "Allow admin and authorized hr write sharaf_allocations"
ON public.sharaf_allocations FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'manageSharaf')::boolean = true)
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
        AND (
            m.role = 'admin'
            OR (m.hr_permissions IS NOT NULL AND (m.hr_permissions->>'manageSharaf')::boolean = true)
        )
    )
);

-- 6. Seed Static Definitions & Default App Settings

-- Safar Mode Global Setting
INSERT INTO public.app_settings (key, value)
VALUES ('safar_mode', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Default Sharaf Event Types
INSERT INTO public.sharaf_events (id, name, is_default)
VALUES 
    ('waaz', 'Waaz', true),
    ('qadambosi', 'Qadambosi', true),
    ('nikah', 'Nikah', true),
    ('misaq', 'Misaq', true),
    ('ziyafat', 'Ziyafat', true)
ON CONFLICT (id) DO UPDATE SET is_default = EXCLUDED.is_default, name = EXCLUDED.name;

-- Predefined Miqaats
INSERT INTO public.miqaats (id, name)
VALUES
    ('m1', 'Ashara Mubarakah 1448H'),
    ('m2', 'Chehlum Imam Husain 1448H'),
    ('m3', 'Milad al-Nabi al-Adham 1448H'),
    ('m4', 'Washeq Night Miqaat 1448H')
ON CONFLICT (id) DO NOTHING;

-- Predefined Zones
INSERT INTO public.zones (id, name, description)
VALUES
    ('z1', 'Karachi South (Taheri Masjid)', 'Main masjid compound and surrounding streets'),
    ('z2', 'Saddar Zone (Burhani Masjid)', 'Auxiliary prayer hall and crowd control pathways'),
    ('z3', 'Clifton / DHA', 'Secondary community centers and transport hubs'),
    ('z4', 'Sahn-e-Masjid (Main Courtyard)', 'Central open-air courtyard coverage'),
    ('z5', 'Mawaid-e-Saifee (Dining)', 'Dining halls and meal preparation areas'),
    ('z6', 'Mazar-e-Qutbi (Spiritual Shrine)', 'Holy shrines and visiting pilgrim areas'),
    ('z7', 'Al-Vazarat (Administrative)', 'Offices, registration, and security gates')
ON CONFLICT (id) DO NOTHING;

-- Predefined Topics
INSERT INTO public.topics (id, name, category)
VALUES
    ('t1', 'Ashara Ohbat (Venue & Construction)', 'Preparation'),
    ('t2', 'Syedna (TUS) Arrival & Istiqbal', 'Milestone'),
    ('t3', 'Waaz Shareef (Sermon Coverage)', 'Core Event'),
    ('t4', 'Mumineen Devotion (Matam & Bukat)', 'Emotional Focus'),
    ('t5', 'Khidmat & Volunteers (Scouts & Medical)', 'Service'),
    ('t6', 'Mawaid Catering & Distribution', 'Support'),
    ('t7', 'Night Miqaats & Lailatul Qadr', 'Special Prayer')
ON CONFLICT (id) DO NOTHING;
