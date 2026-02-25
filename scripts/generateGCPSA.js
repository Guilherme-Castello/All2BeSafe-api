import "dotenv/config";
import fs from "fs";
import path from "path";

const gcpKeyPath = path.join("/tmp", "gcp-sa.json");

if (!fs.existsSync(gcpKeyPath)) {
  console.log(process.env)
  if (!process.env.GCP_SA_JSON) {
    throw new Error("GCP_SA_JSON não está definida");
  }

  const generatedFile = fs.writeFileSync(
    gcpKeyPath,
    process.env.GCP_SA_JSON,
    { encoding: "utf-8" }
  );
  console.log("Generated: ")
  console.log(generatedFile)
}

console.log("Service Account gerado em:", gcpKeyPath);