-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: mawell_buffet
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('04247109-bac5-4cdd-ab10-a907afe8d020','b0535432904b24c35eb06b99f376075350cfbf1f6cab757882de48a61cdf990c','2026-03-24 15:02:50.783','20260402113000_system_activity_logs',NULL,NULL,'2026-03-24 15:02:50.760',1),('0560ef80-3a73-453e-a9a5-3ada022d7ce5','434876df491386f1642241ef4b0fc626b5021f954a2f8bc9426d874f7442c70f',NULL,'20260330120000_dormitory_profile','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260330120000_dormitory_profile\n\nDatabase error code: 1050\n\nDatabase error:\nTable \'dormitory_profiles\' already exists\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260330120000_dormitory_profile\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260330120000_dormitory_profile\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-22 17:11:33.451','2026-03-22 17:09:47.273',0),('13c7f0f3-6edc-4a03-8390-417a151726ca','8590f42ba0e8d9271fa568884ea32e87f509aa428eb78e2bad1a9e22fb36d7df','2026-03-22 11:22:18.190','20260322130000_init_mysql',NULL,NULL,'2026-03-22 11:22:18.171',1),('1469fd98-b807-4e67-a87d-bdf36e69eb0d','6110fc69311b2f3b501e0ad330417d479c32e436c33a305bad9d6b402424b8ae','2026-03-22 15:33:10.488','20260328140000_barber_service_log_amount_baht',NULL,NULL,'2026-03-22 15:33:10.475',1),('1eb4f119-0f6e-4ead-a03c-69dc3fea77b1','30d9ba5873493ced0aec5fd2164906993d8b0898832ac3599537fea8c6abb710','2026-03-22 19:23:17.281','20260322180000_barber_bookings',NULL,NULL,'2026-03-22 19:23:17.128',1),('22b3d3d7-61f6-415d-97a8-43b51d46e5a4','f83f5e4c4341c4846d1cbe234960ff95090d69814c0b43f680f65c2a0b003cb3','2026-03-22 14:45:51.799','20260326120000_dormitory_module_group1',NULL,NULL,'2026-03-22 14:45:51.796',1),('33ab813c-7b98-4f64-8c19-a6832d8fd10e','3cbdb8998068a01001a41bfd2dea74405d83576a6e9843bce261f6c7de74b5c5','2026-03-24 15:02:50.759','20260402100000_home_finance_due_dates',NULL,NULL,'2026-03-24 15:02:50.732',1),('36000b32-c0fc-49b4-9ced-8ab3ff0d340d','408a21808cb8117c27e743d90648182338e52f8167eb071a1127b0c048665207','2026-03-27 14:31:29.669','20260405110000_car_wash_server_scope',NULL,NULL,'2026-03-27 14:31:29.142',1),('3b3da48f-73e7-4d52-aeb4-fa115de4a639','db70206a5166431f4ccd9ec4aef2b88a0427e7cdc095be54011476272d2f17b0','2026-03-24 14:26:48.746','20260324113000_home_finance_extensions',NULL,NULL,'2026-03-24 14:26:48.581',1),('41d3caa0-23a3-43d8-a740-7fd97037d735','bdcba14277899fbb22e7d4b34269e437d4ad8e22126f7d396875f0a9032bd610',NULL,'20260329140000_village_community_module','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260329140000_village_community_module\n\nDatabase error code: 1146\n\nDatabase error:\nTable \'mawell_buffet.users\' doesn\'t exist\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260329140000_village_community_module\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260329140000_village_community_module\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-29 14:48:05.213','2026-03-29 14:42:55.790',0),('439f3673-b09f-464d-941b-76b7ccf2411b','f4bc86aa611e2a25eaedb87485e8513b060101307827744394413c105c1b8487','2026-03-24 14:15:46.553','20260324100000_home_finance_group1',NULL,NULL,'2026-03-24 14:15:46.491',1),('48b6445c-c844-4436-bece-c96d4136146d','03e9be91733d713771b5057d68af0fe4f9d4296484ecfd4f718f39b98b972131','2026-03-27 14:46:44.398','20260405150000_add_building_pos_module_group1',NULL,NULL,'2026-03-27 14:46:44.392',1),('4fd4a019-43fd-40cc-8f5e-67580c899355','2b120fff60b16ddde55246406d2979f9e3a920f222d1cbf98b997982ce99c0e6','2026-03-22 15:11:57.972','20260327120000_barber_shop_module',NULL,NULL,'2026-03-22 15:11:57.621',1),('5552b40c-2aa4-4fe9-9768-6de8e248a869','e96381c03dcddb1b6320e196bd94401e1364257efa2b828bb80c1bd229ef7821','2026-03-29 11:39:17.361','20260428100000_building_pos_menu_is_featured',NULL,NULL,'2026-03-29 11:39:17.301',1),('55d81631-050b-42b1-96eb-30671cbc8336','56a831968aca6ae49ef2454737588fc6e0dd96331c29df066cd099d707c58216','2026-03-24 15:33:20.615','20260402130000_home_finance_reminders',NULL,NULL,'2026-03-24 15:33:20.570',1),('58e37e2b-befa-45a3-bc2e-3e9939379e19','f3d45e907629ba69569a757f6f72b6f46d045ac97c9031aef6a442a89a003bd5','2026-03-26 02:18:47.174','20260326180000_attendance_trial_session_scope',NULL,NULL,'2026-03-26 02:18:46.770',1),('592f9089-0207-4584-8d11-7d2c5ba2e171','e41085a74096216b5a1c6b56f63f1035499727dea5a7ec897f4cbee07c6ff5d7','2026-03-22 18:44:30.067','20260401120000_barber_portal_staff_pings',NULL,NULL,'2026-03-22 18:44:30.012',1),('648d9310-b691-43c2-9032-71a4683c2da2','fc7e971f6e6588c3b4c757cfe677889b97e67f1f49fb18a10231de2ef8a0edee',NULL,'20260325140000_trial_sessions_sandbox_scope','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260325140000_trial_sessions_sandbox_scope\n\nDatabase error code: 1553\n\nDatabase error:\nCannot drop index \'dormitory_profiles_owner_id_key\': needed in a foreign key constraint\n\nPlease check the query number 12 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260325140000_trial_sessions_sandbox_scope\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260325140000_trial_sessions_sandbox_scope\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-26 01:51:42.786','2026-03-26 01:44:17.428',0),('6ca80e78-3635-4846-ac22-5255e14cd4c5','f73b46aa6c5a409bd722f14976c886edcacf7e56084046593f637768c9cdb9d3',NULL,'20260330120000_dormitory_profile','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260330120000_dormitory_profile\n\nDatabase error code: 1824\n\nDatabase error:\nFailed to open the referenced table \'users\'\n\nPlease check the query number 2 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260330120000_dormitory_profile\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260330120000_dormitory_profile\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-22 17:09:36.831','2026-03-22 17:07:35.774',0),('7cf1395f-21eb-418d-b754-a41b39053eb2','474e18942edd8319a7be161a24f63de478c6906b3c50a0a5ffe536eb65d4d691','2026-03-23 00:36:25.924','20260322190000_smart_attendance',NULL,NULL,'2026-03-23 00:36:25.416',1),('8b25b014-fdc9-496f-8b31-6ed43c0e5abc','1fe7f32851017657a385673fca218a0617527a1bb518745d5b410e151c12de74','2026-03-22 17:11:48.877','20260330120000_dormitory_profile',NULL,NULL,'2026-03-22 17:11:48.840',1),('92499b54-7b05-4641-8492-5bfe3b7c94d5','788619cd61337eabb9c0f5f37c0c6cb1fa8b9ca5f7f53b0e428284a713f2bdb0','2026-03-24 18:08:53.576','20260324180000_attendance_roster_shift_and_applied_index',NULL,NULL,'2026-03-24 18:08:53.549',1),('95ffd923-7a18-441c-b430-35f4a230d7e7','8b9f44d2a6b1f9b1f6d5554b539f1f3494fe79f51801e0265af495994249564c','2026-03-24 17:55:24.403','20260324120000_attendance_locations_shifts',NULL,NULL,'2026-03-24 17:55:24.305',1),('9dbdd2a7-f4d9-46f4-ba98-8831361a77ef','307a68c2b13c22361960a90800f2ab1d7732edbf5a46579213d0593abd93897e','2026-03-26 14:55:40.122','20260404100000_add_car_wash_module',NULL,NULL,'2026-03-26 14:55:40.104',1),('a23ee01d-2b2d-43ef-b4c1-8ffe0d1b9b90','c6eefa26e3ad2c76500a400226833549755c74a56eecfe12915ef72fa0eae6c7','2026-03-22 16:07:49.586','20260329120000_barber_stylists',NULL,NULL,'2026-03-22 16:07:49.220',1),('afd69490-b160-48f7-bb30-5896cdd601ef','4608a12095f0f40a3e99064ca1dbe1bcf3221734e7a461ce873c5840fd572870','2026-03-22 19:01:18.205','20260322160000_barber_shop_profile',NULL,NULL,'2026-03-22 19:01:18.139',1),('c2982af1-052b-4dbc-8f88-e08e07f4159b','7e0e384dab9ce5b2413619ea62cf71b67afeacd23fea6cd9c6507082b8335497','2026-03-22 17:58:54.292','20260331130000_dorm_invoice_promptpay_proof',NULL,NULL,'2026-03-22 17:58:54.242',1),('c87083f9-2fe7-43e2-83c8-3c264f24b26e','192a2088dd56cf5136d6990b71bbccc61acb5c8730f1659e835764e87b13a85a','2026-03-22 11:44:59.702','20260322114459_buffet_subscription_tokens_chat',NULL,NULL,'2026-03-22 11:44:59.594',1),('c8ee9925-12e8-42d2-bf69-fd2674297072','3dad656adb72cf6e295b4bfbcdda9f6851a34edbab61afbf99d141a4517303be','2026-03-23 01:02:57.587','20260323000000_attendance_roster_visitor_kind',NULL,NULL,'2026-03-23 01:02:57.482',1),('cebef1de-5d9d-44d6-a01d-b641f7b5e934','f6bdfa01e951000432a2141b84fe799432d2f3b843ada795783621a90fe017b7',NULL,'20260326180000_attendance_trial_session_scope','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260326180000_attendance_trial_session_scope\n\nDatabase error code: 1059\n\nDatabase error:\nIdentifier name \'attendance_roster_entries_owner_id_trial_session_id_is_active_idx\' is too long\n\nPlease check the query number 21 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260326180000_attendance_trial_session_scope\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260326180000_attendance_trial_session_scope\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-26 02:16:20.669','2026-03-26 02:14:52.313',0),('d050f40e-0559-4201-91c1-4c9da63d1d21','d96324c05ef76bd2ef85fff8c25ac93027471d4511426db3a5d7530df0d5bd79','2026-03-22 14:45:51.795','20260325120000_dormitory_int_mysql',NULL,NULL,'2026-03-22 14:45:51.222',1),('d37c72a7-6106-42bd-bbee-c7cee7eb05fd','530d8311056ac10fa27bd1ec5af3531b03e39b3be9ae6855097e75768456287b','2026-03-22 14:45:51.220','20260323140000_dormitory_management',NULL,NULL,'2026-03-22 14:45:50.852',1),('d3b27b2c-8db5-4d3d-bd2c-5747ef60dc70','d2698c3f5778292b09360ad226476197e5259d1cbc64e04e071915617481ae8c','2026-03-22 12:39:41.472','20260322180000_module_access_control',NULL,NULL,'2026-03-22 12:39:41.432',1),('d85b2f1b-caa5-4b5b-8fb2-cfcc91a50195','c05fcde1eabb624133176e299c9cfe0a213b02fce3251ecf924514368d0b826c','2026-03-27 14:31:30.149','20260405123000_add_mqtt_service_group1_and_tables',NULL,NULL,'2026-03-27 14:31:29.678',1),('dbe0d45e-3dab-441d-afbb-02ff789b27b8','2b41d89b0413aab350feca89b4959d7d8f52caadd3bbb39d44bfb5934680ce0a','2026-03-27 15:02:55.964','20260405171000_building_pos_images',NULL,NULL,'2026-03-27 15:02:55.941',1),('e44426df-e01b-4d2a-9352-26174de4ba70','54ab9bb55665d5cc048b1ebfc7a288fc52cd6c5fff8e87a48a3f057c93c52138','2026-03-22 13:37:52.668','20260323120000_buffet_monthly_billing',NULL,NULL,'2026-03-22 13:37:52.645',1),('ed1be6d5-85f9-4503-975c-2039c0094e75','7a59e0d553bf3c1371de9d2ad2f7c2c1cddbdb46ffa646e1657805d04dbbee09','2026-03-29 14:48:11.924','20260329140000_village_community_module',NULL,NULL,'2026-03-29 14:48:11.331',1),('ee3a91bf-0bff-4f2f-a750-d271b50789e5','9c3c7b1db218528bd441f9527b1e27a3aa996352f4ce7915c521332725c65f9e','2026-03-27 14:46:44.590','20260405162000_building_pos_tables',NULL,NULL,'2026-03-27 14:46:44.400',1),('f247e0ed-bba7-4f2b-aaad-5896ecfac84e','bc3d7e53fbc483539ac5c3d09e270123c7f5d8fffaab4600d9d37930bde3a678','2026-03-22 14:58:36.702','20260326130000_dormitory_module_title',NULL,NULL,'2026-03-22 14:58:36.693',1),('f504fc23-76a5-4afa-96a7-95cf32e6c3de','7c8b035a9a02738a60926902b6853e1a57659b5be7c3b3aac40cc7f6e1fc4ccf',NULL,'20260326180000_attendance_trial_session_scope','A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260326180000_attendance_trial_session_scope\n\nDatabase error code: 1091\n\nDatabase error:\nCan\'t DROP \'attendance_settings_owner_id_key\'; check that column/key exists\n\nPlease check the query number 2 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260326180000_attendance_trial_session_scope\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name=\"20260326180000_attendance_trial_session_scope\"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260','2026-03-26 02:18:44.505','2026-03-26 02:16:23.010',0),('f7001aa0-3144-4c48-a37f-128e7fb07e9f','d0b738238b78b64ea6fc57621bedc87152b38c80b9fd4a92014fa043bf37fd06','2026-03-24 16:14:09.676','20260403120000_attendance_checkin_face_photo',NULL,NULL,'2026-03-24 16:14:09.656',1),('fc581d36-4e21-4b21-b0cf-6f9f1429c7b5','1c2389a6a3b1f6cc724efc91c9a9daaaaf314cdb1e0d3539dca3efd24ceca433','2026-03-26 01:51:48.964','20260325140000_trial_sessions_sandbox_scope',NULL,NULL,'2026-03-26 01:51:48.295',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_locations`
--

DROP TABLE IF EXISTS `attendance_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'จุดเช็ค',
  `allowed_location_lat` double NOT NULL,
  `allowed_location_lng` double NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '120',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_locations_owner_id_trial_session_id_sort_order_idx` (`owner_id`,`trial_session_id`,`sort_order`),
  KEY `attendance_locations_owner_id_idx` (`owner_id`),
  KEY `aloc_owner_trial_sort_idx` (`owner_id`,`trial_session_id`,`sort_order`),
  KEY `aloc_owner_id_idx` (`owner_id`),
  CONSTRAINT `attendance_locations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_locations`
--

LOCK TABLES `attendance_locations` WRITE;
/*!40000 ALTER TABLE `attendance_locations` DISABLE KEYS */;
INSERT INTO `attendance_locations` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','จุดหลัก',13.95850284256917,100.481584149332,150,0,'2026-03-25 00:55:24.397','2026-03-25 00:55:24.397'),(2,'cmn1oqmwk0000ua1g374zua6n','prod','จุดหลัก',13.95847703334551,100.4814978975444,150,0,'2026-03-25 00:55:24.397','2026-03-24 18:11:56.273'),(4,'cmn66gf3z0001uab0411acyw3','prod','จุดหลัก',13.95843005623678,100.4814737399088,150,0,'2026-03-26 01:53:45.927','2026-03-26 01:54:23.123'),(5,'cmn66gf3z0001uab0411acyw3','cmn6uqcyo0001ua3wkbz7v2pn','จุดหลัก',13.95848072667534,100.4814946056268,150,0,'2026-03-26 02:27:17.625','2026-03-26 02:27:24.526');
/*!40000 ALTER TABLE `attendance_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `actor_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in_time` datetime(3) DEFAULT NULL,
  `check_out_time` datetime(3) DEFAULT NULL,
  `check_in_lat` double DEFAULT NULL,
  `check_in_lng` double DEFAULT NULL,
  `check_out_lat` double DEFAULT NULL,
  `check_out_lng` double DEFAULT NULL,
  `status` enum('AWAITING_CHECKOUT','ON_TIME','LATE','EARLY_LEAVE','LATE_AND_EARLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AWAITING_CHECKOUT',
  `late_check_in` tinyint(1) NOT NULL DEFAULT '0',
  `early_check_out` tinyint(1) NOT NULL DEFAULT '0',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `public_visitor_kind` enum('ROSTER_STAFF','EXTERNAL_GUEST') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in_face_photo_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applied_shift_index` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_logs_actor_user_id_idx` (`actor_user_id`),
  KEY `alog_owner_trial_in_idx` (`owner_id`,`trial_session_id`,`check_in_time`),
  KEY `alog_owner_trial_phone_idx` (`owner_id`,`trial_session_id`,`guest_phone`),
  KEY `alog_owner_id_idx` (`owner_id`),
  CONSTRAINT `attendance_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `attendance_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_logs`
--

LOCK TABLES `attendance_logs` WRITE;
/*!40000 ALTER TABLE `attendance_logs` DISABLE KEYS */;
INSERT INTO `attendance_logs` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','cmn1pz7p60000uaog02stazhd',NULL,NULL,'2026-03-23 00:41:58.708',NULL,13.95846237931937,100.4814928434487,NULL,NULL,'AWAITING_CHECKOUT',0,0,NULL,'2026-03-23 00:41:58.713','2026-03-23 00:41:58.713',NULL,NULL,NULL),(2,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-23 00:52:47.113',NULL,13.95842207969414,100.4815005024091,NULL,NULL,'AWAITING_CHECKOUT',0,0,NULL,'2026-03-23 00:52:47.117','2026-03-23 00:52:47.117',NULL,NULL,NULL),(3,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-24 12:59:29.404','2026-03-24 12:59:57.113',13.95846929091547,100.4815289578648,13.95847126496158,100.4815348360263,'LATE',1,0,NULL,'2026-03-24 12:59:29.407','2026-03-24 12:59:57.111','ROSTER_STAFF',NULL,NULL),(4,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-24 16:33:10.136',NULL,13.95846621127096,100.481513809069,NULL,NULL,'AWAITING_CHECKOUT',1,0,NULL,'2026-03-24 16:33:10.140','2026-03-24 16:33:10.140','ROSTER_STAFF','/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774369990132-6e484df3.jpg',NULL),(5,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-24 17:00:44.391','2026-03-24 17:01:01.344',13.95843993082078,100.4814889424619,13.95843832341218,100.4814967549949,'EARLY_LEAVE',0,1,NULL,'2026-03-24 17:00:44.394','2026-03-24 17:01:01.348','ROSTER_STAFF','/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774371644386-8d40f534.jpg',NULL),(6,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-24 17:04:13.551','2026-03-24 17:04:48.606',13.95846750329348,100.4815018653315,13.95845838586713,100.4814899901689,'EARLY_LEAVE',0,1,NULL,'2026-03-24 17:04:13.556','2026-03-24 17:04:48.612','ROSTER_STAFF','/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774371853546-27965a19.jpg',NULL),(7,'cmn1pz7p60000uaog02stazhd','prod',NULL,'0815418771','อ้อม','2026-03-25 12:14:56.854',NULL,13.95847497244971,100.4815182197264,NULL,NULL,'AWAITING_CHECKOUT',1,0,NULL,'2026-03-25 12:14:56.861','2026-03-25 12:14:56.861','ROSTER_STAFF','/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774440896849-83673f26.jpg',0);
/*!40000 ALTER TABLE `attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_roster_entries`
--

DROP TABLE IF EXISTS `attendance_roster_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_roster_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `roster_shift_index` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `atr_owner_phone_trial_uidx` (`owner_id`,`phone`,`trial_session_id`),
  KEY `atr_owner_trial_active_idx` (`owner_id`,`trial_session_id`,`is_active`),
  CONSTRAINT `attendance_roster_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_roster_entries`
--

LOCK TABLES `attendance_roster_entries` WRITE;
/*!40000 ALTER TABLE `attendance_roster_entries` DISABLE KEYS */;
INSERT INTO `attendance_roster_entries` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','อ้อม','0815418771',1,'2026-03-23 01:11:24.351','2026-03-23 01:11:24.351',0),(2,'cmn1pz7p60000uaog02stazhd','prod','แมน','0966646914',1,'2026-03-25 14:47:49.854','2026-03-25 14:47:49.854',0),(3,'cmn66gf3z0001uab0411acyw3','prod','สมใจ','0966646914',1,'2026-03-26 01:54:54.150','2026-03-26 01:54:54.150',0),(4,'cmn66gf3z0001uab0411acyw3','cmn6uqcyo0001ua3wkbz7v2pn','เนอร์','0815418771',1,'2026-03-26 02:27:37.150','2026-03-26 02:27:37.150',0);
/*!40000 ALTER TABLE `attendance_roster_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_settings`
--

DROP TABLE IF EXISTS `attendance_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `shift_start_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '09:00',
  `shift_end_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '18:00',
  `allowed_location_lat` double NOT NULL,
  `allowed_location_lng` double NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '120',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_settings_owner_id_trial_session_id_key` (`owner_id`,`trial_session_id`),
  UNIQUE KEY `atset_owner_trial_uidx` (`owner_id`,`trial_session_id`),
  KEY `attendance_settings_owner_id_idx` (`owner_id`),
  KEY `atset_owner_id_idx` (`owner_id`),
  CONSTRAINT `attendance_settings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_settings`
--

LOCK TABLES `attendance_settings` WRITE;
/*!40000 ALTER TABLE `attendance_settings` DISABLE KEYS */;
INSERT INTO `attendance_settings` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','09:00','18:00',13.95850284256917,100.481584149332,150,'2026-03-23 00:39:06.083','2026-03-23 00:39:36.117'),(2,'cmn1oqmwk0000ua1g374zua6n','prod','09:00','18:00',13.95847703334551,100.4814978975444,150,'2026-03-24 17:26:08.200','2026-03-24 18:11:56.300'),(3,'cmn66gf3z0001uab0411acyw3','prod','07:00','19:00',13.95843005623678,100.4814737399088,150,'2026-03-26 01:53:45.915','2026-03-26 01:54:23.149'),(4,'cmn66gf3z0001uab0411acyw3','cmn6uqcyo0001ua3wkbz7v2pn','09:00','18:00',13.95848072667534,100.4814946056268,150,'2026-03-26 02:27:17.614','2026-03-26 02:27:24.541');
/*!40000 ALTER TABLE `attendance_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_shifts`
--

DROP TABLE IF EXISTS `attendance_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `location_id` int NOT NULL,
  `start_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_shifts_location_id_sort_order_idx` (`location_id`,`sort_order`),
  CONSTRAINT `attendance_shifts_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `attendance_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_shifts`
--

LOCK TABLES `attendance_shifts` WRITE;
/*!40000 ALTER TABLE `attendance_shifts` DISABLE KEYS */;
INSERT INTO `attendance_shifts` VALUES (1,1,'09:00','18:00',0,'2026-03-25 00:55:24.400','2026-03-25 00:55:24.400'),(4,2,'09:00','18:00',0,'2026-03-24 18:11:56.279','2026-03-24 18:11:56.279'),(5,2,'10:00','17:00',1,'2026-03-24 18:11:56.283','2026-03-24 18:11:56.283'),(6,2,'15:00','22:00',2,'2026-03-24 18:11:56.287','2026-03-24 18:11:56.287'),(10,4,'07:00','19:00',0,'2026-03-26 01:54:23.127','2026-03-26 01:54:23.127'),(12,5,'09:00','18:00',0,'2026-03-26 02:27:24.530','2026-03-26 02:27:24.530');
/*!40000 ALTER TABLE `attendance_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_bookings`
--

DROP TABLE IF EXISTS `barber_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `barber_customer_id` int DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduled_at` datetime(3) NOT NULL,
  `status` enum('SCHEDULED','ARRIVED','NO_SHOW','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `barber_bookings_owner_id_scheduled_at_idx` (`owner_id`,`scheduled_at`),
  KEY `barber_bookings_barber_customer_id_fkey` (`barber_customer_id`),
  KEY `barber_bookings_owner_id_trial_session_id_idx` (`owner_id`,`trial_session_id`),
  CONSTRAINT `barber_bookings_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `barber_bookings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_bookings`
--

LOCK TABLES `barber_bookings` WRITE;
/*!40000 ALTER TABLE `barber_bookings` DISABLE KEYS */;
INSERT INTO `barber_bookings` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',2,'0815418771','อ้อม','2026-03-23 09:00:00.000','SCHEDULED','2026-03-22 19:24:14.671','2026-03-22 19:24:14.671'),(2,'cmn1pz7p60000uaog02stazhd','prod',2,'0815418771','อ้อม','2026-03-24 16:06:00.000','SCHEDULED','2026-03-24 15:37:04.300','2026-03-24 15:37:04.300'),(3,'cmn1oqmwk0000ua1g374zua6n','prod',NULL,'0815418771','แมน','2026-03-24 18:39:00.000','SCHEDULED','2026-03-24 18:10:05.238','2026-03-24 18:10:05.238');
/*!40000 ALTER TABLE `barber_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_customers`
--

DROP TABLE IF EXISTS `barber_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barber_customers_owner_id_phone_trial_session_id_key` (`owner_id`,`phone`,`trial_session_id`),
  KEY `barber_customers_owner_id_idx` (`owner_id`),
  CONSTRAINT `barber_customers_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_customers`
--

LOCK TABLES `barber_customers` WRITE;
/*!40000 ALTER TABLE `barber_customers` DISABLE KEYS */;
INSERT INTO `barber_customers` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','0966646914','แมน','2026-03-22 15:19:07.078','2026-03-22 15:28:11.399'),(2,'cmn1pz7p60000uaog02stazhd','prod','0815418771','อ้อม','2026-03-22 15:47:06.733','2026-03-22 15:47:06.733');
/*!40000 ALTER TABLE `barber_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_packages`
--

DROP TABLE IF EXISTS `barber_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total_sessions` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `barber_packages_owner_id_idx` (`owner_id`),
  KEY `barber_packages_owner_id_trial_session_id_idx` (`owner_id`,`trial_session_id`),
  CONSTRAINT `barber_packages_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_packages`
--

LOCK TABLES `barber_packages` WRITE;
/*!40000 ALTER TABLE `barber_packages` DISABLE KEYS */;
INSERT INTO `barber_packages` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','ตัด 10 ครั้ง',1200.00,10,'2026-03-22 15:27:46.805','2026-03-22 15:27:46.805');
/*!40000 ALTER TABLE `barber_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_portal_staff_pings`
--

DROP TABLE IF EXISTS `barber_portal_staff_pings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_portal_staff_pings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `barber_customer_id` int DEFAULT NULL,
  `subscription_id` int DEFAULT NULL,
  `phone_masked` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_latitude` double DEFAULT NULL,
  `client_longitude` double DEFAULT NULL,
  `distance_meters` double DEFAULT NULL,
  `geo_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `barber_portal_staff_pings_owner_id_created_at_idx` (`owner_id`,`created_at`),
  CONSTRAINT `barber_portal_staff_pings_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_portal_staff_pings`
--

LOCK TABLES `barber_portal_staff_pings` WRITE;
/*!40000 ALTER TABLE `barber_portal_staff_pings` DISABLE KEYS */;
INSERT INTO `barber_portal_staff_pings` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',2,2,'081-xxx-8771',13.95845931569477,100.4815735564615,4.973122281743374,1,'2026-03-22 18:59:05.288'),(2,'cmn1pz7p60000uaog02stazhd','prod',2,2,'081-xxx-8771',13.95848125093794,100.4815691944885,2.892847975849308,1,'2026-03-22 19:04:48.485');
/*!40000 ALTER TABLE `barber_portal_staff_pings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_service_logs`
--

DROP TABLE IF EXISTS `barber_service_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_service_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `subscription_id` int DEFAULT NULL,
  `barber_customer_id` int NOT NULL,
  `visit_type` enum('PACKAGE_USE','CASH_WALK_IN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `amount_baht` decimal(10,2) DEFAULT NULL,
  `stylist_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `barber_service_logs_owner_id_created_at_idx` (`owner_id`,`created_at`),
  KEY `barber_service_logs_barber_customer_id_idx` (`barber_customer_id`),
  KEY `barber_service_logs_subscription_id_fkey` (`subscription_id`),
  KEY `barber_service_logs_stylist_id_idx` (`stylist_id`),
  KEY `barber_service_logs_owner_id_trial_session_id_idx` (`owner_id`,`trial_session_id`),
  CONSTRAINT `barber_service_logs_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `barber_service_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `barber_service_logs_stylist_id_fkey` FOREIGN KEY (`stylist_id`) REFERENCES `barber_stylists` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `barber_service_logs_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `customer_subscriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_service_logs`
--

LOCK TABLES `barber_service_logs` WRITE;
/*!40000 ALTER TABLE `barber_service_logs` DISABLE KEYS */;
INSERT INTO `barber_service_logs` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',NULL,1,'CASH_WALK_IN',NULL,'2026-03-22 15:19:07.086',NULL,NULL),(2,'cmn1pz7p60000uaog02stazhd','prod',2,2,'PACKAGE_USE',NULL,'2026-03-22 15:48:46.816',NULL,NULL),(3,'cmn1pz7p60000uaog02stazhd','prod',1,1,'PACKAGE_USE',NULL,'2026-03-22 16:24:04.968',NULL,1),(4,'cmn1pz7p60000uaog02stazhd','prod',2,2,'PACKAGE_USE',NULL,'2026-03-22 19:10:56.485',NULL,NULL),(5,'cmn1pz7p60000uaog02stazhd','prod',2,2,'PACKAGE_USE',NULL,'2026-03-22 19:26:37.751',NULL,NULL);
/*!40000 ALTER TABLE `barber_service_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_shop_profiles`
--

DROP TABLE IF EXISTS `barber_shop_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_shop_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `display_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contact_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `barber_shop_profiles_owner_id_trial_session_id_key` (`owner_id`,`trial_session_id`),
  KEY `barber_shop_profiles_owner_id_idx` (`owner_id`),
  CONSTRAINT `barber_shop_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_shop_profiles`
--

LOCK TABLES `barber_shop_profiles` WRITE;
/*!40000 ALTER TABLE `barber_shop_profiles` DISABLE KEYS */;
INSERT INTO `barber_shop_profiles` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','ร้านโอ๋ บารเบอร์','/uploads/barber-logos/cmn1pz7p60000uaog02stazhd-1774206161881.png','1234567893','222/285','0815418771','2026-03-22 19:02:41.886','2026-03-22 19:03:16.545'),(2,'cmn1oqmwk0000ua1g374zua6n','prod',NULL,NULL,'1234567890',NULL,NULL,'2026-03-24 17:24:44.986','2026-03-24 17:59:27.198');
/*!40000 ALTER TABLE `barber_shop_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barber_stylists`
--

DROP TABLE IF EXISTS `barber_stylists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barber_stylists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `barber_stylists_owner_id_idx` (`owner_id`),
  KEY `barber_stylists_owner_id_is_active_idx` (`owner_id`,`is_active`),
  KEY `barber_stylists_owner_id_trial_session_id_idx` (`owner_id`,`trial_session_id`),
  CONSTRAINT `barber_stylists_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barber_stylists`
--

LOCK TABLES `barber_stylists` WRITE;
/*!40000 ALTER TABLE `barber_stylists` DISABLE KEYS */;
INSERT INTO `barber_stylists` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','โอ๋',NULL,1,'2026-03-22 16:23:19.586','2026-03-22 16:23:19.586'),(2,'cmn1pz7p60000uaog02stazhd','prod','แมน',NULL,1,'2026-03-22 16:41:44.298','2026-03-22 16:41:44.298');
/*!40000 ALTER TABLE `barber_stylists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `building_pos_categories`
--

DROP TABLE IF EXISTS `building_pos_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `building_pos_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bpos_cat_owner_trial_sort_idx` (`owner_id`,`trial_session_id`,`sort_order`),
  KEY `bpos_cat_owner_idx` (`owner_id`),
  CONSTRAINT `building_pos_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `building_pos_categories`
--

LOCK TABLES `building_pos_categories` WRITE;
/*!40000 ALTER TABLE `building_pos_categories` DISABLE KEYS */;
INSERT INTO `building_pos_categories` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','ของหวาน','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774625584379.png',3,1,'2026-03-27 15:33:06.376','2026-03-29 13:28:29.094'),(2,'cmn1pz7p60000uaog02stazhd','prod','แนะนำ','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790118466.png',1,1,'2026-03-29 13:15:19.443','2026-03-29 13:15:19.443'),(3,'cmn1pz7p60000uaog02stazhd','prod','ต้มยำ','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790135967.png',1,1,'2026-03-29 13:15:36.919','2026-03-29 13:15:36.919'),(4,'cmn1pz7p60000uaog02stazhd','prod','ทอด','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790174287.png',1,1,'2026-03-29 13:16:14.898','2026-03-29 13:16:14.898'),(5,'cmn1pz7p60000uaog02stazhd','prod','ผัด','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790200734.png',2,1,'2026-03-29 13:16:41.357','2026-03-29 13:28:36.313');
/*!40000 ALTER TABLE `building_pos_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `building_pos_menu_items`
--

DROP TABLE IF EXISTS `building_pos_menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `building_pos_menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `category_id` int NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `price` int NOT NULL,
  `description` varchar(800) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `bpos_menu_owner_trial_cat_idx` (`owner_id`,`trial_session_id`,`category_id`),
  KEY `bpos_menu_owner_idx` (`owner_id`),
  CONSTRAINT `building_pos_menu_items_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `building_pos_menu_items`
--

LOCK TABLES `building_pos_menu_items` WRITE;
/*!40000 ALTER TABLE `building_pos_menu_items` DISABLE KEYS */;
INSERT INTO `building_pos_menu_items` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',1,'บัวลอย','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774625614706.png',20,'',1,'2026-03-27 15:33:40.218','2026-03-27 15:33:40.218',0),(2,'cmn1pz7p60000uaog02stazhd','prod',1,'ข้าวเหนียวดำ','/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774782265265.png',30,'',1,'2026-03-29 11:04:35.280','2026-03-29 11:04:35.280',0);
/*!40000 ALTER TABLE `building_pos_menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `building_pos_orders`
--

DROP TABLE IF EXISTS `building_pos_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `building_pos_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `customer_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `table_no` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `items_json` json NOT NULL,
  `total_amount` int NOT NULL DEFAULT '0',
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bpos_order_owner_trial_created_idx` (`owner_id`,`trial_session_id`,`created_at`),
  KEY `bpos_order_owner_idx` (`owner_id`),
  CONSTRAINT `building_pos_orders_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `building_pos_orders`
--

LOCK TABLES `building_pos_orders` WRITE;
/*!40000 ALTER TABLE `building_pos_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `building_pos_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_wash_bundles`
--

DROP TABLE IF EXISTS `car_wash_bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_wash_bundles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `customer_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `plate_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_id` int NOT NULL,
  `package_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paid_amount` int NOT NULL DEFAULT '0',
  `total_uses` int NOT NULL DEFAULT '0',
  `used_uses` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cwash_bundle_owner_trial_active_idx` (`owner_id`,`trial_session_id`,`is_active`),
  KEY `cwash_bundle_owner_trial_phone_idx` (`owner_id`,`trial_session_id`,`customer_phone`),
  KEY `cwash_bundle_owner_trial_plate_idx` (`owner_id`,`trial_session_id`,`plate_number`),
  KEY `cwash_bundle_owner_idx` (`owner_id`),
  CONSTRAINT `car_wash_bundles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_wash_bundles`
--

LOCK TABLES `car_wash_bundles` WRITE;
/*!40000 ALTER TABLE `car_wash_bundles` DISABLE KEYS */;
/*!40000 ALTER TABLE `car_wash_bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_wash_complaints`
--

DROP TABLE IF EXISTS `car_wash_complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_wash_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cwash_cmp_owner_trial_created_idx` (`owner_id`,`trial_session_id`,`created_at`),
  KEY `cwash_cmp_owner_idx` (`owner_id`),
  CONSTRAINT `car_wash_complaints_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_wash_complaints`
--

LOCK TABLES `car_wash_complaints` WRITE;
/*!40000 ALTER TABLE `car_wash_complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `car_wash_complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_wash_packages`
--

DROP TABLE IF EXISTS `car_wash_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_wash_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '30',
  `description` varchar(800) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cwash_pkg_owner_trial_active_idx` (`owner_id`,`trial_session_id`,`is_active`),
  KEY `cwash_pkg_owner_idx` (`owner_id`),
  CONSTRAINT `car_wash_packages_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_wash_packages`
--

LOCK TABLES `car_wash_packages` WRITE;
/*!40000 ALTER TABLE `car_wash_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `car_wash_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `car_wash_visits`
--

DROP TABLE IF EXISTS `car_wash_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `car_wash_visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `visit_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `customer_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `plate_number` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_id` int DEFAULT NULL,
  `package_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `listed_price` int NOT NULL DEFAULT '0',
  `final_price` int NOT NULL DEFAULT '0',
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `recorded_by_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cwash_visit_owner_trial_visit_idx` (`owner_id`,`trial_session_id`,`visit_at`),
  KEY `cwash_visit_owner_trial_phone_idx` (`owner_id`,`trial_session_id`,`customer_phone`),
  KEY `cwash_visit_owner_trial_plate_idx` (`owner_id`,`trial_session_id`,`plate_number`),
  KEY `cwash_visit_owner_idx` (`owner_id`),
  CONSTRAINT `car_wash_visits_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `car_wash_visits`
--

LOCK TABLES `car_wash_visits` WRITE;
/*!40000 ALTER TABLE `car_wash_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `car_wash_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatmessage`
--

DROP TABLE IF EXISTS `chatmessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatmessage` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ChatMessage_createdAt_idx` (`createdAt`),
  KEY `ChatMessage_userId_fkey` (`userId`),
  CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatmessage`
--

LOCK TABLES `chatmessage` WRITE;
/*!40000 ALTER TABLE `chatmessage` DISABLE KEYS */;
INSERT INTO `chatmessage` VALUES ('cmn1qyyjh0001uaacsci9dr5i','cmn1oqmwk0000ua1g374zua6n','ทดสอบ','2026-03-22 12:42:51.101');
/*!40000 ALTER TABLE `chatmessage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_subscriptions`
--

DROP TABLE IF EXISTS `customer_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `barber_customer_id` int NOT NULL,
  `package_id` int NOT NULL,
  `remaining_sessions` int NOT NULL,
  `status` enum('ACTIVE','EXHAUSTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `sold_by_stylist_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_subscriptions_owner_id_idx` (`owner_id`),
  KEY `customer_subscriptions_barber_customer_id_idx` (`barber_customer_id`),
  KEY `customer_subscriptions_package_id_idx` (`package_id`),
  KEY `customer_subscriptions_sold_by_stylist_id_idx` (`sold_by_stylist_id`),
  KEY `customer_subscriptions_owner_id_trial_session_id_idx` (`owner_id`,`trial_session_id`),
  CONSTRAINT `customer_subscriptions_barber_customer_id_fkey` FOREIGN KEY (`barber_customer_id`) REFERENCES `barber_customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `customer_subscriptions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `customer_subscriptions_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `barber_packages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `customer_subscriptions_sold_by_stylist_id_fkey` FOREIGN KEY (`sold_by_stylist_id`) REFERENCES `barber_stylists` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_subscriptions`
--

LOCK TABLES `customer_subscriptions` WRITE;
/*!40000 ALTER TABLE `customer_subscriptions` DISABLE KEYS */;
INSERT INTO `customer_subscriptions` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',1,1,9,'ACTIVE','2026-03-22 15:28:11.403','2026-03-22 16:24:04.967',NULL),(2,'cmn1pz7p60000uaog02stazhd','prod',2,1,7,'ACTIVE','2026-03-22 15:47:06.737','2026-03-22 19:26:37.748',NULL);
/*!40000 ALTER TABLE `customer_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dormitory_profiles`
--

DROP TABLE IF EXISTS `dormitory_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dormitory_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `display_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `caretaker_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_paper_size` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SLIP_58',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `prompt_pay_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_channels_note` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dormitory_profiles_owner_id_trial_session_id_key` (`owner_id`,`trial_session_id`),
  KEY `dormitory_profiles_owner_id_idx` (`owner_id`),
  CONSTRAINT `dormitory_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dormitory_profiles`
--

LOCK TABLES `dormitory_profiles` WRITE;
/*!40000 ALTER TABLE `dormitory_profiles` DISABLE KEYS */;
INSERT INTO `dormitory_profiles` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','มาเวล','/uploads/dorm-logos/cmn1pz7p60000uaog02stazhd-1774199540926.png','123456789','222/285 ม.1 ต.บางคูวัด อ.เมือง จ.ปทุมธานี 12000','0815418771','A4','2026-03-22 17:12:20.929','2026-03-22 18:22:38.365','0815418771','ธ.กสิกรไทย เลขที่ 0966646914'),(2,'cmn1oqmwk0000ua1g374zua6n','prod',NULL,NULL,NULL,NULL,NULL,'SLIP_58','2026-03-24 17:24:44.992','2026-03-24 17:59:27.204','0966646914','ธ.กสิกรไทย 0966646914');
/*!40000 ALTER TABLE `dormitory_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `home_finance_categories`
--

DROP TABLE IF EXISTS `home_finance_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_finance_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `home_finance_categories_owner_id_name_key` (`owner_id`,`name`),
  KEY `home_finance_categories_owner_id_is_active_idx` (`owner_id`,`is_active`),
  CONSTRAINT `home_finance_categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `home_finance_categories`
--

LOCK TABLES `home_finance_categories` WRITE;
/*!40000 ALTER TABLE `home_finance_categories` DISABLE KEYS */;
INSERT INTO `home_finance_categories` VALUES (1,'cmn1pz7p60000uaog02stazhd','เบ็ดเตล็ด',100,1,'2026-03-24 14:37:32.322','2026-03-24 14:37:32.322');
/*!40000 ALTER TABLE `home_finance_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `home_finance_entries`
--

DROP TABLE IF EXISTS `home_finance_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_finance_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_date` date NOT NULL,
  `type` enum('INCOME','EXPENSE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `bill_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_center` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(600) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `category_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'อื่นๆ',
  PRIMARY KEY (`id`),
  KEY `home_finance_entries_owner_id_entry_date_idx` (`owner_id`,`entry_date`),
  KEY `home_finance_entries_owner_id_category_key_idx` (`owner_id`,`category_key`),
  CONSTRAINT `home_finance_entries_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `home_finance_entries`
--

LOCK TABLES `home_finance_entries` WRITE;
/*!40000 ALTER TABLE `home_finance_entries` DISABLE KEYS */;
INSERT INTO `home_finance_entries` VALUES (4,'cmn1pz7p60000uaog02stazhd','2026-03-23','EXPENSE','UTILITIES_WATER','น้ำ',50.00,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-24 15:09:07.910','2026-03-24 15:09:07.910','ค่าน้ำประปา');
/*!40000 ALTER TABLE `home_finance_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `home_finance_reminders`
--

DROP TABLE IF EXISTS `home_finance_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_finance_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `note` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `home_finance_reminders_owner_id_due_date_is_done_idx` (`owner_id`,`due_date`,`is_done`),
  CONSTRAINT `home_finance_reminders_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `home_finance_reminders`
--

LOCK TABLES `home_finance_reminders` WRITE;
/*!40000 ALTER TABLE `home_finance_reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `home_finance_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `home_utility_profiles`
--

DROP TABLE IF EXISTS `home_utility_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_utility_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `utility_type` enum('ELECTRIC','WATER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meter_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_due_day` int DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `note` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `home_utility_profiles_owner_id_utility_type_is_active_idx` (`owner_id`,`utility_type`,`is_active`),
  CONSTRAINT `home_utility_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `home_utility_profiles`
--

LOCK TABLES `home_utility_profiles` WRITE;
/*!40000 ALTER TABLE `home_utility_profiles` DISABLE KEYS */;
INSERT INTO `home_utility_profiles` VALUES (1,'cmn1pz7p60000uaog02stazhd','ELECTRIC','ค่าไฟบ้าน',NULL,'1234567890',NULL,NULL,'2026-03-31',NULL,1,'2026-03-24 15:25:23.208','2026-03-24 15:25:23.208');
/*!40000 ALTER TABLE `home_utility_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `home_vehicle_profiles`
--

DROP TABLE IF EXISTS `home_vehicle_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_vehicle_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type` enum('CAR','MOTORCYCLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plate_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_year` int DEFAULT NULL,
  `tax_due_date` date DEFAULT NULL,
  `service_due_date` date DEFAULT NULL,
  `insurance_due_date` date DEFAULT NULL,
  `note` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `home_vehicle_profiles_owner_id_vehicle_type_is_active_idx` (`owner_id`,`vehicle_type`,`is_active`),
  CONSTRAINT `home_vehicle_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `home_vehicle_profiles`
--

LOCK TABLES `home_vehicle_profiles` WRITE;
/*!40000 ALTER TABLE `home_vehicle_profiles` DISABLE KEYS */;
INSERT INTO `home_vehicle_profiles` VALUES (1,'cmn1pz7p60000uaog02stazhd','CAR','everest',NULL,NULL,'กม 4460 กทม.',NULL,'2026-03-31','2026-03-31','2026-03-31',NULL,1,'2026-03-24 15:26:55.162','2026-03-24 15:26:55.162');
/*!40000 ALTER TABLE `home_vehicle_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_list`
--

DROP TABLE IF EXISTS `module_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_list` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `group_id` int NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_list_slug_key` (`slug`),
  KEY `module_list_group_id_idx` (`group_id`),
  KEY `module_list_is_active_sort_order_idx` (`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_list`
--

LOCK TABLES `module_list` WRITE;
/*!40000 ALTER TABLE `module_list` DISABLE KEYS */;
INSERT INTO `module_list` VALUES ('building-pos-module','building-pos','ระบบ POS ร้านอาหารอาคาร','กลุ่ม 1 (Basic) — เพิ่มเมนู จัดกลุ่มเมนู รับออเดอร์ และ QR สั่งอาหารด้วยตนเอง',1,20,1,'2026-03-27 21:46:44.394','2026-03-27 21:46:44.394'),('car-wash-module','car-wash','ระบบจัดการคาร์แคร์','กลุ่ม 1 (Basic) — แพ็กเกจบริการ บันทึกเข้ารับบริการ และติดตามร้องเรียน',1,18,1,'2026-03-26 21:55:40.107','2026-03-26 21:55:40.107'),('cmn1rjt4m0002uag0vp8mireo','attendance','ระบบเช็คชื่อ','กลุ่ม 1 (Basic)',1,10,1,'2026-03-22 12:59:03.863','2026-03-22 15:12:10.884'),('cmn1rjt4p0003uag0isi5yjjy','income-expense-basic','ระบบบันทึกรายรับ-รายจ่ายเบื้องต้น','กลุ่ม 1 (Basic) — สายรายวันใช้กลุ่มนี้',1,20,1,'2026-03-22 12:59:03.865','2026-03-22 15:12:10.896'),('cmn1rjt4r0004uag01vvb8qfi','stock-management','ระบบจัดการสต็อกสินค้า','กลุ่ม 2 (Silver)',2,30,1,'2026-03-22 12:59:03.868','2026-03-22 15:12:10.914'),('cmn1rjt4u0005uag0ly0mm2sv','receipt-print','ระบบพิมพ์ใบเสร็จ','กลุ่ม 2 (Silver)',2,40,1,'2026-03-22 12:59:03.870','2026-03-22 15:12:10.926'),('cmn1rjt4w0006uag0d8g38go9','analytics-dashboard','ระบบวิเคราะห์ Dashboard (Data Analytics)','กลุ่ม 3 (Gold)',3,50,1,'2026-03-22 12:59:03.872','2026-03-22 15:12:10.929'),('cmn1rjt4y0007uag0e7ti9xxk','inter-branch-chat','ระบบ Chat ระหว่างสาขา','กลุ่ม 3 (Gold)',3,60,1,'2026-03-22 12:59:03.875','2026-03-22 15:12:10.931'),('cmn1rjt510008uag0gse55c8q','employee-management','ระบบจัดการพนักงาน','กลุ่ม 4 (Platinum)',4,70,1,'2026-03-22 12:59:03.877','2026-03-22 15:12:10.934'),('cmn1rjt530009uag07iydnnfe','payroll','ระบบเงินเดือน','กลุ่ม 4 (Platinum)',4,80,1,'2026-03-22 12:59:03.880','2026-03-22 15:12:10.936'),('cmn1rjt55000auag0lufeav1j','external-api','ระบบ API เชื่อมต่อภายนอก','กลุ่ม 5 (Ultimate)',5,90,1,'2026-03-22 12:59:03.882','2026-03-22 15:12:10.938'),('cmn1rjt58000buag00ehtjpuw','advanced-automation','ระบบ Automation ขั้นสูง','กลุ่ม 5 (Ultimate)',5,100,1,'2026-03-22 12:59:03.884','2026-03-22 15:12:10.940'),('cmn1vdf2b0004ualwewgpldwc','dormitory','ระบบจัดการหอพัก','กลุ่ม 1 (Basic) — ห้อง/ผู้เข้าพัก มิเตอร์น้ำไฟ Split Bill ใบเสร็จ',1,15,1,'2026-03-22 14:46:04.164','2026-03-22 15:12:10.901'),('cmn1wazyy0005ua903w1t3fsk','barber','ระบบจัดการร้านตัดผม','กลุ่ม 1 (Basic) — แพ็กเกจ สมาชิก เช็คอิน QR/เบอร์ ประวัติ',1,17,1,'2026-03-22 15:12:10.906','2026-03-22 15:12:10.906'),('mqtt-service-module','mqtt-service','ระบบบริการ MQTT','กลุ่ม 1 (Basic) — จัดการ credentials, ACL, และสถานะการเชื่อมต่อสำหรับอุปกรณ์ IoT',1,19,1,'2026-03-27 21:31:29.689','2026-03-27 21:31:29.689'),('village-module','village','ระบบจัดการหมู่บ้าน','กลุ่ม 1 (Basic) — ลูกบ้าน ค่าส่วนกลางรายบ้าน ตรวจสลิป สรุปรายปี รายงาน Excel',1,19,1,'2026-03-29 21:48:11.919','2026-03-29 21:48:11.919');
/*!40000 ALTER TABLE `module_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_acl_rules`
--

DROP TABLE IF EXISTS `mqtt_acl_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_acl_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `tenant_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_value` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `topic_pattern` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effect` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'allow',
  `priority` int NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mqtt_acl_owner_trial_active_idx` (`owner_id`,`trial_session_id`,`is_active`),
  KEY `mqtt_acl_owner_trial_subject_idx` (`owner_id`,`trial_session_id`,`subject_type`,`subject_value`),
  KEY `mqtt_acl_owner_idx` (`owner_id`),
  CONSTRAINT `mqtt_acl_rules_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_acl_rules`
--

LOCK TABLES `mqtt_acl_rules` WRITE;
/*!40000 ALTER TABLE `mqtt_acl_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_acl_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_client_session_logs`
--

DROP TABLE IF EXISTS `mqtt_client_session_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_client_session_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `tenant_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `mqtt_sess_owner_trial_created_idx` (`owner_id`,`trial_session_id`,`created_at`),
  KEY `mqtt_sess_owner_trial_client_idx` (`owner_id`,`trial_session_id`,`client_id`),
  KEY `mqtt_sess_owner_idx` (`owner_id`),
  CONSTRAINT `mqtt_client_session_logs_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_client_session_logs`
--

LOCK TABLES `mqtt_client_session_logs` WRITE;
/*!40000 ALTER TABLE `mqtt_client_session_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_client_session_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_credentials`
--

DROP TABLE IF EXISTS `mqtt_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_credentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `tenant_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_seen_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mqtt_cred_owner_trial_client_uniq` (`owner_id`,`trial_session_id`,`client_id`),
  UNIQUE KEY `mqtt_cred_owner_trial_user_uniq` (`owner_id`,`trial_session_id`,`username`),
  KEY `mqtt_cred_owner_trial_active_idx` (`owner_id`,`trial_session_id`,`is_active`),
  KEY `mqtt_cred_owner_idx` (`owner_id`),
  CONSTRAINT `mqtt_credentials_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_credentials`
--

LOCK TABLES `mqtt_credentials` WRITE;
/*!40000 ALTER TABLE `mqtt_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_message_stat_daily`
--

DROP TABLE IF EXISTS `mqtt_message_stat_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_message_stat_daily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `tenant_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stat_date` date NOT NULL,
  `publish_count` bigint unsigned NOT NULL DEFAULT '0',
  `deliver_count` bigint unsigned NOT NULL DEFAULT '0',
  `connect_count` bigint unsigned NOT NULL DEFAULT '0',
  `unique_clients` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mqtt_stat_owner_trial_date_uniq` (`owner_id`,`trial_session_id`,`stat_date`),
  KEY `mqtt_stat_owner_idx` (`owner_id`),
  CONSTRAINT `mqtt_message_stat_daily_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_message_stat_daily`
--

LOCK TABLES `mqtt_message_stat_daily` WRITE;
/*!40000 ALTER TABLE `mqtt_message_stat_daily` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_message_stat_daily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_tenant_profiles`
--

DROP TABLE IF EXISTS `mqtt_tenant_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_tenant_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `tenant_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mqtt_tenant_owner_trial_uniq` (`owner_id`,`trial_session_id`),
  UNIQUE KEY `mqtt_tenant_code_uniq` (`tenant_code`),
  KEY `mqtt_tenant_owner_idx` (`owner_id`),
  CONSTRAINT `mqtt_tenant_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_tenant_profiles`
--

LOCK TABLES `mqtt_tenant_profiles` WRITE;
/*!40000 ALTER TABLE `mqtt_tenant_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_tenant_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `bill_id` int NOT NULL,
  `amount_to_pay` decimal(10,2) NOT NULL,
  `payment_status` enum('PENDING','PAID','OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paid_at` datetime(3) DEFAULT NULL,
  `receipt_number` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `proof_slip_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_uploaded_at` datetime(3) DEFAULT NULL,
  `public_proof_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_tenant_id_bill_id_key` (`tenant_id`,`bill_id`),
  UNIQUE KEY `payments_receipt_number_key` (`receipt_number`),
  UNIQUE KEY `payments_public_proof_token_key` (`public_proof_token`),
  KEY `payments_tenant_id_idx` (`tenant_id`),
  KEY `payments_bill_id_idx` (`bill_id`),
  KEY `payments_payment_status_idx` (`payment_status`),
  CONSTRAINT `payments_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `utility_bills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,1,2128.00,'PAID','2026-03-22 16:56:49.645','RCP-1774198609645',NULL,'2026-03-22 14:51:03.625','2026-03-22 16:56:49.646',NULL,NULL,NULL),(2,3,4,2096.00,'PENDING',NULL,NULL,NULL,'2026-03-22 18:20:18.514','2026-03-22 18:43:26.213','/uploads/dorm-payment-proofs/p2-1774205006206.jpg','2026-03-22 18:43:26.208','ccb931909061e55d7589536239b2989d3936d2d67fb9139b'),(3,2,3,2114.00,'PAID','2026-03-24 15:13:06.439','RCP-1774365186439',NULL,'2026-03-22 18:27:13.808','2026-03-24 15:13:06.451',NULL,NULL,'a5262f09ec4e538c8be5e06949f4f943c1e11a997c9a87cd');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `room_number` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` int NOT NULL,
  `room_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_occupants` int NOT NULL DEFAULT '1',
  `base_price` decimal(10,2) NOT NULL,
  `status` enum('AVAILABLE','OCCUPIED','MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_owner_id_room_number_trial_session_id_key` (`owner_id`,`room_number`,`trial_session_id`),
  KEY `rooms_owner_id_idx` (`owner_id`),
  CONSTRAINT `rooms_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod','101',1,'แอร์',2,2000.00,'AVAILABLE','2026-03-22 14:46:59.258','2026-03-22 14:46:59.258'),(2,'cmn1pz7p60000uaog02stazhd','prod','102',1,'แอร์',2,2000.00,'AVAILABLE','2026-03-22 17:34:48.741','2026-03-22 17:34:48.741'),(3,'cmn1pz7p60000uaog02stazhd','prod','203',1,'แอร์',2,2000.00,'AVAILABLE','2026-03-22 18:03:20.244','2026-03-22 18:03:20.244'),(4,'cmn1pz7p60000uaog02stazhd','prod','103',1,'พัดลม',2,1000.00,'AVAILABLE','2026-03-22 18:29:19.304','2026-03-22 18:29:19.304');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_activity_logs`
--

DROP TABLE IF EXISTS `system_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` enum('CREATE','UPDATE','UPSERT','DELETE','CREATE_MANY','UPDATE_MANY','DELETE_MANY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `system_activity_logs_created_at_idx` (`created_at`),
  KEY `system_activity_logs_expires_at_idx` (`expires_at`),
  KEY `system_activity_logs_actor_user_id_created_at_idx` (`actor_user_id`,`created_at`),
  KEY `system_activity_logs_model_name_created_at_idx` (`model_name`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_activity_logs`
--

LOCK TABLES `system_activity_logs` WRITE;
/*!40000 ALTER TABLE `system_activity_logs` DISABLE KEYS */;
INSERT INTO `system_activity_logs` VALUES (1,NULL,'CREATE','HomeFinanceEntry','{\"data\": {\"note\": null, \"type\": \"EXPENSE\", \"title\": \"ค่าไฟ\", \"amount\": 100, \"dueDate\": null, \"entryDate\": \"2026-03-23T17:00:00.000Z\", \"billNumber\": null, \"categoryKey\": \"UTILITIES_ELECTRIC\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"vehicleType\": null, \"categoryLabel\": \"ค่าไฟฟ้า\", \"paymentMethod\": null, \"serviceCenter\": null}}','2026-03-24 15:04:45.742','2027-03-24 15:04:45.740'),(2,NULL,'DELETE','HomeFinanceEntry','{\"where\": {\"id\": 1}}','2026-03-24 15:05:02.661','2027-03-24 15:05:02.659'),(3,NULL,'DELETE','HomeFinanceEntry','{\"where\": {\"id\": 2}}','2026-03-24 15:07:31.934','2027-03-24 15:07:31.932'),(4,NULL,'CREATE','HomeFinanceEntry','{\"data\": {\"note\": null, \"type\": \"EXPENSE\", \"title\": \"ค่าไฟ\", \"amount\": 30, \"dueDate\": null, \"entryDate\": \"2026-03-23T17:00:00.000Z\", \"billNumber\": null, \"categoryKey\": \"UTILITIES_ELECTRIC\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"vehicleType\": null, \"categoryLabel\": \"ค่าไฟฟ้า\", \"paymentMethod\": null, \"serviceCenter\": null}}','2026-03-24 15:08:04.627','2027-03-24 15:08:04.626'),(5,NULL,'CREATE','HomeFinanceEntry','{\"data\": {\"note\": null, \"type\": \"EXPENSE\", \"title\": \"น้ำ\", \"amount\": 50, \"dueDate\": null, \"entryDate\": \"2026-03-23T17:00:00.000Z\", \"billNumber\": null, \"categoryKey\": \"UTILITIES_WATER\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"vehicleType\": null, \"categoryLabel\": \"ค่าน้ำประปา\", \"paymentMethod\": null, \"serviceCenter\": null}}','2026-03-24 15:09:07.915','2027-03-24 15:09:07.913'),(6,NULL,'DELETE','HomeFinanceEntry','{\"where\": {\"id\": 3}}','2026-03-24 15:11:19.105','2027-03-24 15:11:19.104'),(7,'cmn1pz7p60000uaog02stazhd','DELETE','HomeFinanceEntry','{\"id\": 3, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\"}','2026-03-24 15:11:19.109','2027-03-24 15:11:19.108'),(8,NULL,'UPDATE','SplitBillPayment','{\"data\": {\"note\": null, \"paidAt\": \"2026-03-24T15:13:06.439Z\", \"paymentStatus\": \"PAID\", \"receiptNumber\": \"RCP-1774365186439\"}, \"where\": {\"id\": 3}}','2026-03-24 15:13:06.467','2027-03-24 15:13:06.465'),(9,'debug-user','CREATE','DebugProbe','{\"at\": \"2026-03-24T15:17:21.480Z\", \"ok\": true}','2026-03-24 15:17:21.498','2027-03-24 15:17:21.481'),(10,NULL,'CREATE','HomeUtilityProfile','{\"data\": {\"note\": null, \"label\": \"ค่าไฟบ้าน\", \"dueDate\": \"2026-03-31T00:00:00.000Z\", \"isActive\": true, \"provider\": null, \"meterNumber\": null, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"utilityType\": \"ELECTRIC\", \"accountNumber\": \"1234567890\", \"defaultDueDay\": null}}','2026-03-24 15:25:23.213','2027-03-24 15:25:23.211'),(11,NULL,'CREATE','HomeVehicleProfile','{\"data\": {\"note\": null, \"brand\": null, \"label\": \"everest\", \"model\": null, \"isActive\": true, \"taxDueDate\": \"2026-03-31T00:00:00.000Z\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"plateNumber\": \"กม 4460 กทม.\", \"vehicleType\": \"CAR\", \"vehicleYear\": null, \"serviceDueDate\": \"2026-03-31T00:00:00.000Z\", \"insuranceDueDate\": \"2026-03-31T00:00:00.000Z\"}}','2026-03-24 15:26:55.167','2027-03-24 15:26:55.165'),(12,NULL,'CREATE','BarberBooking','{\"data\": {\"phone\": \"0815418771\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"scheduledAt\": \"2026-03-24T16:06:00.000Z\", \"customerName\": \"อ้อม\", \"barberCustomerId\": 2}}','2026-03-24 15:37:04.305','2026-06-24 15:37:04.304'),(13,NULL,'CREATE','AttendanceLog','{\"data\": {\"status\": \"AWAITING_CHECKOUT\", \"guestName\": \"อ้อม\", \"checkInLat\": 13.95846621127096, \"checkInLng\": 100.481513809069, \"guestPhone\": \"0815418771\", \"checkInTime\": \"2026-03-24T16:33:10.136Z\", \"lateCheckIn\": true, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"publicVisitorKind\": \"ROSTER_STAFF\", \"checkInFacePhotoUrl\": \"/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774369990132-6e484df3.jpg\"}}','2026-03-24 16:33:10.144','2026-06-24 16:33:10.143'),(14,NULL,'CREATE','AttendanceLog','{\"data\": {\"status\": \"AWAITING_CHECKOUT\", \"guestName\": \"อ้อม\", \"checkInLat\": 13.95843993082078, \"checkInLng\": 100.4814889424619, \"guestPhone\": \"0815418771\", \"checkInTime\": \"2026-03-24T17:00:44.391Z\", \"lateCheckIn\": false, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"publicVisitorKind\": \"ROSTER_STAFF\", \"checkInFacePhotoUrl\": \"/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774371644386-8d40f534.jpg\"}}','2026-03-24 17:00:44.399','2026-06-24 17:00:44.398'),(15,NULL,'UPDATE','AttendanceLog','{\"data\": {\"status\": \"EARLY_LEAVE\", \"checkOutLat\": 13.95843832341218, \"checkOutLng\": 100.4814967549949, \"checkOutTime\": \"2026-03-24T17:01:01.344Z\", \"earlyCheckOut\": true}, \"where\": {\"id\": 5}}','2026-03-24 17:01:01.353','2026-06-24 17:01:01.351'),(16,NULL,'CREATE','AttendanceLog','{\"data\": {\"status\": \"AWAITING_CHECKOUT\", \"guestName\": \"อ้อม\", \"checkInLat\": 13.95846750329348, \"checkInLng\": 100.4815018653315, \"guestPhone\": \"0815418771\", \"checkInTime\": \"2026-03-24T17:04:13.551Z\", \"lateCheckIn\": false, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"publicVisitorKind\": \"ROSTER_STAFF\", \"checkInFacePhotoUrl\": \"/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774371853546-27965a19.jpg\"}}','2026-03-24 17:04:13.560','2026-06-24 17:04:13.559'),(17,NULL,'UPDATE','AttendanceLog','{\"data\": {\"status\": \"EARLY_LEAVE\", \"checkOutLat\": 13.95845838586713, \"checkOutLng\": 100.4814899901689, \"checkOutTime\": \"2026-03-24T17:04:48.606Z\", \"earlyCheckOut\": true}, \"where\": {\"id\": 6}}','2026-03-24 17:04:48.617','2026-06-24 17:04:48.615'),(18,NULL,'UPDATE','User','{\"data\": {\"tokens\": {\"increment\": 5000}}, \"where\": {\"id\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"select\": {\"id\": true, \"role\": true, \"email\": true, \"tokens\": true, \"username\": true, \"createdAt\": true, \"updatedAt\": true, \"subscriptionTier\": true, \"subscriptionType\": true}}','2026-03-24 17:20:58.623','2026-06-24 17:20:58.621'),(19,NULL,'UPDATE','User','{\"data\": {\"role\": \"USER\", \"email\": \"test@test.com\", \"username\": \"test\", \"passwordHash\": \"$2b$12$pAawoYtM2DGlc10CHTXr2egyDSyQOSh8WXEOxJeotVSpDuloPzGLa\", \"subscriptionTier\": \"TIER_199\", \"subscriptionType\": \"BUFFET\", \"lastBuffetBillingMonth\": \"2026-03\"}, \"where\": {\"id\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"select\": {\"id\": true, \"role\": true, \"email\": true, \"tokens\": true, \"username\": true, \"createdAt\": true, \"updatedAt\": true, \"subscriptionTier\": true, \"subscriptionType\": true}}','2026-03-24 17:23:22.516','2026-06-24 17:23:22.514'),(20,NULL,'UPDATE','User','{\"data\": {\"phone\": \"0966646914\", \"address\": \"222/285\", \"fullName\": \"เร๊าะมัน หะนิแร\", \"latitude\": 13.95847703334551, \"longitude\": 100.4814978975444}, \"where\": {\"id\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"select\": {\"email\": true, \"phone\": true, \"tokens\": true, \"address\": true, \"fullName\": true, \"latitude\": true, \"username\": true, \"avatarUrl\": true, \"longitude\": true, \"subscriptionTier\": true}}','2026-03-24 17:24:44.980','2026-06-24 17:24:44.979'),(21,NULL,'UPSERT','BarberShopProfile','{\"where\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"create\": {\"taxId\": \"1234567890\", \"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"update\": {\"taxId\": \"1234567890\"}}','2026-03-24 17:24:44.989','2026-06-24 17:24:44.987'),(22,NULL,'UPSERT','DormitoryProfile','{\"where\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"create\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\", \"promptPayPhone\": \"0966646914\", \"defaultPaperSize\": \"SLIP_58\", \"paymentChannelsNote\": \"ธ.กสิกรไทย 0966646914\"}, \"update\": {\"promptPayPhone\": \"0966646914\", \"defaultPaperSize\": \"SLIP_58\", \"paymentChannelsNote\": \"ธ.กสิกรไทย 0966646914\"}}','2026-03-24 17:24:44.994','2026-06-24 17:24:44.993'),(23,NULL,'CREATE','AttendanceSettings','{\"data\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\", \"radiusMeters\": 150, \"allowedLocationLat\": 13.95847703334551, \"allowedLocationLng\": 100.4814978975444}}','2026-03-24 17:26:08.205','2026-06-24 17:26:08.203'),(24,NULL,'UPDATE','User','{\"data\": {\"phone\": \"0966646914\", \"address\": \"222/285\", \"fullName\": \"ร้านมาเวล\", \"latitude\": 13.95847703334551, \"longitude\": 100.4814978975444}, \"where\": {\"id\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"select\": {\"email\": true, \"phone\": true, \"tokens\": true, \"address\": true, \"fullName\": true, \"latitude\": true, \"username\": true, \"avatarUrl\": true, \"longitude\": true, \"subscriptionTier\": true}}','2026-03-24 17:59:27.194','2026-06-24 17:59:27.192'),(25,NULL,'UPSERT','BarberShopProfile','{\"where\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"create\": {\"taxId\": \"1234567890\", \"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"update\": {\"taxId\": \"1234567890\"}}','2026-03-24 17:59:27.201','2026-06-24 17:59:27.199'),(26,NULL,'UPSERT','DormitoryProfile','{\"where\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}, \"create\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\", \"promptPayPhone\": \"0966646914\", \"defaultPaperSize\": \"SLIP_58\", \"paymentChannelsNote\": \"ธ.กสิกรไทย 0966646914\"}, \"update\": {\"promptPayPhone\": \"0966646914\", \"defaultPaperSize\": \"SLIP_58\", \"paymentChannelsNote\": \"ธ.กสิกรไทย 0966646914\"}}','2026-03-24 17:59:27.207','2026-06-24 17:59:27.205'),(27,NULL,'CREATE','BarberBooking','{\"data\": {\"phone\": \"0815418771\", \"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\", \"scheduledAt\": \"2026-03-24T18:39:00.000Z\", \"customerName\": \"แมน\", \"barberCustomerId\": null}}','2026-03-24 18:10:05.243','2026-06-24 18:10:05.241'),(28,NULL,'DELETE_MANY','AttendanceShift','{\"where\": {\"locationId\": 2}}','2026-03-24 18:11:56.269','2026-06-24 18:11:56.267'),(29,NULL,'UPDATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"sortOrder\": 0, \"radiusMeters\": 150, \"allowedLocationLat\": 13.95847703334551, \"allowedLocationLng\": 100.4814978975444}, \"where\": {\"id\": 2}}','2026-03-24 18:11:56.276','2026-06-24 18:11:56.274'),(30,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"18:00\", \"sortOrder\": 0, \"startTime\": \"09:00\", \"locationId\": 2}}','2026-03-24 18:11:56.281','2026-06-24 18:11:56.279'),(31,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"17:00\", \"sortOrder\": 1, \"startTime\": \"10:00\", \"locationId\": 2}}','2026-03-24 18:11:56.285','2026-06-24 18:11:56.283'),(32,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"22:00\", \"sortOrder\": 2, \"startTime\": \"15:00\", \"locationId\": 2}}','2026-03-24 18:11:56.289','2026-06-24 18:11:56.287'),(33,NULL,'DELETE_MANY','AttendanceLocation','{\"where\": {\"id\": {\"notIn\": [2]}, \"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}}','2026-03-24 18:11:56.292','2026-06-24 18:11:56.291'),(34,NULL,'UPDATE','AttendanceSettings','{\"data\": {\"radiusMeters\": 150, \"shiftEndTime\": \"18:00\", \"shiftStartTime\": \"09:00\", \"allowedLocationLat\": 13.95847703334551, \"allowedLocationLng\": 100.4814978975444}, \"where\": {\"ownerUserId\": \"cmn1oqmwk0000ua1g374zua6n\"}}','2026-03-24 18:11:56.305','2026-06-24 18:11:56.303'),(35,NULL,'CREATE','AttendanceLog','{\"data\": {\"status\": \"AWAITING_CHECKOUT\", \"guestName\": \"อ้อม\", \"checkInLat\": 13.95847497244971, \"checkInLng\": 100.4815182197264, \"guestPhone\": \"0815418771\", \"checkInTime\": \"2026-03-25T12:14:56.854Z\", \"lateCheckIn\": true, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"appliedShiftIndex\": 0, \"publicVisitorKind\": \"ROSTER_STAFF\", \"checkInFacePhotoUrl\": \"/uploads/attendance-faces/cmn1pz7p60000uaog02stazh-1774440896849-83673f26.jpg\"}}','2026-03-25 12:14:56.865','2026-06-25 12:14:56.864'),(36,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:08:25.739','2026-06-25 13:08:25.737'),(37,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:30:17.918Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:15:17.925','2026-06-25 13:15:17.923'),(38,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:39:09.248Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:24:09.273','2026-06-25 13:24:09.266'),(39,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:51:51.792Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:36:51.798','2026-06-25 13:36:51.797'),(40,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:55:29.575Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:40:29.581','2026-06-25 13:40:29.580'),(41,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:58:51.858Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:43:51.868','2026-06-25 13:43:51.866'),(42,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:59:19.753Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:44:19.759','2026-06-25 13:44:19.757'),(43,NULL,'CREATE','TopUpOrder','{\"data\": {\"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:59:39.313Z\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:44:39.320','2026-06-25 13:44:39.318'),(44,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"0a1c9f8531124f3d91bc48b6\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:08:42.535Z\", \"mqttOrderNo\": \"2503260a1c9f85\", \"mqttDeviceId\": \"web0a1c9f85ucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:53:42.555','2026-06-25 13:53:42.553'),(45,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"a03c42cea8944c6bbd3845c0\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:13:09.770Z\", \"mqttOrderNo\": \"250326a03c42ce\", \"mqttDeviceId\": \"weba03c42ceucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 13:58:09.779','2026-06-25 13:58:09.777'),(46,NULL,'UPDATE','TopUpOrder','{\"data\": {\"melodyMeta\": {\"cm\": \"qrsuccess\", \"id\": \"weba03c42ceucmn1pz\", \"state\": true, \"value_str1\": \"SUCCESS\", \"value_str2\": 4120}, \"externalRef\": \"weba03c42ceucmn1pz\"}, \"where\": {\"id\": \"a03c42cea8944c6bbd3845c0\"}}','2026-03-25 13:58:21.695','2026-06-25 13:58:21.693'),(47,NULL,'UPDATE','TopUpOrder','{\"data\": {\"status\": \"FAILED\"}, \"where\": {\"id\": \"a03c42cea8944c6bbd3845c0\"}}','2026-03-25 13:58:21.707','2026-06-25 13:58:21.705'),(48,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"f8999b4fd22e45fabecf52f5\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:16:35.949Z\", \"mqttOrderNo\": \"250326f8999b4f\", \"mqttDeviceId\": \"webf8999b4fucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:01:35.975','2026-06-25 14:01:35.973'),(49,NULL,'UPDATE','TopUpOrder','{\"data\": {\"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:16:35.949Z\", \"mqttOrderNo\": \"250326f8999b4f\", \"mqttDeviceId\": \"webf8999b4fucmn1pz\", \"mqttLastEvent\": {\"cm\": \"qrsuccess\", \"id\": \"webf8999b4fucmn1pz\", \"state\": true, \"value_str1\": \"SUCCESS\", \"value_str2\": 4121}, \"mqttLastEventAt\": \"2026-03-25T14:01:49.311Z\"}, \"externalRef\": \"webf8999b4fucmn1pz\"}, \"where\": {\"id\": \"f8999b4fd22e45fabecf52f5\"}}','2026-03-25 14:01:49.316','2026-06-25 14:01:49.314'),(50,NULL,'UPDATE','TopUpOrder','{\"data\": {\"status\": \"PAID\"}, \"where\": {\"id\": \"f8999b4fd22e45fabecf52f5\"}}','2026-03-25 14:01:49.321','2026-06-25 14:01:49.320'),(51,NULL,'UPDATE','User','{\"data\": {\"tokens\": {\"increment\": 1}}, \"where\": {\"id\": \"cmn1pz7p60000uaog02stazhd\"}}','2026-03-25 14:01:49.330','2026-06-25 14:01:49.328'),(52,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"ba9f1963c21747a09bc8aac8\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:20:34.223Z\", \"mqttOrderNo\": \"250326ba9f1963\", \"mqttDeviceId\": \"webba9f1963ucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:05:34.230','2026-06-25 14:05:34.228'),(53,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"57a70c7bdfb24ebaa6758626\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:21:12.641Z\", \"mqttOrderNo\": \"25032657a70c7b\", \"mqttDeviceId\": \"web57a70c7bucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:06:12.647','2026-06-25 14:06:12.645'),(54,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"47a2c7241d804e728c3983af\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:23:38.016Z\", \"mqttOrderNo\": \"25032647a2c724\", \"mqttDeviceId\": \"web47a2c724ucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:08:38.022','2026-06-25 14:08:38.021'),(55,NULL,'UPDATE','TopUpOrder','{\"data\": {\"status\": \"PAID\"}, \"where\": {\"id\": \"47a2c7241d804e728c3983af\"}}','2026-03-25 14:10:25.853','2026-06-25 14:10:25.851'),(56,NULL,'UPDATE','User','{\"data\": {\"tokens\": {\"increment\": 1}}, \"where\": {\"id\": \"cmn1pz7p60000uaog02stazhd\"}}','2026-03-25 14:10:25.888','2026-06-25 14:10:25.886'),(57,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"8bfee13ecb13416dbe7eedf9\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:26:00.701Z\", \"mqttOrderNo\": \"2503268bfee13e\", \"mqttDeviceId\": \"web8bfee13eucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:11:00.707','2026-06-25 14:11:00.705'),(58,NULL,'CREATE','TopUpOrder','{\"data\": {\"id\": \"68536c7538db4567842ef14a\", \"status\": \"PENDING\", \"userId\": \"cmn1pz7p60000uaog02stazhd\", \"melodyMeta\": {\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:31:15.467Z\", \"mqttOrderNo\": \"25032668536c75\", \"mqttDeviceId\": \"web68536c75ucmn1pz\"}, \"planPriceKey\": 1, \"tokensToDeduct\": 1}}','2026-03-25 14:16:15.490','2026-06-25 14:16:15.486'),(59,NULL,'CREATE','AttendanceRosterEntry','{\"data\": {\"phone\": \"0966646914\", \"isActive\": true, \"displayName\": \"แมน\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"rosterShiftIndex\": 0}}','2026-03-25 14:47:49.859','2026-06-25 14:47:49.856'),(60,NULL,'CREATE','User','{\"data\": {\"role\": \"USER\", \"email\": \"test3@test.com\", \"tokens\": 7, \"username\": \"test3\", \"passwordHash\": \"$2b$12$zgAeEQ4pjEE4tz0TTFu9MOWkKe39hZP9CIqVLhcFfzwc0yPmkCCwu\", \"subscriptionTier\": \"NONE\", \"subscriptionType\": \"DAILY\", \"lastDeductionDate\": null}}','2026-03-25 15:07:24.675','2026-06-25 15:07:24.673'),(61,NULL,'UPDATE','User','{\"data\": {\"lastDeductionDate\": \"2026-03-25T15:07:24.733Z\"}, \"where\": {\"id\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-25 15:07:24.743','2026-06-25 15:07:24.740'),(62,NULL,'UPDATE','User','{\"data\": {\"tokens\": 6, \"lastDeductionDate\": \"2026-03-26T01:43:50.260Z\"}, \"where\": {\"id\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:43:50.316','2026-06-26 01:43:50.314'),(63,NULL,'CREATE','TrialSession','{\"data\": {\"status\": \"ACTIVE\", \"userId\": \"cmn66gf3z0001uab0411acyw3\", \"moduleId\": \"cmn1rjt4m0002uag0vp8mireo\", \"expiresAt\": \"2026-04-02T01:53:31.369Z\"}}','2026-03-26 01:53:31.376','2026-06-26 01:53:31.374'),(64,NULL,'UPDATE','User','{\"data\": {\"tokens\": 5, \"lastAttendanceTokenDate\": \"2026-03-26T05:00:00.000Z\"}, \"where\": {\"id\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:53:38.429','2026-06-26 01:53:38.427'),(65,NULL,'UPDATE','User','{\"data\": {\"tokens\": 5, \"lastAttendanceTokenDate\": \"2026-03-26T05:00:00.000Z\"}, \"where\": {\"id\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:53:38.452','2026-06-26 01:53:38.450'),(66,NULL,'CREATE','AttendanceSettings','{\"data\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"radiusMeters\": 150, \"allowedLocationLat\": 13.7563309, \"allowedLocationLng\": 100.5017651}}','2026-03-26 01:53:45.920','2026-06-26 01:53:45.918'),(67,NULL,'CREATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"shifts\": {\"create\": [{\"endTime\": \"18:00\", \"sortOrder\": 0, \"startTime\": \"09:00\"}]}, \"sortOrder\": 0, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"radiusMeters\": 150, \"allowedLocationLat\": 13.7563309, \"allowedLocationLng\": 100.5017651}}','2026-03-26 01:53:45.931','2026-06-26 01:53:45.929'),(68,NULL,'DELETE_MANY','AttendanceShift','{\"where\": {\"locationId\": 4}}','2026-03-26 01:54:21.057','2026-06-26 01:54:21.056'),(69,NULL,'UPDATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"sortOrder\": 0, \"radiusMeters\": 150, \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"id\": 4}}','2026-03-26 01:54:21.065','2026-06-26 01:54:21.064'),(70,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"19:00\", \"sortOrder\": 0, \"startTime\": \"07:00\", \"locationId\": 4}}','2026-03-26 01:54:21.070','2026-06-26 01:54:21.069'),(71,NULL,'DELETE_MANY','AttendanceLocation','{\"where\": {\"id\": {\"notIn\": [4]}, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:21.073','2026-06-26 01:54:21.072'),(72,NULL,'UPDATE','AttendanceSettings','{\"data\": {\"radiusMeters\": 150, \"shiftEndTime\": \"19:00\", \"shiftStartTime\": \"07:00\", \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:21.084','2026-06-26 01:54:21.082'),(73,NULL,'DELETE_MANY','AttendanceShift','{\"where\": {\"locationId\": 4}}','2026-03-26 01:54:22.593','2026-06-26 01:54:22.591'),(74,NULL,'UPDATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"sortOrder\": 0, \"radiusMeters\": 150, \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"id\": 4}}','2026-03-26 01:54:22.599','2026-06-26 01:54:22.598'),(75,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"19:00\", \"sortOrder\": 0, \"startTime\": \"07:00\", \"locationId\": 4}}','2026-03-26 01:54:22.603','2026-06-26 01:54:22.602'),(76,NULL,'DELETE_MANY','AttendanceLocation','{\"where\": {\"id\": {\"notIn\": [4]}, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:22.606','2026-06-26 01:54:22.605'),(77,NULL,'UPDATE','AttendanceSettings','{\"data\": {\"radiusMeters\": 150, \"shiftEndTime\": \"19:00\", \"shiftStartTime\": \"07:00\", \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:22.614','2026-06-26 01:54:22.613'),(78,NULL,'DELETE_MANY','AttendanceShift','{\"where\": {\"locationId\": 4}}','2026-03-26 01:54:23.117','2026-06-26 01:54:23.116'),(79,NULL,'UPDATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"sortOrder\": 0, \"radiusMeters\": 150, \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"id\": 4}}','2026-03-26 01:54:23.125','2026-06-26 01:54:23.123'),(80,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"19:00\", \"sortOrder\": 0, \"startTime\": \"07:00\", \"locationId\": 4}}','2026-03-26 01:54:23.128','2026-06-26 01:54:23.127'),(81,NULL,'DELETE_MANY','AttendanceLocation','{\"where\": {\"id\": {\"notIn\": [4]}, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:23.141','2026-06-26 01:54:23.139'),(82,NULL,'UPDATE','AttendanceSettings','{\"data\": {\"radiusMeters\": 150, \"shiftEndTime\": \"19:00\", \"shiftStartTime\": \"07:00\", \"allowedLocationLat\": 13.95843005623678, \"allowedLocationLng\": 100.4814737399088}, \"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\"}}','2026-03-26 01:54:23.152','2026-06-26 01:54:23.151'),(83,NULL,'CREATE','AttendanceRosterEntry','{\"data\": {\"phone\": \"0966646914\", \"isActive\": true, \"displayName\": \"สมใจ\", \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"rosterShiftIndex\": 0}}','2026-03-26 01:54:54.153','2026-06-26 01:54:54.152'),(84,NULL,'DELETE_MANY','BarberServiceLog','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:24.998','2026-06-26 01:56:24.995'),(85,NULL,'DELETE_MANY','BarberBooking','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.002','2026-06-26 01:56:25.000'),(86,NULL,'DELETE_MANY','BarberCustomerSubscription','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.005','2026-06-26 01:56:25.003'),(87,NULL,'DELETE_MANY','BarberPortalStaffPing','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.008','2026-06-26 01:56:25.006'),(88,NULL,'DELETE_MANY','BarberCustomer','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.011','2026-06-26 01:56:25.009'),(89,NULL,'DELETE_MANY','BarberPackage','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.015','2026-06-26 01:56:25.013'),(90,NULL,'DELETE_MANY','BarberStylist','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.018','2026-06-26 01:56:25.016'),(91,NULL,'DELETE_MANY','BarberShopProfile','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.022','2026-06-26 01:56:25.020'),(92,NULL,'DELETE_MANY','Room','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.026','2026-06-26 01:56:25.023'),(93,NULL,'DELETE_MANY','DormitoryProfile','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.029','2026-06-26 01:56:25.026'),(94,NULL,'DELETE','TrialSession','{\"where\": {\"id\": \"cmn6tjbot0001uaswffxbh37b\"}}','2026-03-26 01:56:25.033','2026-06-26 01:56:25.031'),(95,NULL,'CREATE','TrialSession','{\"data\": {\"status\": \"ACTIVE\", \"userId\": \"cmn66gf3z0001uab0411acyw3\", \"moduleId\": \"cmn1rjt4m0002uag0vp8mireo\", \"expiresAt\": \"2026-04-02T02:26:59.229Z\"}}','2026-03-26 02:26:59.235','2026-06-26 02:26:59.233'),(96,NULL,'CREATE','AttendanceSettings','{\"data\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"radiusMeters\": 150, \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\", \"allowedLocationLat\": 13.7563309, \"allowedLocationLng\": 100.5017651}}','2026-03-26 02:27:17.619','2026-06-26 02:27:17.617'),(97,NULL,'CREATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"shifts\": {\"create\": [{\"endTime\": \"18:00\", \"sortOrder\": 0, \"startTime\": \"09:00\"}]}, \"sortOrder\": 0, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"radiusMeters\": 150, \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\", \"allowedLocationLat\": 13.7563309, \"allowedLocationLng\": 100.5017651}}','2026-03-26 02:27:17.631','2026-06-26 02:27:17.628'),(98,NULL,'DELETE_MANY','AttendanceShift','{\"where\": {\"locationId\": 5}}','2026-03-26 02:27:24.523','2026-06-26 02:27:24.521'),(99,NULL,'UPDATE','AttendanceLocation','{\"data\": {\"name\": \"จุดหลัก\", \"sortOrder\": 0, \"radiusMeters\": 150, \"allowedLocationLat\": 13.95848072667534, \"allowedLocationLng\": 100.4814946056268}, \"where\": {\"id\": 5}}','2026-03-26 02:27:24.528','2026-06-26 02:27:24.526'),(100,NULL,'CREATE','AttendanceShift','{\"data\": {\"endTime\": \"18:00\", \"sortOrder\": 0, \"startTime\": \"09:00\", \"locationId\": 5}}','2026-03-26 02:27:24.532','2026-06-26 02:27:24.530'),(101,NULL,'DELETE_MANY','AttendanceLocation','{\"where\": {\"id\": {\"notIn\": [5]}, \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:27:24.535','2026-06-26 02:27:24.533'),(102,NULL,'UPDATE','AttendanceSettings','{\"data\": {\"radiusMeters\": 150, \"shiftEndTime\": \"18:00\", \"shiftStartTime\": \"09:00\", \"allowedLocationLat\": 13.95848072667534, \"allowedLocationLng\": 100.4814946056268}, \"where\": {\"ownerUserId_trialSessionId\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}}','2026-03-26 02:27:24.544','2026-06-26 02:27:24.542'),(103,NULL,'CREATE','AttendanceRosterEntry','{\"data\": {\"phone\": \"0815418771\", \"isActive\": true, \"displayName\": \"เนอร์\", \"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\", \"rosterShiftIndex\": 0}}','2026-03-26 02:27:37.154','2026-06-26 02:27:37.151'),(104,NULL,'DELETE_MANY','BarberServiceLog','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.280','2026-06-26 02:28:50.279'),(105,NULL,'DELETE_MANY','BarberBooking','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.285','2026-06-26 02:28:50.284'),(106,NULL,'DELETE_MANY','BarberCustomerSubscription','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.289','2026-06-26 02:28:50.287'),(107,NULL,'DELETE_MANY','BarberPortalStaffPing','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.292','2026-06-26 02:28:50.291'),(108,NULL,'DELETE_MANY','BarberCustomer','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.295','2026-06-26 02:28:50.294'),(109,NULL,'DELETE_MANY','BarberPackage','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.298','2026-06-26 02:28:50.297'),(110,NULL,'DELETE_MANY','BarberStylist','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.302','2026-06-26 02:28:50.300'),(111,NULL,'DELETE_MANY','BarberShopProfile','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.305','2026-06-26 02:28:50.304'),(112,NULL,'DELETE_MANY','Room','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.309','2026-06-26 02:28:50.308'),(113,NULL,'DELETE_MANY','DormitoryProfile','{\"where\": {\"ownerUserId\": \"cmn66gf3z0001uab0411acyw3\", \"trialSessionId\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.313','2026-06-26 02:28:50.311'),(114,NULL,'DELETE','TrialSession','{\"where\": {\"id\": \"cmn6uqcyo0001ua3wkbz7v2pn\"}}','2026-03-26 02:28:50.319','2026-06-26 02:28:50.317'),(115,NULL,'CREATE','BuildingPosCategory','{\"data\": {\"name\": \"ของหวาน\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774625584379.png\", \"isActive\": true, \"sortOrder\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-27 15:33:06.380','2026-06-27 15:33:06.379'),(116,NULL,'CREATE','BuildingPosMenuItem','{\"data\": {\"name\": \"บัวลอย\", \"price\": 20, \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774625614706.png\", \"isActive\": true, \"categoryId\": 1, \"description\": \"\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-27 15:33:40.221','2026-06-27 15:33:40.219'),(117,NULL,'CREATE','BuildingPosMenuItem','{\"data\": {\"name\": \"ข้าวเหนียวดำ\", \"price\": 30, \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774782265265.png\", \"isActive\": true, \"categoryId\": 1, \"description\": \"\", \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 11:04:35.286','2026-06-29 11:04:35.285'),(118,NULL,'CREATE','BuildingPosCategory','{\"data\": {\"name\": \"แนะนำ\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790118466.png\", \"isActive\": true, \"sortOrder\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:15:19.449','2026-06-29 13:15:19.447'),(119,NULL,'CREATE','BuildingPosCategory','{\"data\": {\"name\": \"ต้มยำ\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790135967.png\", \"isActive\": true, \"sortOrder\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:15:36.922','2026-06-29 13:15:36.920'),(120,NULL,'CREATE','BuildingPosCategory','{\"data\": {\"name\": \"ทอด\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790174287.png\", \"isActive\": true, \"sortOrder\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:16:14.902','2026-06-29 13:16:14.900'),(121,NULL,'CREATE','BuildingPosCategory','{\"data\": {\"name\": \"ผัด\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790200734.png\", \"isActive\": true, \"sortOrder\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:16:41.361','2026-06-29 13:16:41.359'),(122,NULL,'UPDATE_MANY','BuildingPosCategory','{\"data\": {\"name\": \"ของหวาน\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774625584379.png\", \"isActive\": true, \"sortOrder\": 3}, \"where\": {\"id\": 1, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:28:29.101','2026-06-29 13:28:29.099'),(123,NULL,'UPDATE_MANY','BuildingPosCategory','{\"data\": {\"name\": \"ผัด\", \"imageUrl\": \"/uploads/building-pos/cmn1pz7p60000uaog02stazhd-1774790200734.png\", \"isActive\": true, \"sortOrder\": 2}, \"where\": {\"id\": 5, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"trialSessionId\": \"prod\"}}','2026-03-29 13:28:36.320','2026-06-29 13:28:36.318'),(124,NULL,'CREATE','VillageProfile','{\"data\": {\"displayName\": null, \"ownerUserId\": \"cmn1pz7p60000uaog02stazhd\", \"dueDayOfMonth\": 5, \"trialSessionId\": \"prod\", \"defaultMonthlyFee\": 0}}','2026-03-29 15:41:27.475','2026-06-29 15:41:27.473');
/*!40000 ALTER TABLE `system_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_card` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','MOVED_OUT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `check_in_date` date NOT NULL,
  `check_out_date` date DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tenants_room_id_idx` (`room_id`),
  CONSTRAINT `tenants_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,1,'มาดี','0966646914','1111111111111','ACTIVE','2026-03-22',NULL,'2026-03-22 14:50:59.255','2026-03-22 14:50:59.255'),(2,2,'นายเอ','08888888','2222222222222','ACTIVE','2026-03-23',NULL,'2026-03-22 17:36:08.671','2026-03-22 17:36:08.671'),(3,3,'นายบี','0815418771','3333333333333','ACTIVE','2026-03-23',NULL,'2026-03-22 18:03:45.581','2026-03-22 18:03:45.581'),(4,4,'นายซี','0812365478','4444444444444','ACTIVE','2026-03-23',NULL,'2026-03-22 18:30:05.105','2026-03-22 18:30:05.105');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topuporder`
--

DROP TABLE IF EXISTS `topuporder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topuporder` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amountBaht` int NOT NULL,
  `tokensToAdd` int NOT NULL,
  `status` enum('PENDING','PAID','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `externalRef` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `melodyMeta` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TopUpOrder_externalRef_key` (`externalRef`),
  KEY `TopUpOrder_userId_idx` (`userId`),
  KEY `TopUpOrder_status_idx` (`status`),
  CONSTRAINT `TopUpOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topuporder`
--

LOCK TABLES `topuporder` WRITE;
/*!40000 ALTER TABLE `topuporder` DISABLE KEYS */;
INSERT INTO `topuporder` VALUES ('0a1c9f8531124f3d91bc48b6','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:08:42.535Z\", \"mqttOrderNo\": \"2503260a1c9f85\", \"mqttDeviceId\": \"web0a1c9f85ucmn1pz\"}','2026-03-25 13:53:42.550','2026-03-25 13:53:42.550'),('47a2c7241d804e728c3983af','cmn1pz7p60000uaog02stazhd',1,1,'PAID',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:23:38.016Z\", \"mqttOrderNo\": \"25032647a2c724\", \"mqttDeviceId\": \"web47a2c724ucmn1pz\"}','2026-03-25 14:08:38.018','2026-03-25 14:10:25.851'),('57a70c7bdfb24ebaa6758626','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:21:12.641Z\", \"mqttOrderNo\": \"25032657a70c7b\", \"mqttDeviceId\": \"web57a70c7bucmn1pz\"}','2026-03-25 14:06:12.643','2026-03-25 14:06:12.643'),('68536c7538db4567842ef14a','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:31:15.467Z\", \"mqttOrderNo\": \"25032668536c75\", \"mqttDeviceId\": \"web68536c75ucmn1pz\"}','2026-03-25 14:16:15.471','2026-03-25 14:16:15.471'),('8bfee13ecb13416dbe7eedf9','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:26:00.701Z\", \"mqttOrderNo\": \"2503268bfee13e\", \"mqttDeviceId\": \"web8bfee13eucmn1pz\"}','2026-03-25 14:11:00.703','2026-03-25 14:11:00.703'),('a03c42cea8944c6bbd3845c0','cmn1pz7p60000uaog02stazhd',1,1,'FAILED','weba03c42ceucmn1pz','{\"cm\": \"qrsuccess\", \"id\": \"weba03c42ceucmn1pz\", \"state\": true, \"value_str1\": \"SUCCESS\", \"value_str2\": 4120}','2026-03-25 13:58:09.773','2026-03-25 13:58:21.706'),('ba9f1963c21747a09bc8aac8','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:20:34.223Z\", \"mqttOrderNo\": \"250326ba9f1963\", \"mqttDeviceId\": \"webba9f1963ucmn1pz\"}','2026-03-25 14:05:34.226','2026-03-25 14:05:34.226'),('cmn1qzsxt0003uaac5bso7ibt','cmn1oqmwk0000ua1g374zua6n',199,25,'PAID',NULL,NULL,'2026-03-22 12:43:30.498','2026-03-22 12:43:38.918'),('cmn627eo40001ua006vcvw0iz','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\"}','2026-03-25 13:08:25.730','2026-03-25 13:08:25.730'),('cmn62g8ps0003ua00gatwlkx6','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:30:17.918Z\"}','2026-03-25 13:15:17.920','2026-03-25 13:15:17.920'),('cmn62rmoy0001uanw6ovd54tu','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:39:09.248Z\"}','2026-03-25 13:24:09.251','2026-03-25 13:24:09.251'),('cmn637z2p0003uanwnv8gl3ff','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:51:51.792Z\"}','2026-03-25 13:36:51.794','2026-03-25 13:36:51.794'),('cmn63cn480005uanw9liofvy0','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:55:29.575Z\"}','2026-03-25 13:40:29.577','2026-03-25 13:40:29.577'),('cmn63gz7b0007uanw6ymgw6tp','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:58:51.858Z\"}','2026-03-25 13:43:51.861','2026-03-25 13:43:51.861'),('cmn63hkq30001uaj4z53e5uzw','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:59:19.753Z\"}','2026-03-25 13:44:19.755','2026-03-25 13:44:19.755'),('cmn63hztf0003uaj40zvwjzo4','cmn1pz7p60000uaog02stazhd',1,1,'PENDING',NULL,'{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T13:59:39.313Z\"}','2026-03-25 13:44:39.315','2026-03-25 13:44:39.315'),('f8999b4fd22e45fabecf52f5','cmn1pz7p60000uaog02stazhd',1,1,'PAID','webf8999b4fucmn1pz','{\"kind\": \"TOKEN_TOPUP\", \"source\": \"dashboard_topup\", \"expiresAt\": \"2026-03-25T14:16:35.949Z\", \"mqttOrderNo\": \"250326f8999b4f\", \"mqttDeviceId\": \"webf8999b4fucmn1pz\", \"mqttLastEvent\": {\"cm\": \"qrsuccess\", \"id\": \"webf8999b4fucmn1pz\", \"state\": true, \"value_str1\": \"SUCCESS\", \"value_str2\": 4121}, \"mqttLastEventAt\": \"2026-03-25T14:01:49.311Z\"}','2026-03-25 14:01:35.962','2026-03-25 14:01:49.320');
/*!40000 ALTER TABLE `topuporder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trial_sessions`
--

DROP TABLE IF EXISTS `trial_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trial_sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `trial_sessions_user_id_module_id_idx` (`user_id`,`module_id`),
  KEY `trial_sessions_expires_at_idx` (`expires_at`),
  KEY `trial_sessions_module_id_fkey` (`module_id`),
  CONSTRAINT `trial_sessions_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `module_list` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `trial_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trial_sessions`
--

LOCK TABLES `trial_sessions` WRITE;
/*!40000 ALTER TABLE `trial_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `trial_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `resetToken` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resetTokenExpires` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `avatarUrl` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_deduction_date` datetime(3) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscription_tier` enum('NONE','TIER_199','TIER_299','TIER_399','TIER_499','TIER_599') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `tokens` int NOT NULL DEFAULT '0',
  `subscription_type` enum('BUFFET','DAILY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DAILY',
  `last_buffet_billing_month` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_dormitory_token_date` date DEFAULT NULL,
  `last_barber_token_date` date DEFAULT NULL,
  `last_attendance_token_date` date DEFAULT NULL,
  `employer_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_village_token_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_username_key` (`username`),
  KEY `User_employer_user_id_idx` (`employer_user_id`),
  CONSTRAINT `User_employer_user_id_fkey` FOREIGN KEY (`employer_user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmn1oqmwk0000ua1g374zua6n','test@test.com','test','$2b$12$pAawoYtM2DGlc10CHTXr2egyDSyQOSh8WXEOxJeotVSpDuloPzGLa','USER',NULL,NULL,'2026-03-22 11:40:23.540','2026-03-24 17:59:27.190','222/285','/uploads/avatars/cmn1oqmwk0000ua1g374zua6n-1774181175151.png','ร้านมาเวล','2026-03-22 12:00:35.887',13.95847703334551,100.4814978975444,'0966646914','TIER_199',6125,'BUFFET','2026-03',NULL,NULL,NULL,NULL,NULL),('cmn1pz7p60000uaog02stazhd','admin@mawell.local','admin','$2b$12$auRWkJsTN67W3qyUD5.AaOH4KNB3QCdC7HmkmhlpKdQjQCtwMcFxm','ADMIN',NULL,NULL,'2026-03-22 12:15:03.354','2026-03-25 14:10:25.884','222/285 ม.1 ต.บางคูวัด อ.เมือง จ.ปทุมธานี 12000','/uploads/avatars/cmn1pz7p60000uaog02stazhd-1774205717539.png','หจก.มาเวล','2026-03-22 12:15:03.344',13.95850284256917,100.481584149332,'0815418771','TIER_599',100001,'BUFFET','2026-03',NULL,NULL,NULL,NULL,NULL),('cmn1pz7w00001uaog0dbxhx5y','user@mawell.local','user','$2b$12$O8ae9pVuB/fCHkAa4lcWGeOJEgJgOmTFR8.blqeE1DmfWWvuGbHHq','USER',NULL,NULL,'2026-03-22 12:15:03.601','2026-03-22 15:12:10.879',NULL,NULL,NULL,'2026-03-22 13:08:58.004',NULL,NULL,NULL,'NONE',7,'DAILY',NULL,NULL,NULL,NULL,NULL,NULL),('cmn1sjdmq0004uaacw02oyde2','test2@test.com','test2','$2b$12$DV85tWIyHTZIBlvLDGExMem2VgRp2ZqFQtnvdP6DgQfz6v/w8C.NC','USER',NULL,NULL,'2026-03-22 13:26:43.394','2026-03-22 17:01:11.517',NULL,NULL,NULL,'2026-03-22 17:01:11.513',NULL,NULL,NULL,'NONE',6,'DAILY',NULL,NULL,NULL,NULL,NULL,NULL),('cmn2gmore0003uaowqxibkj3l','man4460@hotmail.com','test1','$2b$12$/wJWDdribrl6LsQBxaq9PebDFg.TvFuBGto8/AiM4GFKhrf/hFfEO','USER',NULL,NULL,'2026-03-23 00:41:08.570','2026-03-23 00:41:08.570',NULL,NULL,'แมน',NULL,NULL,NULL,NULL,'NONE',0,'DAILY',NULL,NULL,NULL,NULL,'cmn1pz7p60000uaog02stazhd',NULL),('cmn66gf3z0001uab0411acyw3','test3@test.com','test3','$2b$12$zgAeEQ4pjEE4tz0TTFu9MOWkKe39hZP9CIqVLhcFfzwc0yPmkCCwu','USER',NULL,NULL,'2026-03-25 15:07:24.671','2026-03-26 01:53:38.441',NULL,NULL,NULL,'2026-03-26 01:43:50.260',NULL,NULL,NULL,'NONE',5,'DAILY',NULL,NULL,NULL,'2026-03-26',NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_module_subscriptions`
--

DROP TABLE IF EXISTS `user_module_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_module_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_module` (`user_id`,`module_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module_id` (`module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_module_subscriptions`
--

LOCK TABLES `user_module_subscriptions` WRITE;
/*!40000 ALTER TABLE `user_module_subscriptions` DISABLE KEYS */;
INSERT INTO `user_module_subscriptions` VALUES (7,'cmn1pz7p60000uaog02stazhd','cmn1rjt4m0002uag0vp8mireo','2026-03-25 21:51:10.883'),(10,'cmn1pz7p60000uaog02stazhd','cmn1vdf2b0004ualwewgpldwc','2026-03-25 21:56:25.521'),(11,'cmn1oqmwk0000ua1g374zua6n','cmn1rjt4m0002uag0vp8mireo','2026-03-25 22:05:34.709'),(12,'cmn1oqmwk0000ua1g374zua6n','cmn1vdf2b0004ualwewgpldwc','2026-03-25 22:05:38.163'),(17,'cmn66gf3z0001uab0411acyw3','cmn1rjt4m0002uag0vp8mireo','2026-03-26 09:29:16.449'),(18,'cmn1pz7p60000uaog02stazhd','car-wash-module','2026-03-26 21:56:21.156'),(19,'cmn1pz7p60000uaog02stazhd','cmn1wazyy0005ua903w1t3fsk','2026-03-26 22:00:54.665'),(20,'cmn1pz7p60000uaog02stazhd','mqtt-service-module','2026-03-27 21:32:05.635'),(21,'cmn1pz7p60000uaog02stazhd','building-pos-module','2026-03-27 21:49:55.241'),(22,'cmn1pz7p60000uaog02stazhd','village-module','2026-03-29 21:58:50.035');
/*!40000 ALTER TABLE `user_module_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_module_unsubscribe_cooldowns`
--

DROP TABLE IF EXISTS `user_module_unsubscribe_cooldowns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_module_unsubscribe_cooldowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unsubscribed_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_module_cd` (`user_id`,`module_id`),
  KEY `idx_user_cd_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_module_unsubscribe_cooldowns`
--

LOCK TABLES `user_module_unsubscribe_cooldowns` WRITE;
/*!40000 ALTER TABLE `user_module_unsubscribe_cooldowns` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_module_unsubscribe_cooldowns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utility_bills`
--

DROP TABLE IF EXISTS `utility_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utility_bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `billing_month` int NOT NULL,
  `billing_year` int NOT NULL,
  `water_meter_prev` int NOT NULL,
  `water_meter_curr` int NOT NULL,
  `electric_meter_prev` int NOT NULL,
  `electric_meter_curr` int NOT NULL,
  `water_price` decimal(10,2) NOT NULL,
  `electric_price` decimal(10,2) NOT NULL,
  `fixed_fees` json DEFAULT NULL,
  `total_room_amount` decimal(10,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utility_bills_room_id_billing_year_billing_month_key` (`room_id`,`billing_year`,`billing_month`),
  KEY `utility_bills_room_id_idx` (`room_id`),
  CONSTRAINT `utility_bills_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utility_bills`
--

LOCK TABLES `utility_bills` WRITE;
/*!40000 ALTER TABLE `utility_bills` DISABLE KEYS */;
INSERT INTO `utility_bills` VALUES (1,1,3,2026,25,29,23,30,18.00,8.00,'{\"20\": 0}',128.00,'2026-03-22 14:48:30.268','2026-03-22 14:51:03.609'),(2,1,2,2026,15,23,13,24,18.00,8.00,'{\"ค่าส่วนกลาง\": 20}',252.00,'2026-03-22 17:33:21.864','2026-03-22 17:33:26.666'),(3,2,3,2026,20,25,15,18,18.00,8.00,NULL,114.00,'2026-03-22 17:35:18.174','2026-03-22 18:27:13.796'),(4,3,3,2026,23,25,21,26,18.00,8.00,'{\"ค่าส่วนกลาง\": 20}',96.00,'2026-03-22 18:04:16.518','2026-03-22 18:26:01.942');
/*!40000 ALTER TABLE `utility_bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village_common_fee_rows`
--

DROP TABLE IF EXISTS `village_common_fee_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `village_common_fee_rows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `house_id` int NOT NULL,
  `year_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_due` int NOT NULL,
  `amount_paid` int NOT NULL DEFAULT '0',
  `status` enum('PENDING','PARTIAL','PAID','WAIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vfee_owner_trial_house_ym_uniq` (`owner_id`,`trial_session_id`,`house_id`,`year_month`),
  KEY `vfee_owner_trial_ym_idx` (`owner_id`,`trial_session_id`,`year_month`),
  KEY `vfee_owner_idx` (`owner_id`),
  KEY `village_common_fee_rows_house_id_fkey` (`house_id`),
  CONSTRAINT `village_common_fee_rows_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `village_common_fee_rows_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village_common_fee_rows`
--

LOCK TABLES `village_common_fee_rows` WRITE;
/*!40000 ALTER TABLE `village_common_fee_rows` DISABLE KEYS */;
/*!40000 ALTER TABLE `village_common_fee_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village_houses`
--

DROP TABLE IF EXISTS `village_houses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `village_houses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `house_no` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plot_label` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthly_fee_override` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vhouse_owner_trial_no_uniq` (`owner_id`,`trial_session_id`,`house_no`),
  KEY `vhouse_owner_trial_sort_idx` (`owner_id`,`trial_session_id`,`sort_order`),
  KEY `vhouse_owner_idx` (`owner_id`),
  CONSTRAINT `village_houses_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village_houses`
--

LOCK TABLES `village_houses` WRITE;
/*!40000 ALTER TABLE `village_houses` DISABLE KEYS */;
/*!40000 ALTER TABLE `village_houses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village_profiles`
--

DROP TABLE IF EXISTS `village_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `village_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `display_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contact_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prompt_pay_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_channels_note` text COLLATE utf8mb4_unicode_ci,
  `default_monthly_fee` int NOT NULL DEFAULT '0',
  `due_day_of_month` int NOT NULL DEFAULT '5',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vprof_owner_trial_uniq` (`owner_id`,`trial_session_id`),
  KEY `vprof_owner_idx` (`owner_id`),
  CONSTRAINT `village_profiles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village_profiles`
--

LOCK TABLES `village_profiles` WRITE;
/*!40000 ALTER TABLE `village_profiles` DISABLE KEYS */;
INSERT INTO `village_profiles` VALUES (1,'cmn1pz7p60000uaog02stazhd','prod',NULL,NULL,NULL,NULL,NULL,0,5,'2026-03-29 15:41:27.469','2026-03-29 15:41:27.469');
/*!40000 ALTER TABLE `village_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village_residents`
--

DROP TABLE IF EXISTS `village_residents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `village_residents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `house_id` int NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vres_house_idx` (`house_id`),
  CONSTRAINT `village_residents_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village_residents`
--

LOCK TABLES `village_residents` WRITE;
/*!40000 ALTER TABLE `village_residents` DISABLE KEYS */;
/*!40000 ALTER TABLE `village_residents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `village_slip_submissions`
--

DROP TABLE IF EXISTS `village_slip_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `village_slip_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `house_id` int NOT NULL,
  `fee_row_id` int DEFAULT NULL,
  `year_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `slip_image_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reviewer_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vslip_owner_trial_status_idx` (`owner_id`,`trial_session_id`,`status`),
  KEY `vslip_owner_trial_ym_idx` (`owner_id`,`trial_session_id`,`year_month`),
  KEY `vslip_fee_row_idx` (`fee_row_id`),
  KEY `village_slip_submissions_house_id_fkey` (`house_id`),
  CONSTRAINT `village_slip_submissions_fee_row_id_fkey` FOREIGN KEY (`fee_row_id`) REFERENCES `village_common_fee_rows` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `village_slip_submissions_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `village_houses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `village_slip_submissions_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `village_slip_submissions`
--

LOCK TABLES `village_slip_submissions` WRITE;
/*!40000 ALTER TABLE `village_slip_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `village_slip_submissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-31 19:49:26
