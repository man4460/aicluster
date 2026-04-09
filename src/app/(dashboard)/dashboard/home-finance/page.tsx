import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { HomeFinanceClient } from "@/systems/home-finance/components/HomeFinanceClient";

export default function HomeFinancePage() {
  return (
    <HomeFinanceClient
      section="dashboard"
      calendarDefaults={{ monthStartYmd: bangkokMonthStartYmd(), todayYmd: bangkokTodayYmd() }}
    />
  );
}
