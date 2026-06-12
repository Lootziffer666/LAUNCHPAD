<h1 align="center">🎮 VENT</h1>

<p align="center">
  <strong>Steam Family Management & Wishlist Tools für Android</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Focus-Steam%20Family-purple?style=flat-square" />
</p>

---

## 🧭 Was ist VENT?

Suite von **Steam-bezogenen Tools** für den Android-Workflow: Family Management, Wishlist Handling, Steam Administration. Kein fertiges Produkt — aktiver Workspace.

> Seit Juni 2026 lebt VENT als Unterprojekt im LAUNCHPAD-Monorepo (`vent/`),
> neben dem Android-Launcher, der Companion-App und dem Desktop-Shell.
> Übernommen wurde der Expo-Prototyp (`src/`, `App.tsx`), die komplette
> Spezifikation (`docs/`) und das Branding (`graphics/`).

## 🚀 App (Expo / React Native)

```bash
cd vent
npm install
npm start            # Expo Dev Server
npm run android      # auf Android-Gerät/Emulator
```

Stand des Prototyps: Screens für Home, Wishlist, Families, Library, Sales,
Compare, Activity, Game-Detail und Settings; Theme-Tokens unter `src/theme/`;
CheapShark-Preisabfrage unter `src/services/cheapshark.ts`. `npx tsc --noEmit`
meldet noch eine Handvoll Typfehler (ViewStyle/fontWeight-Strenge) — bekannt,
nicht blockierend für `expo start`.

## 📚 Docs

Alle Spezifikationen liegen unter [`docs/`](docs/):

| Dokument | Inhalt |
|----------|--------|
| [`docs/0_VENT_HANDOVER_DOCUMENT.md`](docs/0_VENT_HANDOVER_DOCUMENT.md) | Übergabe-Dokument |
| [`docs/1_VENT_PRD.md`](docs/1_VENT_PRD.md) | Product Requirements |
| `docs/2…9` | Screen Map, Wireframes, Component Specs, Interaction Model, Design Foundation |
| [`docs/10_VENT_Component_Specs_v1.md`](docs/10_VENT_Component_Specs_v1.md) | Komponenten-Specs |
| [`docs/11_VENT_Figma-Ready_Design_Tokens_v1.md`](docs/11_VENT_Figma-Ready_Design_Tokens_v1.md) | Design Tokens |
| [`docs/12_VENT_Unified_Architecture_v1.md`](docs/12_VENT_Unified_Architecture_v1.md) | Architektur |
| [`docs/13_VENT_Visual_&_UX_Foundation_v1.md`](docs/13_VENT_Visual_&_UX_Foundation_v1.md) | UX Foundation |

Außerdem: [`GATES.md`](GATES.md) (nächste Entwicklungs-Gates),
[`TASKS.md`](TASKS.md) (MVP Execution Board),
[`GITHUB_REPOS.md`](GITHUB_REPOS.md) (recherchierte Referenz-Repos).

## 🔗 Relevante Projekte

| Projekt | Relevanz |
|---------|----------|
| [farion1231/cc-switch](https://github.com/farion1231/cc-switch) | Steam Account Switching |
| [SteamDB](https://steamdb.info) | Steam-Daten-Referenz |

---

<p align="center"><em>Steam. Familie. Kontrolle.</em></p>
