import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Activity, AudioLines, BookOpen, Check, CheckCircle2, ClipboardCheck, Clock3,
  FileText, GraduationCap, Headphones, House, Layers3, ListChecks, Play, RotateCcw,
  ShieldCheck, Target, X,
} from "lucide-react";
import { caseCount, matchesAnswer, modules, type Module, type Question } from "./curriculum";

const icons = { cyan: FileText, violet: AudioLines, blue: Layers3, mint: ClipboardCheck };
type Progress = Record<string, number>;
type Route = { section: "beranda" | "materi" | "latihan"; module?: Module };
type Registration = "checking" | "required" | "done" | "failed";

function readRoute(): Route {
  const [section, id] = window.location.hash.slice(1).split("/");
  if (section !== "materi" && section !== "latihan") return { section: "beranda" };
  return { section, module: modules.find((module) => module.id === id) };
}

function readProgress(key: string): Progress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
    if (typeof value !== "object" || value === null) return {};
    const record = value as Record<string, unknown>;
    return Object.fromEntries(modules.flatMap(({ id, questions }) => {
      const score = record[id];
      return typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= questions.length
        ? [[id, score]] : [];
    }));
  } catch {
    return {};
  }
}

function Brand() {
  return <a className="brand" href="#beranda" aria-label="CodaVibe Rater Lab, Beranda">
    <span className="brand-icon"><Activity size={23} strokeWidth={2.6} /></span>
    <span><strong>CodaVibe</strong><small>RATER LAB</small></span>
  </a>;
}

export function Lab() {
  const [route, setRoute] = useState<Route>({ section: "beranda" });
  const [progress, setProgress] = useState<Progress>({});
  const [registration, setRegistration] = useState<Registration>("checking");
  const [retry, setRetry] = useState(0);
  const storageKey = "codavibe-rater-progress-v1";
  const completed = Object.keys(progress).length;
  const recommended = modules.find(({ id }) => progress[id] === undefined) ?? modules[0];
  const active = route.module;
  const practice = route.section === "latihan" && Boolean(active);
  const canPractice = practice && registration === "done";

  useEffect(() => {
    const sync = () => setRoute(readRoute());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => { setProgress(readProgress(storageKey)); }, [storageKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/participant", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return "failed";
        const data = await response.json() as { registered?: boolean };
        return data.registered ? "done" : "required";
      }).then((state) => {
        if (!controller.signal.aborted) setRegistration(state as Registration);
      }).catch(() => { if (!controller.signal.aborted) setRegistration("failed"); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (active || route.section === "beranda") {
        window.scrollTo(0, 0);
      } else {
        document.getElementById(route.section)?.scrollIntoView();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [route, canPractice]);

  function recordScore(moduleId: string, score: number) {
    const updated = { ...progress, [moduleId]: Math.max(progress[moduleId] ?? 0, score) };
    setProgress(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* Progress stays in memory. */ }
  }

  return <>
    <a className="skip" href="#main" onClick={(event) => {
      event.preventDefault();
      document.getElementById("main")?.focus();
    }}>Langsung ke konten</a>
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Navigasi utama">
          <a href="#beranda" aria-current={route.section === "beranda" ? "page" : undefined}><House size={17} /> Beranda</a>
          <a href="#materi" aria-current={route.section === "materi" ? "page" : undefined}><BookOpen size={17} /> Materi</a>
          <a href="#latihan" aria-current={route.section === "latihan" ? "page" : undefined}><ListChecks size={17} /> Latihan</a>
        </nav>
        <a className="button button-small button-quiet admin-link" href="/admin"><ShieldCheck size={17} /> Admin</a>
      </div>
    </header>

    <main className="shell site-main" id="main" tabIndex={-1}>
      {active && route.section === "materi" ? <Lesson module={active} />
        : active && canPractice ? <Practice key={active.id} module={active} onComplete={recordScore} />
        : <>
          <section className="hero" id="beranda">
            <div className="hero-art" aria-hidden="true" />
            <div className="hero-content">
              <div className="eyebrow">CODAVIBE COMMUNITY</div>
              <h1>Ruang Belajar<br /><span>AI Rater Indonesia</span></h1>
              <p>Latih telinga dan ketelitianmu. Pelajari transkripsi, pelabelan audio, dan quality check lewat simulasi interaktif.</p>
              <div className="actions">
                <a className="button button-primary" href={"#latihan/" + recommended.id}><Play size={17} fill="currentColor" /> Mulai latihan</a>
                <a className="button button-secondary" href="#materi"><BookOpen size={17} /> Lihat materi</a>
              </div>
            </div>
          </section>

          <section className="stats" aria-label="Ringkasan ruang belajar">
            <div className="stat"><span className="stat-icon cyan"><BookOpen size={21} /></span><div><strong>{modules.length} modul</strong><small>Materi belajar</small></div></div>
            <div className="stat"><span className="stat-icon violet"><Headphones size={21} /></span><div><strong>{caseCount} kasus</strong><small>Latihan interaktif</small></div></div>
            <div className="stat progress-stat"><span className="stat-icon mint"><Target size={21} /></span><div><strong>{completed} / {modules.length} modul</strong><small>Progresmu di perangkat ini</small></div><progress aria-label="Progres modul" value={completed} max={modules.length} /></div>
          </section>

          <section className="modules-section" id={route.section === "latihan" ? "latihan" : "materi"}>
            <div className="section-header">
              <div>
                <h2>{route.section === "latihan" ? "Pilih latihan" : "Jalur belajar"}</h2>
                <p>{route.section === "latihan" ? "Jawab kasus, cek pembahasannya, dan lihat skormu." : "Dari ketepatan transkripsi hingga keputusan reviewer."}</p>
              </div>
              <span className="section-meta"><GraduationCap size={17} /> Pemula hingga menengah</span>
            </div>

            <div className="module-grid">
              {modules.map((module) => {
                const Icon = icons[module.color];
                const score = progress[module.id];
                const isExerciseList = route.section === "latihan";
                return <article className={"module-card " + module.color} key={module.id}>
                  <div className="module-top"><span className="module-icon"><Icon size={24} /></span><span className="level">{module.level}</span></div>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <div className="module-meta"><span><Clock3 size={15} /> {module.duration} menit</span><span>{module.questions.length} kasus</span></div>
                  <div className="module-foot">
                    <a href={"#" + (isExerciseList ? "latihan/" : "materi/") + module.id}>{isExerciseList ? "Buka latihan" : "Buka modul"}<span className="sr-only"> {module.title}</span></a>
                    {score !== undefined && <span className="completed-label"><Check size={15} /> {score}/{module.questions.length}</span>}
                  </div>
                </article>;
              })}
            </div>
          </section>

          <section className="practice-note">
            <span className="stat-icon blue"><Headphones size={21} /></span>
            <div><h2>Siapkan headphone sebelum latihan audio</h2><p>Kasus memakai skenario bahasa Indonesia serta klip sintetis bahasa Inggris dan bunyi latar.</p></div>
          </section>
        </>}

      {practice && active && registration !== "done" && <RegistrationDialog
        module={active}
        registration={registration}
        onClose={() => { window.location.hash = "#latihan"; }}
        onRetry={() => { setRegistration("checking"); setRetry((value) => value + 1); }}
        onRegistered={() => setRegistration("done")}
      />}
    </main>

    <footer className="site-footer"><div className="shell footer-inner"><span>CodaVibe Community <span className="footer-sep">/</span> AI Rater Indonesia</span></div></footer>
  </>;
}

function Lesson({ module }: { module: Module }) {
  const Icon = icons[module.color];
  return <div className={"lesson layout-narrow " + module.color}>
    <a href="#materi" className="back-link">Kembali ke materi</a>
    <header className="detail-header">
      <span className="module-icon"><Icon size={25} /></span>
      <div><div className="detail-meta">{module.level} <span>•</span> {module.duration} menit</div><h1>{module.title}</h1><p>{module.description}</p></div>
    </header>
    <div className="lesson-content">
      <article className="content-panel">
        <h2>Yang perlu kamu kuasai</h2>
        {module.sections.map((section) => <section className="concept" key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}
      </article>
      <aside className="content-panel worked-example">
        <h2>Contoh kasus</h2>
        <p>{module.example.situation}</p>
        <blockquote>{module.example.answer}</blockquote>
        <p>{module.example.reasoning}</p>
      </aside>
    </div>
    <div className="lesson-actions"><p>{module.questions.length} kasus dengan skor dan pembahasan.</p><a className="button button-primary" href={"#latihan/" + module.id}><Play size={17} fill="currentColor" /> Mulai latihan modul</a></div>
  </div>;
}

function RegistrationDialog({ module, registration, onClose, onRetry, onRegistered }: {
  module: Module; registration: Registration;
  onClose: () => void; onRetry: () => void; onRegistered: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setMessage("");
    setPending(true);
    try {
      const response = await fetch("/api/participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fields.get("name"), email: fields.get("email"), linkedIn: fields.get("linkedIn") }),
      });
      const data = await response.json() as { registered?: boolean; error?: string };
      if (!response.ok || data.registered !== true) {
        setMessage(data.error ?? "Pendaftaran belum tersimpan. Coba lagi.");
        return;
      }
      onRegistered();
    } catch {
      setMessage("Pendaftaran belum tersimpan. Periksa koneksi dan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return <dialog ref={dialog} className="registration-dialog" aria-labelledby="registration-title" onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }}>
    <button className="icon-button dialog-close" type="button" aria-label="Tutup formulir" onClick={onClose} disabled={pending}><X size={22} /></button>
    <span className="stat-icon cyan"><GraduationCap size={23} /></span>
    <h2 id="registration-title">Formulir peserta</h2>
    <p className="dialog-intro">Daftar sekali untuk mengerjakan latihan, termasuk {module.title}.</p>
    {registration === "checking" ? <p role="status">Memeriksa pendaftaran…</p>
      : registration === "failed" ? <div><p role="alert">Status pendaftaran belum bisa diperiksa.</p><button className="button button-secondary" onClick={onRetry}>Coba lagi</button></div>
      : <form onSubmit={register}>
        <label htmlFor="name">Nama lengkap</label>
        <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nama kamu" />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="nama@contoh.com" />
        <label htmlFor="linkedIn">Profil LinkedIn</label>
        <input id="linkedIn" name="linkedIn" type="url" required maxLength={300} autoComplete="url" placeholder="https://www.linkedin.com/in/nama" />
        <p className="form-note"><ShieldCheck size={17} /> Pengelola CodaVibe mengakses data ini untuk mendata peserta latihan.</p>
        {message && <p className="error" role="alert">{message}</p>}
        <button className="button button-primary full-width" disabled={pending}>{pending ? "Menyimpan…" : "Daftar dan mulai latihan"}</button>
      </form>}
  </dialog>;
}

function Player({ clip }: { clip: NonNullable<Question["audio"]> }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState("1");

  function rewind() {
    if (audio.current) audio.current.currentTime = Math.max(0, audio.current.currentTime - 3);
  }

  return <div className="audio-player">
    <div className="audio-header"><AudioLines size={20} /><p>{clip.label}</p></div>
    <audio ref={audio} src={"/audio/" + clip.file + ".mp3"} controls preload="metadata" aria-label={clip.label} />
    <div className="audio-tools">
      <button className="button button-small button-quiet" type="button" onClick={rewind}><RotateCcw size={15} /> Mundur 3 detik</button>
      <label>Kecepatan <select value={rate} onChange={(event) => {
        setRate(event.target.value);
        if (audio.current) audio.current.playbackRate = Number(event.target.value);
      }}><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option></select></label>
    </div>
  </div>;
}

function Practice({ module, onComplete }: { module: Module; onComplete: (id: string, score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<number | string | null>(module.questions[0].draft ?? null);
  const [graded, setGraded] = useState<boolean | null>(null);
  const [scores, setScores] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const questionTitle = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const question = module.questions[index];
  const total = module.questions.length;
  const score = scores.filter(Boolean).length;
  const answer = typeof question.answer === "number" ? question.options?.[question.answer] : question.answer;

  function grade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value === null || graded !== null || (typeof value === "string" && !value.trim())) return;
    const correct = matchesAnswer(value, question.answer);
    setGraded(correct);
    setScores((previous) => [...previous, correct]);
    window.requestAnimationFrame(() => feedback.current?.focus());
  }

  function loadQuestion(next: number) {
    setIndex(next);
    setGraded(null);
    setValue(module.questions[next].draft ?? null);
    window.requestAnimationFrame(() => questionTitle.current?.focus());
  }

  function advance() {
    if (index + 1 === total) {
      onComplete(module.id, score);
      setFinished(true);
      window.requestAnimationFrame(() => questionTitle.current?.focus());
    } else {
      loadQuestion(index + 1);
    }
  }

  function repeat() {
    setScores([]);
    setFinished(false);
    loadQuestion(0);
  }

  return <div className={"practice layout-narrow " + module.color}>
    <a className="back-link" href={"#materi/" + module.id}>Kembali ke modul</a>
    {finished ? <section className="content-panel results">
      <span className="module-icon"><Target size={28} /></span>
      <h1 tabIndex={-1} ref={questionTitle}>Latihan selesai</h1>
      <p>{module.title}</p>
      <strong className="result-score">{score}<span> / {total}</span></strong>
      <p>{score === total ? "Semua jawaban sesuai dengan konvensi latihan." : "Buka kembali materi atau ulangi latihan untuk menguji pemahamanmu."}</p>
      <div className="actions"><button className="button button-secondary" onClick={repeat}><RotateCcw size={17} /> Ulangi latihan</button><a className="button button-primary" href="#latihan">Pilih latihan lain</a></div>
    </section> : <>
      <div className="practice-top"><h1>{module.title}</h1><span>Kasus {index + 1} dari {total}</span></div>
      <progress className="quiz-progress" value={index + 1} max={total} aria-label={"Kasus " + (index + 1) + " dari " + total} />
      <section className="content-panel question-panel">
        <h2 ref={questionTitle} tabIndex={-1}>{question.title}</h2>
        <p className="question-prompt">{question.prompt}</p>
        {question.audio && <Player key={question.audio.file} clip={question.audio} />}
        <form onSubmit={grade}>
          {question.options ? <fieldset className="options" disabled={graded !== null}>
            <legend className="sr-only">Pilih jawaban</legend>
            {question.options.map((option, position) => {
              const selected = value === position;
              const state = graded !== null && question.answer === position ? "correct" : graded === false && selected ? "incorrect" : selected ? "selected" : "";
              return <label className={"option " + state} key={option}>
                <input type="radio" name="choice" checked={selected} onChange={() => setValue(position)} />
                <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + position)}</span>
                <span>{option}</span>
                {state === "correct" && <Check size={18} className="option-mark" />}
                {state === "incorrect" && <X size={18} className="option-mark" />}
              </label>;
            })}
          </fieldset> : <div className="transcript-input">
            <label htmlFor="transcript">Sunting transkripsi</label>
            <textarea id="transcript" value={typeof value === "string" ? value : ""} onChange={(event) => setValue(event.target.value)} rows={3} maxLength={500} readOnly={graded !== null} />
          </div>}
          {graded === null && <button className="button button-primary" disabled={value === null || (typeof value === "string" && !value.trim())}><CheckCircle2 size={17} /> Periksa jawaban</button>}
        </form>
        {graded !== null && <>
          <div className={"feedback " + (graded ? "good" : "review")} ref={feedback} tabIndex={-1}>
            <h3>{graded ? "Jawaban tepat" : "Mari lihat pembahasannya"}</h3>
            {!graded && <p><strong>Jawaban acuan</strong> {answer}</p>}
            <p>{question.feedback}</p>
          </div>
          <button className="button button-primary" onClick={advance}>{index + 1 === total ? "Lihat skor" : "Kasus berikutnya"}</button>
        </>}
      </section>
    </>}
  </div>;
}
