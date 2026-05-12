/**
 * คืน URL รูปสต็อก (Unsplash) ให้สอดกับชื่อสินค้าและหมวด — ใช้เป็นตัวอย่างเท่านั้น ไม่บันทึกลงเซิร์ฟเวอร์
 * ลำดับ: กฎเฉพาะจากชื่อ+หมวดก่อน → กฎกว้าง → default ร้านค้า
 */
const U = {
  coffee:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=72",
  tea: "https://images.unsplash.com/photo-1544787219-7f47ccb23c51?auto=format&fit=crop&w=800&q=72",
  waterBottle:
    "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=72",
  bread:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=72",
  noodles:
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec842?auto=format&fit=crop&w=800&q=72",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=72",
  meat: "https://images.unsplash.com/photo-1603048297172-c92544798d5b?auto=format&fit=crop&w=800&q=72",
  seafood:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=72",
  fruit:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=72",
  vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=72",
  dairyEggs:
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=72",
  snacks:
    "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=72",
  chocolate:
    "https://images.unsplash.com/photo-1511381939415-e154154238ac?auto=format&fit=crop&w=800&q=72",
  iceCream:
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=72",
  frozen:
    "https://images.unsplash.com/photo-1497534446932-c925458314e?auto=format&fit=crop&w=800&q=72",
  beverages:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=72",
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=72",
  battery:
    "https://images.unsplash.com/photo-1619641802008-3d870b9b824d?auto=format&fit=crop&w=800&q=72",
  toy: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=72",
  book: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=72",
  medicine:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=72",
  stationery:
    "https://images.unsplash.com/photo-1517842645767-c167b6725734?auto=format&fit=crop&w=800&q=72",
  household:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf00?auto=format&fit=crop&w=800&q=72",
  personalCare:
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=72",
  food:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=72",
  defaultStore:
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=72",
} as const;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

type Ctx = { th: string; en: string };

function buildCtx(input: { name: string; categoryName?: string | null }): Ctx {
  const name = input.name.trim();
  const cat = (input.categoryName ?? "").trim();
  return {
    th: `${cat}${name}`,
    en: norm(`${cat} ${name}`),
  };
}

/** แนะภาพตัวอย่างจากชื่อสินค้า/รายการและชื่อหมวด (ถ้ามี) — จับคู่ตามความหมายของสินค้าก่อน */
export function suggestGeneralStorePosStockImageUrl(input: { name: string; categoryName?: string | null }): string {
  const { th, en } = buildCtx(input);

  const first = (pairs: [RegExp, string][]): string | null => {
    for (const [re, url] of pairs) {
      if (re.test(th) || re.test(en)) return url;
    }
    return null;
  };

  const specific = first([
    [/กาแฟ|คาปูชิโน|ลาเต้|อเมริกาโน|เอสเปรสโซ|มอคค่า|cold\s*brew/i, U.coffee],
    [/ชา|matcha|มัทฉะ|bubble\s*tea|ชานม|โออิชะ|oolong/i, U.tea],
    [/น้ำเปล่า|น้ำแร่|น้ำดื่ม|mineral\s*water|drinking\s*water/i, U.waterBottle],
    [/ขนมปัง|แซนวิช|เบเกอรี|croissant|bagel|toast|wheat\s*bread/i, U.bread],
    [/บะหมี่|ก๋วยเตี๋ยว|ราเมน|ผัดไท|spaghetti|pasta|noodle|instant\s*noodle|มาม่า/i, U.noodles],
    [/ข้าวสาร|ข้าวหอม|jasmine\s*rice|brown\s*rice|ข้าวกล่อง/i, U.rice],
    [/หมู|เนื้อวัว|ไก่|แกะ|สเต็ก|bacon|sausage|ground\s*beef|pork|chicken\s*breast|แฮม/i, U.meat],
    [/กุ้ง|ปลา|หอย|ปู|ซูชิ|แซลมอน|seafood|tuna|salmon|squid/i, U.seafood],
    [/ผลไม้|แอปเปิ้ล|ส้ม|องุ่น|กล้วย|มะม่วง|แตงโม|fruit|berry|melon/i, U.fruit],
    [/ผัก|คะน้า|บล็อกโคลี่|มะเขือ|salad|vegetable|lettuce|carrot|tomato/i, U.vegetables],
    [/ไข่|นมจืด|นมสด|นม\s*uht|นมยูเอชที|นมเปรี้ยว|นมข้น|นมผง|(?<!ชา)นม(?!ชา)|ชีส|เนย|yogurt|dairy|cheddar|mozzarella|\bmilk\b/i, U.dairyEggs],
    [/ช็อก|chocolate|brownie|truffle/i, U.chocolate],
    [/ไอศกรีม|ice\s*cream|gelato|popsicle/i, U.iceCream],
    [/แช่แข็ง|ฟรีซ|frozen\s*food|frozen\s*veg/i, U.frozen],
    [/แบต|ถ่าน|battery|aa\s*battery|aaa/i, U.battery],
    [/มือถือ|สมาร์ทโฟน|tablet|หูฟัง|สายชาร์จ|usb|adapter|keyboard|mouse|laptop|gadget|electronics/i, U.electronics],
    [/ของเล่น|ตุ๊กตา|เลโก้|toy|lego|plush|puzzle/i, U.toy],
    [/หนังสือ|นิตยสาร|สมุดโน้ต|book|magazine|notebook/i, U.book],
    [/ยา|วิตามิน|แคปซูล|supplement|paracetamol|aspirin/i, U.medicine],
  ]);
  if (specific) return specific;

  if (/ขนม|มันฝรั่ง|ลูกอม|บิสกิต|เวเฟอร์|ขนมขบเคี้ยว|chips|crisp|candy|cracker|cookie/i.test(th) || /snack|chips|biscuit|cracker/i.test(en)) {
    return U.snacks;
  }
  if (/ดินสอ|ปากกา|สมุด|ยางลบ|ไม้บรรทัด|เครื่องเขียน|อุปกรณ์การเรียน/i.test(th) || /stationery|pencil|pen|eraser|ruler/i.test(en)) {
    return U.stationery;
  }
  if (/ทำความสะอาด|น้ำยา|ไม้ถูพื้น|ถุงขยะ|กระดาษชำระ|ซักผ้า/i.test(th) || /detergent|tissue|toilet|laundry|household|cleaning/i.test(en)) {
    return U.household;
  }
  if (/แชมพู|สบู่|ยาสีฟัน|แปรงสีฟัน|ครีม|โลชั่น|เครื่องสำอาง/i.test(th) || /shampoo|toothpaste|lotion|cosmetic|skincare/i.test(en)) {
    return U.personalCare;
  }
  if (
    /น้ำ|โซดา|มิลค์|uht|อัดลม|เครื่องดื่ม|น้ำปั่น|น้ำผลไม้|energy\s*drink/i.test(th) ||
    /beverage|drink|soda|juice|milk(?!\s*shake)|cola|soft\s*drink/i.test(en)
  ) {
    return U.beverages;
  }
  if (/อาหาร|ข้าว(?!สาร)|แกง|ผัด|อาหารแห้ง|อาหารสำเร็จรูป/i.test(th) || /food|rice(?!\s*pack)|meal|instant(?!\s*noodle)/i.test(en)) {
    return U.food;
  }

  return U.defaultStore;
}
