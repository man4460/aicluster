/** คำนวณตารางผ่อนแบบดอกเบี้ยคงที่ (flat) — ประมาณการ ไม่ผูกสัญญา */

export type UsedCarInstallmentInput = {
  priceBaht: number;
  downPaymentBaht: number;
  annualInterestPercent: number;
  months: number;
};

export type UsedCarInstallmentScheduleRow = {
  period: number;
  principalBaht: number;
  interestBaht: number;
  paymentBaht: number;
  remainingBaht: number;
};

export type UsedCarInstallmentResult = {
  financedBaht: number;
  totalInterestBaht: number;
  totalPaymentBaht: number;
  monthlyPaymentBaht: number;
  schedule: UsedCarInstallmentScheduleRow[];
};

export function computeFlatInstallment(input: UsedCarInstallmentInput): UsedCarInstallmentResult | null {
  const price = Math.max(0, Math.round(Number(input.priceBaht) || 0));
  const down = Math.max(0, Math.round(Number(input.downPaymentBaht) || 0));
  const rate = Math.max(0, Number(input.annualInterestPercent) || 0);
  const months = Math.max(1, Math.min(120, Math.round(Number(input.months) || 0)));
  if (price <= 0 || months < 1) return null;
  const financed = Math.max(0, price - down);
  if (financed <= 0) {
    return {
      financedBaht: 0,
      totalInterestBaht: 0,
      totalPaymentBaht: 0,
      monthlyPaymentBaht: 0,
      schedule: [],
    };
  }

  const totalInterest = Math.round(financed * (rate / 100) * (months / 12));
  const totalPayment = financed + totalInterest;
  const monthlyPayment = Math.ceil(totalPayment / months);
  const principalPerMonth = Math.floor(financed / months);
  let remainingPrincipal = financed;
  let remainingInterest = totalInterest;
  const schedule: UsedCarInstallmentScheduleRow[] = [];

  for (let i = 1; i <= months; i += 1) {
    const isLast = i === months;
    const interestBaht = isLast
      ? remainingInterest
      : Math.round(totalInterest / months);
    const principalBaht = isLast ? remainingPrincipal : principalPerMonth;
    const paymentBaht = isLast ? principalBaht + interestBaht : monthlyPayment;
    remainingPrincipal = Math.max(0, remainingPrincipal - principalBaht);
    remainingInterest = Math.max(0, remainingInterest - interestBaht);
    schedule.push({
      period: i,
      principalBaht,
      interestBaht,
      paymentBaht,
      remainingBaht: remainingPrincipal,
    });
  }

  return {
    financedBaht: financed,
    totalInterestBaht: totalInterest,
    totalPaymentBaht: totalPayment,
    monthlyPaymentBaht: monthlyPayment,
    schedule,
  };
}
