CREATE TABLE IF NOT EXISTS audit_logs (
    id varchar(255) PRIMARY KEY,
    entity_type varchar(255) NOT NULL,
    entity_id varchar(255) NOT NULL,
    action varchar(255) NOT NULL,
    actor_id varchar(255) NOT NULL,
    actor_role varchar(255),
    message text NOT NULL,
    metadata text,
    created_at timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS club_health_records (
    id varchar(255) PRIMARY KEY,
    club_id varchar(255) NOT NULL UNIQUE,
    watchlisted boolean NOT NULL DEFAULT false,
    latest_note text,
    latest_note_by varchar(255),
    latest_note_at timestamp,
    updated_at timestamp
);

UPDATE club_members
SET status = 'ACTIVE'
WHERE status = 'PENDING';

UPDATE clubs
SET requires_approval = false
WHERE requires_approval IS DISTINCT FROM false;
