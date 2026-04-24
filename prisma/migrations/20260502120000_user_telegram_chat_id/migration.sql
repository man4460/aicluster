ALTER TABLE `User` ADD COLUMN `telegram_chat_id` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `User_telegram_chat_id_key` ON `User`(`telegram_chat_id`);
