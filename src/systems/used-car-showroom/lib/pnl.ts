export type UsedCarPnlInput = {
  purchaseCostBaht: number;
  prepCostBaht: number;
  commissionBaht: number;
  salePriceBaht: number;
  discountBaht?: number;
};

export type UsedCarPnlResult = {
  netSaleBaht: number;
  totalCostBaht: number;
  profitBaht: number;
};

/** กำไรสุทธิ = ราคาขายสุทธิ − (ทุนซื้อ + ค่าปรับสภาพ + ค่าคอมที่ผูกรถ) */
export function computeUsedCarVehiclePnl(input: UsedCarPnlInput): UsedCarPnlResult {
  const purchase = Math.max(0, Math.round(input.purchaseCostBaht || 0));
  const prep = Math.max(0, Math.round(input.prepCostBaht || 0));
  const commission = Math.max(0, Math.round(input.commissionBaht || 0));
  const sale = Math.max(0, Math.round(input.salePriceBaht || 0));
  const discount = Math.max(0, Math.round(input.discountBaht || 0));
  const netSaleBaht = Math.max(0, sale - discount);
  const totalCostBaht = purchase + prep + commission;
  return {
    netSaleBaht,
    totalCostBaht,
    profitBaht: netSaleBaht - totalCostBaht,
  };
}
