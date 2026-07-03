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
  idCardImageUrl: string | null;
  note: string | null;
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
