import { Storage } from "@google-cloud/storage";

if (!process.env.CREDENTIALS) {
  throw new Error("CREDENTIALS não definida");
}

const credentials = JSON.parse(process.env.CREDENTIALS);

credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

export const storage = new Storage({
  projectId: credentials.project_id,
  credentials,
});

export const bucket = storage.bucket("all2bsafe-images");