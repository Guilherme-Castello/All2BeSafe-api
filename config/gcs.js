import { Storage } from "@google-cloud/storage";
import { GCP_KEY_PATH } from "./gcs";

export const storage = new Storage({
  keyFilename: GCP_KEY_PATH,
  projectId: "weatherproject-486222",
});
export const bucket = storage.bucket("all2bsafe-images");