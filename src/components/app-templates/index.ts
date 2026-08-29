/**
 * MAWELL — template กลาง UI (รูป / lightbox / แดชบอร์ด / พิมพ์ / อัปโหลดรูป / ไอคอน SVG)
 *
 * หน้าและโมดูลใหม่: import จาก `@/components/app-templates` เท่าที่ทำได้
 * ชื่อเก่า HomeFinanceImageLightbox / HomeFinanceThumb ยัง re-export จากไฟล์เดิมถ้ามี
 */

export { AppImageLightbox, type AppImageLightboxProps } from "./AppImageLightbox";
export { AppImageThumb, type AppImageThumbProps } from "./AppImageThumb";
export { useAppImageLightbox, type AppImageLightboxState } from "./useAppImageLightbox";

export {
  appDashboardBrandCtaPillButtonClass,
  appDashboardBrandGradientFillClass,
  appDashboardBrandGradientBarClass,
  appDashboardInnerScrollClass,
  appDashboardSectionSlateClass,
  appDashboardSectionVioletClass,
  appDashboardHistoryListShellClass,
  appModuleShellMainScrollClass,
  appTemplateOutlineButtonClass,
  appTemplatePickGalleryImageButtonClass,
  appTemplateTakePhotoButtonClass,
} from "./dashboard-tokens";

export {
  appSparkChartPanelClass,
  appSparkChartsTwoColumnGridClass,
} from "./spark-chart-layout-tokens";
export {
  AppSparkChartPanel,
  AppSparkChartsTwoColumnGrid,
  type AppSparkChartPanelProps,
  type AppSparkChartsTwoColumnGridProps,
} from "./AppSparkChartShell";

export { AppDashboardSection, type AppDashboardSectionProps } from "./AppDashboardSection";
export {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  appPublicCheckInGlassPageClass,
} from "./AppPublicCheckInGlassTemplate";
export { AppSectionHeader, type AppSectionHeaderProps } from "./AppSectionHeader";
export { AppEmptyState, type AppEmptyStateProps } from "./AppEmptyState";
export { AppCompareBarList, type AppCompareBarListProps, type AppCompareBarRow } from "./AppCompareBarList";
export { AppColumnBarSparkChart, type AppColumnBarSparkChartProps, type AppColumnBarBucket } from "./AppColumnBarSparkChart";
export {
  AppColumnBarDualSparkChart,
  type AppColumnBarDualSparkChartProps,
  type AppDualColumnBarBucket,
} from "./AppColumnBarDualSparkChart";
export {
  AppRevenueCostColumnChart,
  type AppRevenueCostColumnChartProps,
  type AppRevenueCostBucket,
} from "./AppRevenueCostColumnChart";
export { AppWindowPrintButton, type AppWindowPrintButtonProps } from "./AppWindowPrintButton";
export {
  alertIfSlipPrintFailed,
  alertSlipPrintRequiresMonthlyPlan,
  APP_SLIP_PAPER_SIZE_OPTIONS,
  appSlipPageAndRootCss,
  buildAppOrderTicketSlipInnerHtml,
  buildAppReceiptSlipInnerHtml,
  buildAppShortReceiptSlipInnerHtml,
  buildAppSlipStaticDocumentHtml,
  DEFAULT_APP_SLIP_PAPER_SIZE,
  escapeSlipHtml,
  openAppSlipPrintWindow,
  parseAppSlipPaperSize,
  printAppOrderTicketSlip,
  printAppReceiptSlip,
  printAppShortReceiptSlip,
  resolveAppSlipPaperSize,
  type AppOrderTicketSlipVariant,
  type AppSlipLineItem,
  type AppSlipPaperSize,
  type AppSlipPrintPageOptions,
  type PrintAppOrderTicketSlipParams,
  type PrintAppReceiptSlipParams,
  type PrintAppShortReceiptSlipParams,
  type AppReceiptSlipBuildParams,
} from "./slip-print";
export {
  buildAppInvoicePayUploadQrRowHtml,
  type AppInvoicePayUploadQrRowParams,
} from "./invoice-pay-upload-qr";
export {
  AppInvoicePayUploadQrSection,
  type AppInvoicePayUploadQrSectionProps,
} from "./AppInvoicePayUploadQrSection";
export { AppSlipPaperSizeToolbar, type AppSlipPaperSizeToolbarProps } from "./AppSlipPaperSizeToolbar";
export {
  fetchAppDefaultSlipPaperSize,
  saveAppDefaultSlipPaperSize,
  useAppSlipPaperSize,
} from "./useAppSlipPaperSize";
export {
  AppSlipPaperSizeSettingsField,
  type AppSlipPaperSizeSettingsFieldProps,
} from "./AppSlipPaperSizeSettingsField";
export {
  AppStaffDailyPinSettingsField,
  staffDailyPinPatchBody,
} from "./AppStaffDailyPinSettingsField";
export { AppSlipPrintIconButton, type AppSlipPrintIconButtonProps } from "./AppSlipPrintIconButton";
export { AppGalleryCameraFileInputs, type AppGalleryCameraFileInputsProps } from "./AppGalleryCameraFileInputs";
export { AppImagePickCameraButtons, type AppImagePickCameraButtonsProps } from "./AppImagePickCameraButtons";
export { AppShopLogoField, type AppShopLogoFieldProps } from "./AppShopLogoField";
export {
  AppSignaturePad,
  type AppSignaturePadHandle,
  type AppSignaturePadProps,
} from "./AppSignaturePad";
export {
  AppModuleShopSettingsClient,
  type AppModuleShopSettingsClientProps,
} from "./AppModuleShopSettingsClient";
export { AppModuleShopPaymentFields } from "./AppModuleShopPaymentFields";
export { AppModuleOwnerAccountSection } from "./AppModuleOwnerAccountSection";
export {
  AppPickGalleryImageButton,
  type AppPickGalleryImageButtonProps,
  AppTakePhotoButton,
  type AppTakePhotoButtonProps,
} from "./AppTemplateSlipImageButtons";
export { AppCameraCaptureModal, type AppCameraCaptureModalProps } from "./AppCameraCaptureModal";
export {
  useAppCameraCapture,
  type UseAppCameraCaptureOptions,
} from "./useAppCameraCapture";
export { AppQrScanModal, type AppQrScanModalProps } from "./AppQrScanModal";
export {
  AppNoticePopup,
  useAppNoticePopup,
  type AppNoticePopupProps,
  type AppNoticePopupTone,
  type UseAppNoticePopupOptions,
} from "./AppNoticePopup";
export {
  LoyaltyRewardMenuCard,
  LoyaltyRewardMenuGrid,
} from "./LoyaltyRewardMenuCard";

export {
  openPrintableHtml,
  printDataUrlImagePoster,
  printPrintableHtmlInHiddenIframe,
} from "./openPrintableHtml";
export {
  PREPARED_IMAGE_MAX_BYTES,
  PREPARED_IMAGE_MAX_DIMENSION,
  prepareImageFileAsDataUrl,
  prepareImageFileForUpload,
  prepareImageFileForVisionOcr,
} from "./prepareImageFileForUpload";
export {
  CLIENT_UPLOAD_MAX_IMAGE_BYTES,
  CLIENT_UPLOAD_MAX_PDF_BYTES,
  isImageUploadFile,
  isPdfUploadFile,
  normalizeUploadDisplayName,
  prepareUploadFile,
  prepareUploadFileAsDataUrl,
  suggestUploadDisplayName,
  UPLOAD_DISPLAY_NAME_MAX,
} from "./prepareUploadFile";

export {
  appMobileDockBackdropClass,
  appMobileDockContentClearanceClass,
  appMobileDockGridClass,
  appMobileDockItemActiveClass,
  appMobileDockItemIdleClass,
  appMobileDockLinkClass,
  appMobileDockPillClass,
  appMobileDockUnifiedSlotClass,
} from "./mobile-dock-tokens";
export { AppMobileDockShell, AppMobileDockUnifiedBar } from "./AppMobileDockShell";

export {
  APP_TEMPLATE_ICON_STROKE,
  AppIconUpload,
  AppIconImage,
  AppIconPencil,
  AppIconPower,
  AppIconTrash,
  AppIconCheck,
  AppIconUserX,
  AppIconClose,
  AppIconPrint,
  AppIconToolbarButton,
  type AppTemplateIconProps,
  type AppIconToolbarButtonProps,
} from "./AppTemplateIcons";
export { AppUsageGuideModal } from "./AppUsageGuideModal";
export {
  AppTime24Input,
  normalizeAppTime24,
  type AppTime24InputProps,
} from "./AppTime24Input";
