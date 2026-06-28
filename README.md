# 📺 Anime Checklist Tool

Strumento client-side per gestire le checklist degli anime stagionali, pensato per repository GitHub.

## 🚀 Deploy su GitHub Pages

### 1. Crea il repository

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/anime-checklist.git
git push -u origin main
```

### 2. Attiva GitHub Pages

1. Vai su **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Clicca **Save**

Dopo 1-2 minuti il sito sarà disponibile su:
`https://TUO-USERNAME.github.io/anime-checklist/`

---

## ➕ Aggiungere una nuova stagione

1. Crea il file JSON nella cartella `data/`:

```json
[
  {
    "title": "Titolo Anime",
    "date": "07/01",
    "platform": "CR",
    "dub": "si",
    "genres": "Action, Fantasy",
    "kvdate": "2027-01-07",
    "notes": ""
  }
]
```

Piattaforme disponibili: `CR` (Crunchyroll), `NF` (Netflix), `D+` (Disney+), `AP` (Amazon Prime)  
Dub: `si` oppure `no`

2. Aggiungi la voce a `data/seasons.json`:

```json
{
  "id": "inverno-2027",
  "title": "Inverno 2027",
  "file": "inverno-2027.json"
}
```

3. Fai il commit e push → la stagione apparirà automaticamente nel menu.

---

## 📁 Struttura progetto

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js       ← controller principale
│   ├── storage.js   ← localStorage helpers
│   ├── ui.js        ← rendering DOM
│   ├── filters.js   ← logica filtri
│   └── loader.js    ← caricamento JSON e file
├── data/
│   ├── seasons.json          ← manifest stagioni
│   ├── estate-2026.json
│   ├── primavera-2026.json
│   ├── inverno-2026.json
│   └── autunno-2025.json
└── README.md
```

---

## ✅ Funzionalità

- ✅ Solo tema scuro
- ✅ Caricamento stagioni da `seasons.json`
- ✅ Import JSON (pulsante + drag & drop)
- ✅ Checkbox completati con aggiornamento live
- ✅ Statistiche in tempo reale
- ✅ Ricerca istantanea
- ✅ Filtri: piattaforma, stato, Dub ITA
- ✅ Copia testi con `navigator.clipboard`
- ✅ Persistenza con localStorage
- ✅ Completamente client-side
