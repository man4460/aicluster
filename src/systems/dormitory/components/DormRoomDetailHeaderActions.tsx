"use client";

import Link from "next/link";
import { EditRoomForm, type EditRoomFormRoom } from "@/systems/dormitory/components/EditRoomForm";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

export function DormRoomDetailHeaderActions({ room }: { room: EditRoomFormRoom }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <EditRoomForm room={room} />
      <Link href="/dashboard/dormitory/rooms" className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto")}>
        การจัดการ
      </Link>
    </div>
  );
}
