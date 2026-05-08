/** ช่องทางบันทึกออเดอร์ที่พนักงาน/แคชเชียร์สั่งแทนลูกค้า — เก็บใน `PosOrder.note` */

export type BuildingPosStaffOrderChannel = "floor" | "counter" | "takeaway";

export const BUILDING_POS_STAFF_ORDER_CHANNELS: {
  key: BuildingPosStaffOrderChannel;
  label: string;
  noteLine: string;
}[] = [
  { key: "floor", label: "พนักงานสั่ง", noteLine: "สั่งโดย: พนักงานหน้าร้าน" },
  { key: "counter", label: "แคชเชียร์", noteLine: "สั่งโดย: แคชเชียร์/ส่วนกลาง" },
  { key: "takeaway", label: "กลับบ้าน", noteLine: "สั่งโดย: รับกลับบ้าน" },
];

export function buildingPosStaffOrderNoteLine(channel: BuildingPosStaffOrderChannel): string {
  return BUILDING_POS_STAFF_ORDER_CHANNELS.find((x) => x.key === channel)?.noteLine ?? "";
}
