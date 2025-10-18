# Harmon Bhasin's Personal Site

A minimal static site generator built with vanilla JavaScript. Converts markdown blog posts to static HTML with zero framework dependencies.

## Quick Start

```bash
# Install dependencies
npm install

# Build site
npm run build

# Preview locally
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
├── build.js              # Build system (entire SSG)
├── posts/*.md            # Blog posts (markdown + frontmatter)
├── pages/*.md            # Static pages (about, etc.)
├── templates/base.html   # HTML template
├── public/               # Static assets
└── dist/                 # Generated site (git-ignored)
```

## Writing Posts

Create `posts/my-post.md`:

```yaml
---
title: "Post Title"
description: "Brief description"
date: '2025-03-15'
categories:
  - 'category-name'
published: true
---

Your content in **markdown**.
```

Run `npm run build` to generate HTML.

## Features

- Markdown to HTML conversion (marked)
- LaTeX math rendering (KaTeX)
- Syntax highlighting (highlight.js)
- Client-side search and filtering
- Tailwind CSS via CDN
- Sub-second build times

## Deployment

Deploys to Vercel automatically on push to main branch.

## Architecture

See `LLM.md` for comprehensive architectural documentation.

## Dependencies

- `marked` - Markdown parser
- `gray-matter` - Frontmatter parsing
- `marked-katex-extension` - Math rendering
- `highlight.js` - Syntax highlighting
