import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const example = new URL("../.env.example", import.meta.url);
const target = new URL("../.env", import.meta.url);

try {
  const config = readFileSync(example, "utf8")
    .replace("ADMIN_PASSWORD=", "ADMIN_PASSWORD=" + randomBytes(24).toString("base64url"))
    .replace("SESSION_SECRET=", "SESSION_SECRET=" + randomBytes(48).toString("base64url"));
  writeFileSync(target, config, { flag: "wx", mode: 0o600 });
  console.log(".env dibuat. Lihat ADMIN_PASSWORD di file itu untuk masuk ke /admin.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(".env sudah tersedia.");
}
