# Contributing to Markuxt

Thanks for your interest in contributing! This guide covers everything you need to set up a local development environment and work on the framework.

## Prerequisites

- **Node.js** ≥ 24
- **pnpm** ≥ 10 (the project uses pnpm workspaces)

## Project Structure

This repository is a **pnpm workspace** with two packages:

```bash
markuxt/
├── package.json              # @markuxt/markuxt — the framework (Nuxt layer)
├── pnpm-workspace.yaml       # Declares . and demo as workspace members
├── nuxt.config.ts            # Layer config: modules, hooks, Vite settings
├── src/                      # Framework source (components, pages, styles, …)
└── demo/                     # markuxt-portal — live demo & test site
    ├── package.json          # Depends on @markuxt/markuxt via workspace:*
    ├── nuxt.config.ts        # Extends the framework, provides content & config
    └── src/                  # Demo content (members, news, projects, …)
```

The `demo/` site **extends the framework via `workspace:*` symlink**, so any change you make to `src/` is reflected immediately in the demo through HMR — no build step required.

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/markuxt/markuxt.git
cd markuxt
pnpm install

# 2. Start the demo dev server (runs from repo root)
pnpm dev
```

This runs `pnpm --filter ./demo dev`, which starts the demo site (typically at `http://localhost:3000`).

- `pnpm dev` — Start the demo site (recommended for everyday development)
- `pnpm dev:self` — Start the framework itself as a standalone Nuxt app (rarely needed)

## Development Workflow

### Editing the Framework (`src/`)

1. Edit components, pages, styles, or composables under `src/`
2. The demo's Vite dev server watches the symlinked layer — **changes are hot-reloaded automatically**
3. No restart or rebuild is needed for component/style changes

### Editing the Demo (`demo/`)

- **Content**: Edit Markdown files in `demo/src/` (members, news, projects, etc.)
- **Config**: Edit `demo/nuxt.config.ts` (navigation, carousel, contact info, theme options)
- **i18n**: Edit `demo/src/i18n/en.json` and `demo/src/i18n/zh-CN.json`
- **Styles**: Edit `demo/styles/` to override theme tokens

### Adding Dependencies

Dependencies are managed at the workspace root:

```bash
# Add a dependency to the framework
pnpm add <package>

# Add a dependency to the demo only
pnpm add <package> --filter ./demo
```

## Architecture

Markuxt is a **Nuxt layer** — consuming sites `extends: ['@markuxt/markuxt']` and only provide content, configuration, and optional overrides.

### Key Directories

| Path                        | Purpose                                                                   |
|-----------------------------|---------------------------------------------------------------------------|
| `src/components/`           | Vue components (AppHeader, AppFooter, Hero, MemberCard, etc.)             |
| `src/composables/`          | Shared composables (e.g., `resolveContentImage`)                          |
| `src/pages/`                | All route pages (index, members, news, projects, positions, publications) |
| `src/layouts/`              | Default layout with header + footer                                       |
| `src/styles/`               | Design system — CSS custom properties for colors, spacing, typography     |
| `src/middleware/`           | Navigation guard (unlisted pages return 404)                              |
| `src/content-transformers/` | Custom Nuxt Content transformer for binary assets                         |
| `src/plugins/`              | Nuxt client/server plugins                                                |

### Content Asset Sync

Binary assets (images, videos) placed next to Markdown files are automatically synced to `public/_markuxt/` during the `build:before` hook. The `resolveContentImage` composable converts relative frontmatter paths like `image: assets/photo.jpg` into absolute `/_markuxt/...` URLs.

### i18n

The framework consumes translation keys (e.g., `nav.home`, `members.staff`, `footer.brand`) but does **not** ship locale files. Consuming sites provide their own. See `demo/src/i18n/en.json` for the full key reference.

## Code Style

- **Vue**: Composition API with `<script setup>` / `defineProps`
- **CSS**: BEM-like naming, CSS custom properties for theming
- **TypeScript**: Strict mode, no `any` where avoidable
- **Commits**: Conventional Commits preferred (`feat:`, `fix:`, `chore:`)

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and verify with `pnpm dev`
4. Commit with a descriptive message
5. Open a Pull Request against `main`

### Before Submitting

- Verify the demo site runs without errors: `pnpm dev`
- Test both locales (English and Chinese) if your change affects i18n
- Test both light and dark mode
- Test responsive layout on mobile viewport

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0](LICENSE) license.
