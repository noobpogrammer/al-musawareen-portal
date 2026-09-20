-- Migration: Timing model, physical card submissions, and unified data dump support

-- 1. Extend Assignments Table with timing and deadline fields
ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS from_time TEXT,
    ADD COLUMN IF NOT EXISTS to_time TEXT,
    ADD COLUMN IF NOT EXISTS data_copying_deadline_date DATE,
    ADD COLUMN IF NOT EXISTS data_copying_deadline_time TEXT;

-- 2. Extend Sharaf Allocations Table with date, timing and deadline fields
ALTER TABLE public.sharaf_allocations
    ADD COLUMN IF NOT EXISTS date DATE,
    ADD COLUMN IF NOT EXISTS data_copying_deadline_date DATE,
    ADD COLUMN IF NOT EXISTS data_copying_deadline_time TEXT;

-- 3. Extend Shot Reports Table to support physical card submissions and quick percent completion
ALTER TABLE public.shot_reports
    ALTER COLUMN drive_link DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS submission_method TEXT DEFAULT 'drive',
    ADD COLUMN IF NOT EXISTS touch_point_completion_mode TEXT DEFAULT 'exact',
    ADD COLUMN IF NOT EXISTS completion_percent_override INTEGER,
    ADD COLUMN IF NOT EXISTS completed_touch_points JSONB,
    ADD COLUMN IF NOT EXISTS admin_override JSONB,
    ADD COLUMN IF NOT EXISTS red_star_flags JSONB;

-- 4. Extend Data Dumps Table to support touch point completion metadata and Sharaf allocations
ALTER TABLE public.data_dumps
    ADD COLUMN IF NOT EXISTS sharaf_allocation_id UUID REFERENCES public.sharaf_allocations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS touch_point_completion_mode TEXT DEFAULT 'exact',
    ADD COLUMN IF NOT EXISTS completion_percent_override INTEGER,
    ADD COLUMN IF NOT EXISTS completed_touch_points JSONB;
