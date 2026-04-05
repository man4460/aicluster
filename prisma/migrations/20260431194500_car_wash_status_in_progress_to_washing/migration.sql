-- แยกสถานะละเอียด: เลิกใช้ IN_PROGRESS ใช้ WASHING แทน
UPDATE `car_wash_visits` SET `service_status` = 'WASHING' WHERE `service_status` = 'IN_PROGRESS';
