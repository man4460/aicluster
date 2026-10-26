import { SmartPoliceInvestigationGraph } from "@/systems/smart-police/components/SmartPoliceInvestigationGraph";

export default async function SmartPoliceInvestigationGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const { caseId } = await searchParams;
  return (
    <div className="p-4">
      <div className="mb-3">
        <h1 className="text-lg font-bold text-[#1e1b4b]">ผังเชื่อมโยงการสืบสวน</h1>
        <p className="text-xs text-slate-600">
          ลากโหนดจัดวาง · ลากเส้นระหว่างบุคคลเพื่อเพิ่มความสัมพันธ์ · คลิกโหนดดูรายละเอียด
        </p>
      </div>
      <SmartPoliceInvestigationGraph initialCaseId={caseId} />
    </div>
  );
}
