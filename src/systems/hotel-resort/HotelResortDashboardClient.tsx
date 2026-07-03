"use client";



import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { AppDashboardSection, AppEmptyState, AppSectionHeader } from "@/components/app-templates";

import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";

import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";

import { HotelResortRoomGrid } from "@/systems/hotel-resort/components/HotelResortRoomGrid";

import { HotelResortStatCard } from "@/systems/hotel-resort/components/HotelResortStatCard";

import { HotelResortStatsPanel } from "@/systems/hotel-resort/components/HotelResortStatsPanel";
import {
  IconBed,
  IconBuilding,
  IconCalendar,
  IconDoorOpen,
} from "@/systems/hotel-resort/components/HotelResortIcons";

import {

  hotelResortSkeletonClass,

  hotelResortStatsGridClass,

} from "@/systems/hotel-resort/lib/ui-tokens";

import {

  hotelResortFetchErrorMessage,

  type HotelResortDashboardSummary,

  type HotelResortRoomRow,

} from "@/systems/hotel-resort/lib/client-data";



const emptySummary: HotelResortDashboardSummary = {

  totalRooms: 0,

  vacant: 0,

  occupied: 0,

  reserved: 0,

  maintenance: 0,

  arrivalsToday: 0,

  departuresToday: 0,

  inHouse: 0,

};



export function HotelResortDashboardClient() {

  const router = useRouter();

  const [summary, setSummary] = useState<HotelResortDashboardSummary>(emptySummary);

  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const [summaryRes, roomsRes] = await Promise.all([

        fetch("/api/hotel-resort/dashboard-summary", { cache: "no-store", credentials: "include" }),

        fetch("/api/hotel-resort/rooms", { cache: "no-store", credentials: "include" }),

      ]);

      if (!summaryRes.ok) throw new Error(await hotelResortFetchErrorMessage(summaryRes));

      if (!roomsRes.ok) throw new Error(await hotelResortFetchErrorMessage(roomsRes));

      const summaryJson = (await summaryRes.json()) as HotelResortDashboardSummary;

      const roomsJson = (await roomsRes.json()) as { rooms?: HotelResortRoomRow[] };

      setSummary(summaryJson);

      setRooms(Array.isArray(roomsJson.rooms) ? roomsJson.rooms : []);

    } catch (e) {

      setError(e instanceof Error ? e.message : "โหลดแดชบอร์ดไม่สำเร็จ");

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  return (

    <div className="space-y-4 sm:space-y-6">

      {error ? <HotelResortErrorBanner message={error} /> : null}



      <HotelResortStatsPanel title="สถิติห้องพัก" gridClassName={hotelResortStatsGridClass}>

        <HotelResortStatCard

          title="ห้องทั้งหมด"

          value={summary.totalRooms.toLocaleString("th-TH")}

          tone="slate"

          icon={<IconBuilding className="h-4 w-4" />}

        />

        <HotelResortStatCard

          title="ว่าง"

          value={summary.vacant.toLocaleString("th-TH")}

          tone="emerald"

          icon={<IconDoorOpen className="h-4 w-4" />}

        />

        <HotelResortStatCard

          title="เข้าพัก"

          value={summary.occupied.toLocaleString("th-TH")}

          tone="indigo"

          icon={<IconBed className="h-4 w-4" />}

        />

        <HotelResortStatCard

          title="จองวันนี้"

          value={summary.arrivalsToday.toLocaleString("th-TH")}

          tone="amber"

          icon={<IconCalendar className="h-4 w-4" />}

        />

      </HotelResortStatsPanel>



      <AppDashboardSection tone="violet">

        <AppSectionHeader

          tone="violet"

          title="ผังห้องพัก"

          className="flex flex-row items-start justify-between gap-3 sm:items-center"

          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"

          action={

            <HotelResortButton

              type="button"

              onClick={() => void load()}

              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/55 bg-white/75 px-2.5 py-2 text-sm font-semibold text-[#5b61ff] hover:bg-white/90 sm:min-w-0 sm:px-3.5"

              aria-label="รีเฟรชข้อมูลห้องพัก"

            >

              <svg className={loading ? "h-5 w-5 animate-spin sm:mr-1.5" : "h-5 w-5 sm:mr-1.5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>

                <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />

                <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />

              </svg>

              <span className="hidden sm:inline">รีเฟรช</span>

            </HotelResortButton>

          }

        />

        {loading ? (

          <div className={`mt-4 h-32 ${hotelResortSkeletonClass}`} aria-hidden />

        ) : rooms.length === 0 ? (

          <AppEmptyState className="mt-4">ยังไม่มีห้องพักในระบบ</AppEmptyState>

        ) : (

          <div className="mt-4">

            <HotelResortRoomGrid

              rooms={rooms}

              onOpenBookingDetail={(bookingId) => router.push(`/dashboard/hotel-resort/bookings?bookingId=${bookingId}`)}

            />

          </div>

        )}

      </AppDashboardSection>

    </div>

  );

}

