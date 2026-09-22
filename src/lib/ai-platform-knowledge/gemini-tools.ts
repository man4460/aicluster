/**
 * Gemini function declarations สำหรับ Knowledge API
 * — คัดลอกไปตั้งใน Google AI Studio / Vertex / SDK ได้
 */
export const MAWELL_GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "get_platform_overview",
    description:
      "สรุปแพลตฟอร์ม MAWELL: แบรนด์ โมเดลธุรกิจ โทเคน บทบาท tech stack และจำนวนโมดูล",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "list_modules",
    description:
      "รายการโมดูล MAWELL (slug, ชื่อไทย, billing, เส้นทาง, ความสามารถสั้น). กรองได้ด้วย freeOnly/visibleOnly/dailyOnly/q/groupId",
    parameters: {
      type: "OBJECT",
      properties: {
        freeOnly: {
          type: "BOOLEAN",
          description: "true = เฉพาะโมดูลฟรี (ไม่หักโทเคนรายวัน)",
        },
        visibleOnly: {
          type: "BOOLEAN",
          description: "true = เฉพาะโมดูลที่ลูกค้าเห็นในแคตตาล็อก",
        },
        dailyOnly: {
          type: "BOOLEAN",
          description: "true = เฉพาะโมดูลสายรายวัน (หักโทเคน)",
        },
        groupId: {
          type: "INTEGER",
          description: "กรองตามกลุ่มโมดูล 1–5",
        },
        q: {
          type: "STRING",
          description: "ค้นหาใน slug/ชื่อ/คำอธิบาย/ความสามารถ",
        },
      },
    },
  },
  {
    name: "get_module_detail",
    description: "รายละเอียดโมดูลตาม slug เช่น laundry, barber, smart-guard-tour",
    parameters: {
      type: "OBJECT",
      properties: {
        slug: {
          type: "STRING",
          description: "slug ของโมดูล เช่น laundry",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_platform_rules",
    description:
      "กฎแพลตฟอร์มตามหัวข้อ: billing | timezone | qr | roles | ux | print | security | all",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: {
          type: "STRING",
          description: "billing | timezone | qr | roles | ux | print | security | all",
        },
      },
    },
  },
] as const;

export function geminiToolsPayload(baseUrl: string) {
  return {
    auth: {
      header: "Authorization: Bearer <MAWELL_AI_KNOWLEDGE_API_KEY>",
      altHeader: "X-Mawell-Ai-Key: <MAWELL_AI_KNOWLEDGE_API_KEY>",
    },
    endpoints: {
      overview: `${baseUrl}/api/ai/platform`,
      modules: `${baseUrl}/api/ai/platform/modules`,
      moduleDetail: `${baseUrl}/api/ai/platform/modules/{slug}`,
      rules: `${baseUrl}/api/ai/platform/rules?topic=all`,
      tools: `${baseUrl}/api/ai/platform/tools`,
    },
    functionDeclarations: MAWELL_GEMINI_FUNCTION_DECLARATIONS,
    toolToHttp: {
      get_platform_overview: { method: "GET", path: "/api/ai/platform" },
      list_modules: {
        method: "GET",
        path: "/api/ai/platform/modules",
        queryFromArgs: ["freeOnly", "visibleOnly", "dailyOnly", "groupId", "q"],
      },
      get_module_detail: {
        method: "GET",
        path: "/api/ai/platform/modules/{slug}",
      },
      get_platform_rules: {
        method: "GET",
        path: "/api/ai/platform/rules",
        queryFromArgs: ["topic"],
      },
    },
  };
}
