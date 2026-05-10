# MAWELL DB Backup — เครื่อง 4 → เครื่อง 2

ระบบ backup MySQL `mawell_buffet` แบบ **อัตโนมัติทุกวันตี 2** จากเครื่อง production (เครื่อง 4, `192.168.1.194`) ไปเก็บไฟล์ `.sql.gz` ที่เครื่อง 2 (`192.168.1.192:~/mawell-backups/`) เก็บย้อนหลัง 30 วัน

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `scripts/backup-db.sh` | ตัวหลัก — `mysqldump | gzip | ssh` ส่งไฟล์ + อัปเดต `latest.sql.gz` + ลบไฟล์เก่าเกิน 30 วัน |
| `scripts/backup-db-restore.sh` | กู้กลับ — ดึงไฟล์จากเครื่อง 2 → DROP/CREATE/IMPORT ลง MySQL บนเครื่องนี้ |
| `scripts/backup-db-setup.sh` | ติดตั้ง SSH key + LaunchAgent (cron) |
| `scripts/com.mawell.db-backup.plist.tmpl` | Template LaunchAgent (macOS) — รัน 02:00 ทุกวัน |
| `scripts/backup-db.env.example` | ตัวอย่าง config (host/path/retention) |
| `scripts/backup-db.env` | (gitignored) ค่า config จริงของเครื่องนี้ |

## ตั้งค่าครั้งแรก

1. **คัดลอก config**

   ```bash
   cp scripts/backup-db.env.example scripts/backup-db.env
   ```

   ปรับค่าใน `scripts/backup-db.env` ถ้าต้องการ (ค่า default ตรงกับ 192.168.1.192 + retention 30 วันอยู่แล้ว)

2. **ติดตั้งทั้งระบบครั้งเดียว** (สร้าง SSH key → copy ไปเครื่อง 2 → ติดตั้ง LaunchAgent → รัน backup ทดสอบ → แสดงสถานะ)

   ```bash
   npm run db:backup:setup
   ```

   หรือทำทีละขั้น:

   ```bash
   bash scripts/backup-db-setup.sh ssh        # ตั้ง SSH key (จะถามรหัสครั้งแรก)
   bash scripts/backup-db-setup.sh install    # ติดตั้ง LaunchAgent (02:00 ทุกวัน)
   bash scripts/backup-db-setup.sh test       # รัน backup ทันที 1 ครั้ง
   ```

## รัน manual

```bash
npm run db:backup
# หรือ
bash scripts/backup-db.sh
```

## ตรวจสถานะ

```bash
npm run db:backup:status
```

แสดง:
- LaunchAgent โหลดอยู่ไหม
- log 12 บรรทัดล่าสุด (`~/logs/db-backup.log`)
- รายการไฟล์ `.sql.gz` ล่าสุดบนเครื่อง 2 + ตัว `latest.sql.gz`

## Restore (กู้คืน)

> ⚠️ **คำเตือน**: คำสั่งนี้จะ `DROP DATABASE mawell_buffet` ก่อน import ใหม่ — ใช้เฉพาะตอนกู้

ลิสต์ไฟล์บนเครื่อง 2:

```bash
bash scripts/backup-db-restore.sh --list
```

กู้จากไฟล์ล่าสุด:

```bash
npm run db:restore
# หรือเงียบ ๆ ไม่ถามยืนยัน:
bash scripts/backup-db-restore.sh --yes
```

กู้จากไฟล์เฉพาะวัน:

```bash
bash scripts/backup-db-restore.sh mawell_buffet-20260510-020000.sql.gz
```

หลัง restore:

```bash
npx prisma generate
pm2 restart software-mawell
```

## ปลด/ติดตั้งใหม่

```bash
npm run db:backup:uninstall   # ปลด LaunchAgent
npm run db:backup:install     # ติดใหม่
```

## ตำแหน่ง log

| log | path |
|---|---|
| log หลัก (script เขียนเอง) | `~/logs/db-backup.log` |
| stdout จาก LaunchAgent | `~/logs/db-backup.launchd.out.log` |
| stderr จาก LaunchAgent | `~/logs/db-backup.launchd.err.log` |

ดูสด:

```bash
tail -f ~/logs/db-backup.log
```

## ความปลอดภัย / ข้อสังเกต

- **Password**: script ใช้ `MYSQL_PWD` (env var) ส่งให้ `mysqldump` แทนใส่ใน command line — ไม่ขึ้นใน `ps`
- **DATABASE_URL**: ถ้าไม่ตั้ง `SOURCE_PASSWORD` ใน config script จะ parse จาก `.env` (`DATABASE_URL`) อัตโนมัติ
- **SSH**: ใช้ key-based เท่านั้น (`BatchMode=yes`) — ไม่ถามรหัสตอนรันอัตโนมัติ ถ้าเชื่อมไม่ได้ script จะ fail ทันทีและไม่ค้าง
- **Retention**: ลบเฉพาะไฟล์ที่ขึ้นต้น `mawell_buffet-` และเก่าเกิน N วัน (ค่า `BACKUP_RETENTION_DAYS`) — ไฟล์อื่นในโฟลเดอร์ปลอดภัย
- **Atomic**: ใช้ `--single-transaction` (InnoDB) — ดัมป์ขณะ DB รันอยู่ได้โดยไม่ล็อกตาราง
- **`latest.sql.gz`**: เป็น symlink บนเครื่อง 2 ชี้ไฟล์ล่าสุดเสมอ ใช้กับ restore โดยไม่ต้องระบุชื่อ

## สมมุติฐาน

- เครื่อง 2 (`192.168.1.192`) เป็น Linux/macOS ที่มี SSH server เปิดและ user `mawell` อยู่ — ปรับใน `scripts/backup-db.env` ถ้าต่าง
- เครื่อง 4 มี `mysqldump`, `gzip`, `ssh` (macOS มาพร้อม `ssh`/`gzip`; ติดตั้ง `mysqldump` ผ่าน `brew install mysql-client` ถ้ายังไม่มี)
- Disk ปลายทางมีพื้นที่พอเก็บ 30 วัน × ขนาด dump
