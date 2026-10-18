"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type QaKind = "ask" | "ans";
type QaRow = { id: string; kind: QaKind; text: string };
type CaretTarget = "start" | "end" | number;

const LABEL: Record<QaKind, string> = { ask: "ถาม", ans: "ตอบ" };
const PLACEHOLDER: Record<QaKind, string> = { ask: "พิมพ์คำถาม…", ans: "พิมพ์คำตอบ…" };
/** ไม่ใช้ \b — ภาษาไทยไม่นับเป็น word char */
const PREFIX_RE = /^\s*(ถาม|ตอบ)\s*(?:\d+\s*[.)]?)?[ \t]?/;
const DOT_ROWS = 48;

let seq = 0;
function newRowId(): string {
  seq += 1;
  return `qa-${Date.now().toString(36)}-${seq.toString(36)}`;
}

function parseQaText(value: string): QaRow[] {
  const rows: QaRow[] = [];
  for (const line of value.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.match(PREFIX_RE);
    if (m) {
      rows.push({ id: newRowId(), kind: m[1] === "ถาม" ? "ask" : "ans", text: line.slice(m[0].length) });
      continue;
    }
    if (!line.trim()) continue;
    const last = rows[rows.length - 1];
    if (last) last.text = last.text ? `${last.text}\n${line}` : line;
    else rows.push({ id: newRowId(), kind: "ask", text: line });
  }
  return rows.length > 0 ? rows : [{ id: newRowId(), kind: "ask", text: "" }];
}

function serializeQaRows(rows: QaRow[]): string {
  if (rows.length === 1 && rows[0].kind === "ask" && !rows[0].text.trim()) return "";
  return rows.map((r) => `${LABEL[r.kind]} ${r.text}`).join("\n");
}

function caretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer)) return 0;
  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(r.startContainer, r.startOffset);
  return pre.toString().length;
}

function setCaret(el: HTMLElement, at: CaretTarget) {
  el.focus({ preventScroll: true });
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  if (at === "start" || at === "end") {
    range.selectNodeContents(el);
    range.collapse(at === "start");
  } else {
    let left = at;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let placed = false;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const len = n.textContent?.length ?? 0;
      if (left <= len) {
        range.setStart(n, left);
        range.collapse(true);
        placed = true;
        break;
      }
      left -= len;
    }
    if (!placed) {
      range.selectNodeContents(el);
      range.collapse(false);
    }
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

function insertPlainText(el: HTMLElement, text: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * ถาม–ตอบแบบ Word — ป้ายคอลัมน์ซ้ายคงที่ · ข้อความยาวขึ้นบรรทัดใหม่ตรงขอบช่องพิมพ์
 * Enter = แถวใหม่สลับ ถาม/ตอบ · Shift+Enter = ขึ้นบรรทัดในแถวเดิม · Tab = ย่อหน้า
 * Backspace ต้นแถว = รวมกับแถวก่อน
 */
export function StatementQaEditor({
  value,
  onChange,
  ariaLabel,
  minHeight,
  fill,
  lineHeight,
  fontSize,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  minHeight: string;
  fill?: boolean;
  lineHeight: string;
  fontSize: string;
}) {
  const [state, setState] = useState(() => ({ rows: parseQaText(value), source: value }));
  if (value !== state.source) {
    setState({ rows: parseQaText(value), source: value });
  }
  const rows = state.rows;
  /** handler อ่านแถวล่าสุดก่อน re-render — commit อัปเดตทันที */
  const rowsRef = useRef(rows);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<{ id: string; at: CaretTarget } | null>(null);

  useLayoutEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useLayoutEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    const el = cellRefs.current.get(p.id);
    if (!el) return;
    pendingFocus.current = null;
    setCaret(el, p.at);
  });

  function commit(next: QaRow[]) {
    rowsRef.current = next;
    const s = serializeQaRows(next);
    setState({ rows: next, source: s });
    onChange(s);
  }

  function syncText(id: string, el: HTMLElement) {
    const text = el.textContent ?? "";
    commit(rowsRef.current.map((r) => (r.id === id ? { ...r, text } : r)));
  }

  function splitRow(idx: number, el: HTMLElement) {
    const list = rowsRef.current;
    const cur = list[idx];
    const full = el.textContent ?? "";
    const off = Math.min(caretOffset(el), full.length);
    const before = full.slice(0, off);
    const after = full.slice(off).replace(/^[ \t]+/, "");
    el.textContent = before;
    const added: QaRow = { id: newRowId(), kind: cur.kind === "ask" ? "ans" : "ask", text: after };
    const next = [...list];
    next[idx] = { ...cur, text: before };
    next.splice(idx + 1, 0, added);
    pendingFocus.current = { id: added.id, at: "start" };
    commit(next);
  }

  function mergeWithPrev(idx: number, el: HTMLElement) {
    const list = rowsRef.current;
    const prev = list[idx - 1];
    const curText = el.textContent ?? "";
    const next = [...list];
    next[idx - 1] = { ...prev, text: prev.text + curText };
    next.splice(idx, 1);
    pendingFocus.current = { id: prev.id, at: prev.text.length };
    commit(next);
  }

  function focusRow(idx: number, at: CaretTarget) {
    const row = rowsRef.current[idx];
    const el = row ? cellRefs.current.get(row.id) : undefined;
    if (el) setCaret(el, at);
  }

  function onCellKeyDown(e: KeyboardEvent<HTMLDivElement>, idx: number) {
    if (e.nativeEvent.isComposing) return;
    const el = e.currentTarget;
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        insertPlainText(el, "\n");
        syncText(rowsRef.current[idx].id, el);
      } else {
        splitRow(idx, el);
      }
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (!e.shiftKey) {
        insertPlainText(el, "\t");
        syncText(rowsRef.current[idx].id, el);
      }
      return;
    }
    const sel = window.getSelection();
    const collapsed = !!sel && sel.isCollapsed;
    if (e.key === "Backspace" && idx > 0 && collapsed && caretOffset(el) === 0) {
      e.preventDefault();
      mergeWithPrev(idx, el);
      return;
    }
    if (e.key === "ArrowUp" && idx > 0 && collapsed && caretOffset(el) === 0) {
      e.preventDefault();
      focusRow(idx - 1, "end");
      return;
    }
    if (
      e.key === "ArrowDown" &&
      idx < rowsRef.current.length - 1 &&
      collapsed &&
      caretOffset(el) === (el.textContent ?? "").length
    ) {
      e.preventDefault();
      focusRow(idx + 1, "start");
    }
  }

  function onCellBeforeInput(e: FormEvent<HTMLDivElement>, idx: number) {
    const inputType = (e.nativeEvent as InputEvent).inputType;
    if (inputType === "insertParagraph") {
      e.preventDefault();
      splitRow(idx, e.currentTarget);
    } else if (inputType === "insertLineBreak") {
      e.preventDefault();
      insertPlainText(e.currentTarget, "\n");
      syncText(rowsRef.current[idx].id, e.currentTarget);
    }
  }

  function onCellPaste(e: ClipboardEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r\n/g, "\n");
    if (!text) return;
    insertPlainText(e.currentTarget, text);
    syncText(rowsRef.current[idx].id, e.currentTarget);
  }

  return (
    <div
      className="relative w-full"
      style={{ minHeight, flex: fill ? "1 1 auto" : undefined, marginBottom: "2mm" }}
    >
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
        <div
          className="relative"
          style={{ minHeight: "100%", cursor: "text" }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest("[data-qa-lines]")) return;
            e.preventDefault();
            focusRow(rowsRef.current.length - 1, "end");
          }}
        >
          <div data-qa-lines className="absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: DOT_ROWS }, (_, i) => (
              <div
                key={i}
                style={{ height: lineHeight, boxSizing: "border-box", borderBottom: "0.5pt dotted #111" }}
              />
            ))}
          </div>
          <div role="group" aria-label={ariaLabel} className="relative">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                style={{ display: "grid", gridTemplateColumns: "10mm minmax(0, 1fr)", alignItems: "start" }}
              >
                <span
                  aria-hidden
                  style={{ fontSize, lineHeight, userSelect: "none" }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    focusRow(idx, "start");
                  }}
                >
                  {LABEL[row.kind]}
                </span>
                <div
                  ref={(el) => {
                    if (!el) {
                      cellRefs.current.delete(row.id);
                      return;
                    }
                    cellRefs.current.set(row.id, el);
                    if (document.activeElement !== el && el.textContent !== row.text) {
                      el.textContent = row.text;
                    }
                  }}
                  role="textbox"
                  aria-multiline
                  aria-label={`${LABEL[row.kind]} แถวที่ ${idx + 1}`}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  data-placeholder={PLACEHOLDER[row.kind]}
                  data-empty={row.text === "" ? "true" : undefined}
                  className="sp-qa-cell outline-none"
                  style={{
                    fontSize,
                    lineHeight,
                    minHeight: lineHeight,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    tabSize: 8,
                    color: "#111",
                  }}
                  onKeyDown={(e) => onCellKeyDown(e, idx)}
                  onBeforeInput={(e) => onCellBeforeInput(e, idx)}
                  onPaste={(e) => onCellPaste(e, idx)}
                  onInput={(e) => syncText(row.id, e.currentTarget)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
