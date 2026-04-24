/**
 * อ่านรูป / สลิป — Ollama vision, Kimi K2.5 ก่อน แล้ว GLM-OCR รอง
 * การทำงานเต็มอยู่ที่ @/lib/ollama/ollama-vision และ @/lib/vision/glm-ocr-service
 */
export { ollamaBaseUrl, ollamaCallVisionText, type OllamaVisionTextArgs } from "@/lib/ollama/ollama-vision";
export {
  readSlipWithGlmOcr,
  readSlipWithKimiThenGlmOcr,
  SLIP_OCR_JSON_PROMPT,
  dataUrlToBase64Raw,
  buildGlmOcrResultFromModelText,
  type GlmOcrSlipResult,
  type GlmOcrReadPipeline,
} from "@/lib/vision/glm-ocr-service";
export {
  nvidiaSlipOcrConfigured,
  nvidiaSlipModel,
  callNvidiaSlipVision,
} from "@/lib/vision/nvidia-slip-vision";
