/** แบบฟอร์มเปล่า (แหล่ง: สอบสวน.com/form) — ไฟล์อยู่ public/smart-police/forms */
export const SMART_POLICE_BLANK_FORM_CATEGORY_ORDER = [
  "เอกสารทั่วไป",
  "เอกสารผู้กล่าวหา",
  "เอกสารผู้ต้องหา",
  "เอกสารพยาน",
  "เอกสารพนักงานสอบสวน",
  "คำร้องต่างๆ"
] as const;

export type SmartPoliceBlankFormCategory = (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number];

export type SmartPoliceBlankFormItem = {
  id: string;
  category: string;
  title: string;
  sortOrder: number;
  fileName: string;
};

export const SMART_POLICE_BLANK_FORMS: SmartPoliceBlankFormItem[] = [
  {
    "id": "1",
    "category": "เอกสารทั่วไป",
    "title": "แบบฟอร์มคำให้การ (ตามคำสั่ง 419/2556)",
    "sortOrder": 1,
    "fileName": "แบบฟอร์มคำให้การ (ตามคำสั่ง 419-2556).pdf"
  },
  {
    "id": "2",
    "category": "เอกสารผู้กล่าวหา",
    "title": "คำให้การผู้กล่าวหา",
    "sortOrder": 1,
    "fileName": "คำให้การผู้กล่าวหา.docx"
  },
  {
    "id": "3",
    "category": "เอกสารผู้กล่าวหา",
    "title": "คำให้การผู้กล่าวหาที่เป็นข้าราชการ",
    "sortOrder": 2,
    "fileName": "คำให้การผู้กล่าวหาที่เป็นข้าราชการ.docx"
  },
  {
    "id": "4",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บัญชีทรัพย์ถูกประทุษร้าย",
    "sortOrder": 3,
    "fileName": "บัญชีทรัพย์ถูกประทุษร้าย.docx"
  },
  {
    "id": "5",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บัญชีทรัพย์ถูกประทุษร้ายได้คืน",
    "sortOrder": 4,
    "fileName": "บัญชีทรัพย์ถูกประทุษร้ายได้คืน.docx"
  },
  {
    "id": "6",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บัญชีทรัพย์ถูกประทุษร้ายไม่ได้คืน",
    "sortOrder": 5,
    "fileName": "บัญชีทรัพย์ถูกประทุษร้ายไม่ได้คืน.docx"
  },
  {
    "id": "7",
    "category": "เอกสารผู้กล่าวหา",
    "title": "แผนที่เกิดเหตุ",
    "sortOrder": 6,
    "fileName": "แผนที่เกิดเหตุ.docx"
  },
  {
    "id": "8",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บันทึกถอนคำร้องทุกข์",
    "sortOrder": 7,
    "fileName": "บันทึกถอนคำร้องทุกข์.docx"
  },
  {
    "id": "9",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บันทึกการชดใช้ค่าเสียหาย",
    "sortOrder": 8,
    "fileName": "บันทึกการชดใช้ค่าเสียหาย.docx"
  },
  {
    "id": "10",
    "category": "เอกสารผู้กล่าวหา",
    "title": "บันทึกแจ้งสิทธิผู้เสียหาย",
    "sortOrder": 9,
    "fileName": "บันทึกแจ้งสิทธิผู้เสียหาย.docx"
  },
  {
    "id": "11",
    "category": "เอกสารผู้ต้องหา",
    "title": "คำให้การผู้ต้องหา",
    "sortOrder": 1,
    "fileName": "คำให้การผู้ต้องหา.docx"
  },
  {
    "id": "12",
    "category": "เอกสารผู้ต้องหา",
    "title": "คำให้การผู้ต้องหาฟ้องวาจา",
    "sortOrder": 2,
    "fileName": "คำให้การผู้ต้องหาฟ้องวาจา.docx"
  },
  {
    "id": "13",
    "category": "เอกสารผู้ต้องหา",
    "title": "บัญชีของกลาง",
    "sortOrder": 3,
    "fileName": "บัญชีของกลาง.docx"
  },
  {
    "id": "14",
    "category": "เอกสารผู้ต้องหา",
    "title": "บันทึกจับกุม",
    "sortOrder": 4,
    "fileName": "บันทึกจับกุม.docx"
  },
  {
    "id": "15",
    "category": "เอกสารผู้ต้องหา",
    "title": "บันทึกแจ้งข้อหา",
    "sortOrder": 5,
    "fileName": "บันทึกแจ้งข้อหา.docx"
  },
  {
    "id": "16",
    "category": "เอกสารผู้ต้องหา",
    "title": "บันทึกแจ้งสิทธิผู้ต้องหา",
    "sortOrder": 6,
    "fileName": "บันทึกแจ้งสิทธิ.docx"
  },
  {
    "id": "17",
    "category": "เอกสารผู้ต้องหา",
    "title": "ภาพถ่ายประกอบคดี",
    "sortOrder": 7,
    "fileName": "ภาพถ่ายประกอบคดี.docx"
  },
  {
    "id": "18",
    "category": "เอกสารพยาน",
    "title": "คำให้การพยาน",
    "sortOrder": 1,
    "fileName": "คำให้การพยาน.docx"
  },
  {
    "id": "19",
    "category": "เอกสารพยาน",
    "title": "บันทึกชี้รูปผู้ต้องหา",
    "sortOrder": 2,
    "fileName": "บันทึกชี้รูปผู้ต้องหา.docx"
  },
  {
    "id": "20",
    "category": "เอกสารพยาน",
    "title": "บันทึกชี้ตัวผู้ต้องหา",
    "sortOrder": 3,
    "fileName": "บันทึกชี้ตัวผู้ต้องหา.docx"
  },
  {
    "id": "21",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "ปกสำนวน",
    "sortOrder": 1,
    "fileName": "ปกสำนวน.docx"
  },
  {
    "id": "22",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "รายงานการสอบสวน",
    "sortOrder": 2,
    "fileName": "รายงานการสอบสวน.docx"
  },
  {
    "id": "23",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "บันทึกพนักงานสอบสวน",
    "sortOrder": 3,
    "fileName": "บันทึกพนักงานสอบสวน.docx"
  },
  {
    "id": "24",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "บัญชีสำนวนการสอบสวน",
    "sortOrder": 4,
    "fileName": "บัญชีสำนวนการสอบสวน.docx"
  },
  {
    "id": "25",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "บันทึกตรวจสถานที่เกิดเหตุ",
    "sortOrder": 5,
    "fileName": "บันทึกตรวจสถานที่เกิดเหตุ.docx"
  },
  {
    "id": "26",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "บันทึกแจ้งความคืบหน้าทางคดี",
    "sortOrder": 6,
    "fileName": "บันทึกแจ้งความคืบหน้าทางคดี.docx"
  },
  {
    "id": "27",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "ใบนำส่งผู้บาดเจ็บหรือศพ",
    "sortOrder": 7,
    "fileName": "ใบนำส่งผู้บาดเจ็บหรือศพ.docx"
  },
  {
    "id": "28",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "หนังสือส่งตรวจพิสูจน์",
    "sortOrder": 8,
    "fileName": "หนังสือส่งตรวจพิสูจน์.docx"
  },
  {
    "id": "29",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "บันทึกควบคุม",
    "sortOrder": 9,
    "fileName": "บันทึกควบคุม.docx"
  },
  {
    "id": "30",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "สัญญาประกัน",
    "sortOrder": 10,
    "fileName": "สัญญาประกัน.docx"
  },
  {
    "id": "31",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "แจ้งสืบสวน",
    "sortOrder": 11,
    "fileName": "แจ้งสืบสวน.docx"
  },
  {
    "id": "32",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "รายงานคดีน่าสนใจ/อุกฉกรรจ์",
    "sortOrder": 12,
    "fileName": "รายงานคดีน่าสนใจ-อุกฉกรรจ์.docx"
  },
  {
    "id": "33",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "แบบรายงานแผนประทุษกรรม",
    "sortOrder": 13,
    "fileName": "แบบรายงานแผนประทุษกรรม.docx"
  },
  {
    "id": "34",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "แบบรายการตำหนิรูปพรรณทรัพย์",
    "sortOrder": 14,
    "fileName": "แบบรายการตำหนิรูปพรรณทรัพย์.docx"
  },
  {
    "id": "35",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "หมายเรียกพยาน",
    "sortOrder": 15,
    "fileName": "หมายเรียกพยาน.docx"
  },
  {
    "id": "36",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "หมายเรียกผู้ต้องหา",
    "sortOrder": 16,
    "fileName": "หมายเรียกผู้ต้องหา.docx"
  },
  {
    "id": "37",
    "category": "เอกสารพนักงานสอบสวน",
    "title": "หมายเรียกพยานเอกสาร",
    "sortOrder": 17,
    "fileName": "หมายเรียกพยานเอกสาร.docx"
  },
  {
    "id": "38",
    "category": "คำร้องต่างๆ",
    "title": "คำร้องฝากขัง",
    "sortOrder": 1,
    "fileName": "คำร้องฝากขัง.docx"
  },
  {
    "id": "39",
    "category": "คำร้องต่างๆ",
    "title": "ฝากขังครั้งที่ 2",
    "sortOrder": 2,
    "fileName": "ฝากขังครั้งที่ 2.docx"
  },
  {
    "id": "40",
    "category": "คำร้องต่างๆ",
    "title": "หมายจับ",
    "sortOrder": 3,
    "fileName": "หมายจับ.docx"
  },
  {
    "id": "41",
    "category": "คำร้องต่างๆ",
    "title": "หมายค้น",
    "sortOrder": 4,
    "fileName": "หมายค้น.docx"
  },
  {
    "id": "42",
    "category": "คำร้องต่างๆ",
    "title": "คำร้องขอหมายจับ",
    "sortOrder": 5,
    "fileName": "คำร้องขอหมายจับ.docx"
  },
  {
    "id": "43",
    "category": "คำร้องต่างๆ",
    "title": "คำร้องขอหมายค้น",
    "sortOrder": 6,
    "fileName": "คำร้องขอหมายค้น.docx"
  }
];

export function smartPoliceBlankFormHref(fileName: string): string {
  return "/smart-police/forms/" + encodeURIComponent(fileName);
}

export function smartPoliceBlankFormsGrouped(): { category: string; items: SmartPoliceBlankFormItem[] }[] {
  const map = new Map<string, SmartPoliceBlankFormItem[]>();
  for (const f of SMART_POLICE_BLANK_FORMS) {
    const list = map.get(f.category) ?? [];
    list.push(f);
    map.set(f.category, list);
  }
  return SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.filter((cat) => map.has(cat)).map((category) => ({
    category,
    items: (map.get(category) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
