import { Download, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

type Participant = { id: number; name: string; email: string; linkedIn: string; createdAt: string };
type Page = { total: number; rows: Participant[]; pageSize: number };

const date = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function ParticipantsPanel() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/participants?page=" + page, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error ?? "Data peserta belum bisa dimuat.");
        }
        if (!controller.signal.aborted) setData(await response.json() as Page);
      }).catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Data peserta belum bisa dimuat.");
      });
    return () => controller.abort();
  }, [page, revision]);

  function changePage(next: number) {
    setError("");
    setData(null);
    setPage(next);
  }

  async function exportCsv() {
    setExporting(true);
    setExportError("");
    try {
      const response = await fetch("/api/admin/export", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.blob();
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "codavibe-peserta.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setExportError("Unduhan gagal. Coba ekspor lagi.");
    } finally {
      setExporting(false);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return <section className="content-panel participants-panel">
    <div className="participants-header">
      <div><span className="stat-icon violet"><UsersRound size={21} /></span><h2>{data ? data.total + " peserta terdaftar" : "Peserta terdaftar"}</h2></div>
      <button className="button button-primary" onClick={exportCsv} disabled={exporting || !data || !data.total}><Download size={18} /> {exporting ? "Mengekspor…" : "Unduh CSV"}</button>
    </div>
    {exportError && <p className="error" role="alert">{exportError}</p>}
    {error ? <div className="empty-table"><p className="error" role="alert">{error}</p><button className="button button-secondary" onClick={() => { setError(""); setRevision((value) => value + 1); }}>Coba lagi</button></div>
      : !data ? <p className="empty-table" role="status">Memuat data peserta…</p>
      : data.total === 0 ? <p className="empty-table">Pendaftaran akan muncul di sini setelah peserta mengisi formulir.</p>
      : <>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Daftar peserta">
          <table>
            <thead><tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">LinkedIn</th><th scope="col">Terdaftar (WIB)</th></tr></thead>
            <tbody>{data.rows.map((row) => <tr key={row.id}>
              <td>{row.name}</td><td>{row.email}</td><td><a href={row.linkedIn} target="_blank" rel="noreferrer">Buka profil<span className="sr-only"> {row.name}</span></a></td><td>{date.format(new Date(row.createdAt))}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {pages > 1 && <nav className="pagination" aria-label="Halaman daftar peserta">
          <button className="button button-small button-quiet" disabled={page === 1} onClick={() => changePage(page - 1)}>Sebelumnya</button>
          <span>Halaman {page} dari {pages}</span>
          <button className="button button-small button-quiet" disabled={page >= pages} onClick={() => changePage(page + 1)}>Berikutnya</button>
        </nav>}
      </>}
  </section>;
}
