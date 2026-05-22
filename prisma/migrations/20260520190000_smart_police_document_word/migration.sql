-- Smart Police: คำให้การ + ไฟล์ Word + ผูกบุคคลในคดี

ALTER TABLE `smart_police_documents`
    ADD COLUMN `party_id` VARCHAR(191) NULL,
    ADD COLUMN `word_file_url` VARCHAR(512) NULL,
    ADD COLUMN `word_file_name` VARCHAR(255) NULL;

CREATE INDEX `spdoc_party_idx` ON `smart_police_documents`(`party_id`);

ALTER TABLE `smart_police_documents`
    ADD CONSTRAINT `smart_police_documents_party_id_fkey`
    FOREIGN KEY (`party_id`) REFERENCES `smart_police_parties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
