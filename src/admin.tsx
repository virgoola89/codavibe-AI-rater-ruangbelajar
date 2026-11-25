import { Activity, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { ParticipantsPanel } from "./participants-panel";

type AdminStatus = "checking" | "signed-in" | "signed-out" | "unavailable";

export function AdminPage() {
  const [status, setStatus] = useState<AdminStatus>("checking");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/session", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const session = await response.json() as { signedIn: boolean };
        if (!controller.signal.aborted) setStatus(session.signedIn ? "signed-in" : "signed-out");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("unavailable"); });
    return () => controller.abort();
  }, [retry]);

  async function changeSession(action: "login" | "logout", password?: FormDataEntryValue | null) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "login" ? { password } : {}),
      });
      const session = await response.json() as { signedIn?: boolean; error?: string };
      if (!response.ok) {
        setMessage(session.error ?? "Akses admin belum bisa diproses.");
        return;
      }
      setStatus(session.signedIn ? "signed-in" : "signed-out");
    } catch {
      setMessage("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get("password");
    form.reset();
    void changeSession("login", password);
  }

  return <main className="shell admin-page">
    <a className="brand" href="/" aria-label="CodaVibe Rater Lab, Beranda">
      <span className="brand-icon"><Activity size={23} strokeWidth={2.6} /></span>
      <span><strong>CodaVibe</strong><small>RATER LAB</small></span>
    </a>
    <header className="admin-heading">
      <span className="stat-icon cyan"><ShieldCheck size={24} /></span>
      <div><h1>Data peserta</h1><p>CodaVibe Rater Lab</p></div>
      {status === "signed-in" && <button className="button button-quiet logout-button" disabled={pending} onClick={() => void changeSession("logout")}>Keluar</button>}
    </header>
    {message && <p className="error" role="alert">{message}</p>}
    {status === "signed-in" ? <ParticipantsPanel /> : <section className="content-panel admin-blocked">
      <h2>Akses pengelola</h2>
      {status === "checking" ? <p role="status">Memeriksa sesi admin…</p>
        : status === "unavailable" ? <>
          <p role="alert">Status admin belum bisa diperiksa.</p>
          <button className="button button-secondary" onClick={() => { setStatus("checking"); setRetry((value) => value + 1); }}>Coba lagi</button>
        </> : <form className="login-form" onSubmit={login}>
          <label htmlFor="password">Kata sandi admin</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} />
          <button className="button button-primary" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</button>
        </form>}
    </section>}
  </main>;
}
