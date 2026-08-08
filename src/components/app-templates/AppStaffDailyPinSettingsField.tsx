"use client";

type Props = {
  fieldClassName?: string;
  /** มีรหัสตั้งไว้แล้วหรือไม่ (ไม่โชว์รหัสจริง) */
  pinSet: boolean;
  pinDraft: string;
  onPinDraftChange: (v: string) => void;
  clearPin: boolean;
  onClearPinChange: (v: boolean) => void;
  disabled?: boolean;
};

/** ช่องตั้งรหัสเข้าลิงก์พนักงานรายวัน — ในฟอร์มตั้งค่าร้าน */
export function AppStaffDailyPinSettingsField({
  fieldClassName = "app-input mt-1 w-full rounded-xl",
  pinSet,
  pinDraft,
  onPinDraftChange,
  clearPin,
  onClearPinChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-2 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 ring-1 ring-amber-200/40">
      <div>
        <p className="text-xs font-bold text-[#4d47b6]">รหัสเข้าลิงก์พนักงาน (รายวัน)</p>
        <p className="mt-0.5 text-[11px] font-medium text-[#66638c]">
          พนักงานต้องใส่รหัสนี้ทุกวันเมื่อเปิดลิงก์ · ว่าง = ไม่บังคับรหัส
        </p>
      </div>
      {pinSet ? (
        <p className="text-xs font-semibold text-emerald-800">ตั้งรหัสแล้ว — กรอกรหัสใหม่เพื่อเปลี่ยน</p>
      ) : (
        <p className="text-xs font-medium text-[#8b87b8]">ยังไม่ได้ตั้งรหัส</p>
      )}
      <label className="block space-y-1">
        <span className="text-xs font-bold text-[#4d47b6]">
          {pinSet ? "รหัสใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "ตั้งรหัส (4–32 ตัว)"}
        </span>
        <input
          type="password"
          autoComplete="new-password"
          className={fieldClassName}
          value={pinDraft}
          disabled={disabled || clearPin}
          onChange={(e) => onPinDraftChange(e.target.value)}
          placeholder={pinSet ? "••••••••" : "เช่น 1234"}
        />
      </label>
      {pinSet ? (
        <label className="flex items-center gap-2 text-xs font-semibold text-rose-700">
          <input
            type="checkbox"
            checked={clearPin}
            disabled={disabled}
            onChange={(e) => {
              onClearPinChange(e.target.checked);
              if (e.target.checked) onPinDraftChange("");
            }}
          />
          ล้างรหัส (ไม่บังคับใส่เมื่อเปิดลิงก์)
        </label>
      ) : null}
    </div>
  );
}

export function staffDailyPinPatchBody(opts: {
  pinDraft: string;
  clearPin: boolean;
}): { staffDailyPin?: string; staffDailyPinClear?: boolean } {
  if (opts.clearPin) return { staffDailyPinClear: true };
  const pin = opts.pinDraft.trim();
  if (!pin) return {};
  return { staffDailyPin: pin };
}
