"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

type QaKind = "ask" | "ans" | "cont";
type QaRow = { id: string; kind: QaKind; text: string };
type CaretTarget = "start" | "end" | number;
export type QaFocus = { row: number; offset: number };
export type QaFocusRequest = QaFocus & { nonce: number };

/** cont = ย่อหน้าที่ต่อมาจากหน้าก่อน (ไม่มีป้าย) */
const LABEL: Record<QaKind, string> = { ask: "ถาม", ans: "ตอบ", cont: "" };
const PLACEHOLDER: Record<QaKind, string> = { ask: "พิมพ์คำถาม…", ans: "พิมพ์คำตอบ…", cont: "" };
/** ไม่ใช้ \b — ภาษาไทยไม่นับเป็น word char */
const PREFIX_RE = /^\s*(ถาม|ตอบ)\s*(?:\d+\s*[.)]?)?[ \t]?/;
const DOT_ROWS = 48;
/** ความกว้างคอลัมน์ป้ายถาม/ตอบ — Tab ต้องย่อหน้าเท่านี้ */
const LABEL_COL = "10mm";

let seq = 0;
function newRowId(): string {
  seq += 1;
  return `qa-${Date.now().toString(36)}-${seq.toString(36)}`;
}

function parseQaText(value: string, emptyKind: QaKind = "ask"): QaRow[] {
  if (value === "") return [{ id: newRowId(), kind: emptyKind, text: "" }];
  const rows: QaRow[] = [];
  for (const line of value.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.match(PREFIX_RE);
    if (m) {
      rows.push({ id: newRowId(), kind: m[1] === "ถาม" ? "ask" : "ans", text: line.slice(m[0].length) });
      continue;
    }
    if (!line.trim()) {
      rows.push({ id: newRowId(), kind: "cont", text: "" });
      continue;
    }
    const last = rows[rows.length - 1];
    if (last) last.text = last.text ? `${last.text}\n${line}` : line;
    else rows.push({ id: newRowId(), kind: "cont", text: line });
  }
  return rows.length > 0 ? rows : [{ id: newRowId(), kind: emptyKind, text: "" }];
}

function serializeQaRows(rows: QaRow[]): string {
  if (rows.length === 1 && !rows[0].text.trim()) return "";
  return rows.map((r) => (r.kind === "cont" ? r.text : `${LABEL[r.kind]} ${r.text}`)).join("\n");
}

/** ป้ายสุดท้ายของข้อความหน้า (ถาม/ตอบ) — ใช้ต่อ Enter หลังย่อหน้าที่ไหลมาจากหน้าก่อน */
export function lastQaKind(text: string): "ask" | "ans" | null {
  const rows = parseQaText(text);
  for (let i = rows.length - 1; i >= 0; i--) {
    const k = rows[i].kind;
    if (k !== "cont" && (rows.length > 1 || rows[i].text.trim())) return k;
  }
  return null;
}

function textPosition(el: HTMLElement, offset: number): { node: Text; offset: number } | null {
  let left = offset;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const len = n.data.length;
    if (left < len) return { node: n, offset: left };
    left -= len;
  }
  return null;
}

/** จำนวนตัวอักษรต้นช่องที่ยังอยู่เหนือขอบล่าง limit (ตัดตรงจุดขึ้นบรรทัดจริง) */
function fitTextLength(el: HTMLElement, limit: number): number {
  const total = (el.textContent ?? "").length;
  const range = document.createRange();
  const charBottom = (i: number): number => {
    const pos = textPosition(el, i);
    if (!pos) return Number.NEGATIVE_INFINITY;
    range.setStart(pos.node, pos.offset);
    range.setEnd(pos.node, pos.offset + 1);
    const rects = range.getClientRects();
    return rects.length > 0 ? rects[0].bottom : Number.NEGATIVE_INFINITY;
  };
  let lo = 0;
  let hi = total;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (charBottom(mid - 1) <= limit) lo = mid;
    else hi = mid - 1;
  }
  return lo;
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
 * ถาม–ตอบแบบ Word — ป้ายคอลัมน์ซ้าย · ข้อความยาวขึ้นบรรทัดใหม่ตรงขอบช่องพิมพ์
 * Enter = ย่อหน้าใหม่ชิดซ้ายเสมอแนวป้ายถาม (ไม่มีป้าย) · กดป้ายซ้ายเพื่อสลับ ถาม/ตอบ/ว่าง
 * Shift+Enter = ขึ้นบรรทัดในแถวเดิม · Tab = ย่อหน้ากว้างเท่าคอลัมน์ถาม · Backspace ต้นแถว = รวมกับแถวก่อน
 */
export function StatementQaEditor({
  value,
  onChange,
  ariaLabel,
  minHeight,
  fill,
  lineHeight,
  fontSize,
  onOverflow,
  focusRequest,
  emptyKind = "ask",
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  minHeight: string;
  fill?: boolean;
  lineHeight: string;
  fontSize: string;
  /** แถวที่ล้นกรอบหน้า → ส่งต่อหน้าถัดไป (focus = แถว/ตำแหน่งเคอร์เซอร์ในข้อความที่ส่งต่อ) */
  onOverflow?: (text: string, focus: QaFocus | null) => void;
  focusRequest?: QaFocusRequest | null;
  /** คงไว้เพื่อ API เดิม — Enter ไม่สลับถาม/ตอบแล้ว */
  continuesKind?: "ask" | "ans" | null;
  /** ช่องว่างทั้งหน้า — ผู้ต้องหาใช้ cont (ไม่มีป้ายถาม) ให้พิมพ์อย่างอื่นก่อน */
  emptyKind?: QaKind;
}) {
  const [state, setState] = useState(() => ({ rows: parseQaText(value, emptyKind), source: value }));
  if (value !== state.source) {
    setState({ rows: parseQaText(value, emptyKind), source: value });
  }
  const rows = state.rows;
  /** handler อ่านแถวล่าสุดก่อน re-render — commit อัปเดตทันที */
  const rowsRef = useRef(rows);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<{ id: string; at: CaretTarget } | null>(null);
  const handledFocusNonce = useRef(0);
  const composing = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!focusRequest || focusRequest.nonce === handledFocusNonce.current) return;
    const row = rows[Math.min(focusRequest.row, rows.length - 1)];
    const el = row ? cellRefs.current.get(row.id) : undefined;
    if (!el) return;
    handledFocusNonce.current = focusRequest.nonce;
    setCaret(el, focusRequest.offset);
    el.scrollIntoView({ block: "nearest" });
  });

  function commit(next: QaRow[]) {
    rowsRef.current = next;
    const s = serializeQaRows(next);
    setState({ rows: next, source: s });
    onChange(s);
  }

  useLayoutEffect(() => {
    if (!onOverflow || composing.current) return;
    const box = boxRef.current;
    const group = groupRef.current;
    if (!box || !group) return;
    // เบราว์เซอร์เลื่อนกล่อง overflow-hidden ตามเคอร์เซอร์ได้ — ต้องอยู่ที่ 0 ก่อนวัด
    box.scrollTop = 0;
    const limit = box.getBoundingClientRect().top + box.clientHeight + 1;
    const rowEls = [...group.children];
    const cut = rowEls.findIndex((el) => el.getBoundingClientRect().bottom > limit);
    if (cut < 0) return;
    const list = rowsRef.current;
    const cur = list[cut];
    const cell = cur ? cellRefs.current.get(cur.id) : undefined;
    if (!cur || !cell) return;

    // ตัดย่อหน้าตรงบรรทัดสุดท้ายที่ยังพอดีหน้า — ส่วนที่เหลือต่อหน้าถัดไป (ไม่มีป้าย)
    const fit = fitTextLength(cell, limit);
    const active = document.activeElement;
    let kept: QaRow[];
    let moved: QaRow[];
    let focus: QaFocus | null = null;
    if (fit > 0 && fit < cur.text.length) {
      const head = cur.text.slice(0, fit);
      const tail = cur.text.slice(fit);
      const lead = tail.length - tail.replace(/^[ \t]+/, "").length;
      kept = [...list.slice(0, cut), { ...cur, text: head }];
      moved = [{ id: newRowId(), kind: "cont", text: tail.slice(lead) }, ...list.slice(cut + 1)];
      if (active === cell) {
        const off = caretOffset(cell);
        if (off >= fit) focus = { row: 0, offset: Math.max(0, off - fit - lead) };
      }
      cell.textContent = head;
    } else if (fit >= cur.text.length && cur.text.length > 0) {
      kept = list.slice(0, cut + 1);
      moved = list.slice(cut + 1);
    } else if (cut > 0) {
      kept = list.slice(0, cut);
      moved = list.slice(cut);
    } else {
      return;
    }
    if (moved.length === 0) return;
    moved.forEach((r, j) => {
      const el = cellRefs.current.get(r.id);
      if (el && el === active) focus = { row: j, offset: caretOffset(el) };
    });
    // ต้องวัด layout จริงก่อนจึงรู้ว่าล้น — อัปเดตใน layout effect โดยตั้งใจ (ไม่วน: แถวที่เหลือพอดีหน้าแล้ว)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    commit(kept);
    onOverflow(serializeQaRows(moved), focus);
  });

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
    const added: QaRow = { id: newRowId(), kind: "cont", text: after };
    const next = [...list];
    next[idx] = { ...cur, text: before };
    next.splice(idx + 1, 0, added);
    pendingFocus.current = { id: added.id, at: "start" };
    commit(next);
  }

  function cycleRowKind(idx: number) {
    const list = rowsRef.current;
    const cur = list[idx];
    if (!cur) return;
    const order: QaKind[] = ["ask", "ans", "cont"];
    const nextKind = order[(order.indexOf(cur.kind) + 1) % order.length] ?? "cont";
    commit(list.map((r, j) => (j === idx ? { ...r, kind: nextKind } : r)));
    focusRow(idx, "start");
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
      <div
        ref={boxRef}
        className={cn("absolute inset-0 overflow-x-hidden", onOverflow ? "overflow-y-hidden" : "overflow-y-auto")}
        onScroll={(e) => {
          if (onOverflow && e.currentTarget.scrollTop !== 0) e.currentTarget.scrollTop = 0;
        }}
      >
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
          <div ref={groupRef} role="group" aria-label={ariaLabel} className="relative">
            {rows.map((row, idx) => {
              const isCont = row.kind === "cont";
              return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isCont ? "minmax(0, 1fr)" : `${LABEL_COL} minmax(0, 1fr)`,
                  alignItems: "start",
                }}
              >
                {isCont ? null : (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`ป้าย${LABEL[row.kind]} แถวที่ ${idx + 1} — กดเพื่อเปลี่ยน`}
                    title="กดเพื่อเปลี่ยนป้าย"
                    style={{
                      appearance: "none",
                      border: 0,
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      width: "100%",
                      font: "inherit",
                      fontSize,
                      lineHeight,
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => cycleRowKind(idx)}
                  >
                    {LABEL[row.kind]}
                  </button>
                )}
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
                  aria-label={`${LABEL[row.kind] || "ย่อหน้า"} แถวที่ ${idx + 1}`}
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
                    tabSize: LABEL_COL,
                    color: "#111",
                  }}
                  onKeyDown={(e) => onCellKeyDown(e, idx)}
                  onBeforeInput={(e) => onCellBeforeInput(e, idx)}
                  onPaste={(e) => onCellPaste(e, idx)}
                  onInput={(e) => syncText(row.id, e.currentTarget)}
                  onCompositionStart={() => {
                    composing.current = true;
                  }}
                  onCompositionEnd={(e) => {
                    composing.current = false;
                    syncText(row.id, e.currentTarget);
                  }}
                />
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
