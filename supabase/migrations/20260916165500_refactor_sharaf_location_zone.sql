-- 1. Add zone column if not present
ALTER TABLE public.sharaf_allocations
ADD COLUMN IF NOT EXISTS zone TEXT;

-- 2. Migrate existing waaz_zone to zone if waaz_zone exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'sharaf_allocations' 
          AND column_name = 'waaz_zone'
    ) THEN
        UPDATE public.sharaf_allocations
        SET zone = waaz_zone
        WHERE zone IS NULL AND waaz_zone IS NOT NULL;

        ALTER TABLE public.sharaf_allocations DROP COLUMN IF EXISTS waaz_zone;
    END IF;
END $$;

-- 3. Drop legacy Sharaf-only mohalla and is_custom_zone columns if they exist
ALTER TABLE public.sharaf_allocations DROP COLUMN IF EXISTS mohalla;
ALTER TABLE public.sharaf_allocations DROP COLUMN IF EXISTS is_custom_zone;
