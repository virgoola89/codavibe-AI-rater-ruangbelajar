import { createRoot } from "react-dom/client";
import { AdminPage } from "./admin";
import { Lab } from "./lab";
import "./globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemen utama tidak ditemukan.");

const admin = window.location.pathname.replace(/\/$/, "") === "/admin";
if (admin) document.title = "Data Peserta | CodaVibe Rater Lab";
createRoot(root).render(admin ? <AdminPage /> : <Lab />);
