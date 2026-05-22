import type { SmartPoliceA4PreviewModel } from "@/lib/smart-police/document-a4-preview";
import { cn } from "@/lib/cn";

const dottedUnderline =
  "border-b border-dotted border-slate-400 pb-0.5 min-h-[1.35em] text-[#1e293b]";

export function SmartPoliceStatementA4Sheet({
  model,
  className,
  printRootId,
}: {
  model: SmartPoliceA4PreviewModel;
  className?: string;
  printRootId?: string;
}) {
  const addr = [model.stationAddress, model.province].filter(Boolean).join(" ");

  return (
    <article
      id={printRootId}
      className={cn(
        "mx-auto w-full max-w-[210mm] bg-white text-[#111] shadow-md print:shadow-none",
        "px-[14mm] py-[16mm] text-[15px] leading-snug sm:text-[16px]",
        className,
      )}
    >
      <header className="grid grid-cols-[64px_1fr_120px] items-start gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-center text-[11px] text-slate-500"
          aria-hidden
        >
          โลโก้
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{model.stationName}</h1>
          {addr ? <p className="mt-0.5 text-[13px] text-slate-600">{addr}</p> : null}
          {model.commanderLine ? <p className="text-[13px] text-slate-600">{model.commanderLine}</p> : null}
        </div>
        <div className="text-right text-[12px] text-slate-600">
          เลขที่
          <br />
          <strong className="text-slate-800">{model.docRef}</strong>
        </div>
      </header>

      <div className="mt-4 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{model.documentTitle}</h2>
        <p className="mt-1 text-[14px] text-slate-600">{model.subtitle}</p>
        <p className="text-[14px] text-slate-600">เรื่อง {model.caseTitle}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
        {model.metaRows.map((row) => (
          <div key={row.label} className="min-w-0">
            <span className="block text-[14px] font-semibold text-slate-800">{row.label}</span>
            <span className={cn("mt-0.5 block text-[15px]", dottedUnderline)}>{row.value}</span>
          </div>
        ))}
      </div>

      <hr className="my-4 border-slate-300" />

      {model.preamble.map((line) => (
        <p key={line} className="text-center text-[13px] text-slate-500">
          {line}
        </p>
      ))}

      <table className="mt-3 w-full border-collapse text-[15px]">
        <thead>
          <tr className="bg-sky-100">
            <th className="w-12 border border-slate-700 px-2 py-1.5 text-center font-bold">ข้อ</th>
            <th className="border border-slate-700 px-2 py-1.5 text-center font-bold">รายละเอียดคำให้การ</th>
          </tr>
        </thead>
        <tbody>
          {model.statementItems.map((it) => {
            const text = it.text.trim();
            const empty = !text || /^[.\s…]+$/.test(text);
            return (
              <tr key={it.no}>
                <td className="border border-slate-700 px-2 py-2 text-center font-semibold">{it.no}</td>
                <td className="min-h-[2.5em] border border-slate-700 px-2 py-2 align-top">
                  {empty ? (
                    <span className="text-slate-400">…………………………………………………………………………………………………………</span>
                  ) : (
                    text
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 space-y-2 text-justify">
        {model.bodyParagraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {(model.signatures.length > 0
          ? model.signatures
          : [
              { caption: "ลงชื่อผู้ให้การ", nameLine: "……………………………………" },
              { caption: "ลงชื่อพนักงานสอบสวน", nameLine: "……………………………………" },
            ]
        ).map((s) => (
          <div key={s.caption}>
            <p>{s.caption}</p>
            <div className={cn("mt-2", dottedUnderline)} aria-hidden />
            <p className="mt-1 text-center">({s.nameLine})</p>
          </div>
        ))}
      </div>

      {model.dateLine ? <p className="mt-6 text-center">วันที่ {model.dateLine}</p> : null}

      {model.footer ? (
        <footer className="mt-6 border-t border-slate-300 pt-3 text-center text-[12px] text-slate-500">
          {model.footer}
        </footer>
      ) : null}
    </article>
  );
}

export function SmartPoliceGenericA4Sheet({
  model,
  className,
  printRootId,
}: {
  model: SmartPoliceA4PreviewModel;
  className?: string;
  printRootId?: string;
}) {
  const addr = [model.stationAddress, model.province].filter(Boolean).join(" ");

  return (
    <article
      id={printRootId}
      className={cn(
        "mx-auto w-full max-w-[210mm] bg-white text-[#111] shadow-md print:shadow-none",
        "px-[14mm] py-[16mm] text-[15px] leading-relaxed sm:text-[16px]",
        className,
      )}
    >
      <header className="text-center">
        <h1 className="text-lg font-bold sm:text-xl">{model.stationName}</h1>
        {addr ? <p className="text-[13px] text-slate-600">{addr}</p> : null}
      </header>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-bold">{model.documentTitle}</h2>
        <p className="text-[14px] text-slate-600">
          {model.kindLabel} · เลขที่ {model.docRef}
        </p>
      </div>
      <div className="mt-6 space-y-2 text-justify">
        {model.bodyParagraphs.map((p, i) => (
          <p key={`${i}-${p.slice(0, 24)}`}>{p}</p>
        ))}
      </div>
      {model.footer ? (
        <footer className="mt-8 border-t pt-3 text-center text-[12px] text-slate-500">{model.footer}</footer>
      ) : null}
    </article>
  );
}
