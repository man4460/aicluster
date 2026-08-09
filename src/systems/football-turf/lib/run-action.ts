import type { FootballTurfRepository } from "@/systems/football-turf/lib/types";

export type FootballTurfActionBody = {
  op: string;
  id?: number;
  input?: Record<string, unknown>;
};

type FootballTurfServerRepoLike = Pick<
  FootballTurfRepository,
  | "updateSettings"
  | "createCourt"
  | "updateCourt"
  | "deleteCourt"
  | "createBooking"
  | "updateBooking"
  | "deleteBooking"
  | "createPromotion"
  | "updatePromotion"
  | "deletePromotion"
  | "createPromotionSale"
  | "updatePromotionSale"
  | "deletePromotionSale"
  | "usePromotionSale"
  | "createCostCategory"
  | "updateCostCategory"
  | "deleteCostCategory"
  | "createCostEntry"
  | "updateCostEntry"
  | "deleteCostEntry"
  | "createIncomeCategory"
  | "updateIncomeCategory"
  | "deleteIncomeCategory"
  | "createIncomeEntry"
  | "updateIncomeEntry"
  | "deleteIncomeEntry"
  | "createCustomer"
  | "updateCustomer"
  | "deleteCustomer"
>;

export async function runFootballTurfAction(
  repo: FootballTurfServerRepoLike,
  body: FootballTurfActionBody,
): Promise<{ ok: true; result: unknown } | { ok: false; status: number; error: string }> {
  const { op, id, input = {} } = body;

  switch (op) {
    case "updateSettings": {
      const result = await repo.updateSettings(input as Parameters<FootballTurfRepository["updateSettings"]>[0]);
      return { ok: true, result };
    }
    case "createCourt": {
      const result = await repo.createCourt(input as Parameters<FootballTurfRepository["createCourt"]>[0]);
      return { ok: true, result };
    }
    case "updateCourt": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updateCourt(id, input as Parameters<FootballTurfRepository["updateCourt"]>[1]);
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deleteCourt": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deleteCourt(id);
      return { ok: true, result: { deleted } };
    }
    case "createBooking": {
      const result = await repo.createBooking(input as Parameters<FootballTurfRepository["createBooking"]>[0]);
      return { ok: true, result };
    }
    case "updateBooking": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updateBooking(id, input as Parameters<FootballTurfRepository["updateBooking"]>[1]);
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deleteBooking": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deleteBooking(id);
      return { ok: true, result: { deleted } };
    }
    case "createPromotion": {
      const result = await repo.createPromotion(input as Parameters<FootballTurfRepository["createPromotion"]>[0]);
      return { ok: true, result };
    }
    case "updatePromotion": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updatePromotion(id, input as Parameters<FootballTurfRepository["updatePromotion"]>[1]);
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deletePromotion": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deletePromotion(id);
      return { ok: true, result: { deleted } };
    }
    case "createPromotionSale": {
      const result = await repo.createPromotionSale(
        input as Parameters<FootballTurfRepository["createPromotionSale"]>[0],
      );
      return { ok: true, result };
    }
    case "updatePromotionSale": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updatePromotionSale(
        id,
        input as Parameters<FootballTurfRepository["updatePromotionSale"]>[1],
      );
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deletePromotionSale": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deletePromotionSale(id);
      return { ok: true, result: { deleted } };
    }
    case "usePromotionSale": {
      const saleId = id ?? (input.saleId as number | undefined);
      const bookingId = input.bookingId as number | undefined;
      if (saleId == null || bookingId == null) return { ok: false, status: 400, error: "saleId and bookingId required" };
      const result = await repo.usePromotionSale(saleId, bookingId);
      if (!result) return { ok: false, status: 400, error: "cannot use promotion" };
      return { ok: true, result };
    }
    case "createCostCategory": {
      const name = (input.name as string | undefined) ?? "";
      const result = await repo.createCostCategory(name);
      return { ok: true, result };
    }
    case "updateCostCategory": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const name = (input.name as string | undefined) ?? "";
      try {
        const result = await repo.updateCostCategory(id, name);
        if (!result) return { ok: false, status: 404, error: "not found" };
        return { ok: true, result };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "update failed" };
      }
    }
    case "deleteCostCategory": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      try {
        const deleted = await repo.deleteCostCategory(id);
        if (!deleted) return { ok: false, status: 404, error: "not found" };
        return { ok: true, result: { deleted } };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "delete failed" };
      }
    }
    case "createCostEntry": {
      const result = await repo.createCostEntry(input as Parameters<FootballTurfRepository["createCostEntry"]>[0]);
      return { ok: true, result };
    }
    case "updateCostEntry": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updateCostEntry(
        id,
        input as Parameters<FootballTurfRepository["updateCostEntry"]>[1],
      );
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deleteCostEntry": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deleteCostEntry(id);
      return { ok: true, result: { deleted } };
    }
    case "createIncomeCategory": {
      const name = (input.name as string | undefined) ?? "";
      try {
        const result = await repo.createIncomeCategory(name);
        return { ok: true, result };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "create failed" };
      }
    }
    case "updateIncomeCategory": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const name = (input.name as string | undefined) ?? "";
      try {
        const result = await repo.updateIncomeCategory(id, name);
        if (!result) return { ok: false, status: 404, error: "not found" };
        return { ok: true, result };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "update failed" };
      }
    }
    case "deleteIncomeCategory": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      try {
        const deleted = await repo.deleteIncomeCategory(id);
        if (!deleted) return { ok: false, status: 404, error: "not found" };
        return { ok: true, result: { deleted } };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "delete failed" };
      }
    }
    case "createIncomeEntry": {
      try {
        const result = await repo.createIncomeEntry(
          input as Parameters<FootballTurfRepository["createIncomeEntry"]>[0],
        );
        return { ok: true, result };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "create failed" };
      }
    }
    case "updateIncomeEntry": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      try {
        const result = await repo.updateIncomeEntry(
          id,
          input as Parameters<FootballTurfRepository["updateIncomeEntry"]>[1],
        );
        if (!result) return { ok: false, status: 404, error: "not found" };
        return { ok: true, result };
      } catch (e) {
        return { ok: false, status: 409, error: e instanceof Error ? e.message : "update failed" };
      }
    }
    case "deleteIncomeEntry": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deleteIncomeEntry(id);
      return { ok: true, result: { deleted } };
    }
    case "createCustomer": {
      const result = await repo.createCustomer(input as Parameters<FootballTurfRepository["createCustomer"]>[0]);
      return { ok: true, result };
    }
    case "updateCustomer": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const result = await repo.updateCustomer(id, input as Parameters<FootballTurfRepository["updateCustomer"]>[1]);
      if (!result) return { ok: false, status: 404, error: "not found" };
      return { ok: true, result };
    }
    case "deleteCustomer": {
      if (id == null) return { ok: false, status: 400, error: "id required" };
      const deleted = await repo.deleteCustomer(id);
      return { ok: true, result: { deleted } };
    }
    default:
      return { ok: false, status: 400, error: "unknown op" };
  }
}
