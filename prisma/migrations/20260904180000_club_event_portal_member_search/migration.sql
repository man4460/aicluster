-- AlterTable
ALTER TABLE `club_event_profiles`
  ADD COLUMN `portal_show_members` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `portal_member_fields_json` VARCHAR(1000) NOT NULL DEFAULT '{}';
