export type Question = {
  title: string;
  prompt: string;
  audio?: { file: string; label: string };
  draft?: string;
  options?: string[];
  answer: string | number;
  feedback: string;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  level: "Pemula" | "Menengah";
  duration: number;
  color: "cyan" | "violet" | "blue" | "mint";
  sections: { title: string; body: string }[];
  example: { situation: string; answer: string; reasoning: string };
  questions: Question[];
};

export const modules: Module[] = [
  {
    id: "transkripsi", title: "Transkripsi Verbatim", level: "Pemula", duration: 8, color: "cyan",
    description: "Tangkap ucapan sebagaimana terdengar, termasuk jeda, pengulangan, dan kata pengisi.",
    sections: [
      { title: "Dengarkan klip sebelum menyunting", body: "Putar klip dari awal untuk memahami kalimat utuh. Ulangi bagian pendek saat perlu. Periksa batas segmen agar konteks dari bagian sebelumnya tidak ikut tertulis." },
      { title: "Pertahankan jejak cara orang berbicara", body: "Transkripsi verbatim mempertahankan kata pengisi, pengulangan, dan koreksi yang terdengar. Dalam latihan ini, tanda hubung menandai kata yang terputus dan elipsis menandai jeda panjang atau kalimat yang menggantung." },
      { title: "Nyatakan ketidakpastian", body: "Jika sebuah kata tetap tak bisa dikenali setelah diputar ulang, gunakan [tidak jelas]. Gunakan tanda baca seperlunya untuk membuat ujaran terbaca sambil menjaga maksud pembicara." },
    ],
    example: {
      situation: "Dalam satu segmen, seseorang berkata: “Aku, eh, aku udah kirim drafnya.”",
      answer: "Aku, eh, aku udah kirim drafnya.",
      reasoning: "Kata pengisi, pengulangan, dan bentuk percakapan “udah” tetap tercatat.",
    },
    questions: [
      {
        title: "Kata pengisi yang hilang",
        prompt: "Putar audio berbahasa Inggris. Pilih transkripsi yang paling setia pada ucapan yang kamu dengar.",
        audio: { file: "verbatim", label: "Ucapan bahasa Inggris • suara sintetis" },
        options: ["I left the blue folder by the door.", "I, um, left the blue folder by the door.", "Um, the blue folder is by the door."],
        answer: 1,
        feedback: "Kata pengisi “um” terdengar setelah “I”. Pilihan kedua juga mempertahankan urutan kata aslinya.",
      },
      {
        title: "Awal kata terputus",
        prompt: "Pembicara berhenti setelah bunyi “ka”, lalu segera mengulang kata “kartu”. Koreksi draf dengan konvensi tanda hubung dari materi.",
        draft: "Tolong ambil kartu itu.",
        answer: "Tolong ambil ka- kartu itu.",
        feedback: "Fragmen “ka-” mencatat awal kata yang terputus sebelum pembicara mengucapkan kata lengkapnya.",
      },
      {
        title: "Kata yang tertutup bunyi",
        prompt: "Dalam “Titip barangnya ke … sore ini”, suara mesin menutup seluruh nama penerima. Setelah diputar ulang, namanya tetap tak dikenali. Pilih hasil transkripsinya.",
        options: ["Titip barangnya ke Rani sore ini.", "Titip barangnya sore ini.", "Titip barangnya ke [tidak jelas] sore ini."],
        answer: 2,
        feedback: "Penanda ketidakjelasan menempatkan bagian yang hilang pada posisi yang tepat. Nama penerima memerlukan bukti audio.",
      },
    ],
  },
  {
    id: "pelabelan", title: "Pelabelan Audio", level: "Pemula", duration: 8, color: "violet",
    description: "Bedakan bunyi pembicara, kebisingan latar, dan gaya bicara yang jelas terdengar.",
    sections: [
      { title: "Identifikasi sumber bunyi", body: "Tentukan apakah bunyi dibuat oleh pembicara atau berasal dari lingkungan. Di latihan ini, batuk yang jelas dari pembicara diberi label pada titik terjadinya. Bunyi lingkungan diberi label berdasarkan sumber yang paling bisa dikenali." },
      { title: "Beri label pada bunyi yang relevan", body: "Dalam segmen khusus kebisingan, pilih satu label untuk bunyi dominan. Gunakan frasa singkat yang spesifik, misalnya [hujan] atau [derau statis]. Untuk suara napas, perhatikan apakah bunyinya cukup jelas dan berbeda dari napas percakapan sehari-hari." },
      { title: "Nilai gaya dari cara pengucapan", body: "Volume, intonasi, dan ritme bisa membantu mengenali bisikan atau teriakan. Isi gaya bicara saat bukti vokalnya jelas. Kolom boleh dikosongkan jika cara bicaranya terdengar biasa atau ambigu." },
    ],
    example: {
      situation: "Seseorang berkata “Besok kita lanjut”, tertawa, lalu menambahkan “setelah makan siang.”",
      answer: "Besok kita lanjut [tertawa] setelah makan siang.",
      reasoning: "Tawa terdengar jelas, berasal dari pembicara, dan muncul di tengah ujarannya.",
    },
    questions: [
      {
        title: "Segmen khusus kebisingan",
        prompt: "Putar klip simulasi dan pilih satu label untuk bunyi yang mendominasi segmen.",
        audio: { file: "static", label: "Bunyi sintetis • tanpa dialog" },
        options: ["[ketukan pintu]", "[musik latar]", "[derau statis]"],
        answer: 2,
        feedback: "Klip berisi desis dan gemeretak yang terus terdengar. Label [derau statis] paling spesifik untuk bunyi tersebut.",
      },
      {
        title: "Batuk di tengah ucapan",
        prompt: "Pada rekaman “Nanti aku kirim tautannya”, pembicara batuk tepat setelah kata “aku”. Letakkan tag [batuk] di posisi yang tepat.",
        draft: "Nanti aku kirim tautannya.",
        answer: "Nanti aku [batuk] kirim tautannya.",
        feedback: "Batuk yang jelas berasal dari pembicara, sehingga tag ditempatkan sesudah kata “aku”, pada saat bunyi itu muncul.",
      },
      {
        title: "Bukti gaya bicara",
        prompt: "Orang bercerita tentang kabar mengejutkan dengan suara datar dan volume wajar. Bagaimana mengisi kolom gaya bicara?",
        options: ["Kosongkan kolom gaya bicara.", "Tulis “terkejut” karena topiknya mengejutkan.", "Tulis “berbisik” karena ia tidak meninggikan suara."],
        answer: 0,
        feedback: "Topik cerita tidak menentukan gaya penyampaiannya. Pada kasus ini tidak terdengar ciri vokal yang cukup untuk memberi label gaya.",
      },
    ],
  },
  {
    id: "tumpang-tindih", title: "Ujaran Tumpang Tindih", level: "Menengah", duration: 9, color: "blue",
    description: "Kenali interupsi, petakan bagian yang bersamaan, dan cek atribusi penutur.",
    sections: [
      { title: "Bedakan bersamaan dan bergantian", body: "Overlap terjadi ketika dua orang bersuara pada saat yang sama. Respons singkat yang baru mulai setelah ucapan sebelumnya selesai tetap termasuk pergantian giliran." },
      { title: "Batasi rentang overlap", body: "Dengarkan lagi dari sebelum kedua suara bertemu. Tandai awal dan akhir bagian yang bersamaan. Rentang yang terlalu lebar membuat ucapan yang sebenarnya tunggal ikut ditandai." },
      { title: "Periksa kepemilikan ujaran", body: "Catat kata setiap orang pada jalur pembicaranya. Gunakan petunjuk suara yang bisa diulang seperti pitch, timbre, posisi stereo, dan kesinambungan kalimat." },
    ],
    example: {
      situation: "A berkata “Kita mulai hari Rabu.” Pada kata “Rabu”, B berkata “Siap”. Kata “Siap” selesai setelah A berhenti.",
      answer: "Overlap dimulai saat “Siap” masuk dan berakhir saat suara A selesai.",
      reasoning: "Ekor kata “Siap” setelah A berhenti merupakan suara B saja.",
    },
    questions: [
      {
        title: "Interupsi yang terdengar",
        prompt: "Putar simulasi dua suara dalam bahasa Inggris. Apa yang terjadi saat suara kedua berkata “Good idea”?",
        audio: { file: "overlap", label: "Dua suara sintetis • bahasa Inggris" },
        options: ["Pembicara pertama berhenti sebelum suara kedua masuk.", "Suara kedua masuk ketika pembicara pertama masih berbicara.", "Kedua suara mengucapkan kalimat yang sama."],
        answer: 1,
        feedback: "Suara kedua masuk di tengah kalimat pertama. Dua suara dapat terdengar bersamaan pada sebagian klip.",
      },
      {
        title: "Batas overlap pada garis waktu",
        prompt: "A terdengar pada 0,4–3,0 detik. B terdengar pada 2,4–4,1 detik. Rentang mana yang perlu ditandai sebagai overlap?",
        options: ["0,4–4,1 detik", "3,0–4,1 detik", "2,4–3,0 detik"],
        answer: 2,
        feedback: "Kedua jalur beririsan mulai saat B masuk pada 2,4 detik hingga A berhenti pada 3,0 detik.",
      },
      {
        title: "Balasan cepat",
        prompt: "A selesai berkata “Sudah dibaca?” pada detik 2,1. B mulai berkata “Sudah” pada detik 2,2. Bagaimana hubungan kedua ujaran ini?",
        options: ["Pergantian giliran.", "Overlap pada seluruh klip.", "Overlap hanya pada kata “Sudah”."],
        answer: 0,
        feedback: "Ada jarak 0,1 detik antara akhir ujaran A dan awal ujaran B. Kecepatan respons tidak menciptakan overlap.",
      },
    ],
  },
  {
    id: "qa", title: "Pemeriksaan Kualitas", level: "Menengah", duration: 10, color: "mint",
    description: "Bandingkan draf dengan audio, temukan kesalahan yang mengubah makna, dan putuskan perbaikannya.",
    sections: [
      { title: "Mulai dari makna dan kelengkapan", body: "Bandingkan draf dengan audio per segmen. Periksa angka, nama, negasi, kata yang hilang, serta sumber ujaran. Salah dengar satu angka bisa mengubah informasi inti meski kalimatnya terlihat rapi." },
      { title: "Pisahkan verifikasi isi dari perapian", body: "Setelah kata-katanya sesuai audio, periksa format angka, tanda baca, dan konsistensi label. Di lab ini, angka ditulis dengan digit dan label bunyi menggunakan kurung siku." },
      { title: "Ulangi dari awal sebelum menyelesaikan", body: "Putar klip dengan kecepatan normal untuk memeriksa alur. Kaitkan keputusan QC dengan bukti yang dapat didengar atau dengan konvensi yang disebut dalam soal." },
    ],
    example: {
      situation: "Audio berisi “Pesananku belum datang.” Draf berbunyi “Pesananku sudah datang.”",
      answer: "Pesananku belum datang.",
      reasoning: "Mengganti “belum” dengan “sudah” membalikkan makna pernyataan.",
    },
    questions: [
      {
        title: "Koreksi angka",
        prompt: "Putar audio berbahasa Inggris. Sunting draf agar urutan angka cocok dengan ucapan. Tulis angka dengan digit.",
        audio: { file: "review", label: "Ucapan bahasa Inggris • suara sintetis" },
        draft: "Wait, I said 50, not 15.",
        answer: "Wait, I said 15, not 50.",
        feedback: "Urutan yang terdengar adalah “fifteen, not fifty”. Pembalikan angka pada draf mengubah inti ucapan.",
      },
      {
        title: "Konteks berbeda dari audio",
        prompt: "Catatan latar menyebut acara di Bandung. Segmen hanya berisi “Kita mulai jam delapan.” Pilih transkripsi sesuai konvensi latihan.",
        options: ["Kita mulai jam 8 di Bandung.", "Acara di Bandung dimulai jam 8.", "Kita mulai jam 8."],
        answer: 2,
        feedback: "Catatan latar membantu memahami topik, tetapi kata “Bandung” tidak terdengar pada segmen. Angka ditulis sebagai digit dalam latihan ini.",
      },
      {
        title: "Ucapan lintas bahasa",
        prompt: "Pada segmen “Kirim before lunch, ya”, soal menetapkan bahwa frasa bahasa lain yang jelas harus ditulis sebagaimana terdengar. Pilih koreksi terbaik.",
        options: ["Kirim sebelum makan siang, ya.", "Kirim before lunch, ya.", "Kirim [tidak jelas], ya."],
        answer: 1,
        feedback: "Frasa “before lunch” terdengar jelas. Mempertahankannya mencatat perpindahan bahasa dan kata yang sebenarnya diucapkan.",
      },
    ],
  },
];

export const caseCount = modules.reduce((total, module) => total + module.questions.length, 0);

export function matchesAnswer(value: string | number, answer: string | number) {
  if (typeof value === "number" || typeof answer === "number") return value === answer;
  const normalize = (text: string) => text.normalize("NFC").toLowerCase()
    .replace(/[.,?!…]+/g, " ").replace(/\s+/g, " ").trim();
  return normalize(value) === normalize(answer);
}
