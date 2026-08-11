-- เปลี่ยนจากวันหยุด (off) → วันที่รับบริการ (work)
ALTER TABLE `barber_stylists`
  ADD COLUMN `work_weekdays_json` VARCHAR(64) NOT NULL DEFAULT '[0,1,2,3,4,5,6]';

-- วันรับบริการ = ทุกวัน (0–6) ที่ไม่อยู่ใน off_weekdays_json
UPDATE `barber_stylists` s
SET `work_weekdays_json` = CONCAT(
  '[',
  TRIM(BOTH ',' FROM CONCAT(
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '0', '$'), '0,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '1', '$'), '1,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '2', '$'), '2,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '3', '$'), '3,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '4', '$'), '4,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '5', '$'), '5,', ''),
    IF(NOT JSON_CONTAINS(CAST(IFNULL(NULLIF(TRIM(s.`off_weekdays_json`), ''), '[]') AS JSON), '6', '$'), '6,', '')
  )),
  ']'
);

ALTER TABLE `barber_stylists`
  DROP COLUMN `off_weekdays_json`;
