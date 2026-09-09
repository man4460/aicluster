-- AlterTable
ALTER TABLE `club_event_profiles`
  ADD COLUMN `portal_signup_enabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `portal_signup_collect_dues` VARCHAR(16) NOT NULL DEFAULT 'OFF';
