import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const durations = { admin: 8 * 60 * 60, participant: 30 * 24 * 60 * 60 };

export function createAuth(secret, adminPassword, secure) {
  const mac = (input) => createHmac("sha256", secret).update(input).digest();
  const adminKey = mac("admin-password\0" + adminPassword);
  const signature = (role, value) => createHmac("sha256", role === "admin" ? adminKey : secret)
    .update("session\0" + role + "\0" + value).digest();
  const cookieName = (role) => (secure ? "__Host-" : "") + "codavibe-" + role;
  const cookie = (role, value, duration) =>
    cookieName(role) + "=" + value + "; Max-Age=" + duration + "; Path=/; HttpOnly; SameSite=Lax" + (secure ? "; Secure" : "");

  return {
    matchesPassword(value) {
      return typeof value === "string" && value.length <= 200 &&
        timingSafeEqual(mac("admin-password\0" + value), adminKey);
    },
    ipBucket(category, ip) {
      return mac("limit\0" + category + "\0" + ip).toString("base64url");
    },
    issue(role) {
      const expires = Math.floor(Date.now() / 1000) + durations[role];
      const payload = expires + "." + randomUUID();
      return cookie(role, payload + "." + signature(role, payload).toString("base64url"), durations[role]);
    },
    clear(role) {
      return cookie(role, "", 0);
    },
    signedIn(role, header = "") {
      const prefix = cookieName(role) + "=";
      const pair = header.split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix));
      const token = pair?.slice(prefix.length) ?? "";
      const match = /^(\d{1,12})\.([a-f\d-]{36})\.([A-Za-z\d_-]{43})$/.exec(token);
      if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
      const signed = signature(role, match[1] + "." + match[2]);
      return timingSafeEqual(Buffer.from(match[3], "base64url"), signed);
    },
  };
}
