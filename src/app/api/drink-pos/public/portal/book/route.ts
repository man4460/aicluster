import { NextResponse } from "next/server";

/** ร้านเครื่องดื่มไม่มีจองที่นั่งแล้ว — ใช้ POST /api/drink-pos/public/orders */
export async function POST() {
  return NextResponse.json({ error: "ร้านนี้รับเฉพาะสั่งเครื่องดื่ม" }, { status: 410 });
}
