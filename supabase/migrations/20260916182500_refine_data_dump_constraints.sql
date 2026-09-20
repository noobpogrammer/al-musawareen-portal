-- 1. Add card_notes column to data_dumps table if not present
ALTER TABLE public.data_dumps
ADD COLUMN IF NOT EXISTS card_notes TEXT;

-- 2. Populate card_notes from notes if present
UPDATE public.data_dumps
SET card_notes = notes
WHERE card_notes IS NULL AND notes IS NOT NULL;

-- 3. Add constraint to prevent card_copied = true when card_received = false
ALTER TABLE public.data_dumps
DROP CONSTRAINT IF EXISTS check_card_copied_requires_received;

ALTER TABLE public.data_dumps
ADD CONSTRAINT check_card_copied_requires_received
CHECK (card_copied = false OR card_received = true);

-- 4. Add unique constraint for (assignment_id, its_number) to prevent duplicates
ALTER TABLE public.data_dumps
DROP CONSTRAINT IF EXISTS unique_assignment_its_number;

ALTER TABLE public.data_dumps
ADD CONSTRAINT unique_assignment_its_number
UNIQUE (assignment_id, its_number);
