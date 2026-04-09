import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { HomeFinanceClient } from "@/systems/home-finance/components/HomeFinanceClient";

export default function HomeFinanceUtilitiesPage() {
  return (
    <HomeFinanceClient
      section="utilities"
      calendarDefaults={{ monthStartYmd: bangkokMonthStartYmd(), todayYmd: bangkokTodayYmd() }}
    />
  );
}
