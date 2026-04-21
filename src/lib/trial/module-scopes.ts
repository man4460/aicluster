import {
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
} from "@/lib/modules/config";
import { resolveDataScopeBySlug, type ModuleDataScope } from "@/lib/trial/scope";

export function getDormitoryDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, DORMITORY_MODULE_SLUG);
}

export function getBarberDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, BARBER_MODULE_SLUG);
}

export function getAttendanceDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, ATTENDANCE_MODULE_SLUG);
}

export function getCarWashDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, CAR_WASH_MODULE_SLUG);
}

export function getMqttDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, MQTT_SERVICE_MODULE_SLUG);
}

export function getBuildingPosDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, BUILDING_POS_MODULE_SLUG);
}

export function getVillageDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, VILLAGE_MODULE_SLUG);
}

export function getLaundryDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, LAUNDRY_MODULE_SLUG);
}

export function getParkingDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, PARKING_MODULE_SLUG);
}
