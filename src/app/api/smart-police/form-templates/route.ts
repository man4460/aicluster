import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  SMART_POLICE_BLANK_FORMS,
  SMART_POLICE_BLANK_FORM_CATEGORY_ORDER,
} from "@/lib/smart-police/blank-forms-catalog";
import { smartPoliceFormFileKind } from "@/lib/smart-police/form-template";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const overrides = await prisma.smartPoliceFormTemplate.findMany({
    where: { ownerUserId: gate.ctx.ownerUserId },
    select: {
      blankFormId: true,
      title: true,
      isActive: true,
      updatedAt: true,
      contentHtml: true,
      notes: true,
    },
  });
  const byForm = new Map(overrides.map((o) => [o.blankFormId, o]));

  const templates = SMART_POLICE_BLANK_FORMS.map((f) => {
    const ov = byForm.get(f.id);
    return {
      id: f.id,
      category: f.category,
      title: ov?.title?.trim() || f.title,
      originalTitle: f.title,
      fileName: f.fileName,
      fileKind: smartPoliceFormFileKind(f.fileName),
      sortOrder: f.sortOrder,
      hasOverride: Boolean(ov?.contentHtml?.trim() || ov?.notes?.trim() || ov?.title?.trim()),
      isActive: ov?.isActive ?? true,
      updatedAt: ov?.updatedAt?.toISOString() ?? null,
    };
  }).sort((a, b) => {
    const ca = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
      a.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
    );
    const cb = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
      b.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
    );
    const c = (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
    if (c !== 0) return c;
    return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "th");
  });

  return NextResponse.json({
    templates,
    categories: [...SMART_POLICE_BLANK_FORM_CATEGORY_ORDER],
    total: templates.length,
  });
}
