"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AddRoomForm } from "@/systems/dormitory/components/AddRoomForm";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

function DormRoomManageHeaderActionsInner() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
      <Link href="/dashboard/dormitory" className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto")}>
        ผังห้อง
      </Link>
      <AddRoomForm openFromUrl />
    </div>
  );
}

export function DormRoomManageHeaderActions() {
  return (
    <Suspense fallback={null}>
      <DormRoomManageHeaderActionsInner />
    </Suspense>
  );
}
