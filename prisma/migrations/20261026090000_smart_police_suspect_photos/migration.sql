-- Smart Police: รูปภาพบุคคลต้องสงสัย (หลายรูปต่อคน)
-- เตรียม face_embedding ไว้สำหรับค้นหาจากภาพในอนาคต

CREATE TABLE `smart_police_suspect_photos` (
    `id` VARCHAR(191) NOT NULL,
    `suspect_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `kind` VARCHAR(16) NOT NULL DEFAULT 'FRONT',
    `caption` VARCHAR(255) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `bytes` INTEGER NULL,
    `face_embedding` MEDIUMTEXT NULL,
    `embedding_model` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `spphoto_suspect_idx`(`suspect_id`),
    INDEX `spphoto_suspect_kind_idx`(`suspect_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `smart_police_suspect_photos`
  ADD CONSTRAINT `smart_police_suspect_photos_suspect_id_fkey`
  FOREIGN KEY (`suspect_id`) REFERENCES `smart_police_suspects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
