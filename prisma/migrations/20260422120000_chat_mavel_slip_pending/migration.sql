-- รอรับผลวิเคราะห์สลิปจาก Mavel (Telegram reply) → ฝั่ง Chat UI
CREATE TABLE `chat_mavel_slip_pending` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `session_id` VARCHAR(191) NOT NULL,
  `mavel_chat_id` VARCHAR(32) NOT NULL,
  `mavel_message_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `mavel_slip_pending_chat_msg_uidx`(`mavel_chat_id`, `mavel_message_id`),
  INDEX `mavel_slip_pending_session_idx`(`session_id`),
  INDEX `mavel_slip_pending_created_idx`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chat_mavel_slip_pending`
  ADD CONSTRAINT `chat_mavel_slip_pending_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `chat_mavel_slip_pending`
  ADD CONSTRAINT `chat_mavel_slip_pending_session_id_fkey`
  FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
