# Mingalar Edu

Astro static site for English and Myanmar routes. The Myanmar edition intentionally keeps English copy with a translation TODO comment.

Use Node.js 22.12 or newer:

```sh
npm install
npm run dev
npm run check
npm test
npm run build
npm run verify
SHOW_DRAFT_FEES=1 npm run build
SHOW_DRAFT_FEES=1 npm run verify
```

PowerShell draft preview:

```powershell
$env:SHOW_DRAFT_FEES = '1'
npm run build
npm run verify
Remove-Item Env:SHOW_DRAFT_FEES
```

The default production build hides draft service fees, the voucher and all fee data from public HTML and client assets. Draft preview output must not be deployed. The Pages workflow forces production mode and deploys only from `main`; this feature branch requires Young's approval before merge.

School, product and fee information lives in `src/data/*.json`. Unknown values use `TODO` and display as “Contact us”. Every monetary or requirement record has `source` and `asof`; unresolved provenance emits build warnings. Replace placeholders with verified source URLs and dates before publishing confirmed costs or requirements.

Guides live in `src/content/guide/*.md` and use the schema in `src/content.config.ts`. Their visible FAQs generate the same FAQPage JSON-LD; the guide frontmatter generates Article metadata. Add fee displays through the shared Fees component to retain the production draft gate.

Tailwind is built locally using the preserved theme in `tailwind.config.mjs`. Noto Sans Myanmar is bundled from Fontsource under its SIL Open Font License. The matcher runs only on the client, collects no identifying details and performs no storage or network requests.
