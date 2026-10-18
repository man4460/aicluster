/** แยกวัน/เดือน/พ.ศ. จากวันที่ไทย (Asia/Bangkok) */
export function splitThaiOfficialDate(d = new Date()): {
  dayThai: string;
  monthThai: string;
  yearThai: string;
  todayThai: string;
} {
  const dayThai = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
  });
  const monthThai = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    month: "long",
  });
  const yearThai = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
  });
  const todayThai = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return { dayThai, monthThai, yearThai, todayThai };
}
