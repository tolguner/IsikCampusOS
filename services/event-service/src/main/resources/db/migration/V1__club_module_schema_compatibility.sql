ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS requires_approval boolean;

UPDATE clubs
SET requires_approval = false
WHERE requires_approval IS NULL;

ALTER TABLE clubs
    ALTER COLUMN requires_approval SET DEFAULT false,
    ALTER COLUMN requires_approval SET NOT NULL;

ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS is_deleted boolean;

UPDATE clubs
SET is_deleted = false
WHERE is_deleted IS NULL;

ALTER TABLE clubs
    ALTER COLUMN is_deleted SET DEFAULT false,
    ALTER COLUMN is_deleted SET NOT NULL;

ALTER TABLE clubs
    ADD COLUMN IF NOT EXISTS deleted_at timestamp;

ALTER TABLE club_members
    ADD COLUMN IF NOT EXISTS status varchar(255);

UPDATE club_members
SET status = 'ACTIVE'
WHERE status IS NULL;

ALTER TABLE club_members
    ALTER COLUMN status SET DEFAULT 'ACTIVE',
    ALTER COLUMN status SET NOT NULL;
