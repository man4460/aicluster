export type HotelResortBedTypeRow = {
  id: string;
  name: string;
  sortOrder: number;
};

export type HotelResortAmenityRow = {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
};

export type HotelResortBuildingRow = {
  id: string;
  name: string;
  code: string | null;
  sortOrder: number;
  note: string | null;
  roomCount: number;
};

export type HotelResortRoomTypeRow = {
  id: string;
  name: string;
  basePriceBaht: number;
  maxGuests: number;
  sortOrder: number;
};

export type HotelResortRoomRow = {
  id: string;
  roomNumber: string;
  floor: number;
  status: string;
  roomTypeId: string;
  roomTypeName: string;
  basePriceBaht: number;
  guestLabel: string | null;
  bookingId: string | null;
  /** สถานะที่คำนวณตามวัน asOf (ผังห้อง) — ถ้าไม่มีให้ใช้ status */
  displayStatus?: string;
  bookingStatus?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  /** มีการจองล่วงหน้าแต่ยังไม่ถึงวันเช็คอินของ asOf */
  upcomingLabel?: string | null;
  upcomingBookingId?: string | null;
  /** ผู้จองวันถัดไป (เช็คอินพรุ่งนี้) — แสดงแม้ห้องมีผู้เข้าพักวันนี้ */
  nextDayGuestLabel?: string | null;
  nextDayBookingId?: string | null;
  nextDayCheckInAt?: string | null;
  /** มีแขกค้าง + จองถัดไป — ผู้จองต่อเนื่อง */
  nextDayIsContinuous?: boolean;
  /** ผู้จองต่อเนื่องเช็คอินวันนี้ */
  nextDayIsToday?: boolean;
  needsClose?: boolean;
  /** NO_SHOW = จองพ้นเช็คอิน · CHECKOUT = เข้าพักพ้นเช็คเอาต์ */
  needsCloseKind?: "NO_SHOW" | "CHECKOUT" | null;
  asOf?: string;
  buildingId?: string;
  buildingName?: string;
  buildingCode?: string | null;
  bedType?: string | null;
  roomSizeSqm?: number | null;
  viewType?: string | null;
  amenities?: string[];
  /** รูปห้อง (สูงสุด 10) */
  imageUrls?: string[];
};

export type HotelResortRoomManageRow = HotelResortRoomRow & {
  buildingId: string;
  buildingName: string;
  buildingCode: string | null;
  note: string | null;
  sortOrder: number;
  bedType: string | null;
  roomSizeSqm: number | null;
  viewType: string | null;
  amenities: string[];
  imageUrls: string[];
};

export type HotelResortBookingRow = {
  id: string;
  guestName: string;
  guestPhone: string;
  roomId: string | null;
  roomNumber: string | null;
  roomTypeName: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: string;
  isWalkIn: boolean;
  totalBaht: number;
  amountPaidBaht: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentSlipUrl?: string | null;
  idCardImageUrl: string | null;
  note: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  guestAddress?: string | null;
  guestTaxId?: string | null;
};

export type HotelResortDashboardSummary = {
  totalRooms: number;
  vacant: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouse: number;
};

export async function hotelResortFetchErrorMessage(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: string } | null;
  return j?.error ?? `HTTP ${res.status}`;
}
