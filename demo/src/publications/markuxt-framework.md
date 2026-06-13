---
title: "Markuxt Publication Demo: A Markdown-First Framework for Academic Portals"
authors:
  - hnrobert
year: 2025
doi: ''
venue: Open Source Project
keywords:
  - markdown
  - nuxt
  - academic portal
  - static site
  - framework
---

::github{repo="markuxt/markuxt"}

## Abstract

Markuxt is an open-source framework that enables academic teams to build complete web portals using Markdown as the primary content format. Built on Nuxt 3, it provides a full theme layer including layouts, components, content transformers, and internationalization support.

## Key Contributions

- A Markdown-first content authoring workflow for academic portals
- Complete theme layer with four preset palettes
- Built-in support for LaTeX math, Mermaid diagrams, and code highlighting
- First-class i18n with per-page locale files
- Dark/light mode with OS preference detection

## Architecture

Markuxt follows a Nuxt layer architecture where consuming sites extend the framework and provide only content and configuration. Content is organized into five types — members, publications, projects, positions, and news — each authored as Markdown files with YAML frontmatter.

## Conclusion

Markuxt lowers the barrier for academic teams to establish a professional web presence by eliminating the need for CMS expertise while providing rich content features out of the box.
