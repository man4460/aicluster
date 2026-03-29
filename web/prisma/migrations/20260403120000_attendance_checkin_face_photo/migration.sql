-- รูปใบหน้าขณะเช็คเข้า (หลักฐาน)
ALTER TABLE `attendance_logs` ADD COLUMN `check_in_face_photo_url` VARCHAR(512) NULL;
