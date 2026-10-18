-- Smart Police phase 1: officers, evidence, case/party dossier fields, new document kinds

-- AlterEnum: SmartPoliceDocumentKind
ALTER TABLE `smart_police_documents` MODIFY `kind` ENUM('NARRATIVE', 'STATEMENT', 'WARRANT', 'REPORT', 'MEMO', 'PROPERTY_LIST', 'INVESTIGATION_REPORT', 'OTHER') NOT NULL;
ALTER TABLE `smart_police_templates` MODIFY `kind` ENUM('NARRATIVE', 'STATEMENT', 'WARRANT', 'REPORT', 'MEMO', 'PROPERTY_LIST', 'INVESTIGATION_REPORT', 'OTHER') NOT NULL;

-- Profile: commander title / head of work
ALTER TABLE `smart_police_profiles`
  ADD COLUMN `commander_title` VARCHAR(120) NULL,
  ADD COLUMN `head_of_work_rank` VARCHAR(80) NULL,
  ADD COLUMN `head_of_work_name` VARCHAR(200) NULL;

-- Officers
CREATE TABLE `smart_police_officers` (
    `id` VARCHAR(191) NOT NULL,
    `owner_user_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(200) NOT NULL,
    `rank_title` VARCHAR(120) NULL,
    `position` VARCHAR(200) NULL,
    `birth_date` DATETIME(3) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `spofficer_owner_sort_idx`(`owner_user_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_officers`
  ADD CONSTRAINT `smart_police_officers_owner_user_id_fkey`
  FOREIGN KEY (`owner_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Case dossier fields
ALTER TABLE `smart_police_cases`
  ADD COLUMN `court_type` VARCHAR(80) NULL,
  ADD COLUMN `charge_text` TEXT NULL,
  ADD COLUMN `law_refs` TEXT NULL,
  ADD COLUMN `received_at` DATETIME(3) NULL,
  ADD COLUMN `received_time_hm` VARCHAR(8) NULL,
  ADD COLUMN `daily_log_no` VARCHAR(64) NULL,
  ADD COLUMN `custody_mode` ENUM('DETAIN_REMAND', 'NOT_ARRESTED', 'UNKNOWN', 'SURRENDER_RELEASE', 'SURRENDER_DETAIN', 'OTHER') NULL,
  ADD COLUMN `investigator_officer_id` VARCHAR(191) NULL,
  ADD COLUMN `investigation_result` ENUM('INVESTIGATING', 'PROSECUTE', 'NOT_PROSECUTE') NOT NULL DEFAULT 'INVESTIGATING',
  ADD COLUMN `sent_to_prosecutor_at` DATETIME(3) NULL,
  ADD COLUMN `behavior_text` TEXT NULL,
  ADD COLUMN `damage_note` TEXT NULL,
  ADD COLUMN `detain_at` DATETIME(3) NULL;

CREATE INDEX `spcase_officer_idx` ON `smart_police_cases`(`investigator_officer_id`);

ALTER TABLE `smart_police_cases`
  ADD CONSTRAINT `smart_police_cases_investigator_officer_id_fkey`
  FOREIGN KEY (`investigator_officer_id`) REFERENCES `smart_police_officers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Party dossier fields
ALTER TABLE `smart_police_parties`
  ADD COLUMN `case_relation` VARCHAR(200) NULL,
  ADD COLUMN `witness_side` ENUM('COMPLAINANT', 'SUSPECT') NULL,
  ADD COLUMN `plea_status` VARCHAR(200) NULL,
  ADD COLUMN `occupation` VARCHAR(200) NULL,
  ADD COLUMN `workplace` TEXT NULL;

-- Evidence
CREATE TABLE `smart_police_evidence` (
    `id` VARCHAR(191) NOT NULL,
    `case_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `quantity_label` VARCHAR(120) NULL,
    `seizure_no` VARCHAR(64) NULL,
    `seized_from` VARCHAR(255) NULL,
    `owner_name` VARCHAR(200) NULL,
    `owner_note` TEXT NULL,
    `lab_received_at` DATETIME(3) NULL,
    `lab_result` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `spevidence_case_idx`(`case_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_evidence`
  ADD CONSTRAINT `smart_police_evidence_case_id_fkey`
  FOREIGN KEY (`case_id`) REFERENCES `smart_police_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
