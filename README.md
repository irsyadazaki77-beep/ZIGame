# ZI GAME

Portal game HTML5 statis berbahasa Indonesia dengan koleksi arcade, action, puzzle, strategy, rhythm, platformer, dan simulation.

## Menjalankan secara lokal

Karena beberapa browser membatasi fitur offline dan module pada `file://`, jalankan server HTTP sederhana dari folder project:

```powershell
npx serve .
```

Lalu buka alamat yang ditampilkan server. Tidak ada dependency runtime selain browser modern.

## Fitur

- Portal game dengan pencarian, kategori, sorting, favorit, riwayat, profil, XP, achievement, dan pengaturan.
- Kontrol keyboard, mouse, touch, dan virtual control pada game yang mendukungnya.
- Tema gelap/terang serta preferensi reduced motion.
- Penyimpanan progres lokal di browser melalui `localStorage`.
- Offline shell progresif melalui service worker saat di-host lewat HTTPS atau localhost.
- Pemeriksaan otomatis link lokal dan syntax JavaScript melalui `npm run check`.

## Struktur penting

- `index.html` — portal utama.
- `profile.html` dan `settings.html` — profil serta preferensi.
- `game-shared.css`, `mobile-touch.js`, `sounds.js`, `site-runtime.js` — runtime bersama.
- `sw.js` dan `manifest.webmanifest` — dukungan PWA/offline.
- `scripts/validate.mjs` — pemeriksaan kualitas lokal/CI.

## Deploy ke GitHub Pages

Repository ini dapat di-deploy sebagai situs statis dari branch `main` melalui Settings → Pages → Deploy from a branch. Workflow kualitas akan berjalan pada setiap push dan pull request.

## Catatan lisensi

Kode portal dan implementasi game perlu diberi lisensi oleh pemilik repository. Beberapa judul game merujuk pada karya komersial; sebelum dipublikasikan untuk penggunaan komersial, tinjau kembali nama, logo, aset, musik, dan atribusinya.
