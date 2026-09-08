-- หมวด Prompt AI
CREATE TABLE IF NOT EXISTS `home_finance_ai_prompt_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 100,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `home_finance_ai_prompt_categories_owner_id_name_key`(`owner_id`, `name`),
    INDEX `home_finance_ai_prompt_categories_owner_id_sort_order_idx`(`owner_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @fk_hf_ai_cat_owner := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_ai_prompt_categories'
    AND CONSTRAINT_NAME = 'home_finance_ai_prompt_categories_owner_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_hf_ai_cat_owner := IF(@fk_hf_ai_cat_owner = 0,
  'ALTER TABLE `home_finance_ai_prompt_categories` ADD CONSTRAINT `home_finance_ai_prompt_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_ai_cat1 FROM @sql_hf_ai_cat_owner; EXECUTE hf_ai_cat1; DEALLOCATE PREPARE hf_ai_cat1;

SET @col_hf_ai_cat_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_ai_prompts' AND COLUMN_NAME = 'category_id'
);
SET @sql_hf_ai_cat_id := IF(@col_hf_ai_cat_id = 0,
  'ALTER TABLE `home_finance_ai_prompts` ADD COLUMN `category_id` INTEGER NULL',
  'SELECT 1');
PREPARE hf_ai_cat2 FROM @sql_hf_ai_cat_id; EXECUTE hf_ai_cat2; DEALLOCATE PREPARE hf_ai_cat2;

SET @idx_hf_ai_cat := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_ai_prompts'
    AND INDEX_NAME = 'home_finance_ai_prompts_owner_id_category_id_idx'
);
SET @sql_idx_hf_ai_cat := IF(@idx_hf_ai_cat = 0,
  'CREATE INDEX `home_finance_ai_prompts_owner_id_category_id_idx` ON `home_finance_ai_prompts`(`owner_id`, `category_id`)',
  'SELECT 1');
PREPARE hf_ai_cat3 FROM @sql_idx_hf_ai_cat; EXECUTE hf_ai_cat3; DEALLOCATE PREPARE hf_ai_cat3;

SET @fk_hf_ai_cat := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'home_finance_ai_prompts'
    AND CONSTRAINT_NAME = 'home_finance_ai_prompts_category_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_hf_ai_cat := IF(@fk_hf_ai_cat = 0,
  'ALTER TABLE `home_finance_ai_prompts` ADD CONSTRAINT `home_finance_ai_prompts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `home_finance_ai_prompt_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE hf_ai_cat4 FROM @sql_fk_hf_ai_cat; EXECUTE hf_ai_cat4; DEALLOCATE PREPARE hf_ai_cat4;
