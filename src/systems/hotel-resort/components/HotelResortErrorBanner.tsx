import { hotelResortErrorBannerClass } from "@/systems/hotel-resort/lib/ui-tokens";

export function HotelResortErrorBanner({ message }: { message: string }) {
  return <p className={hotelResortErrorBannerClass} role="alert">{message}</p>;
}
