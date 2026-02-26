import { Storage } from "@google-cloud/storage";

const json = Buffer.from(
  process.env.GCP_SA_JSON_BASE64,
  "base64"
).toString("utf-8");

export const storage = new Storage({
  keyFilename: json,
  projectId: "weatherproject-486222",
});
export const bucket = storage.bucket("all2bsafe-images");