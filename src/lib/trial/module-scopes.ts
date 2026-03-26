import {
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
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
