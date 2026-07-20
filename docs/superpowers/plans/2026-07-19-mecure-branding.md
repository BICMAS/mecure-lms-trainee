# MeCure Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand mecure-trainee from BICMAS LEARN to MeCure Excellence Academy with new colors, fonts, logo, Option B login, and internal renames.

**Architecture:** Token-first Tailwind `@theme` swap + string/identifier renames; redesign only `LoginPage.tsx` to split brand panel. Keep Capacitor `appId`.

**Tech Stack:** React, Vite, Tailwind v4 (`App.css` `@theme`), Capacitor

## Global Constraints

- Primary `#0056A6`, hover `#004785`, accent/success `#69BE28`, text `#333333`, bg `#F5F7FA`, warning `#F5A623`, error `#D32F2F`
- Fonts: Montserrat headings, Open Sans body
- Full name: MeCure Excellence Academy; subtitle: Digital Platform; short: MeCure Academy
- Logo: `/img/mecure-industries-logo.png`
- Keep `appId: com.bicmas.academy`; leave `scorm-exit.html` origins; leave Firebase/OneSignal project IDs
- No git repo in this workspace — skip commit steps

---

### Task 1: Tokens, fonts, metadata

**Files:** `App.css`, `index.html`, `package.json`, `metadata.json`, `capacitor.config.ts`, `public/manifest.json`

- [x] Update `@theme` brand colors + body/heading font CSS variables
- [x] Update `index.html` title, theme-color, Google Fonts, body styles
- [x] Update package/metadata/capacitor appName/manifest names and colors

### Task 2: Login Option B redesign

**Files:** `src/components/LoginPage.tsx`

- [x] Split layout: brand panel + form; mobile stack; primary CTA; MeCure naming; new logo; form id `mecure-academy-login-form`

### Task 3: User-facing copy + logo

**Files:** `Layout.tsx`, `CertificateModal.tsx`, `announcementService.ts`, `pushService.ts`, `public/service-worker.js`, Dashboard coin label if any

- [x] Replace BICMAS strings and logo paths

### Task 4: Internal renames

**Files:** `types.ts`, `DashboardPage.tsx`, `Dashboard.tsx`, `api/dashboard.ts`, `api/auth.ts`, `AuthContext.tsx`, `utils/device.ts`

- [x] `bicmasCoins` → `academyPoints`
- [x] `bicmas:auth-*` → `mecure:auth-*`
- [x] `bicmas_device_registered` → `mecure_device_registered`
- [x] SW cache/tags → `mecure-*`

### Task 5: Verify

- [x] Grep for remaining user-facing BICMAS (exclude android firebase, scorm-exit origin, docs)
- [x] Typecheck if available
