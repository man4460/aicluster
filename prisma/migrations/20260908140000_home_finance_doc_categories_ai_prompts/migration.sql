-- หมวดเอกสารส่วนตัว
CREATE TABLE IF NOT EXISTS `home_finance_document_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `home_finance_document_categories_owner_id_name_key`(`owner_id`, `name`),
    INDEX `home_finance_document_categories_owner_id_sort_order_idx`(`owner_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hf_doc_cat_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_document_categories'
    AND CONSTRAINT_NAME = 'home_finance_document_categories_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hf_doc_cat_owner := IF(@fk_hf_doc_cat_owner = 0,
  'ALTER TABLE `home_finance_document_categories` ADD CONSTRAINT `home_finance_document_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_doc_cat1 FROM @sql_hf_doc_cat_owner; EXECUTE hf_doc_cat1; DEALLOCATE PREPARE hf_doc_cat1;

-- ผูกเอกสารกับหมวด (nullable)
SET @col_hf_doc_cat_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_personal_documents' AND COLUMN_NAME = 'category_id'
);
SET @sql_hf_doc_cat_id := IF(@col_hf_doc_cat_id = 0,
  'ALTER TABLE `home_finance_personal_documents` ADD COLUMN `category_id` INTEGER NULL',
  'SELECT 1');
PREPARE hf_doc_cat2 FROM @sql_hf_doc_cat_id; EXECUTE hf_doc_cat2; DEALLOCATE PREPARE hf_doc_cat2;

SET @idx_hf_doc_cat := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_personal_documents'
    AND INDEX_NAME = 'home_finance_personal_documents_owner_id_category_id_idx'
);
SET @sql_idx_hf_doc_cat := IF(@idx_hf_doc_cat = 0,
  'CREATE INDEX `home_finance_personal_documents_owner_id_category_id_idx` ON `home_finance_personal_documents`(`owner_id`, `category_id`)',
  'SELECT 1');
PREPARE hf_doc_cat3 FROM @sql_idx_hf_doc_cat; EXECUTE hf_doc_cat3; DEALLOCATE PREPARE hf_doc_cat3;

SET @fk_hf_doc_cat := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_personal_documents'
    AND CONSTRAINT_NAME = 'home_finance_personal_documents_category_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_hf_doc_cat := IF(@fk_hf_doc_cat = 0,
  'ALTER TABLE `home_finance_personal_documents` ADD CONSTRAINT `home_finance_personal_documents_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `home_finance_document_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_doc_cat4 FROM @sql_fk_hf_doc_cat; EXECUTE hf_doc_cat4; DEALLOCATE PREPARE hf_doc_cat4;

-- Prompt AI ส่วนตัว
CREATE TABLE IF NOT EXISTS `home_finance_ai_prompts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `content` TEXT NOT NULL,
    `prompt_type` VARCHAR(80) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `home_finance_ai_prompts_owner_id_created_at_idx`(`owner_id`, `created_at`),
    INDEX `home_finance_ai_prompts_owner_id_prompt_type_idx`(`owner_id`, `prompt_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hf_ai_prompt_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_ai_prompts'
    AND CONSTRAINT_NAME = 'home_finance_ai_prompts_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hf_ai_prompt_owner := IF(@fk_hf_ai_prompt_owner = 0,
  'ALTER TABLE `home_finance_ai_prompts` ADD CONSTRAINT `home_finance_ai_prompts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_ai_p1 FROM @sql_hf_ai_prompt_owner; EXECUTE hf_ai_p1; DEALLOCATE PREPARE hf_ai_p1;
