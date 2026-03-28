# Yashaswi Alur Prasannakumar — Portfolio

## Stack
- **React 18** + **Vite 5**
- **Google Fonts** — Playfair Display + DM Sans
- **Formspree** — contact form backend
- **Vercel** — hosting

---

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

---

## Deploy to Vercel (with apyashaswi.com)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import project from GitHub
3. Vercel auto-detects Vite — no config needed, just click **Deploy**
4. Go to **Settings → Domains** → Add `apyashaswi.com`
5. In GoDaddy DNS settings, add:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME**: `www` → `cname.vercel-dns.com`

---

## One-Time Setup Tasks

### 1. Contact Form (Formspree)
1. Sign up free at [formspree.io](https://formspree.io)
2. Create a new form — you'll get a form ID like `xabc1234`
3. In `src/App.jsx`, replace `YOUR_FORM_ID` with your actual ID:
   ```
   action="https://formspree.io/f/xabc1234"
   ```

### 2. Profile Photo
- Add a headshot as `public/headshot.jpg`
- Then in `About` section in App.jsx, add an `<img>` element

### 3. OG Image
- Add a 1200×630px banner image as `public/og-image.jpg`
- Already referenced in `index.html`

### 4. Favicon
- Replace `public/favicon.svg` with your actual favicon

---

## Sections Included

| # | Section | What's in it |
|---|---------|-------------|
| 01 | About | Value prop, education cards, stats |
| 02 | Experience | MSIG (current), Cratel, PES Dean's Office |
| 03 | Projects | Spidey Sense (featured), Warehouse, FireTamer, UAV Twin |
| 04 | Research | ARIMA-LLM thesis + 2 publications |
| 05 | Skills | 4 domain groups with tags |
| 06 | Leadership | GSG Senator, ICXR, Shunya, Samarpana, IEEE |
| 07 | Case Studies | Top 4 supply chain cases |
| 08 | Contact | Formspree form + links |

---

## SEO Checklist (already done in index.html)
- [x] Title tag
- [x] Meta description
- [x] Open Graph tags (og:title, og:description, og:image, og:url)
- [x] Twitter Card tags
- [x] JSON-LD Person schema
- [x] Canonical URL
- [x] Google Fonts preconnect

## After launch — update in index.html:
- `og:image` → real URL once deployed
- `og:url` → `https://apyashaswi.com`
- `canonical` → `https://apyashaswi.com`
