-- นโยบายเงื่อนไขแพ็กเกจ (แอดมินเปิด/ปิด: โควต้าแถว + พิมพ์สลิป)
CREATE TABLE IF NOT EXISTS `plan_feature_policy` (
  `id` VARCHAR(32) NOT NULL,
  `data_row_limit_enabled` BOOLEAN NOT NULL DEFAULT true,
  `daily_max_data_rows` INTEGER NOT NULL DEFAULT 10000,
  `monthly_data_rows_threshold` INTEGER NOT NULL DEFAULT 10000,
  `slip_print_gate_enabled` BOOLEAN NOT NULL DEFAULT true,
  `updated_at` DATETIME(3) NOT NULL,
  `updated_by_user_id` VARCHAR(191) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `plan_feature_policy` (
  `id`,
  `data_row_limit_enabled`,
  `daily_max_data_rows`,
  `monthly_data_rows_threshold`,
  `slip_print_gate_enabled`,
  `updated_at`,
  `updated_by_user_id`
)
SELECT
  'default',
  true,
  10000,
  10000,
  true,
  CURRENT_TIMESTAMP(3),
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `plan_feature_policy` WHERE `id` = 'default'
);
