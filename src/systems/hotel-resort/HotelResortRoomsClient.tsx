"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortRoomStatusBadge } from "@/systems/hotel-resort/components/HotelResortRoomStatusBadge";
import { IconBuilding, IconDoorOpen } from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  hotelResortFetchErrorMessage,
  type HotelResortAmenityRow,
  type HotelResortBedTypeRow,
  type HotelResortBuildingRow,
  type HotelResortRoomManageRow,
  type HotelResortRoomTypeRow,
} from "@/systems/hotel-resort/lib/client-data";
import { hotelResortAmenityLabel } from "@/systems/hotel-resort/lib/room-amenities";
import {
  HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS,
  hotelResortNormalizeCheckoutExtraPresets,
  type HotelResortCheckoutExtraPreset,
} from "@/systems/hotel-resort/lib/checkout-extras";
import { HOTEL_RESORT_ROOM_IMAGE_MAX, hotelResortSampleRoomImageUrls } from "@/systems/hotel-resort/lib/room-images";
import {
  hotelResortContentCardClass,
  hotelResortFieldClass,
  hotelResortFilterChipClass,
  hotelResortSectionRadiusClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type RoomForm = {
  id?: string;
  buildingId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: string;
  status: string;
  note: string;
  canEditStatus: boolean;
  bedType: string;
  roomSizeSqm: string;
  viewType: string;
  amenities: string[];
  imageUrls: string[];
};

type BuildingForm = {
  id?: string;
  name: string;
  code: string;
  note: string;
};

type TypeForm = {
  id?: string;
  name: string;
  basePriceBaht: string;
  maxGuests: string;
};

type NameOnlyForm = { id?: string; name: string };

const emptyRoom = (buildingId = "", roomTypeId = "", defaultAmenities: string[] = []): RoomForm => ({
  buildingId,
  roomTypeId,
  roomNumber: "",
  floor: "1",
  status: "VACANT",
  note: "",
  canEditStatus: true,
  bedType: "",
  roomSizeSqm: "",
  viewType: "",
  amenities: defaultAmenities,
  imageUrls: [],
});

export function HotelResortRoomsClient() {
  const [buildings, setBuildings] = useState<HotelResortBuildingRow[]>([]);
  const [roomTypes, setRoomTypes] = useState<HotelResortRoomTypeRow[]>([]);
  const [bedTypes, setBedTypes] = useState<HotelResortBedTypeRow[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<HotelResortAmenityRow[]>([]);
  const [rooms, setRooms] = useState<HotelResortRoomManageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [roomOpen, setRoomOpen] = useState(false);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoom());
  const [roomImageBusy, setRoomImageBusy] = useState(false);
  const [roomImageErr, setRoomImageErr] = useState<string | null>(null);
  const roomGalleryRef = useRef<HTMLInputElement>(null);
  const roomMultiGalleryRef = useRef<HTMLInputElement>(null);
  const roomImageLb = useAppImageLightbox();
  const roomCamera = useAppCameraCapture({ title: "ถ่ายรูปห้อง" });

  const [buildingOpen, setBuildingOpen] = useState(false);
  const [buildingBusy, setBuildingBusy] = useState(false);
  const [buildingForm, setBuildingForm] = useState<BuildingForm>({ name: "", code: "", note: "" });

  const [typeOpen, setTypeOpen] = useState(false);
  const [typeBusy, setTypeBusy] = useState(false);
  const [typeForm, setTypeForm] = useState<TypeForm>({ name: "", basePriceBaht: "0", maxGuests: "2" });

  const [bedOpen, setBedOpen] = useState(false);
  const [bedBusy, setBedBusy] = useState(false);
  const [bedForm, setBedForm] = useState<NameOnlyForm>({ name: "" });

  const [amenityOpen, setAmenityOpen] = useState(false);
  const [amenityBusy, setAmenityBusy] = useState(false);
  const [amenityForm, setAmenityForm] = useState<NameOnlyForm>({ name: "" });

  const [checkoutExtraDrafts, setCheckoutExtraDrafts] = useState<
    Array<{ label: string; amountBaht: string }>
  >(() =>
    HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS.map((p) => ({
      label: p.label,
      amountBaht: String(p.amountBaht),
    })),
  );
  const [checkoutExtrasBusy, setCheckoutExtrasBusy] = useState(false);

  const [catalogTab, setCatalogTab] = useState<
    "buildings" | "roomTypes" | "bedTypes" | "amenities" | "checkoutExtras"
  >("buildings");

  const catalogTabs = [
    { key: "buildings" as const, label: "อาคาร", shortLabel: "อาคาร" },
    { key: "roomTypes" as const, label: "ประเภทห้อง", shortLabel: "ประเภท" },
    { key: "bedTypes" as const, label: "ขนาดเตียง", shortLabel: "เตียง" },
    { key: "amenities" as const, label: "สิ่งอำนวยความสะดวก", shortLabel: "สิ่งอำนวย" },
    { key: "checkoutExtras" as const, label: "ค่าใช้จ่ายเพิ่ม", shortLabel: "ค่าเพิ่ม" },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, tRes, rRes, bedRes, amRes, pRes] = await Promise.all([
        fetch("/api/hotel-resort/buildings", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/room-types", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/rooms", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/bed-types", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/amenities", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/profile", { cache: "no-store", credentials: "include" }),
      ]);
      if (!bRes.ok) throw new Error(await hotelResortFetchErrorMessage(bRes));
      if (!tRes.ok) throw new Error(await hotelResortFetchErrorMessage(tRes));
      if (!rRes.ok) throw new Error(await hotelResortFetchErrorMessage(rRes));
      if (!bedRes.ok) throw new Error(await hotelResortFetchErrorMessage(bedRes));
      if (!amRes.ok) throw new Error(await hotelResortFetchErrorMessage(amRes));
      const bJson = (await bRes.json()) as { buildings?: HotelResortBuildingRow[] };
      const tJson = (await tRes.json()) as { roomTypes?: HotelResortRoomTypeRow[] };
      const rJson = (await rRes.json()) as { rooms?: HotelResortRoomManageRow[] };
      const bedJson = (await bedRes.json()) as { bedTypes?: HotelResortBedTypeRow[] };
      const amJson = (await amRes.json()) as { amenities?: HotelResortAmenityRow[] };
      setBuildings(bJson.buildings ?? []);
      setRoomTypes(tJson.roomTypes ?? []);
      setRooms(rJson.rooms ?? []);
      setBedTypes(bedJson.bedTypes ?? []);
      setAmenityOptions(amJson.amenities ?? []);
      if (pRes.ok) {
        const pJson = (await pRes.json()) as {
          profile?: { checkoutExtraPresets?: HotelResortCheckoutExtraPreset[] };
        };
        const presets = hotelResortNormalizeCheckoutExtraPresets(pJson.profile?.checkoutExtraPresets);
        setCheckoutExtraDrafts(
          presets.map((p) => ({ label: p.label, amountBaht: String(p.amountBaht) })),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดห้องพักไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRooms = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rooms.filter((r) => {
      if (buildingFilter && r.buildingId !== buildingFilter) return false;
      if (!q) return true;
      return (
        r.roomNumber.toLowerCase().includes(q) ||
        r.buildingName.toLowerCase().includes(q) ||
        r.roomTypeName.toLowerCase().includes(q) ||
        (r.bedType ?? "").toLowerCase().includes(q) ||
        (r.viewType ?? "").toLowerCase().includes(q) ||
        (r.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [rooms, buildingFilter, keyword]);

  function openCreateRoom() {
    const defaults = amenityOptions
      .filter((a) => ["WIFI", "TV", "AIRCON", "HOT_WATER"].includes(a.key))
      .map((a) => a.key);
    setRoomImageErr(null);
    setRoomForm(
      emptyRoom(
        buildings[0]?.id ?? "",
        roomTypes[0]?.id ?? "",
        defaults.length ? defaults : amenityOptions.slice(0, 4).map((a) => a.key),
      ),
    );
    setRoomOpen(true);
  }

  function openEditRoom(room: HotelResortRoomManageRow) {
    const canEditStatus = room.status === "VACANT" || room.status === "MAINTENANCE";
    setRoomImageErr(null);
    setRoomForm({
      id: room.id,
      buildingId: room.buildingId,
      roomTypeId: room.roomTypeId,
      roomNumber: room.roomNumber,
      floor: String(room.floor),
      status: room.status,
      note: room.note ?? "",
      canEditStatus,
      bedType: room.bedType ?? "",
      roomSizeSqm: room.roomSizeSqm != null ? String(room.roomSizeSqm) : "",
      viewType: room.viewType ?? "",
      amenities: room.amenities ?? [],
      imageUrls: room.imageUrls ?? [],
    });
    setRoomOpen(true);
  }

  function toggleAmenity(key: string) {
    setRoomForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((k) => k !== key) : [...f.amenities, key],
    }));
  }

  async function uploadRoomImages(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const slots = HOTEL_RESORT_ROOM_IMAGE_MAX - roomForm.imageUrls.length;
    if (slots <= 0) {
      setRoomImageErr(`อัปโหลดได้ไม่เกิน ${HOTEL_RESORT_ROOM_IMAGE_MAX} รูป`);
      return;
    }
    const toUpload = list.slice(0, slots);
    setRoomImageBusy(true);
    setRoomImageErr(null);
    const added: string[] = [];
    try {
      for (const file of toUpload) {
        const prepared = await prepareImageFileForUpload(file);
        const fd = new FormData();
        fd.append("file", prepared);
        const res = await fetch("/api/hotel-resort/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const j = (await res.json().catch(() => null)) as
          | { url?: string; imageUrl?: string; error?: string }
          | null;
        const url = j?.url ?? j?.imageUrl;
        if (!res.ok || typeof url !== "string") {
          throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดรูปไม่สำเร็จ");
        }
        added.push(url);
      }
      setRoomForm((f) => ({
        ...f,
        imageUrls: [...f.imageUrls, ...added].slice(0, HOTEL_RESORT_ROOM_IMAGE_MAX),
      }));
      if (list.length > slots) {
        setRoomImageErr(`อัปโหลดได้สูงสุด ${HOTEL_RESORT_ROOM_IMAGE_MAX} รูป — เพิ่มแล้ว ${added.length} รูป`);
      }
    } catch (e) {
      setRoomImageErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setRoomImageBusy(false);
    }
  }

  function removeRoomImage(url: string) {
    setRoomForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }));
  }

  async function onPickRoomImageFile(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;
    await uploadRoomImages(files);
  }

  async function saveRoom() {
    setRoomBusy(true);
    setError(null);
    try {
      const sizeRaw = roomForm.roomSizeSqm.trim();
      const payload: Record<string, unknown> = {
        buildingId: roomForm.buildingId,
        roomTypeId: roomForm.roomTypeId,
        roomNumber: roomForm.roomNumber.trim(),
        floor: Number(roomForm.floor || 1),
        note: roomForm.note.trim() || null,
        bedType: roomForm.bedType.trim() || null,
        viewType: roomForm.viewType.trim() || null,
        roomSizeSqm: sizeRaw ? Number(sizeRaw) : null,
        amenities: roomForm.amenities,
        imageUrls: roomForm.imageUrls,
      };
      if (!roomForm.id || roomForm.canEditStatus) {
        payload.status = roomForm.status === "MAINTENANCE" ? "MAINTENANCE" : "VACANT";
      }
      const res = await fetch(roomForm.id ? `/api/hotel-resort/rooms/${roomForm.id}` : "/api/hotel-resort/rooms", {
        method: roomForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setRoomOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกห้องไม่สำเร็จ");
    } finally {
      setRoomBusy(false);
    }
  }

  async function deleteRoom(room: HotelResortRoomManageRow) {
    if (!window.confirm(`ลบห้อง ${room.roomNumber} (${room.buildingName})?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/rooms/${room.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบห้องไม่สำเร็จ");
    }
  }

  async function saveBuilding() {
    setBuildingBusy(true);
    setError(null);
    try {
      const payload = {
        name: buildingForm.name.trim(),
        code: buildingForm.code.trim() || null,
        note: buildingForm.note.trim() || null,
      };
      const res = await fetch(
        buildingForm.id ? `/api/hotel-resort/buildings/${buildingForm.id}` : "/api/hotel-resort/buildings",
        {
          method: buildingForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setBuildingOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกอาคารไม่สำเร็จ");
    } finally {
      setBuildingBusy(false);
    }
  }

  async function deleteBuilding(b: HotelResortBuildingRow) {
    if (!window.confirm(`ลบอาคาร ${b.name}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/buildings/${b.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      if (buildingFilter === b.id) setBuildingFilter("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบอาคารไม่สำเร็จ");
    }
  }

  async function saveType() {
    setTypeBusy(true);
    setError(null);
    try {
      const payload = {
        name: typeForm.name.trim(),
        basePriceBaht: Number(typeForm.basePriceBaht || 0),
        maxGuests: Number(typeForm.maxGuests || 2),
      };
      const res = await fetch(
        typeForm.id ? `/api/hotel-resort/room-types/${typeForm.id}` : "/api/hotel-resort/room-types",
        {
          method: typeForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setTypeOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกประเภทห้องไม่สำเร็จ");
    } finally {
      setTypeBusy(false);
    }
  }

  async function deleteType(t: HotelResortRoomTypeRow) {
    if (!window.confirm(`ลบประเภท ${t.name}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/room-types/${t.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบประเภทห้องไม่สำเร็จ");
    }
  }

  async function saveBedType() {
    setBedBusy(true);
    setError(null);
    try {
      const res = await fetch(bedForm.id ? `/api/hotel-resort/bed-types/${bedForm.id}` : "/api/hotel-resort/bed-types", {
        method: bedForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: bedForm.name.trim() }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setBedOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกรูปแบบเตียงไม่สำเร็จ");
    } finally {
      setBedBusy(false);
    }
  }

  async function deleteBedType(row: HotelResortBedTypeRow) {
    if (!window.confirm(`ลบรูปแบบเตียง «${row.name}»?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/bed-types/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบรูปแบบเตียงไม่สำเร็จ");
    }
  }

  async function saveAmenityOption() {
    setAmenityBusy(true);
    setError(null);
    try {
      const res = await fetch(
        amenityForm.id ? `/api/hotel-resort/amenities/${amenityForm.id}` : "/api/hotel-resort/amenities",
        {
          method: amenityForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ label: amenityForm.name.trim() }),
        },
      );
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setAmenityOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกสิ่งอำนวยความสะดวกไม่สำเร็จ");
    } finally {
      setAmenityBusy(false);
    }
  }

  async function deleteAmenityOption(row: HotelResortAmenityRow) {
    if (!window.confirm(`ลบ «${row.label}» ออกจากแคตตาล็อก? (จะถอดจากห้องที่ใช้ด้วย)`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/hotel-resort/amenities/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบสิ่งอำนวยความสะดวกไม่สำเร็จ");
    }
  }

  async function saveCheckoutExtraPresets() {
    setCheckoutExtrasBusy(true);
    setError(null);
    try {
      const presets = hotelResortNormalizeCheckoutExtraPresets(
        checkoutExtraDrafts.map((d) => ({
          label: d.label.trim(),
          amountBaht: Math.max(0, Math.round(Number(d.amountBaht || 0))),
        })),
      );
      const res = await fetch("/api/hotel-resort/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ checkoutExtraPresets: presets }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as {
        profile?: { checkoutExtraPresets?: HotelResortCheckoutExtraPreset[] };
      };
      const next = hotelResortNormalizeCheckoutExtraPresets(j.profile?.checkoutExtraPresets ?? presets);
      setCheckoutExtraDrafts(next.map((p) => ({ label: p.label, amountBaht: String(p.amountBaht) })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกค่าใช้จ่ายเพิ่มไม่สำเร็จ");
    } finally {
      setCheckoutExtrasBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? <HotelResortErrorBanner message={error} /> : null}

      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="ตั้งค่าห้องพัก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <HotelResortButton
              type="button"
              onClick={() => {
                if (catalogTab === "buildings") {
                  setBuildingForm({ name: "", code: "", note: "" });
                  setBuildingOpen(true);
                } else if (catalogTab === "roomTypes") {
                  setTypeForm({ name: "", basePriceBaht: "0", maxGuests: "2" });
                  setTypeOpen(true);
                } else if (catalogTab === "bedTypes") {
                  setBedForm({ name: "" });
                  setBedOpen(true);
                } else if (catalogTab === "amenities") {
                  setAmenityForm({ name: "" });
                  setAmenityOpen(true);
                } else {
                  setCheckoutExtraDrafts((prev) => [...prev, { label: "", amountBaht: "0" }]);
                }
              }}
              className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
              aria-label={
                catalogTab === "buildings"
                  ? "เพิ่มอาคาร"
                  : catalogTab === "roomTypes"
                    ? "เพิ่มประเภทห้อง"
                    : catalogTab === "bedTypes"
                      ? "เพิ่มรูปแบบเตียง"
                      : catalogTab === "amenities"
                        ? "เพิ่มสิ่งอำนวยความสะดวก"
                        : "เพิ่มรายการค่าใช้จ่าย"
              }
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">
                {catalogTab === "buildings"
                  ? "+ เพิ่มอาคาร"
                  : catalogTab === "roomTypes"
                    ? "+ เพิ่มประเภท"
                    : catalogTab === "bedTypes"
                      ? "+ เพิ่มรูปแบบเตียง"
                      : catalogTab === "amenities"
                        ? "+ เพิ่มรายการ"
                        : "+ เพิ่มรายการ"}
              </span>
            </HotelResortButton>
          }
        />

        <div
          className="mt-3 flex gap-1 overflow-x-auto rounded-2xl border border-white/55 bg-white/40 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="เมนูตั้งค่าห้องพัก"
        >
          {catalogTabs.map((tab) => {
            const active = catalogTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCatalogTab(tab.key)}
                className={cn(
                  "min-h-[40px] shrink-0 rounded-[1rem] px-3 py-2 text-xs font-black transition sm:px-4",
                  active
                    ? "bg-[#5b61ff] text-white shadow-md"
                    : "text-[#66638c] hover:bg-white/70 hover:text-[#4d47b6]",
                )}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4" role="tabpanel">
          {loading ? (
            <div className="h-20 animate-pulse rounded-[1rem] bg-[#ecebff]/50" aria-hidden />
          ) : catalogTab === "buildings" ? (
            buildings.length === 0 ? (
              <AppEmptyState>ยังไม่มีอาคาร</AppEmptyState>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {buildings.map((b) => (
                  <li key={b.id} className={cn(hotelResortContentCardClass, "flex items-start justify-between gap-2 p-4")}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <IconBuilding className="h-4 w-4 shrink-0 text-[#5b61ff]" aria-hidden />
                        <p className="truncate text-sm font-black text-[#1e1b4b]">{b.name}</p>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[#66638c]">
                        {b.code ? `${b.code} · ` : ""}
                        {b.roomCount.toLocaleString("th-TH")} ห้อง
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขอาคาร ${b.name}`}
                        title="แก้ไข"
                        onClick={() => {
                          setBuildingForm({ id: b.id, name: b.name, code: b.code ?? "", note: b.note ?? "" });
                          setBuildingOpen(true);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบอาคาร ${b.name}`}
                        title="ลบ"
                        onClick={() => void deleteBuilding(b)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : catalogTab === "roomTypes" ? (
            roomTypes.length === 0 ? (
              <AppEmptyState>ยังไม่มีประเภทห้อง — เพิ่มก่อนสร้างห้อง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {roomTypes.map((t) => (
                  <li
                    key={t.id}
                    className={cn(hotelResortContentCardClass, "flex items-center justify-between gap-2 px-4 py-3")}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#1e1b4b]">{t.name}</p>
                      <p className="text-xs font-semibold text-[#66638c]">
                        ฿{t.basePriceBaht.toLocaleString("th-TH")} · สูงสุด {t.maxGuests} คน
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขประเภท ${t.name}`}
                        title="แก้ไข"
                        onClick={() => {
                          setTypeForm({
                            id: t.id,
                            name: t.name,
                            basePriceBaht: String(t.basePriceBaht),
                            maxGuests: String(t.maxGuests),
                          });
                          setTypeOpen(true);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบประเภท ${t.name}`}
                        title="ลบ"
                        onClick={() => void deleteType(t)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : catalogTab === "bedTypes" ? (
            bedTypes.length === 0 ? (
              <AppEmptyState>ยังไม่มีรูปแบบเตียง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {bedTypes.map((row) => (
                  <li
                    key={row.id}
                    className={cn(hotelResortContentCardClass, "flex items-center justify-between gap-2 px-4 py-3")}
                  >
                    <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{row.name}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขรูปแบบเตียง ${row.name}`}
                        title="แก้ไข"
                        onClick={() => {
                          setBedForm({ id: row.id, name: row.name });
                          setBedOpen(true);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบรูปแบบเตียง ${row.name}`}
                        title="ลบ"
                        onClick={() => void deleteBedType(row)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : catalogTab === "amenities" ? (
            amenityOptions.length === 0 ? (
              <AppEmptyState>ยังไม่มีสิ่งอำนวยความสะดวก</AppEmptyState>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {amenityOptions.map((row) => (
                  <li
                    key={row.id}
                    className={cn(hotelResortContentCardClass, "flex items-center justify-between gap-2 px-4 py-3")}
                  >
                    <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{row.label}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${row.label}`}
                        title="แก้ไข"
                        onClick={() => {
                          setAmenityForm({ id: row.id, name: row.label });
                          setAmenityOpen(true);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${row.label}`}
                        title="ลบ"
                        onClick={() => void deleteAmenityOption(row)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#66638c]">
                ปุ่มลัดตอนเช็คเอาต์ — แก้ชื่อและราคาที่นี่ แล้วกดบันทึก
              </p>
              <ul className="space-y-2">
                {checkoutExtraDrafts.map((row, idx) => (
                  <li
                    key={`extra-${idx}`}
                    className={cn(
                      hotelResortContentCardClass,
                      "grid grid-cols-[1fr_6.5rem_auto] items-center gap-2 px-3 py-2.5",
                    )}
                  >
                    <input
                      className={hotelResortFieldClass}
                      value={row.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCheckoutExtraDrafts((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, label: v } : p)),
                        );
                      }}
                      placeholder="ชื่อรายการ"
                      aria-label={`ชื่อรายการค่าใช้จ่ายที่ ${idx + 1}`}
                    />
                    <input
                      className={cn(hotelResortFieldClass, "text-right font-black tabular-nums")}
                      type="number"
                      min={0}
                      value={row.amountBaht}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCheckoutExtraDrafts((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, amountBaht: v } : p)),
                        );
                      }}
                      placeholder="บาท"
                      aria-label={`ราคา${row.label || `รายการที่ ${idx + 1}`}`}
                    />
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบรายการที่ ${idx + 1}`}
                      title="ลบ"
                      disabled={checkoutExtrasBusy || checkoutExtraDrafts.length <= 1}
                      onClick={() =>
                        setCheckoutExtraDrafts((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <HotelResortButton
                  type="button"
                  disabled={checkoutExtrasBusy}
                  onClick={() =>
                    setCheckoutExtraDrafts((prev) => [...prev, { label: "", amountBaht: "0" }])
                  }
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "min-h-[40px] rounded-[1rem] px-4 text-xs font-black text-[#4d47b6]",
                  )}
                >
                  + เพิ่มรายการ
                </HotelResortButton>
                <HotelResortButton
                  type="button"
                  disabled={checkoutExtrasBusy}
                  onClick={() => void saveCheckoutExtraPresets()}
                  className="app-btn-primary min-h-[40px] rounded-[1rem] px-4 text-xs font-black"
                >
                  {checkoutExtrasBusy ? "กำลังบันทึก…" : "บันทึกราคาปุ่มลัด"}
                </HotelResortButton>
              </div>
            </div>
          )}
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="ห้องพัก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => setMobileFilterOpen((v) => !v)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative min-h-[40px] min-w-[40px] px-0 sm:hidden",
                  (buildingFilter || keyword) && "border-[#5b61ff]/40 bg-[#ecebff]/80",
                )}
                aria-label="เปิดตัวกรอง"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={openCreateRoom}
                disabled={buildings.length === 0 || roomTypes.length === 0}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4 disabled:opacity-50"
                aria-label="เพิ่มห้องพัก"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มห้อง</span>
              </HotelResortButton>
            </div>
          }
        />

        <div className={cn("mt-3 gap-2 sm:grid sm:grid-cols-2", mobileFilterOpen ? "grid" : "hidden sm:grid")}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาเลขห้อง / อาคาร"
            className={hotelResortFieldClass}
            aria-label="ค้นหาห้อง"
          />
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className={hotelResortFieldClass}
            aria-label="กรองตามอาคาร"
          >
            <option value="">ทุกอาคาร</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={hotelResortFilterChipClass(!buildingFilter)}
            onClick={() => setBuildingFilter("")}
          >
            ทั้งหมด
          </button>
          {buildings.map((b) => (
            <button
              key={b.id}
              type="button"
              className={hotelResortFilterChipClass(buildingFilter === b.id)}
              onClick={() => setBuildingFilter(b.id)}
            >
              {b.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 h-32 animate-pulse rounded-[1rem] bg-[#ecebff]/50" aria-hidden />
        ) : filteredRooms.length === 0 ? (
          <AppEmptyState className="mt-4">ยังไม่มีห้องพัก</AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {filteredRooms.map((room) => (
              <li
                key={room.id}
                className={cn(hotelResortContentCardClass, "flex items-center justify-between gap-2 px-4 py-3")}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {room.imageUrls?.[0] ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        roomImageLb.openGallery(room.imageUrls ?? [], 0);
                      }}
                      className="relative z-[1] h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] ring-2 ring-white/70 transition hover:ring-[#5b61ff]/45"
                      aria-label={`ดูรูปห้อง ${room.roomNumber}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={room.imageUrls[0]}
                        alt={`ห้อง ${room.roomNumber}`}
                        className="h-full w-full object-cover object-center"
                      />
                      {room.imageUrls.length > 1 ? (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[9px] font-black text-white">
                          {room.imageUrls.length}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] border border-white/60 bg-white/55 text-[#8b87b8]"
                      aria-hidden
                    >
                      <IconDoorOpen className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <IconDoorOpen className="h-4 w-4 shrink-0 text-[#5b61ff]" aria-hidden />
                    <p className="text-sm font-black text-[#1e1b4b]">ห้อง {room.roomNumber}</p>
                    <HotelResortRoomStatusBadge
                      status={room.status as "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#66638c]">
                    {room.buildingName}
                    {room.buildingCode ? ` (${room.buildingCode})` : ""} · ชั้น {room.floor} · {room.roomTypeName} · ฿
                    {room.basePriceBaht.toLocaleString("th-TH")}
                  </p>
                  {(room.bedType || room.roomSizeSqm || room.viewType) && (
                    <p className="mt-1 text-[11px] font-semibold text-[#66638c]">
                      {[room.bedType, room.roomSizeSqm != null ? `${room.roomSizeSqm} ตร.ม.` : null, room.viewType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {room.amenities?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {room.amenities.slice(0, 6).map((key) => (
                        <span
                          key={key}
                          className="rounded-lg border border-white/60 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-[#4d47b6]"
                        >
                          {hotelResortAmenityLabel(key, amenityOptions)}
                        </span>
                      ))}
                      {room.amenities.length > 6 ? (
                        <span className="rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-[#8b87b8]">
                          +{room.amenities.length - 6}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {room.imageUrls?.length ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-[#66638c]">
                      รูปห้อง {room.imageUrls.length}/{HOTEL_RESORT_ROOM_IMAGE_MAX}
                    </p>
                  ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขห้อง ${room.roomNumber}`}
                    title="แก้ไข"
                    onClick={() => openEditRoom(room)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบห้อง ${room.roomNumber}`}
                    title="ลบ"
                    onClick={() => void deleteRoom(room)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={roomOpen}
        onClose={() => !roomBusy && setRoomOpen(false)}
        title={roomForm.id ? "แก้ไขห้อง" : "เพิ่มห้อง"}
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => setRoomOpen(false)}
            onSubmit={() => void saveRoom()}
            submitLabel="บันทึก"
            loading={roomBusy}
            submitDisabled={!roomForm.roomNumber.trim() || !roomForm.buildingId || !roomForm.roomTypeId || roomImageBusy}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">อาคาร</span>
            <select
              className={hotelResortFieldClass}
              value={roomForm.buildingId}
              onChange={(e) => setRoomForm((f) => ({ ...f, buildingId: e.target.value }))}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เลขห้อง</span>
            <input
              className={hotelResortFieldClass}
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ชั้น</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              value={roomForm.floor}
              onChange={(e) => setRoomForm((f) => ({ ...f, floor: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">ประเภทห้อง</span>
            <select
              className={hotelResortFieldClass}
              value={roomForm.roomTypeId}
              onChange={(e) => setRoomForm((f) => ({ ...f, roomTypeId: e.target.value }))}
            >
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (฿{t.basePriceBaht.toLocaleString("th-TH")})
                </option>
              ))}
            </select>
          </label>
          {roomForm.canEditStatus ? (
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold text-[#66638c]">สถานะตั้งต้น</span>
              <select
                className={hotelResortFieldClass}
                value={roomForm.status === "MAINTENANCE" ? "MAINTENANCE" : "VACANT"}
                onChange={(e) => setRoomForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="VACANT">ว่าง</option>
                <option value="MAINTENANCE">ซ่อมบำรุง</option>
              </select>
            </label>
          ) : null}

          <p className="sm:col-span-2 text-xs font-black uppercase tracking-widest text-[#66638c]">รายละเอียดห้อง</p>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">รูปแบบ / ขนาดเตียง</span>
            <select
              className={hotelResortFieldClass}
              value={roomForm.bedType}
              onChange={(e) => setRoomForm((f) => ({ ...f, bedType: e.target.value }))}
            >
              <option value="">— เลือก —</option>
              {bedTypes.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
              {roomForm.bedType && !bedTypes.some((b) => b.name === roomForm.bedType) ? (
                <option value={roomForm.bedType}>{roomForm.bedType} (เดิม)</option>
              ) : null}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ขนาดห้อง (ตร.ม.)</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              value={roomForm.roomSizeSqm}
              onChange={(e) => setRoomForm((f) => ({ ...f, roomSizeSqm: e.target.value }))}
              placeholder="เช่น 28"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">วิว / มุมมอง</span>
            <input
              className={hotelResortFieldClass}
              value={roomForm.viewType}
              onChange={(e) => setRoomForm((f) => ({ ...f, viewType: e.target.value }))}
              placeholder="เช่น ทะเล · สระ · เมือง"
            />
          </label>
          <div className="sm:col-span-2 space-y-2">
            <span className="text-xs font-semibold text-[#66638c]">สิ่งอำนวยความสะดวกในห้อง</span>
            {amenityOptions.length === 0 ? (
              <p className="text-xs font-semibold text-[#8b87b8]">เพิ่มรายการในส่วน «สิ่งอำนวยความสะดวก» ก่อน</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="สิ่งอำนวยความสะดวก">
                {amenityOptions.map((opt) => {
                  const active = roomForm.amenities.includes(opt.key);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleAmenity(opt.key)}
                      aria-pressed={active}
                      className={cn(
                        "min-h-[40px] rounded-[1rem] border px-2.5 py-2 text-left text-xs font-bold transition",
                        active
                          ? "border-[#5b61ff]/45 bg-[#ecebff]/90 text-[#4d47b6]"
                          : "border-white/60 bg-white/55 text-[#66638c] hover:bg-white/80",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-[#66638c]">
              รูปห้อง ({roomForm.imageUrls.length}/{HOTEL_RESORT_ROOM_IMAGE_MAX})
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[#8b87b8]">
              อัปโหลดได้สูงสุด {HOTEL_RESORT_ROOM_IMAGE_MAX} รูป — ระบบย่อขนาดให้อัตโนมัติก่อนบันทึก
            </p>
            {roomImageErr ? <p className="mt-1 text-sm font-semibold text-rose-600">{roomImageErr}</p> : null}
            <AppGalleryCameraFileInputs
              galleryInputRef={roomGalleryRef}
              cameraInputRef={roomCamera.cameraInputRef}
              onChange={(e) => void onPickRoomImageFile(e)}
            />
            <input
              ref={roomMultiGalleryRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => void onPickRoomImageFile(e)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <AppImagePickCameraButtons
                onPickGallery={() => roomMultiGalleryRef.current?.click()}
                onPickCamera={() =>
                  roomCamera.openCamera((file) => void uploadRoomImages([file]))
                }
                disabled={roomBusy || roomImageBusy || roomForm.imageUrls.length >= HOTEL_RESORT_ROOM_IMAGE_MAX}
                busy={roomImageBusy}
                labels={{ gallery: "เลือกรูป (หลายไฟล์ได้)", camera: "ถ่ายรูป" }}
              />
              {roomForm.imageUrls.length === 0 ? (
                <button
                  type="button"
                  disabled={roomBusy || roomImageBusy}
                  onClick={() => {
                    const idx = rooms.findIndex((r) => r.id === roomForm.id);
                    setRoomForm((f) => ({
                      ...f,
                      imageUrls: hotelResortSampleRoomImageUrls(idx >= 0 ? idx : rooms.length, 3),
                    }));
                    setRoomImageErr(null);
                  }}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "min-h-[44px] rounded-xl px-3 text-xs font-bold text-[#4d47b6]",
                  )}
                >
                  ใส่รูปตัวอย่าง
                </button>
              ) : null}
            </div>
            {roomCamera.cameraModal}
            {roomForm.imageUrls.length ? (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {roomForm.imageUrls.map((url, idx) => (
                  <li key={`${url}-${idx}`} className="relative">
                    <AppImageThumb
                      src={url}
                      alt={`รูปห้อง ${idx + 1}`}
                      onOpen={() => roomImageLb.openGallery(roomForm.imageUrls, idx)}
                      className="h-20 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeRoomImage(url)}
                      className={cn(
                        assetRowRemoveIconButtonClass,
                        "absolute -right-1 -top-1 !min-h-[32px] !min-w-[32px] rounded-full shadow-sm",
                      )}
                      aria-label={`ลบรูปที่ ${idx + 1}`}
                      title="ลบรูป"
                    >
                      <IconRowRemove className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีรูป — เลือกจากแกลเลอรีหรือถ่ายใหม่</p>
            )}
          </div>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">หมายเหตุ</span>
            <input
              className={hotelResortFieldClass}
              value={roomForm.note}
              onChange={(e) => setRoomForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={buildingOpen}
        onClose={() => !buildingBusy && setBuildingOpen(false)}
        title={buildingForm.id ? "แก้ไขอาคาร" : "เพิ่มอาคาร"}
        footer={
          <FormModalFooterActions
            onCancel={() => setBuildingOpen(false)}
            onSubmit={() => void saveBuilding()}
            submitLabel="บันทึก"
            loading={buildingBusy}
            submitDisabled={!buildingForm.name.trim()}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ชื่ออาคาร / ตึก</span>
            <input
              className={hotelResortFieldClass}
              value={buildingForm.name}
              onChange={(e) => setBuildingForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น อาคาร A"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">รหัสสั้น</span>
            <input
              className={hotelResortFieldClass}
              value={buildingForm.code}
              onChange={(e) => setBuildingForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="เช่น A"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">หมายเหตุ</span>
            <input
              className={hotelResortFieldClass}
              value={buildingForm.note}
              onChange={(e) => setBuildingForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={typeOpen}
        onClose={() => !typeBusy && setTypeOpen(false)}
        title={typeForm.id ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง"}
        footer={
          <FormModalFooterActions
            onCancel={() => setTypeOpen(false)}
            onSubmit={() => void saveType()}
            submitLabel="บันทึก"
            loading={typeBusy}
            submitDisabled={!typeForm.name.trim()}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">ชื่อประเภท</span>
            <input
              className={hotelResortFieldClass}
              value={typeForm.name}
              onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ราคาพื้นฐาน (บาท)</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              value={typeForm.basePriceBaht}
              onChange={(e) => setTypeForm((f) => ({ ...f, basePriceBaht: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">จำนวนแขกสูงสุด</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={1}
              value={typeForm.maxGuests}
              onChange={(e) => setTypeForm((f) => ({ ...f, maxGuests: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={bedOpen}
        onClose={() => !bedBusy && setBedOpen(false)}
        title={bedForm.id ? "แก้ไขรูปแบบเตียง" : "เพิ่มรูปแบบเตียง"}
        footer={
          <FormModalFooterActions
            onCancel={() => setBedOpen(false)}
            onSubmit={() => void saveBedType()}
            submitLabel="บันทึก"
            loading={bedBusy}
            submitDisabled={!bedForm.name.trim()}
          />
        }
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#66638c]">ชื่อรูปแบบ / ขนาดเตียง</span>
          <input
            className={hotelResortFieldClass}
            value={bedForm.name}
            onChange={(e) => setBedForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น เตียงคิงไซส์"
          />
        </label>
      </FormModal>

      <FormModal
        open={amenityOpen}
        onClose={() => !amenityBusy && setAmenityOpen(false)}
        title={amenityForm.id ? "แก้ไขสิ่งอำนวยความสะดวก" : "เพิ่มสิ่งอำนวยความสะดวก"}
        footer={
          <FormModalFooterActions
            onCancel={() => setAmenityOpen(false)}
            onSubmit={() => void saveAmenityOption()}
            submitLabel="บันทึก"
            loading={amenityBusy}
            submitDisabled={!amenityForm.name.trim()}
          />
        }
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-[#66638c]">ชื่อรายการ</span>
          <input
            className={hotelResortFieldClass}
            value={amenityForm.name}
            onChange={(e) => setAmenityForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น Wi‑Fi · ทีวี · ตู้เย็น"
          />
        </label>
      </FormModal>

      <AppImageLightbox
        src={roomImageLb.src}
        sources={roomImageLb.sources}
        initialIndex={roomImageLb.initialIndex}
        onClose={roomImageLb.close}
        alt="รูปห้อง"
      />
    </div>
  );
}
