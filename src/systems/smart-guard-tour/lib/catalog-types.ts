export type CatalogCheckpoint = {
  id: string;
  name: string;
  slug: string;
  zoneLabel: string | null;
  buildingLabel: string | null;
  floorLabel: string | null;
  lat: number | null;
  lng: number | null;
  geofenceRadiusM: number;
  coverImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  videoCount: number;
};

export type CatalogSchedule = {
  id: string;
  name: string;
  routeMode: string;
  intervalMinutes: number;
  checkpointCount: number;
  isActive: boolean;
};

export type CatalogIncident = {
  id: string;
  title: string;
  kind: string;
  status: string;
  severity: string;
  detail: string | null;
  checkpointName: string | null;
  staffName: string | null;
  contactName: string | null;
  imageCount: number;
  resolvedNote: string | null;
  createdAt: string;
};

export type CatalogContact = {
  id: string;
  displayName: string;
  phone: string | null;
  lineId: string | null;
  isActive: boolean;
};

export type CatalogAsset = {
  id: string;
  name: string;
  kind: string;
  assetCode: string | null;
  status: string;
};

export type CatalogTourLog = {
  id: string;
  status: string;
  entryOn: string;
  scannedAt: string | null;
  photoUrl: string | null;
  checkpointName: string;
  zoneLabel: string | null;
  staffName: string | null;
  scheduleName: string | null;
  scanLat: number | null;
  scanLng: number | null;
};

export type CatalogShift = {
  id: string;
  shiftOn: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  staffName: string;
  staffPhone: string | null;
  onDuty: boolean;
  /** สรุปค่าแรงจากกะที่จัดเวร (null ถ้ายังไม่ผูกเวร/ยังไม่คำนวณ) */
  clockMinutes: number | null;
  normalMinutes: number | null;
  otMinutes: number | null;
  totalBaht: number | null;
  weeklyNormalExceeded: boolean;
  missingHourlyRate: boolean;
  missingDuty: boolean;
  postName: string | null;
  templateName: string | null;
  templateHm: string | null;
};

export type CatalogLedger = {
  id: string;
  kind: string;
  title: string;
  amountBaht: number;
  entryOn: string;
  paymentMethod: string | null;
  slipImageUrl: string | null;
  categoryName: string | null;
  staffName: string | null;
  assetName: string | null;
};

export type SmartGuardCatalog = {
  today: string;
  month: string;
  checkpoints: CatalogCheckpoint[];
  schedules: CatalogSchedule[];
  incidents: CatalogIncident[];
  contacts: CatalogContact[];
  assets: CatalogAsset[];
  tourLogs: CatalogTourLog[];
  shifts: CatalogShift[];
  ledger: CatalogLedger[];
  financeSummary: {
    incomeBaht: number;
    expenseBaht: number;
    netBaht: number;
    entryCount: number;
  };
};

export const EMPTY_CATALOG: SmartGuardCatalog = {
  today: "",
  month: "",
  checkpoints: [],
  schedules: [],
  incidents: [],
  contacts: [],
  assets: [],
  tourLogs: [],
  shifts: [],
  ledger: [],
  financeSummary: { incomeBaht: 0, expenseBaht: 0, netBaht: 0, entryCount: 0 },
};
