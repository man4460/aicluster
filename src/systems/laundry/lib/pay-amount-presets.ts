import {
  formatBarberPayAmountPresetsInput,
  parseBarberPayAmountPresets,
  serializeBarberPayAmountPresets,
} from "@/systems/barber/lib/pay-amount-presets";

export {
  formatBarberPayAmountPresetsInput as formatLaundryPayAmountPresetsInput,
  parseBarberPayAmountPresets as parseLaundryPayAmountPresets,
  serializeBarberPayAmountPresets as serializeLaundryPayAmountPresets,
};

export const DEFAULT_LAUNDRY_PAY_AMOUNT_PRESETS = [80, 100, 120, 150] as const;
