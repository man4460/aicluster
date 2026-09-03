import {
  ASSET_MODULE_SLUG,
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  FOOTBALL_TURF_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  DOC_TRANSMISSION_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  EDUCARE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  CLUB_EVENT_MODULE_SLUG,
  LMS_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  WAIT_QUEUE_MODULE_SLUG,
  APPOINTMENT_QUEUE_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  COMMUNITY_COOP_MODULE_SLUG,
} from "@/lib/modules/config";
import { resolveDataScopeBySlug, type ModuleDataScope } from "@/lib/trial/scope";

export function getDormitoryDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, DORMITORY_MODULE_SLUG);
}

export function getBarberDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, BARBER_MODULE_SLUG);
}

export function getMassageDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, MASSAGE_MODULE_SLUG);
}

export function getAttendanceDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, ATTENDANCE_MODULE_SLUG);
}

export function getCarWashDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, CAR_WASH_MODULE_SLUG);
}

export function getFootballTurfDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, FOOTBALL_TURF_MODULE_SLUG);
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

export function getClubEventDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, CLUB_EVENT_MODULE_SLUG);
}

export function getLmsDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, LMS_MODULE_SLUG);
}

export function getParkingDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, PARKING_MODULE_SLUG);
}

export function getWaitQueueDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, WAIT_QUEUE_MODULE_SLUG);
}

export function getAppointmentQueueDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, APPOINTMENT_QUEUE_MODULE_SLUG);
}

export function getLoyaltyStampDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, LOYALTY_STAMP_MODULE_SLUG);
}

export function getDrinkPosDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, DRINK_POS_MODULE_SLUG);
}

export function getHotelResortDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, HOTEL_RESORT_MODULE_SLUG);
}

export function getSchoolBankDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, SCHOOL_BANK_MODULE_SLUG);
}

export function getCommunityCoopDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, COMMUNITY_COOP_MODULE_SLUG);
}

export function getEducareDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, EDUCARE_MODULE_SLUG);
}

export function getAssetDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, ASSET_MODULE_SLUG);
}

export function getDocTransmissionDataScope(userId: string): Promise<ModuleDataScope> {
  return resolveDataScopeBySlug(userId, DOC_TRANSMISSION_MODULE_SLUG);
}
