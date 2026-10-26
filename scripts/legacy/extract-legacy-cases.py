"""ดึงโครงสร้างคดีจากเอกสาร Word 97-2003 (.doc) ของฐานคดีเก่า

ที่มา: D:\\Data\\14-พฤศจิกายน-2555 (48 คดี / 332 ไฟล์)
วิธีการ: olefile อ่าน stream WordDocument + piece table (CLX) แล้ว decode เป็นข้อความ
        ไม่ต้องพึ่ง Microsoft Word / LibreOffice

ผลลัพธ์: tmp/legacy/cases.json
    [{ stamp, caseNo, caseType, chargeText, lawRefs, docKinds[],
       complainants[], suspects[], witnesses[], evidence[], summary }]

ใช้: python scripts/legacy/extract-legacy-cases.py [--src DIR] [--out FILE]
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import re
import sys

import olefile

DEFAULT_SRC = r"D:\Data\14-พฤศจิกายน-2555"
DEFAULT_OUT = os.path.join("tmp", "legacy", "cases.json")


def read_docx_text(path: str) -> str:
    """.docx ที่ตั้งนามสกุลผิดเป็น .doc (พบ 145 ไฟล์ในฐานคดีเก่า)"""
    import zipfile
    from xml.etree import ElementTree as ET

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    lines = []
    for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        parts = []
        for node in p.iter():
            tag = node.tag.split("}")[-1]
            if tag == "t" and node.text:
                parts.append(node.text)
            elif tag == "tab":
                parts.append("\t")
            elif tag in ("br", "cr"):
                parts.append("\n")
        lines.append("".join(parts))
    del ns
    return "\n".join(lines)


def read_any_doc_text(path: str) -> str:
    with open(path, "rb") as fh:
        head = fh.read(8)
    if head.startswith(b"PK"):
        try:
            return read_docx_text(path)
        except Exception:  # noqa: BLE001
            return ""
    return read_doc_text(path)


# ---------------------------------------------------------------- .doc reader
def read_doc_text(path: str) -> str:
    ole = olefile.OleFileIO(path)
    try:
        wd = ole.openstream("WordDocument").read()
        flags = int.from_bytes(wd[0x0A:0x0C], "little")
        table_name = "1Table" if (flags & 0x0200) else "0Table"
        if not ole.exists(table_name):
            table_name = "1Table" if ole.exists("1Table") else "0Table"
        table = ole.openstream(table_name).read()

        fc_clx = int.from_bytes(wd[0x01A2:0x01A6], "little")
        lcb_clx = int.from_bytes(wd[0x01A6:0x01AA], "little")
        clx = table[fc_clx:fc_clx + lcb_clx]

        i = 0
        plc = None
        while i < len(clx):
            kind = clx[i]
            if kind == 0x01:  # Prc
                cb = int.from_bytes(clx[i + 1:i + 3], "little")
                i += 3 + cb
            elif kind == 0x02:  # Pcdt
                lcb = int.from_bytes(clx[i + 1:i + 5], "little")
                plc = clx[i + 5:i + 5 + lcb]
                break
            else:
                break
        if plc is None:
            return ""

        n = (len(plc) - 4) // 12
        cps = [int.from_bytes(plc[j * 4:j * 4 + 4], "little") for j in range(n + 1)]
        base = (n + 1) * 4
        out = []
        for j in range(n):
            off = base + j * 8
            fc_raw = int.from_bytes(plc[off + 2:off + 6], "little")
            compressed = bool(fc_raw & 0x40000000)
            fc = fc_raw & 0x3FFFFFFF
            cch = cps[j + 1] - cps[j]
            if compressed:
                fc //= 2
                out.append(wd[fc:fc + cch].decode("cp1252", errors="replace"))
            else:
                out.append(wd[fc:fc + cch * 2].decode("utf-16le", errors="replace"))
        text = "".join(out)
    finally:
        ole.close()
    return text.replace("\r", "\n").replace("\x07", "\t").replace("\x0b", "\n")


# ---------------------------------------------------------------- classification
CASE_CATEGORY_KEYWORDS = {
    "คดีจราจร": ["จราจร", "เฉี่ยวชน", "ผิวทาง", "ทางแยก", "รอยห้ามล้อ", "ขับรถโดยประมาท"],
    "คดียาเสพติด": ["ยาเสพติด", "ยาบ้า", "ยาไอซ์", "ไอซ์", "เมทแอมเฟตามีน", "กัญชา", "ปัสสาวะ"],
    "คดีทรัพย์": ["ลักทรัพย์", "วิ่งราว", "ชิงทรัพย์", "ปล้นทรัพย์", "รับของโจร", "บุกรุก", "ทรัพย์ถูกประทุษร้าย"],
    "คดีชีวิตและร่างกาย": ["ทำร้ายร่างกาย", "ฆ่าผู้อื่น", "พยายามฆ่า", "ทำร้าย", "ชกต่อย"],
    "คดีอาวุธปืน": ["อาวุธปืน", "เครื่องกระสุน", "ใบอนุญาตปืน"],
    "คดีเด็กและเยาวชน": ["สถานพินิจ", "ผู้เยาว์", "ฟื้นฟู"],
}

# เอกสาร -> kind ที่ระบบรู้จัก (จับคู่กับ slug ใน official-form-catalog)
DOC_KIND_PATTERNS = [
    ("scene-inspect", r"บันทึกตรวจ(?:ที่เกิดเหตุ|สถานที่เกิดเหตุ)"),
    ("scene-map", r"แผนที่เกิดเหตุ"),
    ("case-photo", r"ภาพประกอบคดี"),
    ("arrest-record", r"บันทึกการจับกุม"),
    ("charge-notice", r"บันทึกมอบตัวแจ้งข้อหา|บันทึกแจ้งข้อหา"),
    ("custody-log", r"บันทึกการควบคุม"),
    ("case-cover", r"ปกและบันทึกตรวจสำนวน"),
    ("inquiry-report", r"รายงานการสอบสวน"),
    ("inquiry-docket", r"บัญชีสำนวนการสอบสวน"),
    ("inquiry-memo", r"บันทึกพนักงานสอบสวน"),
    ("property-list", r"บัญชีของกลาง|บัญชีทรัพย์ถูกประทุษร้าย"),
    ("witness-summons", r"หมายเรียกพยาน"),
    ("suspect-summons", r"หมายเรียกผู้ต้องหา"),
    ("arrest-warrant-request", r"คำร้องขอหมายจับ"),
    ("arrest-warrant", r"หมายจับและตำหนิ"),
    ("detention-request", r"คำร้องฝากขังครั้งที่1|คำร้องผัดฟ้องครั้งที่1"),
    ("detention-round2", r"คำร้องฝากขังครั้งที่2"),
    ("bail-bond", r"สัญญาประกัน"),
    ("compensation-settlement", r"บันทึกชดใช้ค่าเสียหาย"),
    ("forensic-request", r"หนังสือส่ง(?:ตรวจปัสสาวะ|ปืนเครื่องกระสุนปืนตรวจ|ยาเสพติดตรวจ|ผู้บาดเจ็บหรือศพตรวจ|สำนวน)"),
    ("injury-referral", r"หนังสือส่ผู้บาดเจ็บหรือศพตรวจ"),
    ("case-progress", r"แจ้งความคืบหน้า"),
    ("official-memo", r"หนังสือ(?:แจ้ง|ส่ง)"),
    ("interesting-case-report", r"รายงานคดีน่าสนใจ"),
]

PERSON_PREFIX = r"(?:นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.|ร\.ต\.ท\.|พ\.ต\.ท\.|ส\.ต\.ท\.|ร\.ต\.อ\.|พ\.ต\.อ\.|ส\.ต\.อ\.|จ\.ส\.ต\.|ว่าที่|ร\.ต\.ท|พ\.ต\.ต\.)"
PERSON_RE = re.compile(PERSON_PREFIX + r"[^\t\n,()]{2,60}")
# ข้อความที่ไม่ใช่ชื่อบุคคล
NON_NAME = re.compile(
    r"(ลงชื่อ|สอบสวน|พิมพ์|บันทึก|เพิ่มเติม|ครั้งที่|สภ\.|สถานี|ตำรวจ|ผู้ต้องหา|ผู้กล่าวหา|พยาน|"
    r"อาชีพ|ที่อยู่|อายุ|เชื้อชาติ|สัญชาติ|หมายเลข|โทร|SmartPolice|ฉบับที่|หน้า)"
)


def clean_names(seq, limit: int = 12) -> list[str]:
    seen = set()
    out = []
    for raw in seq:
        key = re.sub(r"[\s\u0001]+", " ", raw).strip(" .\t-")
        key = re.sub(r"\d+\s*$", "", key).strip()
        if len(key) < 4 or key in seen or NON_NAME.search(key):
            continue
        if not re.fullmatch(r"[^\d]{0,60}", key) and len(re.findall(r"\d", key)) > 0:
            continue
        seen.add(key)
        out.append(key)
        if len(out) >= limit:
            break
    return out


def classify_category(text: str) -> tuple[str, dict[str, int]]:
    score = collections.Counter()
    for cat, kws in CASE_CATEGORY_KEYWORDS.items():
        for kw in kws:
            score[cat] += text.count(kw)
    best = score.most_common(1)
    if not best or best[0][1] == 0:
        return "คดีอาญา", dict(score)
    return best[0][0], dict(score)


def doc_kind(fname: str) -> str | None:
    for slug, pattern in DOC_KIND_PATTERNS:
        if re.search(pattern, fname):
            return slug
    if re.search(r"คำให้การผู้กล่าวหา", fname):
        return "statement-complainant"
    if re.search(r"คำให้การผู้ต้องหา", fname):
        return "statement-suspect"
    if re.search(r"คำให้การพยาน", fname):
        return "statement-witness"
    return None


def case_stamp(fname: str) -> str | None:
    if "!" not in fname:
        return None
    head, rest = fname.split("!", 1)
    m = re.match(r"\s*(\d{4})", rest)
    if not m:
        return None
    return f"{head.strip()}!{m.group(1)}"


def parse_case(docs: dict[str, list[tuple[str, str]]], stamp: str) -> dict:
    entries = docs[stamp]
    all_text = "\n".join(t for _, t in entries)
    # บางเอกสารเป็นตาราง Word — ย่อหน้าถูกแยกบรรทัดไม่เท่ากัน จึงตรวจทั้งแบบมี/ไม่มี \n คั่น
    flat = re.sub(r"\s*\n\s*", "\u0001", all_text)
    case_type, score = classify_category(all_text)

    case_no = ""
    for pattern in [r"คดี(?:จราจร|อาญา)ที่\s*([0-9]{1,5}/[0-9]{2,4})", r"คดีที่\s*\u0001?\s*([0-9]{1,5})\s*\u0001?\s*/\s*\u0001?\s*([0-9๒-๙]{2,4})"]:
        m = re.search(pattern, flat)
        if m:
            groups = [g for g in m.groups() if g]
            case_no = "/".join(groups)
            break
    if not case_no:
        m = re.search(r"^([จอคผบ]|[จอคผบ]\s*ร[จอ])?\s*([0-9]{1,5})!([0-9]{4})", stamp)
        if m:
            case_no = f"{m.group(2)}/{m.group(3)}"

    charge_text = ""
    for pattern in [
        r"ฐานความผิด\s*\u0001\s*([^\u0001]{2,200})",
        r"ข้อหา\s*\u0001\s*([^\u0001]{2,200})",
        r"ในข้อหา\s*\u0001?\s*([^\u0001]{2,200})",
        r"ข้อหา\s*\t?\s*([^\t\n]{2,200})",
        r"เป็นความผิดฐาน\s*([^\n]{2,200})",
        r"ร่วมกันมี[^\u0001]{2,200}",
    ]:
        m = re.search(pattern, flat)
        if m and m.group(1).strip(" ."):
            cand = re.sub(r"\s*(SmartPolice|แบบฟอร์ม|หน้า\s*ที่).*$", "", m.group(1))
            cand = re.sub(r"[\u0001\t\s]+", " ", cand).strip(" .\"'“”")
            if len(cand) >= 6:
                charge_text = cand
                break

    law_refs = ""
    for pattern in [
        r"(?:ตาม)?(?:ประมวลกฎหมายอาญา|พระราชบัญญัติ|ป\.วิ\.อ\.)[^\u0001\n]{0,180}",
        r"มาตรา\s*[0-9๐-๙/,\- ]{1,40}",
    ]:
        m = re.search(pattern, flat)
        if m:
            law_refs = m.group(0).strip()
            break

    evidence = []
    for pattern in [
        r"ของกลาง(?:คือ|ได้แก่)\s*\t?\s*([^\n]{2,200})",
        r"พร้อมของกลาง(?:คือ)?\s*\t?\s*([^\n]{2,200})",
        r"\u0001\s*([^\u0001]{3,120}(?:ถุง|ขวด|ชุด|ห่อ|เม็ด|กรัม)[^\u0001]{0,120})",
    ]:
        m = re.search(pattern, flat)
        if m and m.group(1).strip():
            evidence.append(re.sub(r"\u0001", " ", m.group(1)).strip())
            break

    complainants: list[str] = []
    suspects: list[str] = []
    witnesses: list[str] = []

    # ชื่อจากไฟล์ (แม่นที่สุด)
    for fname, _ in entries:
        m = re.search(r"คำให้การผู้ต้องหา\s+([^\n]+?)(?:\.doc)?$", fname)
        if m:
            suspects.append(m.group(1).strip())
        m = re.search(r"คำให้การพยาน\s+([^\n]+?)(?:\.doc)?$", fname)
        if m:
            witnesses.append(m.group(1).strip())
        m = re.search(r"คำให้การผู้กล่าวหา\s+([^\n]+?)(?:\.doc)?$", fname)
        if m:
            complainants.append(m.group(1).strip())
        m = re.search(r"หมายเรียกผู้ต้องหา\s+([^\n]+?)(?:\.doc)?$", fname)
        if m:
            suspects.append(m.group(1).strip())
        m = re.search(r"หมายเรียกพยาน\s+([^\n]+?)(?:\.doc)?$", fname)
        if m:
            witnesses.append(m.group(1).strip())
        m = re.search(r"ภาพประกอบคดี\s", fname)
        if m:
            pass

    # ตารางในเอกสาร: "ชื่อ \n ผู้ต้องหา" / "ชื่อ \n ผู้กล่าวหา" / "ผู้ต้องหา \n ชื่อ"
    table_patterns = [
        (suspects, r"([^\u0001]{4,60})\u0001\s*ผู้ต้องหา(?:\u0001|$)"),
        (suspects, r"ผู้ต้องหา\u0001\s*([^\u0001]{4,60})(?:\u0001|$)"),
        (complainants, r"([^\u0001]{4,60})\u0001\s*ผู้(?:กล่าวหา|เสียหาย)(?:\u0001|$)"),
        (complainants, r"ผู้(?:กล่าวหา|เสียหาย)\u0001\s*([^\u0001]{4,60})(?:\u0001|$)"),
    ]
    for bucket, pattern in table_patterns:
        for m in re.finditer(pattern, flat):
            bucket.append(m.group(1).strip())

    for fname, text in entries:
        names = [n.strip() for n in PERSON_RE.findall(text)]
        if "คำให้การผู้กล่าวหา" in fname:
            complainants += names[:4]
        if "คำให้การผู้ต้องหา" in fname:
            suspects += names[:4]
        if "คำให้การพยาน" in fname:
            witnesses += names[:4]

    # บันทึกคำให้การ (ตาราง Word): "คำให้การของ <คำนำหน้า> … <ชื่อ สกุล>" — ชื่ออยู่คนละเซลล์กับคำนำหน้า
    for _, text in entries:
        t2 = re.sub(r"[ \t]*\n[ \t]*", "\u0001", text)
        m = re.search(
            r"คำให้การของ\u0001(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)\u0001[^\u0001]{0,120}?\u0001((?:[^\u0001\s]{2,30}\s?){1,3}?)\u0001",
            t2,
        )
        if m:
            name = re.sub(r"\s+", " ", m.group(2)).strip()
            if len(name) >= 5:
                witnesses.append(f"{m.group(1)}{name}")

    kinds = sorted({k for fname, _ in entries if (k := doc_kind(fname))})
    summary = ""
    for pattern in [
        r"เหตุการณ์ที่เกิดขึ้นโดยสังเขป\s*\t?\s*([^\n]{10,600})",
        r"พฤติการณ์แห่งคดี\s*(?:คือ)?\s*\t?\s*([^\n]{10,600})",
        r"เหตุเกิด(?:ที่)?\u0001?\s*([^\u0001]{10,200})",
    ]:
        m = re.search(pattern, all_text if "\n" in pattern else flat)
        if m and m.group(1).strip():
            summary = m.group(1).strip()
            break

    def uniq(seq):
        seen = set()
        out = []
        for x in seq:
            key = re.sub(r"[\s\u0001]+", " ", x).strip(" .\t")
            if len(key) < 4 or key in seen:
                continue
            if re.fullmatch(r"[0-9/.\- ]+", key):
                continue
            seen.add(key)
            out.append(key)
        return out

    readable = sum(1 for _, t in entries if t.strip())
    if readable == 0:
        # ไฟล์ทั้งหมดในคดียังเป็นเนื้อที่ว่าง (บันทึกเสีย) - ใช้ได้แค่ชื่อเอกสาร/ชื่อบุคคลจากชื่อไฟล์
        charge_text = charge_text or ""
        case_type, score = "คดีอาญา", {}
    uniq = clean_names
    return {
        "stamp": stamp,
        "readableDocs": readable,
        "caseNo": case_no,
        "caseType": case_type,
        "categoryScores": score,
        "chargeText": charge_text,
        "lawRefs": law_refs,
        "docKinds": kinds,
        "docFileCount": len(entries),
        "docFiles": sorted(f for f, _ in entries),
        "complainants": clean_names(complainants, 6),
        "suspects": clean_names(suspects, 8),
        "witnesses": clean_names(witnesses, 12),
        "evidence": evidence,
        "summary": summary,
    }


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=DEFAULT_SRC)
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    if not os.path.isdir(args.src):
        print("ไม่พบโฟลเดอร์:", args.src)
        return 1

    docs: dict[str, list[tuple[str, str]]] = collections.defaultdict(list)
    skipped = []
    for fname in sorted(os.listdir(args.src)):
        if not fname.lower().endswith(".doc"):
            continue
        stamp = case_stamp(fname)
        if not stamp:
            skipped.append(fname)
            continue
        try:
            docs[stamp].append((fname, read_any_doc_text(os.path.join(args.src, fname))))
        except Exception as exc:  # noqa: BLE001
            skipped.append(f"{fname} ({exc})")

    cases = [parse_case(docs, stamp) for stamp in sorted(docs)]
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump({"source": args.src, "caseCount": len(cases), "skipped": skipped, "cases": cases}, fh, ensure_ascii=False, indent=1)

    by_type = collections.Counter(c["caseType"] for c in cases)
    unreadable = [c for c in cases if c["readableDocs"] == 0]
    with_charge = [c for c in cases if c["chargeText"]]
    with_party = [c for c in cases if c["suspects"] or c["complainants"]]
    complete = [c for c in cases if c["chargeText"] and (c["suspects"] or c["complainants"])]
    print(f"คดี {len(cases)} คดี - อ่านเอกสารได้ {sum(c['docFileCount'] for c in cases)} ไฟล์ - ข้าม {len(skipped)}")
    for k, v in by_type.most_common():
        print(f"  {k}: {v} คดี")
    print(f"ไฟล์เสีย (0 ไบต์): {len(unreadable)} คดี")
    print(f"ได้ข้อหา: {len(with_charge)}/{len(cases)}")
    print(f"ได้ชื่อคู่ความ: {len(with_party)}/{len(cases)}")
    print(f"ได้ทั้งข้อหาและชื่อคู่ความ: {len(complete)}/{len(cases)}")
    # เกณฑ์จริง: ครบ 48 คดี และมีอย่างน้อย 40 คดีที่ดึงข้อมูลได้อย่างน้อย 1 อย่าง
    # (ข้อจากัดของต้นฉบับ: 18 คดีไฟล์เป็นศูนย์ไบต์, 9 คดีเหลือเฉพาะคำให้การพยาน)
    enriched = [c for c in cases if c["chargeText"] or c["suspects"] or c["complainants"] or c["witnesses"] or c["caseNo"]]
    ok = len(cases) == 48 and len(enriched) >= 40
    print(f"คดีที่ดึงข้อมูลได้อย่างน้อย 1 อย่าง: {len(enriched)}/{len(cases)}")
    print("เกณฑ์ >= 40 คดี:", "ผ่าน" if ok else "ไม่ผ่าน")
    print("เขียน:", args.out)
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
