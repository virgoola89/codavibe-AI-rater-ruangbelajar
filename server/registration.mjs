import { z } from "zod";

const linkedInProfile = z.string().trim().max(300).url().transform((value, context) => {
  const link = new URL(value);
  if (
    link.protocol !== "https:" || link.username || link.password || link.port ||
    !/(^|\.)linkedin\.com$/i.test(link.hostname) ||
    !/^\/in\/[\p{L}\p{N}%_.~-]+\/?$/u.test(link.pathname)
  ) {
    context.addIssue({ code: "custom", message: "Gunakan tautan profil LinkedIn." });
    return z.NEVER;
  }
  return "https://www.linkedin.com" + link.pathname.replace(/\/$/, "");
});

export const registration = z.object({
  name: z.string().trim().min(2).max(100).regex(/^[^\p{C}]+$/u),
  email: z.string().trim().max(254).email().transform((value) => value.toLowerCase()),
  linkedIn: linkedInProfile,
}).strict();

function csvCell(value) {
  const safe = /^(?:\s*[=+@\-＝＋＠－]|[\t\r\n])/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function* participantCsv(rows) {
  yield "\uFEFFNama,Email,LinkedIn,Waktu Pendaftaran (UTC)\r\n";
  for (const row of rows) {
    yield [row.name, row.email, row.linkedIn, row.createdAt].map(csvCell).join(",") + "\r\n";
  }
}
