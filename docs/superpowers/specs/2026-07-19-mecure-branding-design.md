# MeCure Excellence Academy Branding Refactor

**Date:** 2026-07-19  
**App:** `mecure-trainee`  
**Approach:** Token-first full rebrand + industry-standard login redesign (Option B)

## Goal

Replace all BICMAS LEARN branding with **MeCure Excellence Academy** (subtitle: **Digital Platform**), apply MeCure brand colors and corporate fonts, swap the logo, and rename internal identifiers where safe. Redesign only the login page; leave other layouts unchanged aside from inherited token/color updates.

## Brand system

### Identity

| Role | Value |
|------|--------|
| Full name | MeCure Excellence Academy |
| Subtitle | Digital Platform |
| Short name | MeCure Academy |
| Logo | `/img/mecure-industries-logo.png` (existing asset in `public/img/`) |

### Colors

| Token / role | Hex | Usage |
|--------------|-----|--------|
| `brand-primary` | `#0056A6` | Primary CTAs, links, active nav |
| `brand-primary-dark` | `#004785` | CTA hover |
| `brand-primary-light` | `#1A6BB8` (derived) | Secondary primary surfaces |
| `brand-accent` | `#69BE28` | Success / secondary accent (replaces gold) |
| `brand-accent-dark` | `#569B20` (derived) | Accent hover |
| Dark grey | `#333333` | Primary text |
| Light grey | `#F5F7FA` | Page / app background |
| Warning | `#F5A623` | Warning states |
| Error | `#D32F2F` | Error states / form errors |

### Typography

- **Headings:** Montserrat (Google Fonts)
- **Body / form:** Open Sans (Google Fonts)
- Load via `index.html`; apply `font-family` on `body` (Open Sans) and heading elements / utility classes for Montserrat

## Login page redesign (Option B — Split brand panel)

### Desktop

- Two-column layout (~45–50% left / remainder right)
- **Left panel:** Gradient `#0056A6` → `#004785`, logo, full name (Montserrat), subtitle in green (`#69BE28`), one short supporting line
- **Right panel:** White form surface — Email/Phone toggle, existing fields, primary Sign-in CTA (`#0056A6` / hover `#004785`), errors in `#D32F2F`
- Preserve current auth behavior (email vs phone login); no new auth flows

### Mobile

- Stacked: compact brand strip on top, form below
- Same controls and validation as today

### Out of scope for login

- No illustration/photography beyond logo
- No social login
- No layout redesign of dashboard/sidebar beyond logo + token inheritance

## Naming renames

### User-facing

| Current | New |
|---------|-----|
| BICMAS LEARN | MeCure Excellence Academy (or MeCure Academy where space-constrained) |
| Trainee Learning Portal (login subtitle) | Digital Platform |
| Install BICMAS LEARN | Install MeCure Academy |
| Notification titles / share copy | MeCure Excellence Academy / MeCure Academy |
| PWA `name` | MeCure Excellence Academy |
| PWA `short_name` | MeCure Academy |
| Document `<title>` / theme-color | MeCure Academy / `#0056A6` |
| Manifest icons / notification icon paths | `/img/mecure-industries-logo.png` |

### Internal / package (full rebrand)

| Current | New |
|---------|-----|
| `bicmasCoins` | `academyPoints` (still mapped from API `points`) |
| `bicmas:auth-expired` / `bicmas:auth-refreshed` | `mecure:auth-expired` / `mecure:auth-refreshed` |
| `bicmas_device_registered` | `mecure_device_registered` |
| SW cache / notification tags `bicmas-*` | `mecure-*` |
| `package.json` name | `mecure-trainee-portal` |
| `metadata.json` | MeCure Academy naming |
| Capacitor `appName` | `MeCure Academy` |
| Capacitor `appId` | **Keep** `com.bicmas.academy` (changing breaks existing installs) |
| Form / DOM ids like `bicmas-learn-login-form` | `mecure-academy-login-form` |

### Explicitly out of scope / leave alone

- Android Firebase / OneSignal project IDs that still say `bicmas` in third-party config (do not break messaging)
- Backend API contracts that still return BICMAS-named fields (map at the client boundary, e.g. `points` → `academyPoints`)
- Layout redesign of non-login screens
- Deployment / allowlist origins (e.g. `scorm-exit.html` parent origins) until a new production domain is provided

## Technical implementation outline

1. Update `@theme` brand tokens in `App.css`; set page background toward `#F5F7FA` where currently slate-based globals apply
2. Update `index.html` fonts, title, theme-color, body font
3. Redesign `LoginPage.tsx` to Option B split layout
4. Swap logo src/alt in `Layout.tsx`, `LoginPage.tsx`, notifications, SW, manifest
5. Replace user-facing BICMAS strings across components, pages, SW, push copy, certificates share text
6. Rename internal identifiers listed above; update all call sites in the same PR
7. Update Capacitor `appName` only; leave `appId`
8. Add `.superpowers/` to `.gitignore`

## Success criteria

- No user-visible “BICMAS” / “BICMAS LEARN” remains in the trainee app UI, PWA, or notifications
- Brand colors and fonts apply consistently via tokens
- Login matches Option B on desktop and stacks cleanly on mobile
- Auth, downloads, and notifications still work after event/key renames
- Existing Capacitor installs continue to recognize the app (`appId` unchanged)

## Non-goals

- Redesigning dashboard, library, community, or player layouts
- Changing Capacitor `appId` or native package identity
- Changing backend APIs or HR/admin apps
