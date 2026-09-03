-- Club event portal media + payment rules + link submissions
ALTER TABLE `club_event_profiles`
  ADD COLUMN `address` TEXT NULL,
  ADD COLUMN `facebook_url` VARCHAR(512) NULL,
  ADD COLUMN `map_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_banner_url` VARCHAR(512) NULL,
  ADD COLUMN `portal_gallery_json` TEXT NULL,
  ADD COLUMN `payment_rules_note` TEXT NULL,
  ADD COLUMN `tax_id` VARCHAR(30) NULL;

UPDATE `club_event_profiles`
SET `portal_gallery_json` = COALESCE(`portal_gallery_json`, '[]'),
    `payment_rules_note` = COALESCE(`payment_rules_note`, '');

ALTER TABLE `club_event_profiles`
  MODIFY `portal_gallery_json` TEXT NOT NULL,
  MODIFY `payment_rules_note` TEXT NOT NULL;

CREATE TABLE `club_event_link_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `trial_session_id` VARCHAR(36) NOT NULL DEFAULT 'prod',
    `link_id` VARCHAR(191) NOT NULL,
    `respondent_name` VARCHAR(160) NOT NULL DEFAULT '',
    `respondent_phone` VARCHAR(32) NOT NULL DEFAULT '',
    `payload_json` TEXT NOT NULL,
    `amount_baht` INTEGER NULL,
    `payment_method` VARCHAR(32) NULL,
    `slip_url` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `club_event_link_sub_link_created_idx`(`link_id`, `created_at`),
    INDEX `club_event_link_sub_owner_trial_idx`(`owner_id`, `trial_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `club_event_link_submissions`
  ADD CONSTRAINT `club_event_link_submissions_owner_id_fkey`
  FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `club_event_link_submissions`
  ADD CONSTRAINT `club_event_link_submissions_link_id_fkey`
  FOREIGN KEY (`link_id`) REFERENCES `club_event_dynamic_links`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
