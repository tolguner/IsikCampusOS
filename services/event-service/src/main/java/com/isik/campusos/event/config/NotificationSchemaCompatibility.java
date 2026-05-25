package com.isik.campusos.event.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationSchemaCompatibility implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF to_regclass('public.notifications') IS NOT NULL THEN
                        ALTER TABLE notifications
                            DROP CONSTRAINT IF EXISTS notifications_target_audience_check;
                        ALTER TABLE notifications
                            ADD CONSTRAINT notifications_target_audience_check
                            CHECK (target_audience IN ('USER', 'ALL_STUDENTS', 'CLUB_PRESIDENTS', 'SKS_ADMINS'));

                        ALTER TABLE notifications
                            DROP CONSTRAINT IF EXISTS notifications_type_check;
                        ALTER TABLE notifications
                            ADD CONSTRAINT notifications_type_check
                            CHECK (type IN ('ANNOUNCEMENT', 'EVENT_REVISION_REQUEST', 'EVENT_APPROVAL_REQUEST', 'PROFILE_APPROVAL_REQUEST', 'CERTIFICATE'));
                    END IF;

                    IF to_regclass('public.events') IS NOT NULL THEN
                        ALTER TABLE events
                            ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
                        ALTER TABLE events
                            ADD COLUMN IF NOT EXISTS reminder_offsets_minutes VARCHAR(255);
                        ALTER TABLE events
                            ADD COLUMN IF NOT EXISTS sent_reminder_offsets_minutes VARCHAR(255);

                        ALTER TABLE events
                            DROP CONSTRAINT IF EXISTS events_status_check;
                        ALTER TABLE events
                            ADD CONSTRAINT events_status_check
                            CHECK (status IN (
                                'DRAFT',
                                'PENDING_SKS_APPROVAL',
                                'REVISION_REQUESTED',
                                'PUBLISHED',
                                'REJECTED',
                                'CANCELLED',
                                'COMPLETED'
                            ));

                        ALTER TABLE events
                            DROP CONSTRAINT IF EXISTS events_event_mode_check;
                        ALTER TABLE events
                            ADD CONSTRAINT events_event_mode_check
                            CHECK (event_mode IN ('ONLINE', 'IN_PERSON'));
                    END IF;

                    IF to_regclass('public.event_change_requests') IS NOT NULL THEN
                        ALTER TABLE event_change_requests
                            ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
                        ALTER TABLE event_change_requests
                            ADD COLUMN IF NOT EXISTS reminder_offsets_minutes VARCHAR(255);

                        ALTER TABLE event_change_requests
                            DROP CONSTRAINT IF EXISTS event_change_requests_status_check;
                        ALTER TABLE event_change_requests
                            ADD CONSTRAINT event_change_requests_status_check
                            CHECK (status IN (
                                'PENDING_SKS_APPROVAL',
                                'REVISION_REQUESTED',
                                'APPROVED',
                                'REJECTED'
                            ));
                    END IF;

                    IF to_regclass('public.rsvps') IS NOT NULL THEN
                        ALTER TABLE rsvps
                            DROP CONSTRAINT IF EXISTS rsvps_status_check;
                        ALTER TABLE rsvps
                            ADD CONSTRAINT rsvps_status_check
                            CHECK (status IN (
                                'PENDING_PAYMENT',
                                'CONFIRMED',
                                'WAITLISTED',
                                'CANCELLED',
                                'ATTENDED',
                                'NO_SHOW'
                            ));
                    END IF;
                END $$;
                """);
    }
}
