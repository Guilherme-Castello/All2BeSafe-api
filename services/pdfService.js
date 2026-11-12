import { bucket } from "../config/gcs.js";
import { generateAnswarePDFService } from "./templateService.js";

/**
 * Gera o PDF, salva no GCS e devolve uma URL temporária para download.
 * Usado tanto pelo worker BullMQ quanto pelo fallback sem Redis.
 */
export async function generateAndStoreAnswarePDFService(answareid, userid, fileKey) {
  const pdfBuffer = await generateAnswarePDFService(answareid, userid);
  const safeFileKey = String(fileKey).replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = `pdfs/${safeFileKey}.pdf`;
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
  });

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  return { signedUrl, fileName };
}
