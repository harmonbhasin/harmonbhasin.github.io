# LLM.md - Architecture & Navigation Guide

> **Purpose**: This document provides a comprehensive architectural overview of this vanilla JavaScript static site generator. It enables efficient navigation, understanding of design patterns, and extension of functionality.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Directory Structure](#directory-structure)
4. [Build Pipeline](#build-pipeline)
5. [Data Flow](#data-flow)
6. [Key Patterns & Conventions](#key-patterns--conventions)
7. [Template System](#template-system)
8. [Client-Side Features](#client-side-features)
9. [Extension Points](#extension-points)
10. [Common Tasks](#common-tasks)
11. [Dependencies](#dependencies)
12. [Deployment](#deployment)
13. [Performance Characteristics](#performance-characteristics)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What Is This?

A **minimal static site generator** built with vanilla JavaScript (Node.js) that:
- Converts markdown files to HTML at build time
- Generates a personal blog/portfolio site
- Uses zero framework dependencies (no React, Vue, Svelte, etc.)
- Deploys to Vercel as static HTML files

### Why Does This Exist?

**Problem**: Modern web frameworks (SvelteKit, Next.js, etc.) introduce unnecessary complexity for simple static sites:
- Large dependency trees (20+ packages)
- Slow build times (5-10 seconds)
- Framework-specific patterns and limitations
- Hydration overhead and client-side JavaScript

**Solution**: Replace framework with a single 300-line build script that:
- Runs in <1 second
- Has 4 production dependencies
- Produces pure static HTML
- Maintains full control over output

### Migration Context

This project **migrated from SvelteKit** to vanilla JS. See `thoughts/shared/plans/2025-10-18-vanilla-js-static-site-migration.md` for complete migration history and rationale.

---

## Architecture Philosophy

### Core Principles

1. **Build-time everything**: All dynamic logic runs during build, not at runtime
2. **Zero runtime framework**: Only vanilla JS for search/filtering (minimal, optional)
3. **Simple string replacement**: Templates use `{{PLACEHOLDER}}` pattern
4. **Convention over configuration**: Predictable file locations, no config files
5. **Single source of truth**: `build.js` is the entire build system
6. **Progressive enhancement**: Site works without JavaScript, enhanced with it

### Design Constraints

- **No bundler**: No Webpack, Vite, Rollup, etc.
- **No TypeScript**: Plain JavaScript for maximum simplicity
- **No CSS preprocessor**: Tailwind via CDN (zero build step)
- **No image optimization**: Static assets copied as-is
- **No server-side logic**: Pure static HTML output

### Trade-offs

| Choice | Pro | Con |
|--------|-----|-----|
| String replacement templates | Simple, no learning curve | No conditionals/loops in templates |
| Tailwind CDN | Zero config, instant updates | Larger initial payload (~50KB) |
| Client-side search | No server needed | Doesn't work without JS |
| Manual HTML generation | Full control | Verbose template strings |

---

## Directory Structure

```
harm0n/
├── build.js                 # Build script (entire build system)
├── package.json             # 4 dependencies + 1 dev dependency
├── vercel.json              # Deployment configuration
│
├── posts/                   # Blog posts (markdown + frontmatter)
│   ├── cmc-intro.md         # Published post
│   └── second-post.md       # Unpublished post (published: false)
│
├── pages/                   # Static page content (markdown)
│   └── about.md             # About page content
│
├── templates/               # HTML templates
│   └── base.html            # Single template for entire site
│
├── public/                  # Static assets (copied to dist/)
│   ├── favicon.png
│   ├── robots.txt
│   ├── css/                 # Custom CSS (currently unused)
│   └── images/              # Images (currently unused)
│
├── dist/                    # Build output (generated, git-ignored)
│   ├── index.html           # Home page
│   ├── about/
│   │   └── index.html       # About page
│   ├── blog/
│   │   ├── index.html       # Blog listing
│   │   ├── cmc-intro/
│   │   │   └── index.html   # Individual post
│   │   └── [slug]/
│   │       └── index.html   # Pattern for all posts
│   ├── sitemap.xml          # SEO sitemap
│   └── [assets]             # Copied from public/
│
├── thoughts/                # Planning documents (not deployed)
│   └── shared/plans/
│       └── 2025-10-18-vanilla-js-static-site-migration.md
│
├── proposal.md              # Original migration proposal
└── README.md                # User-facing documentation
```

### Directory Ownership

| Directory | Owned By | Mutated By | Purpose |
|-----------|----------|------------|---------|
| `posts/` | User | User | Blog post source content |
| `pages/` | User | User | Static page source content |
| `templates/` | User | User | HTML layout templates |
| `public/` | User | User | Static assets |
| `dist/` | Build | `build.js` | Generated HTML output |
| `thoughts/` | User | User | Planning/documentation |

---

## Build Pipeline

### High-Level Flow

```
User runs: npm run build
    ↓
build.js executes
    ↓
1. Clean dist/ directory
2. Read templates/base.html
3. Read all posts/*.md files
4. Parse frontmatter (gray-matter)
5. Convert markdown → HTML (marked)
6. Inject into templates
7. Write HTML files to dist/
8. Copy public/ → dist/
9. Generate sitemap.xml
    ↓
dist/ ready for deployment
```

### Detailed Build Steps

#### Step 1: Initialize (`build()` function)

```javascript
// build.js:278-304
async function build() {
  // 1. Clean slate
  await fs.rm('dist', { recursive: true, force: true });
  await fs.mkdir('dist/blog', { recursive: true });

  // 2. Load base template
  const template = await readTemplate('base');

  // 3. Get all published posts
  const posts = await getPosts(); // Filters by published: true

  // 4. Generate pages
  await generateBlogList(posts, template);
  for (const post of posts) {
    await generatePost(post, template);
  }
  await generateStaticPages(template);

  // 5. Copy assets and generate sitemap
  await copyAssets();
  await generateSitemap(posts);
}
```

#### Step 2: Post Processing (`getPosts()` function)

```javascript
// build.js:27-51
async function getPosts() {
  const files = await fs.readdir('posts');

  const posts = await Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async (file) => {
        const content = await fs.readFile(`posts/${file}`, 'utf-8');

        // Parse frontmatter
        const { data, content: markdown } = matter(content);

        // Convert markdown to HTML
        const html = marked(markdown);

        // Extract slug from filename
        const slug = file.replace('.md', '');

        return {
          ...data,              // title, description, date, categories, published
          slug,                 // filename without .md
          html,                 // rendered HTML content
          published: data.published || false,
          categories: data.categories || []
        };
      })
  );

  // Filter unpublished posts and sort by date (newest first)
  return posts
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

**Key Details**:
- Reads **all** `.md` files in `posts/`
- Filters by `published: true` frontmatter field
- Sorts by `date` field (descending)
- `slug` derived from filename (e.g., `cmc-intro.md` → `cmc-intro`)

#### Step 3: Page Generation

**Blog Listing** (`generateBlogList()`):
```javascript
// build.js:64-121
- Extracts unique categories from all posts
- Generates category filter buttons
- Generates post preview cards with:
  - Title (linked to post)
  - Date (formatted)
  - Category badges
  - Description
- Injects search input and filter UI
- Writes to: dist/blog/index.html
```

**Individual Posts** (`generatePost()`):
```javascript
// build.js:124-146
- Injects post title, date, categories
- Wraps content in .prose styling
- Category tags link to filtered blog listing
- Writes to: dist/blog/{slug}/index.html
```

**Static Pages** (`generateStaticPages()`):
```javascript
// build.js:149-229
- Home page: Hardcoded content with social links
- About page: Reads from pages/about.md if exists
- Writes to:
  - dist/index.html
  - dist/about/index.html
```

#### Step 4: Asset Copying & Sitemap

```javascript
// copyAssets(): Recursively copy public/ → dist/
// generateSitemap(): Create XML sitemap with all URLs
```

---

## Data Flow

### Content → HTML Pipeline

```
posts/cmc-intro.md
    ↓ [fs.readFile]
Raw file content (frontmatter + markdown)
    ↓ [gray-matter]
{ data: { title, date, ... }, content: "markdown text" }
    ↓ [marked]
{ data: { ... }, html: "<p>rendered HTML</p>" }
    ↓ [template.replace('{{CONTENT}}', html)]
Full HTML page with layout
    ↓ [fs.writeFile]
dist/blog/cmc-intro/index.html
```

### Frontmatter Schema

**Required fields**:
```yaml
---
title: "Post Title"          # String (displayed everywhere)
description: "Post excerpt"   # String (for blog listing, SEO)
date: '2025-02-26'           # String in YYYY-MM-DD format
published: true              # Boolean (false = excluded from build)
---
```

**Optional fields**:
```yaml
categories:                  # Array of strings
  - 'category-name'
  - 'another-category'
```

**Frontmatter parsing**:
- Library: `gray-matter`
- Separates YAML front matter from markdown content
- Returns `{ data: {...}, content: "..." }`

### Markdown Processing

**Pipeline**:
1. Raw markdown text
2. **marked** library converts to HTML
3. Extensions applied:
   - `marked-katex-extension`: LaTeX math rendering ($E=mc^2$, $$...$$)
   - Custom highlight.js integration: Syntax highlighting for code blocks

**Example**:
```markdown
# Heading

Some text with **bold** and [link](https://example.com).

```javascript
console.log("hello");
```

Inline math: $E = mc^2$
```

**Becomes**:
```html
<h1>Heading</h1>
<p>Some text with <strong>bold</strong> and <a href="https://example.com">link</a>.</p>
<pre><code class="language-javascript">
<span class="hljs-built_in">console</span>.log(<span class="hljs-string">"hello"</span>);
</code></pre>
<p>Inline math: <span class="katex">...</span></p>
```

---

## Key Patterns & Conventions

### 1. URL Structure

**Pattern**: Clean URLs with trailing-slash directories

| Page Type | URL | File Path |
|-----------|-----|-----------|
| Home | `/` | `dist/index.html` |
| About | `/about` | `dist/about/index.html` |
| Blog listing | `/blog` | `dist/blog/index.html` |
| Individual post | `/blog/{slug}` | `dist/blog/{slug}/index.html` |
| Sitemap | `/sitemap.xml` | `dist/sitemap.xml` |

**Why trailing-slash pattern?**
- Clean URLs: `/about` instead of `/about.html`
- Works with default directory index behavior
- No `.html` extension in URLs

### 2. Slug Generation

**Pattern**: Filename = slug
- `posts/cmc-intro.md` → slug: `cmc-intro` → URL: `/blog/cmc-intro`
- Slugs must be URL-safe (lowercase, hyphens, no spaces)

**Convention**:
- Use kebab-case: `my-post-title.md`
- Avoid special characters: `!@#$%^&*()`
- No file extensions in slugs (removed by `file.replace('.md', '')`)

### 3. Date Formatting

**Storage**: ISO date strings in frontmatter (`'2025-02-26'`)

**Display**: `formatDate()` function converts to human-readable
```javascript
// build.js:54-61
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',    // "February"
    day: 'numeric'
  });
}
// Output: "February 26, 2025"
```

### 4. Template Replacement Pattern

**Convention**: `{{PLACEHOLDER}}` in templates

```html
<!-- templates/base.html -->
<title>{{TITLE}}</title>
<main>{{CONTENT}}</main>
```

```javascript
// build.js
const html = template
  .replace('{{TITLE}}', 'My Page Title')
  .replace('{{CONTENT}}', '<p>Page content</p>');
```

**Limitations**:
- Single-pass replacement (order matters if same placeholder used twice)
- No conditionals (if/else)
- No loops (handled by JS template strings)

### 5. HTML Generation Pattern

**Pattern**: Template strings for dynamic HTML

```javascript
// build.js:72-85
const postsHTML = posts.map(post => `
  <article class="post-item mb-8 pb-8 border-b" data-categories="${post.categories.join(',')}">
    <h2 class="text-2xl font-bold mb-2">
      <a href="/blog/${post.slug}">${post.title}</a>
    </h2>
    <time>${formatDate(post.date)}</time>
    <p>${post.description}</p>
  </article>
`).join('');
```

**Convention**:
- Use `.map().join('')` for arrays
- Indent for readability (ignored in HTML output)
- Escape user content (markdown already escaped by marked)

### 6. Category Handling

**Storage**: Array in frontmatter
```yaml
categories:
  - 'code-meets-cell'
  - 'machine-learning'
```

**Processing**:
```javascript
// build.js:66
const allCategories = [...new Set(posts.flatMap(p => p.categories))].sort();
```
- `flatMap`: Flatten nested arrays
- `Set`: Remove duplicates
- `sort()`: Alphabetical order

**Rendering**:
```javascript
// build.js:79-81
post.categories.map(cat =>
  `<span class="...badge...">${cat}</span>`
).join('')
```

---

## Template System

### Base Template Structure

**File**: `templates/base.html`

**Anatomy**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{TITLE}}</title>

  <!-- External dependencies -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

  <!-- Analytics -->
  <script defer src="https://cloud.umami.is/script.js" data-website-id="27d21137-87c1-42a6-9f44-77815c153950"></script>

  <!-- Custom styles -->
  <style>
    .prose { /* Custom typography styles */ }
  </style>
</head>
<body>
  <!-- Header navigation (same on all pages) -->
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
    </nav>
  </header>

  <!-- Main content (replaced per page) -->
  <main>
    {{CONTENT}}
  </main>

  <!-- Client-side JavaScript (search/filter) -->
  <script>
    // Search functionality
    // Category filtering
  </script>
</body>
</html>
```

### Placeholders

| Placeholder | Replaced With | Usage |
|-------------|---------------|-------|
| `{{TITLE}}` | Page-specific title | SEO, browser tab |
| `{{CONTENT}}` | Page-specific HTML | Main content area |

**No other placeholders** - template is intentionally minimal.

### Shared Components

**Navigation Header**: Same across all pages (hardcoded in template)
```html
<header class="border-b">
  <nav class="max-w-6xl mx-auto px-4 py-4">
    <a href="/" class="text-xl font-bold">Harmon Bhasin</a>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/blog">Blog</a>
    <a href="https://x.com/harmonbhasin">Twitter</a>
  </nav>
</header>
```

**Prose Styles**: Custom CSS for markdown content
```css
.prose {
  /* Typography for rendered markdown */
  /* Headings, links, lists, blockquotes, code blocks */
}
```

---

## Client-Side Features

### Search Functionality

**Location**: `templates/base.html:541-563`

**How it works**:
1. Listen for input on `#search-input`
2. On each keystroke:
   - Get search query (lowercase)
   - Find all `.post-item` elements
   - Extract title and description text
   - Show/hide based on match
3. Show "no results" message if all hidden

**Code**:
```javascript
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const posts = document.querySelectorAll('.post-item');
  let visibleCount = 0;

  posts.forEach(post => {
    const title = post.querySelector('h2').textContent.toLowerCase();
    const description = post.querySelector('p').textContent.toLowerCase();
    const matches = title.includes(query) || description.includes(query);

    post.style.display = matches ? 'block' : 'none';
    if (matches) visibleCount++;
  });

  noResults.classList.toggle('hidden', visibleCount > 0);
});
```

**Limitations**:
- Case-insensitive substring matching only (no fuzzy search)
- Searches title and description only (not full content)
- No search history or suggestions

### Category Filtering

**Location**: `templates/base.html:565-595`

**How it works**:
1. Each post has `data-categories="cat1,cat2"` attribute
2. Click category button:
   - Extract category from `data-category` attribute
   - Show posts matching that category
   - Update button active state
3. Special "All" button shows all posts

**Code**:
```javascript
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.category;
    const posts = document.querySelectorAll('.post-item');

    // Update active button styling
    categoryButtons.forEach(btn => {
      btn.classList.remove('bg-blue-500', 'text-white');
    });
    button.classList.add('bg-blue-500', 'text-white');

    // Filter posts
    posts.forEach(post => {
      const categories = post.dataset.categories.split(',');
      const matches = category === 'all' || categories.includes(category);
      post.style.display = matches ? 'block' : 'none';
    });

    // Clear search when filtering
    if (searchInput) searchInput.value = '';
  });
});
```

**URL Parameter Support**:
```javascript
// Support /blog?category=code-meets-cell
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get('category');
if (categoryParam) {
  const button = document.querySelector(`[data-category="${categoryParam}"]`);
  if (button) button.click();
}
```

### Progressive Enhancement

**Without JavaScript**:
- Site fully readable
- All content accessible
- Links work
- Styles load (Tailwind CDN)

**With JavaScript**:
- Search filtering
- Category filtering
- Interactive UI updates

---

## Extension Points

### Adding New Page Types

**Pattern**: Add generator function in `build.js`

```javascript
// build.js
async function generateCustomPage(template) {
  const html = template
    .replace('{{TITLE}}', 'Custom Page - Harmon Bhasin')
    .replace('{{CONTENT}}', `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <h1>Custom Content</h1>
      </div>
    `);

  await fs.mkdir('dist/custom', { recursive: true });
  await fs.writeFile('dist/custom/index.html', html);
}

// In build() function:
await generateCustomPage(template);
```

### Adding New Frontmatter Fields

**Example**: Add `author` field

1. **Add to frontmatter**:
```yaml
---
title: "Post Title"
author: "Harmon Bhasin"  # New field
---
```

2. **Access in build.js**:
```javascript
// Already available via gray-matter
const { data } = matter(content);
// data.author is now available

// Use in template:
<p class="author">By ${post.author}</p>
```

### Adding New Markdown Extensions

**Example**: Add GitHub Flavored Markdown tables

```javascript
// build.js
import { gfmPlugin } from 'marked-gfm';  // Add dependency

marked.use(gfmPlugin());  // Configure marked
```

### Adding New Templates

**Pattern**: Create template file, add reader function

```javascript
// 1. Create templates/post.html (specialized template)

// 2. Add reader:
async function generatePost(post) {
  const template = await readTemplate('post');  // Use different template
  // ... rest of function
}
```

### Adding RSS Feed

**Extension point**: Add to `build()` function

```javascript
async function generateRSS(posts) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Harmon Bhasin</title>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <description>${post.description}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
    `).join('')}
  </channel>
</rss>`;

  await fs.writeFile('dist/rss.xml', xml);
}

// In build():
await generateRSS(posts);
```

---

## Common Tasks

### Task 1: Adding a New Blog Post

1. **Create markdown file**:
```bash
touch posts/my-new-post.md
```

2. **Add frontmatter and content**:
```markdown
---
title: "My New Post"
description: "A short description"
date: '2025-03-15'
categories:
  - 'category-name'
published: true
---

Your post content here in **markdown**.
```

3. **Build and preview**:
```bash
npm run dev
```

4. **Post will appear at**: `/blog/my-new-post`

### Task 2: Publishing an Unpublished Post

1. **Edit frontmatter**:
```yaml
published: false  →  published: true
```

2. **Rebuild**:
```bash
npm run build
```

### Task 3: Changing Site Title/Branding

**Navigation header** (in `templates/base.html:520-532`):
```html
<a href="/" class="text-xl font-bold">Harmon Bhasin</a>
```

**Home page content** (in `build.js:151-194`):
```javascript
const homeContent = `
  <section class="max-w-3xl mx-auto px-4 py-12">
    <p>I work as a researcher at...</p>
  </section>
`;
```

### Task 4: Adding a New Static Page

1. **Create markdown** in `pages/`:
```bash
echo "# New Page\n\nContent here." > pages/new-page.md
```

2. **Add generator** in `build.js`:
```javascript
// In generateStaticPages():
const newPageMd = await fs.readFile('pages/new-page.md', 'utf-8');
const { content: markdown } = matter(newPageMd);
const html = marked(markdown);

await fs.mkdir('dist/new-page', { recursive: true });
await fs.writeFile('dist/new-page/index.html',
  template
    .replace('{{TITLE}}', 'New Page - Harmon Bhasin')
    .replace('{{CONTENT}}', `<div class="prose">${html}</div>`)
);
```

3. **Add to navigation** (templates/base.html):
```html
<a href="/new-page">New Page</a>
```

### Task 5: Updating Social Links

**Home page** (`build.js:172-193`):
```javascript
<a href="https://github.com/harmonbhasin">GitHub</a>
<a href="https://x.com/_harm0n">Twitter</a>
// ... add/edit links
```

### Task 6: Changing Color Scheme

**Option A**: Edit Tailwind classes in templates
```html
<!-- Change blue to purple -->
<button class="bg-blue-500">  →  <button class="bg-purple-500">
```

**Option B**: Add custom CSS in `templates/base.html`:
```html
<style>
  :root {
    --primary-color: #your-color;
  }
  .btn-primary {
    background-color: var(--primary-color);
  }
</style>
```

### Task 7: Local Development Workflow

```bash
# 1. Make changes to posts/pages/templates
vim posts/my-post.md

# 2. Rebuild
npm run build

# 3. Preview
npm run dev  # Serves on http://localhost:3000

# 4. Iterate (repeat steps 1-3)
```

---

## Dependencies

### Production Dependencies (4 total)

| Package | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| `marked` | ^11.0.0 | Markdown → HTML conversion | Industry standard, extensible, fast |
| `marked-katex-extension` | ^5.0.0 | LaTeX math rendering in markdown | Integrates KaTeX with marked |
| `gray-matter` | ^4.0.3 | Frontmatter parsing (YAML) | De facto standard for frontmatter |
| `highlight.js` | ^11.9.0 | Syntax highlighting for code blocks | Wide language support, customizable |

### Dev Dependencies (1 total)

| Package | Version | Purpose |
|---------|---------|---------|
| `serve` | ^14.2.1 | Local development server |

### Why These Dependencies?

**marked**:
- Converts markdown to HTML
- Extensible via plugins
- Battle-tested (used by millions)
- Alternative considered: `markdown-it` (heavier, more complex)

**gray-matter**:
- Parses YAML front matter from markdown
- Handles edge cases (dates, arrays, nested objects)
- Alternative considered: Manual regex parsing (error-prone)

**highlight.js**:
- Syntax highlighting for code blocks
- Supports 190+ languages
- CDN available for styles (no CSS bundling needed)
- Alternative considered: Prism.js (requires more setup)

**marked-katex-extension**:
- Renders LaTeX math equations
- Uses KaTeX library (faster than MathJax)
- Integrates seamlessly with marked
- Alternative considered: marked-math (less maintained)

### CDN Dependencies (Not in package.json)

| Dependency | Purpose | Size | Loaded From |
|------------|---------|------|-------------|
| Tailwind CSS | Utility-first CSS framework | ~50KB | cdn.tailwindcss.com |
| Highlight.js CSS | Code syntax highlighting theme | ~8KB | cdnjs.cloudflare.com |
| KaTeX CSS | LaTeX equation styling | ~25KB | cdn.jsdelivr.net |
| Umami Analytics | Privacy-focused analytics | ~2KB | cloud.umami.is |

**Why CDN instead of bundling?**
- Zero build configuration
- Automatic caching across sites
- Always up-to-date
- Trade-off: Slight increase in initial load time

---

## Deployment

### Platform: Vercel

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "node build.js",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### Deployment Flow

```
1. Push to GitHub
     ↓
2. Vercel detects push (webhook)
     ↓
3. Vercel runs: npm install
     ↓
4. Vercel runs: node build.js
     ↓
5. Vercel uploads dist/ to CDN
     ↓
6. Site live at harm0n.com
```

### Environment Variables

**None required** - site is fully static.

**Umami Analytics ID** hardcoded in `templates/base.html:447`:
```html
<script defer src="https://cloud.umami.is/script.js"
  data-website-id="27d21137-87c1-42a6-9f44-77815c153950">
</script>
```

### Custom Domain

**Configuration**:
- Vercel project settings → Domains
- DNS CNAME record: `harm0n.com` → `cname.vercel-dns.com`
- `CNAME` file in repo root (for GitHub Pages compatibility, may not be needed)

### Preview Deployments

- Every branch push creates preview URL
- Format: `harm0n-git-{branch}-{user}.vercel.app`
- Automatic, no configuration needed

---

## Performance Characteristics

### Build Time

**Measured**: <1 second (typically 200-400ms)

**Comparison**:
- SvelteKit (previous): ~5-10 seconds
- Next.js (typical): ~3-8 seconds
- Vanilla JS (this): <1 second

**Factors**:
- No bundler overhead
- No TypeScript compilation
- No CSS processing
- Simple file I/O operations

### Page Load Time

**Metrics** (estimated):
- Time to First Byte (TTFB): ~50-100ms (Vercel CDN)
- First Contentful Paint (FCP): ~200-400ms
- Largest Contentful Paint (LCP): ~300-500ms
- Time to Interactive (TTI): ~400-600ms

**Comparison to SvelteKit**:
- **Faster**: No hydration, no framework JS to download/parse
- **Trade-off**: Search/filter require JS (progressive enhancement)

### Bundle Size

| Asset | Size | Notes |
|-------|------|-------|
| HTML (per page) | ~5-15KB | Static HTML |
| Tailwind CDN | ~50KB | Cached across sites |
| Highlight.js CSS | ~8KB | Cached |
| KaTeX CSS | ~25KB | Cached |
| Search/filter JS | ~2KB | Inline in template |
| **Total (first visit)** | **~90KB** | Excluding content |
| **Total (cached)** | **~5-15KB** | Only HTML changes |

**Comparison**:
- SvelteKit bundle: ~150-200KB (framework + app)
- Vanilla JS (this): ~90KB (mostly CDN CSS)

### Optimization Opportunities

**Not currently implemented** (can be added later):
1. **HTML minification**: Remove whitespace (~10-20% size reduction)
2. **Self-host Tailwind**: Eliminate CDN dependency
3. **Critical CSS**: Inline above-the-fold CSS
4. **Image optimization**: Responsive images, modern formats (WebP)
5. **Service worker**: Offline support, faster repeat visits
6. **Preconnect/Prefetch**: DNS/origin hints for faster CDN loading

---

## Troubleshooting

### Issue: Build fails with "Cannot find module"

**Cause**: Missing dependencies

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Post not appearing on blog listing

**Checklist**:
1. Is `published: true` in frontmatter?
2. Is file in `posts/` directory?
3. Does filename end with `.md`?
4. Is frontmatter YAML valid? (check indentation)
5. Did you rebuild? (`npm run build`)

**Debug**:
```bash
# Check if post is being read
node -e "const matter = require('gray-matter'); const fs = require('fs'); console.log(matter(fs.readFileSync('posts/your-post.md', 'utf-8')));"
```

### Issue: Search/category filtering not working

**Checklist**:
1. Is JavaScript enabled in browser?
2. Are there console errors? (open dev tools)
3. Are the HTML elements present? (`#search-input`, `.post-item`, `.category-filter`)

**Debug**:
```javascript
// In browser console:
document.getElementById('search-input')  // Should not be null
document.querySelectorAll('.post-item')   // Should find posts
```

### Issue: Styles not loading

**Cause**: CDN failure or network issue

**Solutions**:
1. Check network tab in dev tools
2. Verify CDN URLs in `templates/base.html` are accessible
3. Consider self-hosting Tailwind (see Extension Points)

### Issue: Math equations not rendering

**Checklist**:
1. Is KaTeX CSS loading? (check network tab)
2. Is LaTeX syntax correct?
   - Inline: `$E = mc^2$`
   - Block: `$$\int_{-\infty}^{\infty}$$`
3. Is `marked-katex-extension` installed?

**Debug**:
```javascript
// Check if marked is configured:
// In build.js, ensure:
marked.use(katex());
```

### Issue: Local dev server not starting

**Cause**: Port 3000 already in use

**Solutions**:
```bash
# Option 1: Use different port
npx serve dist -p 8080

# Option 2: Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Issue: Deployment fails on Vercel

**Common causes**:
1. `vercel.json` syntax error
2. Build command failing
3. Output directory wrong

**Debug**:
```bash
# Test build locally:
rm -rf dist
node build.js
ls dist  # Should show index.html, blog/, etc.

# Check vercel.json syntax:
cat vercel.json | jq .  # Should parse without error
```

### Issue: Links broken after deployment

**Cause**: Absolute vs. relative paths

**Solution**: Use root-relative paths
```html
✓ <a href="/blog">Blog</a>
✓ <a href="/about">About</a>
✗ <a href="../blog">Blog</a>  <!-- Don't use relative paths -->
```

---

## Advanced Patterns

### Pattern: Conditional Content in Posts

**Problem**: Want to show different content in listing vs. full post

**Solution**: Use frontmatter excerpt
```yaml
---
title: "Post Title"
excerpt: "Short version for listing"
description: "Full description for post page"
---
```

```javascript
// In generateBlogList():
<p>${post.excerpt || post.description}</p>

// In generatePost():
<p>${post.description}</p>
```

### Pattern: Related Posts

**Problem**: Show related posts by category

**Solution**: Filter posts by shared categories
```javascript
function getRelatedPosts(currentPost, allPosts, limit = 3) {
  return allPosts
    .filter(p =>
      p.slug !== currentPost.slug &&
      p.categories.some(cat => currentPost.categories.includes(cat))
    )
    .slice(0, limit);
}

// In generatePost():
const related = getRelatedPosts(post, posts);
const relatedHTML = related.map(p => `
  <a href="/blog/${p.slug}">${p.title}</a>
`).join('');
```

### Pattern: Draft Posts (Soft Publish)

**Problem**: Want to preview unpublished posts locally but not deploy them

**Solution**: Environment-based filtering
```javascript
// build.js
const isDev = process.env.NODE_ENV === 'development';

async function getPosts() {
  // ... existing code ...

  return posts
    .filter(p => p.published || isDev)  // Show drafts in dev
    .sort(...);
}
```

```bash
# Development (shows drafts):
NODE_ENV=development npm run build

# Production (hides drafts):
npm run build
```

### Pattern: Post Series

**Problem**: Want to link posts in a series

**Solution**: Add series frontmatter
```yaml
---
title: "Part 1"
series: "My Series"
series_order: 1
---
```

```javascript
// In generatePost():
const seriesPosts = posts
  .filter(p => p.series === post.series)
  .sort((a, b) => a.series_order - b.series_order);

const seriesHTML = `
  <nav class="series">
    <h3>Series: ${post.series}</h3>
    ${seriesPosts.map((p, i) => `
      <a href="/blog/${p.slug}" ${p.slug === post.slug ? 'aria-current="page"' : ''}>
        ${i + 1}. ${p.title}
      </a>
    `).join('')}
  </nav>
`;
```

---

## Migration History

### From SvelteKit to Vanilla JS

**Reason for migration**: See `thoughts/shared/plans/2025-10-18-vanilla-js-static-site-migration.md`

**Key changes**:
1. Removed ~18 SvelteKit/Vite dependencies → 4 minimal dependencies
2. Replaced Vite build system → Single `build.js` script
3. Replaced Svelte components → HTML template strings
4. Removed server-side rendering → Static HTML generation
5. Kept Tailwind (SvelteKit used Tailwind v4, now using CDN)

**Files removed**:
- `src/` (entire Svelte source)
- `svelte.config.js`, `vite.config.ts`, `tailwind.config.cjs`
- `tsconfig.json` (no TypeScript)
- `.svelte-kit/` (build artifacts)

**Files added**:
- `build.js` (new build system)
- `templates/base.html` (new template)
- `vercel.json` (simpler config)

**Preserved**:
- URLs (no broken links)
- Analytics (same Umami ID)
- Content (markdown files unchanged)
- Deployment (still Vercel)

---

## Quick Reference

### File Locations Cheat Sheet

| Need to modify... | Edit this file... | Lines |
|-------------------|-------------------|-------|
| Navigation header | `templates/base.html` | 520-532 |
| Home page content | `build.js` | 151-194 |
| About page content | `pages/about.md` | - |
| Blog post | `posts/{slug}.md` | - |
| Site styles | `templates/base.html` | 449-516 |
| Search logic | `templates/base.html` | 541-563 |
| Filter logic | `templates/base.html` | 565-595 |
| Build process | `build.js` | 278-304 |
| Deployment config | `vercel.json` | - |

### Common Patterns Cheat Sheet

| Task | Pattern |
|------|---------|
| Add new post | Create `posts/{slug}.md` with frontmatter |
| Publish post | Set `published: true` in frontmatter |
| Add new page | Create `pages/{name}.md`, add generator in `build.js` |
| Add nav link | Edit `<header>` in `templates/base.html` |
| Change branding | Edit `templates/base.html` and `build.js` home content |
| Add RSS feed | See Extension Points → Adding RSS Feed |
| Debug post | Check frontmatter YAML, verify `published: true` |
| Local preview | `npm run dev`, visit `localhost:3000` |

### Key Functions Cheat Sheet

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `getPosts()` | Load all published posts | None | `Post[]` sorted by date |
| `formatDate()` | Format date string | `'2025-02-26'` | `'February 26, 2025'` |
| `generateBlogList()` | Create blog listing page | `posts, template` | Writes `dist/blog/index.html` |
| `generatePost()` | Create individual post | `post, template` | Writes `dist/blog/{slug}/index.html` |
| `generateStaticPages()` | Create home/about pages | `template` | Writes `dist/index.html`, etc. |
| `generateSitemap()` | Create XML sitemap | `posts` | Writes `dist/sitemap.xml` |
| `copyAssets()` | Copy public/ to dist/ | None | Copies files |

---

## Appendix: Full Build Flow Diagram

```
START: npm run build
│
├─ build.js executes
│  │
│  ├─ Clean dist/
│  │  └─ fs.rm('dist', { recursive: true })
│  │
│  ├─ Read template
│  │  └─ readTemplate('base')
│  │     └─ fs.readFile('templates/base.html')
│  │
│  ├─ Get posts
│  │  └─ getPosts()
│  │     ├─ fs.readdir('posts')
│  │     ├─ For each .md file:
│  │     │  ├─ fs.readFile('posts/{file}')
│  │     │  ├─ matter(content) → { data, content }
│  │     │  ├─ marked(markdown) → html
│  │     │  └─ Return { ...data, slug, html }
│  │     ├─ Filter: published === true
│  │     └─ Sort: by date descending
│  │
│  ├─ Generate pages
│  │  ├─ generateBlogList(posts, template)
│  │  │  ├─ Extract categories
│  │  │  ├─ Build filter buttons HTML
│  │  │  ├─ Build posts list HTML
│  │  │  ├─ Replace {{TITLE}}, {{CONTENT}} in template
│  │  │  └─ fs.writeFile('dist/blog/index.html')
│  │  │
│  │  ├─ For each post: generatePost(post, template)
│  │  │  ├─ Build post HTML (title, date, content)
│  │  │  ├─ Replace {{TITLE}}, {{CONTENT}} in template
│  │  │  ├─ fs.mkdir('dist/blog/{slug}')
│  │  │  └─ fs.writeFile('dist/blog/{slug}/index.html')
│  │  │
│  │  └─ generateStaticPages(template)
│  │     ├─ Build home page HTML
│  │     ├─ fs.writeFile('dist/index.html')
│  │     ├─ Read pages/about.md (if exists)
│  │     ├─ matter() → parse frontmatter
│  │     ├─ marked() → convert to HTML
│  │     ├─ Replace template placeholders
│  │     ├─ fs.mkdir('dist/about')
│  │     └─ fs.writeFile('dist/about/index.html')
│  │
│  ├─ Copy assets
│  │  └─ copyAssets()
│  │     └─ Recursively copy public/ → dist/
│  │
│  └─ Generate sitemap
│     └─ generateSitemap(posts)
│        ├─ Build URL list (home, about, blog, posts)
│        ├─ Format as XML
│        └─ fs.writeFile('dist/sitemap.xml')
│
└─ END: dist/ ready for deployment
```

---

## Document Version

- **Created**: 2025-10-18
- **Last Updated**: 2025-10-18
- **Codebase Version**: Post-SvelteKit migration
- **Author**: Generated for LLM navigation and staff-level review

---

**End of LLM.md**
