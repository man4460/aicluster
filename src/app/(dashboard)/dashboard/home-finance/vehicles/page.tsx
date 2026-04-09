import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { HomeFinanceClient } from "@/systems/home-finance/components/HomeFinanceClient";

export default function HomeFinanceVehiclesPage() {
  return (
    <HomeFinanceClient
      section="vehicles"
      calendarDefaults={{ monthStartYmd: bangkokMonthStartYmd(), todayYmd: bangkokTodayYmd() }}
    />
  );
}
