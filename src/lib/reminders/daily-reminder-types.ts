/** รูปแบบรายการแจ้งเตือนรวมสำหรับหน้าเลขาส่วนตัว / API */
export type DailyReminderType = "meeting" | "task" | "payment" | "reminder";
export type DailyReminderStatus = "pending" | "done";

export type DailyReminderItem = {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  type: DailyReminderType;
  status: DailyReminderStatus;
  /** นาทีก่อนถึงกำหนด — ยังไม่มีในฐานข้อมูลบางแหล่ง ใช้ 0 */
  notifyBefore: number;
  source: "home_finance_reminder" | "personal_plan" | "barber_booking" | "personal_note";
};

export type DailyDigestFinanceEntry = {
  id: number;
  type: "INCOME" | "EXPENSE";
  title: string;
  categoryLabel: string;
  amountBaht: number;
};

export type DailyDigestFinance = {
  available: boolean;
  incomeBaht: number;
  expenseBaht: number;
  /** รายการรายรับ–รายจ่ายวันปฏิทินนี้ (กรุงเทพ) */
  entries: DailyDigestFinanceEntry[];
};

export type DailyDigestNote = {
  id: string;
  content: string;
  createdAt: string;
};

export type DailyDigestResponse = {
  todayYmd: string;
  tomorrowYmd: string;
  today: DailyReminderItem[];
  tomorrow: DailyReminderItem[];
  overdue: DailyReminderItem[];
  pendingTodos: DailyReminderItem[];
  financeToday: DailyDigestFinance;
  /** โน้ตล่าสุด (แยกจากรายการตามวันที่) */
  notes: DailyDigestNote[];
};
