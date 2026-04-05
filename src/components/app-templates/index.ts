/**
 * MAWELL — template กลาง UI (รูป / lightbox / แดชบอร์ด / พิมพ์ / อัปโหลดรูป)
 *
 * หน้าและโมดูลใหม่: import จาก `@/components/app-templates` เท่าที่ทำได้
 * ชื่อเก่า HomeFinanceImageLightbox / HomeFinanceThumb ยัง re-export จากไฟล์เดิมถ้ามี
 */

export { AppImageLightbox, type AppImageLightboxProps } from "./AppImageLightbox";
export { AppImageThumb, type AppImageThumbProps } from "./AppImageThumb";
export { useAppImageLightbox, type AppImageLightboxState } from "./useAppImageLightbox";

export {
  appDashboardSectionSlateClass,
  appDashboardSectionVioletClass,
  appDashboardHistoryListShellClass,
  appTemplateOutlineButtonClass,
  appTemplatePickGalleryImageButtonClass,
  appTemplateTakePhotoButtonClass,
} from "./dashboard-tokens";

export { AppDashboardSection, type AppDashboardSectionProps } from "./AppDashboardSection";
export { AppSectionHeader, type AppSectionHeaderProps } from "./AppSectionHeader";
export { AppEmptyState, type AppEmptyStateProps } from "./AppEmptyState";
export { AppCompareBarList, type AppCompareBarListProps, type AppCompareBarRow } from "./AppCompareBarList";
export { AppColumnBarSparkChart, type AppColumnBarSparkChartProps, type AppColumnBarBucket } from "./AppColumnBarSparkChart";
export { AppWindowPrintButton, type AppWindowPrintButtonProps } from "./AppWindowPrintButton";
export { AppGalleryCameraFileInputs, type AppGalleryCameraFileInputsProps } from "./AppGalleryCameraFileInputs";
export { AppImagePickCameraButtons, type AppImagePickCameraButtonsProps } from "./AppImagePickCameraButtons";
export {
  AppPickGalleryImageButton,
  type AppPickGalleryImageButtonProps,
  AppTakePhotoButton,
  type AppTakePhotoButtonProps,
} from "./AppTemplateSlipImageButtons";
export { AppCameraCaptureModal, type AppCameraCaptureModalProps } from "./AppCameraCaptureModal";

export {
  openPrintableHtml,
  printDataUrlImagePoster,
  printPrintableHtmlInHiddenIframe,
} from "./openPrintableHtml";
export { prepareImageFileForUpload } from "./prepareImageFileForUpload";
