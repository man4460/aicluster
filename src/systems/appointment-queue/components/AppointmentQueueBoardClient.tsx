"use client";



import Link from "next/link";

import { useCallback, useMemo, useState } from "react";

import { AppointmentQueueScheduleLink } from "@/systems/appointment-queue/components/AppointmentQueueDashboardHubClient";

import {

  AppDashboardSection,

  AppImageLightbox,

  AppImageThumb,

  AppSectionHeader,

  appDashboardSectionVioletClass,

  appTemplateOutlineButtonClass,

  useAppImageLightbox,

} from "@/components/app-templates";

import { FormModal } from "@/components/ui/FormModal";

import { cn } from "@/lib/cn";

import { isoToBangkokDatetimeLocal } from "@/lib/massage/booking-datetime";

import type {

  AppointmentQueueDashboardDto,

  BoardBookingDto,

} from "@/systems/appointment-queue/lib/load-dashboard";

import type { AppointmentQueueServiceRow } from "@/systems/appointment-queue/lib/load-services";

import {

  assetRowEditIconButtonClass,

  assetRowRemoveIconButtonClass,

  IconRowEdit,

  IconRowRemove,

} from "@/systems/asset/components/AssetRowActionIcons";

import { aqFieldClass, aqListRowCardClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";



type Props = {

  ownerId: string;

  trialSessionId: string;

  initial: AppointmentQueueDashboardDto;

  services: AppointmentQueueServiceRow[];

  /** ภาพรวมหน้าแรก — รวมการ์ดเดียว + ลิงก์ไปแท็บจัดการคิว */

  overview?: boolean;

};



function activeServices(services: AppointmentQueueServiceRow[]) {

  return services.filter((s) => s.isActive);

}



function defaultDatetimeLocal(dateKey: string): string {

  return `${dateKey}T09:00`;

}



export function AppointmentQueueBoardClient({

  initial,

  services,

  overview = false,

}: Props) {

  const [data, setData] = useState(initial);

  const [busyId, setBusyId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<BoardBookingDto | null>(null);

  const [serviceId, setServiceId] = useState<number | "">("");

  const [scheduledLocal, setScheduledLocal] = useState("");

  const [phone, setPhone] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [note, setNote] = useState("");

  const [formErr, setFormErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const lb = useAppImageLightbox();



  const serviceOptions = useMemo(() => activeServices(services), [services]);



  const reload = useCallback(async () => {

    const res = await fetch(

      `/api/appointment-queue/bookings?dateKey=${encodeURIComponent(data.dateKey)}`,

      { credentials: "include" },

    );

    const json = (await res.json().catch(() => null)) as AppointmentQueueDashboardDto | { error?: string };

    if (res.ok && json && "bookings" in json) {

      setData(json);

    }

  }, [data.dateKey]);



  const openAdd = () => {

    const first = serviceOptions[0];

    setEditing(null);

    setServiceId(first?.id ?? "");

    setScheduledLocal(defaultDatetimeLocal(data.dateKey));

    setPhone("");

    setCustomerName("");

    setNote("");

    setFormErr(null);

    setModalOpen(true);

  };



  const openEdit = (b: BoardBookingDto) => {

    setEditing(b);

    setServiceId(b.serviceId);

    setScheduledLocal(isoToBangkokDatetimeLocal(b.scheduledAt));

    setPhone(b.phone);

    setCustomerName(b.customerName ?? "");

    setNote(b.note ?? "");

    setFormErr(null);

    setModalOpen(true);

  };



  const saveBooking = async () => {

    if (!serviceId || !scheduledLocal.trim() || !phone.trim()) {

      setFormErr("กรอกบริการ เวลา และเบอร์โทร");

      return;

    }

    setSaving(true);

    setFormErr(null);

    const body = {

      serviceId: Number(serviceId),

      scheduledAtLocal: scheduledLocal.trim(),

      phone: phone.trim(),

      customerName: customerName.trim() || null,

      note: note.trim() || null,

    };

    try {

      if (editing) {

        const res = await fetch(`/api/appointment-queue/bookings/${editing.id}`, {

          method: "PATCH",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(body),

        });

        const json = (await res.json().catch(() => ({}))) as { error?: string };

        if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");

      } else {

        const res = await fetch("/api/appointment-queue/bookings", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(body),

        });

        const json = (await res.json().catch(() => ({}))) as { error?: string };

        if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");

      }

      setModalOpen(false);

      await reload();

    } catch (e) {

      setFormErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");

    } finally {

      setSaving(false);

    }

  };



  const removeBooking = async (b: BoardBookingDto) => {

    if (!confirm(`ลบคิว ${b.timeLabel} · ${b.serviceName}?`)) return;

    setBusyId(b.id);

    try {

      const res = await fetch(`/api/appointment-queue/bookings/${b.id}`, { method: "DELETE" });

      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) throw new Error(json.error ?? "ลบไม่สำเร็จ");

      await reload();

    } catch (e) {

      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");

    } finally {

      setBusyId(null);

    }

  };



  const confirmDeposit = async (id: number) => {

    setBusyId(id);

    try {

      const res = await fetch(`/api/appointment-queue/bookings/${id}/confirm-deposit`, {

        method: "POST",

      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) throw new Error(json.error ?? "ยืนยันไม่สำเร็จ");

      await reload();

    } catch (e) {

      alert(e instanceof Error ? e.message : "ยืนยันไม่สำเร็จ");

    } finally {

      setBusyId(null);

    }

  };



  const queueCount = data.bookings.length + data.pendingDeposit.length;



  const bookingRow = (b: BoardBookingDto, showActions: boolean) => (

    <li

      key={b.id}

      className={cn(aqListRowCardClass, busyId === b.id && "opacity-60")}

    >

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div className="min-w-0 flex-1 text-left">

          <p className="font-bold text-[#1e1b4b]">

            {b.timeLabel} · {b.serviceName}

          </p>

          <p className="text-sm text-[#66638c]">

            {b.customerName || "ลูกค้า"} · {b.phone}

          </p>

          {b.note ? <p className="mt-1 text-xs text-[#5f5a8a]">{b.note}</p> : null}

        </div>

        {showActions ? (

          <div className="flex shrink-0 items-center gap-1">

            <button

              type="button"

              className={assetRowEditIconButtonClass}

              aria-label={`แก้ไขคิว ${b.timeLabel} ${b.serviceName}`}

              title="แก้ไข"

              disabled={busyId === b.id}

              onClick={() => openEdit(b)}

            >

              <IconRowEdit className="h-4 w-4" aria-hidden />

            </button>

            <button

              type="button"

              className={assetRowRemoveIconButtonClass}

              aria-label={`ลบคิว ${b.timeLabel} ${b.serviceName}`}

              title="ลบ"

              disabled={busyId === b.id}

              onClick={() => void removeBooking(b)}

            >

              <IconRowRemove className="h-4 w-4" aria-hidden />

            </button>

          </div>

        ) : null}

      </div>

    </li>

  );



  const pendingBlock =

    data.pendingDeposit.length > 0 ? (

      <div className={overview ? "space-y-2" : undefined}>

        {!overview ? (

          <AppDashboardSection className={appDashboardSectionVioletClass}>

            <AppSectionHeader title="รอตรวจสลิปมัดจำ" />

            <ul className="space-y-2">

              {data.pendingDeposit.map((b) => (

                <li key={b.id} className={aqListRowCardClass}>

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="min-w-0 text-left">

                      <p className="font-bold text-[#1e1b4b]">

                        {b.timeLabel} · {b.serviceName}

                      </p>

                      <p className="text-sm text-[#66638c]">

                        {b.customerName || "ลูกค้า"} · {b.phone}

                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      {b.depositSlipUrl ? (

                        <AppImageThumb

                          src={b.depositSlipUrl}

                          alt="สลิปมัดจำ"

                          onOpen={() => b.depositSlipUrl && lb.open(b.depositSlipUrl)}

                        />

                      ) : null}

                      <button

                        type="button"

                        disabled={busyId === b.id}

                        onClick={() => void confirmDeposit(b.id)}

                        className="app-btn-primary min-h-[40px] rounded-xl px-3 text-sm"

                      >

                        ยืนยันมัดจำ

                      </button>

                    </div>

                  </div>

                </li>

              ))}

            </ul>

          </AppDashboardSection>

        ) : (

          <>

            <h3 className="text-left text-sm font-black text-[#4d47b6]">รอตรวจสลิปมัดจำ</h3>

            <ul className="space-y-2">

              {data.pendingDeposit.map((b) => (

                <li key={b.id} className={aqListRowCardClass}>

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="min-w-0 text-left">

                      <p className="font-bold text-[#1e1b4b]">

                        {b.timeLabel} · {b.serviceName}

                      </p>

                      <p className="text-sm text-[#66638c]">

                        {b.customerName || "ลูกค้า"} · {b.phone}

                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      {b.depositSlipUrl ? (

                        <AppImageThumb

                          src={b.depositSlipUrl}

                          alt="สลิปมัดจำ"

                          onOpen={() => b.depositSlipUrl && lb.open(b.depositSlipUrl)}

                        />

                      ) : null}

                      <button

                        type="button"

                        disabled={busyId === b.id}

                        onClick={() => void confirmDeposit(b.id)}

                        className="app-btn-primary min-h-[40px] rounded-xl px-3 text-sm"

                      >

                        ยืนยันมัดจำ

                      </button>

                    </div>

                  </div>

                </li>

              ))}

            </ul>

          </>

        )}

      </div>

    ) : null;



  const queueList = (

    <ul className="space-y-2">

      {data.bookings.length === 0 ? (

        <li className="rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-8 text-center text-sm text-[#66638c]">

          ยังไม่มีคิววันนี้ — กดเพิ่มคิวหรือให้ลูกค้าจองผ่าน QR

        </li>

      ) : (

        data.bookings.map((b) => bookingRow(b, !overview))

      )}

    </ul>

  );



  const bookingModal = (

    <FormModal

      open={modalOpen}

      onClose={() => !saving && setModalOpen(false)}

      title={editing ? "แก้ไขคิว" : "เพิ่มคิว"}

      footer={

        <div className="flex flex-wrap justify-end gap-2">

          <button

            type="button"

            className={appTemplateOutlineButtonClass}

            disabled={saving}

            onClick={() => setModalOpen(false)}

          >

            ยกเลิก

          </button>

          <button

            type="button"

            className="app-btn-primary min-h-[40px] rounded-xl px-4"

            disabled={saving || serviceOptions.length === 0}

            onClick={() => void saveBooking()}

          >

            {saving ? "กำลังบันทึก…" : "บันทึก"}

          </button>

        </div>

      }

    >

      {serviceOptions.length === 0 ? (

        <p className="text-sm text-rose-600">

          ยังไม่มีบริการ — ไปแท็บ «บริการ» เพื่อเพิ่มก่อนสร้างคิว

        </p>

      ) : (

        <div className="space-y-3 text-left">

          {formErr ? <p className="text-sm font-medium text-rose-600">{formErr}</p> : null}

          <label className="block space-y-1">

            <span className="text-xs font-bold text-[#4d47b6]">บริการ</span>

            <select

              className={aqFieldClass}

              value={serviceId}

              onChange={(e) => setServiceId(Number(e.target.value))}

            >

              {serviceOptions.map((s) => (

                <option key={s.id} value={s.id}>

                  {s.name} ({s.durationMinutes} นาที)

                </option>

              ))}

            </select>

          </label>

          <label className="block space-y-1">

            <span className="text-xs font-bold text-[#4d47b6]">วันและเวลา (ไทย)</span>

            <input

              type="datetime-local"

              className={aqFieldClass}

              value={scheduledLocal}

              onChange={(e) => setScheduledLocal(e.target.value)}

            />

          </label>

          <label className="block space-y-1">

            <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>

            <input

              type="tel"

              className={aqFieldClass}

              value={phone}

              onChange={(e) => setPhone(e.target.value)}

              placeholder="0812345678"

            />

          </label>

          <label className="block space-y-1">

            <span className="text-xs font-bold text-[#4d47b6]">ชื่อลูกค้า (ไม่บังคับ)</span>

            <input

              type="text"

              className={aqFieldClass}

              value={customerName}

              onChange={(e) => setCustomerName(e.target.value)}

            />

          </label>

          <label className="block space-y-1">

            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>

            <input

              type="text"

              className={aqFieldClass}

              value={note}

              onChange={(e) => setNote(e.target.value)}

            />

          </label>

        </div>

      )}

    </FormModal>

  );



  if (overview) {

    return (

      <AppDashboardSection tone="violet" className="min-w-0">

        <AppSectionHeader

          tone="violet"

          title={`คิววันนี้ · ${data.dateKey}`}

          description={

            queueCount > 0

              ? `มีคิว ${queueCount} รายการวันนี้`

              : "ยังไม่มีคิววันนี้ — ลูกค้าจองผ่าน QR จะแสดงที่นี่"

          }

          className="flex flex-row items-start justify-between gap-3 sm:items-center"

          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"

          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <AppointmentQueueScheduleLink />
              <Link
                href="/dashboard/appointment-queue?tab=queue"
                aria-label="จัดการคิวเต็มรูปแบบ"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] min-w-[40px] rounded-xl sm:min-w-0 sm:px-4",
                )}
              >
                <svg
                  className="h-5 w-5 sm:hidden"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span className="hidden sm:inline">จัดการคิว</span>
              </Link>
            </div>
          }

        />

        <div className="space-y-4 sm:space-y-5">

          {pendingBlock}

          {queueList}

        </div>

        <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปมัดจำ" />

      </AppDashboardSection>

    );

  }



  return (

    <div className="space-y-4 sm:space-y-6">

      {pendingBlock}

      <AppDashboardSection className={appDashboardSectionVioletClass}>

        <AppSectionHeader

          title={`คิววันนี้ · ${data.dateKey}`}

          description="เพิ่ม แก้ไข หรือลบคิวจอง — เรียงตามเวลานัด"

          className="flex flex-row items-start justify-between gap-3 sm:items-center"

          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"

          action={

            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <AppointmentQueueScheduleLink />
              <button

                type="button"

                aria-label="เพิ่มคิว"

                className="app-btn-primary flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl sm:min-w-0 sm:px-4"

                onClick={openAdd}

              >

                <span className="text-lg font-bold leading-none sm:hidden" aria-hidden>

                  +

                </span>

                <span className="hidden sm:inline">+ เพิ่มคิว</span>

              </button>

            </div>

          }

        />

        {queueList}

      </AppDashboardSection>

      {bookingModal}

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปมัดจำ" />

    </div>

  );

}


