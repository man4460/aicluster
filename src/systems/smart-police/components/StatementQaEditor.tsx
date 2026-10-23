"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type QaKind = "ask" | "ans" | "cont" | "body" | "para";
type QaRow = { id: string; kind: QaKind; text: string };
type CaretTarget = "start" | "end" | number;
export type QaFocus = { row: number; offset: number };
export type QaFocusRequest = QaFocus & { nonce: number };

/** cont = Enter ชิดซ้าย · body = รายละเอียด 1 tab ทั้งก้อน · para = ย่อหน้า บรรทัดแรก 2 tab / ห่อ 1 tab */
const LABEL: Record<QaKind, string> = { ask: "ถาม", ans: "ตอบ", cont: "", body: "", para: "" };
const PLACEHOLDER: Record<QaKind, string> = {
  ask: "พิมพ์คำถาม…",
  ans: "พิมพ์คำตอบ…",
  cont: "",
  body: "พิมพ์รายละเอียด…",
  para: "",
};
/** ป้ายถาม/ตอบ ชิดซ้ายสุด — ไม่กิน Tab นำหน้า */
const PREFIX_RE = /^(ถาม|ตอบ)(?:\s*\d+\s*[.)]?)?[ \t]/;
const DOT_ROWS = 48;
/** 1 tab = คอลัมน์รายละเอียดหลังถาม/ตอบ */
const LABEL_COL = "12mm";

let seq = 0;
function newRowId(): string {
  seq += 1;
  return `qa-${Date.now().toString(36)}-${seq.toString(36)}`;
}

function parseQaText(value: string, emptyKind: QaKind = "ask"): QaRow[] {
  if (value === "") return [{ id: newRowId(), kind: emptyKind, text: "" }];
  const rows: QaRow[] = [];
  for (const line of value.replace(/\r\n/g, "\n").split("\n")) {
    const prefix = line.match(PREFIX_RE);
    if (prefix) {
      rows.push({
        id: newRowId(),
        kind: prefix[1] === "ถาม" ? "ask" : "ans",
        text: line.slice(prefix[0].length),
      });
      continue;
    }
    if (line.startsWith("\t\t")) {
      const text = line.slice(2);
      const last = rows[rows.length - 1];
      if (last?.kind === "para") last.text = last.text ? `${last.text}\n${text}` : text;
      else rows.push({ id: newRowId(), kind: "para", text });
      continue;
    }
    if (line.startsWith("\t")) {
      const text = line.slice(1);
      const last = rows[rows.length - 1];
      if (last?.kind === "body") last.text = last.text ? `${last.text}\n${text}` : text;
      else rows.push({ id: newRowId(), kind: "body", text });
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
  if (rows.length === 1 && !rows[0].text.trim() && rows[0].kind !== "body" && rows[0].kind !== "para") return "";
  return rows
    .map((r) => {
      if (r.kind === "para") return `\t\t${r.text}`;
      if (r.kind === "body") return `\t${r.text}`;
      if (r.kind === "cont") return r.text;
      return `${LABEL[r.kind]} ${r.text}`;
    })
    .join("\n");
}

/** ป้ายสุดท้ายของข้อความหน้า (ถาม/ตอบ) — ใช้ต่อ Enter หลังย่อหน้าที่ไหลมาจากหน้าก่อน */
export function lastQaKind(text: string): "ask" | "ans" | null {
  const rows = parseQaText(text);
  for (let i = rows.length - 1; i >= 0; i--) {
    const k = rows[i].kind;
    if ((k === "ask" || k === "ans") && (rows.length > 1 || rows[i].text.trim())) return k;
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

/** ท้ายคำให้การ — ต่อจากแถวถาม–ตอบสุดท้าย · ป้ายตามบทบาท */
export function StatementReadbackSignOff({
  roleLabel,
  signParty,
  signOfficer,
  onSignParty,
  onSignOfficer,
  lineHeight,
  fontSize,
}: {
  roleLabel: string;
  signParty: string;
  signOfficer: string;
  onSignParty: (v: string) => void;
  onSignOfficer: (v: string) => void;
  lineHeight: string;
  fontSize: string;
}) {
  const row: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: "1.5mm",
    minHeight: lineHeight,
    lineHeight,
    fontSize,
    width: "100%",
    margin: 0,
  };
  const inputStyle: CSSProperties = {
    minWidth: 0,
    width: "100%",
    fontSize: "inherit",
    lineHeight: "inherit",
    height: "auto",
    paddingBottom: "1px",
  };
  return (
    <div>
      <p style={{ margin: 0, textAlign: "center", fontSize, lineHeight }}>
        อ่านให้ฟังแล้วรับว่าเป็นความจริงถูกต้อง
      </p>
      <div style={{ width: "72%", marginLeft: "auto" }}>
        <div style={row}>
          <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
          <input
            aria-label={`ลงชื่อ${roleLabel}`}
            value={signParty}
            onChange={(e) => onSignParty(e.target.value)}
            spellCheck={false}
            className="sp-word-field min-w-0 flex-1 align-baseline"
            style={inputStyle}
          />
          <span style={{ flexShrink: 0 }}>{roleLabel}</span>
        </div>
        <div style={row}>
          <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
          <input
            aria-label="ลงชื่อพงส. บันทึก อ่าน"
            value={signOfficer}
            onChange={(e) => onSignOfficer(e.target.value)}
            spellCheck={false}
            className="sp-word-field min-w-0 flex-1 align-baseline"
            style={inputStyle}
          />
          <span style={{ flexShrink: 0 }}>พงส./บันทึก/อ่าน</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ถาม–ตอบแบบ Word
 * รายละเอียด (ถาม/ตอบ + ห่อบรรทัด + ไหลหน้า 2) = เยื้อง 1 tab ทั้งก้อน
 * Enter = ชิดซ้ายสุด · พิมพ์ถาม/ตอบ แล้ว Tab · Tab 1 = รายละเอียด · Tab 2 = ย่อหน้าแบบ Word
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
  footer,
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
  /** ต่อท้ายแถวถาม–ตอบสุดท้าย (เช่น อ่านให้ฟังแล้ว · ลงชื่อ) */
  footer?: ReactNode;
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
  const footerRef = useRef<HTMLDivElement>(null);

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
    const footerH = footerRef.current?.getBoundingClientRect().height ?? 0;
    const limit = box.getBoundingClientRect().top + box.clientHeight - footerH + 1;
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
      const body = tail.slice(lead);
      const hanging = cur.kind === "ask" || cur.kind === "ans" || cur.kind === "body" || cur.kind === "para";
      kept = [...list.slice(0, cut), { ...cur, text: head }];
      moved = [{ id: newRowId(), kind: hanging ? "body" : "cont", text: body }, ...list.slice(cut + 1)];
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
    const list = rowsRef.current;
    const idx = list.findIndex((r) => r.id === id);
    const row = idx >= 0 ? list[idx] : undefined;
    if (row && (row.kind === "cont" || row.kind === "body" || row.kind === "para")) {
      const prefix = text.match(PREFIX_RE);
      if (prefix) {
        const kind: QaKind = prefix[1] === "ถาม" ? "ask" : "ans";
        const rest = text.slice(prefix[0].length);
        el.textContent = rest;
        pendingFocus.current = { id, at: "start" };
        commit(list.map((r, j) => (j === idx ? { ...r, kind, text: rest } : r)));
        return;
      }
    }
    commit(list.map((r) => (r.id === id ? { ...r, text } : r)));
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
    const nextKind =
      cur.kind === "body" || cur.kind === "para" || cur.kind === "cont"
        ? "ask"
        : (order[(order.indexOf(cur.kind) + 1) % order.length] ?? "cont");
    commit(list.map((r, j) => (j === idx ? { ...r, kind: nextKind } : r)));
    focusRow(idx, "start");
  }

  function patchRow(idx: number, kind: QaKind, text: string, caret: CaretTarget) {
    const list = rowsRef.current;
    const cur = list[idx];
    if (!cur) return;
    const el = cellRefs.current.get(cur.id);
    if (el && el.textContent !== text) el.textContent = text;
    pendingFocus.current = { id: cur.id, at: caret };
    commit(list.map((r, j) => (j === idx ? { ...r, kind, text } : r)));
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
      const row = rowsRef.current[idx];
      const off = caretOffset(el);
      const atStart = off === 0 && !!window.getSelection()?.isCollapsed;
      if (e.shiftKey) {
        if (atStart && row.kind === "para") patchRow(idx, "body", row.text, "start");
        else if (atStart && row.kind === "body") patchRow(idx, "cont", row.text, "start");
        return;
      }
      if (atStart && row.kind === "cont" && !row.text.startsWith("\t")) {
        patchRow(idx, "body", row.text, "start");
        return;
      }
      if (atStart && row.kind === "body") {
        patchRow(idx, "para", row.text, "start");
        return;
      }
      insertPlainText(el, "\t");
      syncText(row.id, el);
      return;
    }
    const sel = window.getSelection();
    const collapsed = !!sel && sel.isCollapsed;
    if (e.key === "Backspace" && collapsed && caretOffset(el) === 0) {
      const row = rowsRef.current[idx];
      if (row.kind === "para") {
        e.preventDefault();
        patchRow(idx, "body", row.text, "start");
        return;
      }
      if (row.kind === "body") {
        e.preventDefault();
        patchRow(idx, "cont", row.text, "start");
        return;
      }
      if (idx > 0) {
        e.preventDefault();
        mergeWithPrev(idx, el);
      }
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
              const hanging = row.kind !== "cont";
              const para = row.kind === "para";
              return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: hanging ? `${LABEL_COL} minmax(0, 1fr)` : "minmax(0, 1fr)",
                  alignItems: "start",
                }}
              >
                {row.kind === "cont" ? null : (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={
                      row.kind === "body" || row.kind === "para"
                        ? `รายละเอียดแถวที่ ${idx + 1} — กดเพื่อใส่ป้ายถาม`
                        : `ป้าย${LABEL[row.kind]} แถวที่ ${idx + 1} — กดเพื่อเปลี่ยน`
                    }
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
                  aria-label={`${LABEL[row.kind] || (row.kind === "para" ? "ย่อหน้า" : row.kind === "body" ? "รายละเอียด" : "ย่อหน้า")} แถวที่ ${idx + 1}`}
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
                    textIndent: para ? LABEL_COL : undefined,
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
          {footer ? (
            <div ref={footerRef} data-qa-footer style={{ position: "relative", zIndex: 1 }}>
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
