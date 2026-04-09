import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { HomeFinanceClient } from "@/systems/home-finance/components/HomeFinanceClient";

export default function HomeFinanceCategoriesPage() {
  return (
    <HomeFinanceClient
      section="categories"
      calendarDefaults={{ monthStartYmd: bangkokMonthStartYmd(), todayYmd: bangkokTodayYmd() }}
    />
  );
}
