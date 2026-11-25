import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createAuth } from "./auth.mjs";
import { openDatabase } from "./database.mjs";
import { participantCsv, registration } from "./registration.mjs";

const { ADMIN_PASSWORD, SESSION_SECRET, APP_ORIGIN = "http://127.0.0.1:3000" } = process.env;
const appOrigin = new URL(APP_ORIGIN);
const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const clientDir = fileURLToPath(new URL("../dist/", import.meta.url));

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 16 || ADMIN_PASSWORD.length > 200 ||
    !SESSION_SECRET || SESSION_SECRET.length < 43) {
  throw new Error("Jalankan npm run setup atau atur ADMIN_PASSWORD (16–200 karakter) serta SESSION_SECRET acak.");
}
if (appOrigin.origin !== APP_ORIGIN || !["http:", "https:"].includes(appOrigin.protocol)) {
  throw new Error("APP_ORIGIN harus berisi origin situs tanpa path dan tanpa garis miring di akhir.");
}
if (appOrigin.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(appOrigin.hostname)) {
  throw new Error("Gunakan HTTPS untuk alamat situs di luar komputer lokal.");
}
if (!Number.isSafeInteger(proxyHops) || proxyHops < 0 || proxyHops > 5 ||
    !Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("Periksa TRUST_PROXY_HOPS dan PORT.");
}
if (!existsSync(resolve(clientDir, "index.html"))) throw new Error("Jalankan npm run build sebelum npm start.");

process.umask(0o077);
const db = openDatabase(resolve(process.env.DATABASE_PATH ?? "data/codavibe.sqlite"));
const auth = createAuth(SESSION_SECRET, ADMIN_PASSWORD, appOrigin.protocol === "https:");
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", proxyHops || false);
app.use((_request, response, next) => {
  response.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  });
  next();
});
app.use("/api", (request, response, next) => {
  response.set("Cache-Control", "no-store");
  if (request.method === "POST" && request.get("origin") !== appOrigin.origin) {
    return response.status(403).json({ error: "Kirim formulir dari halaman CodaVibe." });
  }
  if (request.method === "POST" && !request.is("application/json")) {
    return response.status(415).json({ error: "Formulir harus dikirim dalam format JSON." });
  }
  next();
});
app.use("/api", express.json({ limit: "4kb" }));

function requireAdmin(request, response, next) {
  if (!auth.signedIn("admin", request.get("cookie"))) {
    return response.status(401).json({ error: "Masuk sebagai admin untuk membuka data peserta." });
  }
  next();
}

app.get("/api/participant", (request, response) => {
  response.json({ registered: auth.signedIn("participant", request.get("cookie")) });
});

app.post("/api/participant", (request, response) => {
  if (auth.signedIn("participant", request.get("cookie"))) return response.json({ registered: true });

  const limitKey = auth.ipBucket("participant", request.ip);
  if (!db.countAttempt(limitKey, 60_000, 60)) {
    return response.status(429).json({ error: "Terlalu banyak pengiriman. Coba lagi dalam satu menit." });
  }
  const profile = registration.safeParse(request.body);
  if (!profile.success) {
    return response.status(400).json({ error: "Periksa nama, email, dan tautan profil LinkedIn (linkedin.com/in/…)." });
  }

  db.addParticipant(profile.data);
  response.set("Set-Cookie", auth.issue("participant")).json({ registered: true });
});

app.get("/api/admin/session", (request, response) => {
  response.json({ signedIn: auth.signedIn("admin", request.get("cookie")) });
});

app.post("/api/admin/login", (request, response) => {
  const limitKey = auth.ipBucket("admin", request.ip);
  if (!db.countAttempt(limitKey, 15 * 60_000, 8)) {
    return response.status(429).json({ error: "Terlalu banyak percobaan masuk. Coba lagi nanti." });
  }
  if (!auth.matchesPassword(request.body?.password)) {
    return response.status(401).json({ error: "Kata sandi admin tidak sesuai." });
  }
  response.set("Set-Cookie", auth.issue("admin")).json({ signedIn: true });
});

app.post("/api/admin/logout", (_request, response) => {
  response.set("Set-Cookie", auth.clear("admin")).json({ signedIn: false });
});

app.get("/api/admin/participants", requireAdmin, (request, response) => {
  const page = Number(request.query.page ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 10_000) {
    return response.status(400).json({ error: "Nomor halaman tidak valid." });
  }
  response.json(db.participants(page, 25));
});

app.get("/api/admin/export", requireAdmin, async (_request, response) => {
  response.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="codavibe-peserta.csv"',
  });
  await pipeline(Readable.from(participantCsv(db.exportRows())), response);
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Endpoint tidak ditemukan." });
});

app.get(["/admin", "/admin/"], (_request, response) => {
  response.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
  response.sendFile(resolve(clientDir, "index.html"));
});
app.use(express.static(clientDir));

app.use((error, _request, response, next) => {
  if (response.headersSent) return next(error);
  if (error.type === "entity.too.large") {
    return response.status(413).json({ error: "Isian formulir terlalu panjang." });
  }
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Format formulir tidak valid." });
  }
  console.error("Request failed:", error.code ?? error.name);
  response.status(500).json({ error: "Permintaan belum berhasil. Silakan coba lagi." });
});

app.listen(port, host, () => console.log("CodaVibe Rater Lab berjalan di " + appOrigin.origin));
