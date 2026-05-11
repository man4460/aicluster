export type InventoryWarehouseRow = {
  id: number;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type InventoryCategoryRow = {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type InventoryItemRow = {
  id: number;
  sku: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  imageUrl: string | null;
  note: string | null;
  isActive: boolean;
  /** สต๊อกรวมทุกคลัง (server side derived) */
  totalStock: number;
  /** สต๊อกแยกตามคลัง */
  stocks: { warehouseId: number; warehouseCode: string; warehouseName: string; quantity: number }[];
};

export type InventoryMovementType = "IN" | "OUT" | "TRANSFER" | "ADJUST";

export type InventoryMovementRow = {
  id: number;
  type: InventoryMovementType;
  itemId: number;
  itemSku: string;
  itemName: string;
  fromWarehouseId: number | null;
  fromWarehouseName: string | null;
  toWarehouseId: number | null;
  toWarehouseName: string | null;
  quantity: number;
  unitCost: number | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
};
