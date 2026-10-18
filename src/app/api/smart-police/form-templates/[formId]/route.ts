import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import {
  blankFormPublicHref,
  findSmartPoliceBlankForm,
  loadBlankFormPreviewHtml,
  smartPoliceFormFileKind,
} from "@/lib/smart-police/form-template";

export async function GET(_req: Request, ctx: { params: Promise<{ formId: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { formId } = await ctx.params;

  const form = findSmartPoliceBlankForm(formId);
  if (!form) return NextResponse.json({ error: "ไม่พบแบบฟอร์ม" }, { status: 404 });

  const override = await prisma.smartPoliceFormTemplate.findUnique({
    where: {
      ownerUserId_blankFormId: {
        ownerUserId: gate.ctx.ownerUserId,
        blankFormId: formId,
      },
    },
  });

  const fileKind = smartPoliceFormFileKind(form.fileName);
  const fileHref = blankFormPublicHref(form.fileName);

  let sourceHtml: string | null = null;
  if (fileKind === "docx") {
    try {
      sourceHtml = await loadBlankFormPreviewHtml(form.fileName);
    } catch {
      sourceHtml = null;
    }
  }

  const contentHtml = override?.contentHtml?.trim()
    ? override.contentHtml
    : sourceHtml;

  return NextResponse.json({
    template: {
      id: form.id,
      category: form.category,
      title: override?.title?.trim() || form.title,
      originalTitle: form.title,
      fileName: form.fileName,
      fileKind,
      fileHref,
      contentHtml: contentHtml ?? "",
      sourceHtml: sourceHtml ?? "",
      notes: override?.notes ?? "",
      isActive: override?.isActive ?? true,
      hasOverride: Boolean(
        override?.contentHtml?.trim() || override?.notes?.trim() || override?.title?.trim(),
      ),
      updatedAt: override?.updatedAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ formId: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { formId } = await ctx.params;

  const form = findSmartPoliceBlankForm(formId);
  if (!form) return NextResponse.json({ error: "ไม่พบแบบฟอร์ม" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: {
    title?: string | null;
    contentHtml?: string | null;
    notes?: string | null;
    isActive?: boolean;
  } = {};

  if (typeof body.title === "string") {
    data.title = body.title.trim() || null;
  }
  if (typeof body.contentHtml === "string") {
    data.contentHtml = body.contentHtml;
  }
  if (body.contentHtml === null) {
    data.contentHtml = null;
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes.trim() || null;
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (body.resetContent === true) {
    data.contentHtml = null;
  }

  const row = await prisma.smartPoliceFormTemplate.upsert({
    where: {
      ownerUserId_blankFormId: {
        ownerUserId: gate.ctx.ownerUserId,
        blankFormId: formId,
      },
    },
    create: {
      ownerUserId: gate.ctx.ownerUserId,
      blankFormId: formId,
      title: data.title ?? null,
      contentHtml: data.contentHtml ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
    },
    update: data,
  });

  return NextResponse.json({
    template: {
      id: form.id,
      title: row.title?.trim() || form.title,
      contentHtml: row.contentHtml ?? "",
      notes: row.notes ?? "",
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}
