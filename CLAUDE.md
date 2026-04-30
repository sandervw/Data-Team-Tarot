# CLAUDE.md

## Project Overview

A webapp built with Astro 6 (SSG) plus a React island for the draw UI.

Deployed to Cloudflare Pages at https://cheddarsoap.com/. Submissions flow through a Cloudflare Pages Function that commits new fortunes to this GitHub repo via the GitHub Contents API, which triggers the next build.

Before writing or editing any `.astro` files, Astro config, or Astro-related code, always fetch the latest Astro 6 docs via Context7 MCP (`resolve-library-id` then `query-docs`).

Check `public/standards/` before writing CSS, Typescript, or React.
