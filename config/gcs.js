import { Storage } from "@google-cloud/storage";

export const storage = new Storage();
export const bucket = storage.bucket("all2bsafe-images");