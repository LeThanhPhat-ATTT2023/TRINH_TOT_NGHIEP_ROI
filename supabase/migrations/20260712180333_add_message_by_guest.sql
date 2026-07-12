-- Migration: Add message_by_guest column to guests table
-- Date: 2026-07-12

ALTER TABLE guests
ADD COLUMN message_by_guest TEXT;

COMMENT ON COLUMN guests.message_by_guest IS 'Message sent by the guest to the host after RSVP';
