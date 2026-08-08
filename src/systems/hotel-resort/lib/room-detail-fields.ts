import {
  parseHotelResortAmenities,
  serializeHotelResortAmenities,
} from "@/systems/hotel-resort/lib/room-amenities";
import { hotelResortNormalizeRoomImageUrls } from "@/systems/hotel-resort/lib/room-images";

export type HotelResortRoomDetailInput = {
  bedType?: string | null;
  roomSizeSqm?: number | null;
  viewType?: string | null;
  amenities?: string[] | null;
  amenitiesJson?: string | null;
  imageUrls?: string[] | null;
  imageUrlsJson?: unknown;
};

export function mapHotelResortRoomDetails(r: {
  bedType: string | null;
  roomSizeSqm: number | null;
  viewType: string | null;
  amenitiesJson: string | null;
  imageUrlsJson?: unknown;
}) {
  return {
    bedType: r.bedType,
    roomSizeSqm: r.roomSizeSqm,
    viewType: r.viewType,
    amenities: parseHotelResortAmenities(r.amenitiesJson),
    imageUrls: hotelResortNormalizeRoomImageUrls(r.imageUrlsJson),
  };
}

/** Partial update — only include defined keys */
export function hotelResortRoomDetailPatchData(body: HotelResortRoomDetailInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (body.bedType !== undefined) data.bedType = body.bedType?.trim() || null;
  if (body.viewType !== undefined) data.viewType = body.viewType?.trim() || null;
  if (body.roomSizeSqm !== undefined) {
    data.roomSizeSqm =
      body.roomSizeSqm == null || !Number.isFinite(body.roomSizeSqm)
        ? null
        : Math.max(0, Math.round(body.roomSizeSqm));
  }
  if (body.amenities !== undefined) {
    data.amenitiesJson = serializeHotelResortAmenities(body.amenities ?? []);
  } else if (body.amenitiesJson !== undefined) {
    data.amenitiesJson = serializeHotelResortAmenities(parseHotelResortAmenities(body.amenitiesJson));
  }
  if (body.imageUrls !== undefined) {
    data.imageUrlsJson = hotelResortNormalizeRoomImageUrls(body.imageUrls);
  } else if (body.imageUrlsJson !== undefined) {
    data.imageUrlsJson = hotelResortNormalizeRoomImageUrls(body.imageUrlsJson);
  }
  return data;
}
