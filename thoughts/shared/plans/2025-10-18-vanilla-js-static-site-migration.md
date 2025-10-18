# Vanilla JS Static Site Generator Migration

## Overview

Migrate the current SvelteKit blog to a minimal vanilla JavaScript static site generator. Replace framework complexity with a simple Node.js build script that generates static HTML from markdown files at build time.

## Current State Analysis

### What Exists Now:
- **Framework**: SvelteKit + Vite + mdsvex for markdown processing
- **Content**: 2 markdown posts (1 published: `cmc-intro.md`, 1 unpublished: `second-post.md`)
- **Pages**: Home, About, Blog listing (`/blog`), Individual posts (`/blog/[slug]`)
- **Styling**: Tailwind CSS v4 with custom theme colors and typography plugin
- **Dependencies**: 21 total packages (18 dev + 3 production)
- **Analytics**: Umami Analytics already integrated (ID: `27d21137-87c1-42a6-9f44-77815c153950`)
- **Deployment**: Vercel with `@sveltejs/adapter-vercel`
- **Assets**: `favicon.png`, `robots.txt` in `/static/`
- **Components**: Header navigation, FindMe social links

### Current URL Structure:
- `/` - Home page
- `/about` - About page
- `/blog` - Blog listing
- `/blog/[slug]` - Individual posts (e.g., `/blog/cmc-intro`)
- `/sitemap.xml` - Dynamic sitemap
- `/api/posts` - JSON API endpoint (unused externally)

### Frontmatter Format (already compatible):
```yaml
---
title: "Post Title"
description: "Post description"
date: '2025-02-26'
categories:
  - 'category-name'
published: true
---
```

### Key Constraints:
- Must preserve existing URLs (no broken links)
- Must maintain Umami Analytics integration
- Must support markdown features currently used (blockquotes, lists, links)
- Must handle unpublished posts (filter by `published: true`)

## Desired End State

A static website with:
- **4 dependencies total** (marked, marked-katex-extension, gray-matter, highlight.js)
- **Build time**: Milliseconds instead of seconds
- **100% control** over HTML output
- **New features**: Client-side search and tag-based filtering
- **Same URLs**: No broken links
- **Same deployment**: Vercel with simpler configuration

### Verification:
- Site builds with `node build.js` in <1 second
- All pages render correctly
- Search finds posts by title/description
- Tag filtering works
- Analytics tracking verified
- No framework dependencies remain

## What We're NOT Doing

- Dark mode toggle (can be added later if desired)
- RSS feed generation (can be added later if desired)
- Server-side rendering or API routes
- Complex build tooling or bundlers
- TypeScript (using plain JavaScript)
- Custom fonts (using system defaults)
- Image optimization or processing

## Implementation Approach

Replace SvelteKit with a single `build.js` script that:
1. Reads markdown files from `posts/`
2. Parses frontmatter and converts markdown to HTML
3. Injects content into HTML templates
4. Generates static pages and sitemap
5. Copies assets to `dist/`

Use Tailwind CDN for zero-config styling and vanilla JavaScript for search/filtering.

---

## Phase 1: Create Build System Foundation

### Overview
Set up the new directory structure, create the build script, and establish the minimal dependency set.

### Changes Required:

#### 1. Create New Directory Structure
Create these directories:
```bash
mkdir -p posts pages public/css public/images templates dist
```

#### 2. Install Minimal Dependencies
**File**: `package.json`

**Changes**: Replace entire file with:
```json
{
  "name": "harm0n",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "node build.js && npx serve dist",
    "build": "node build.js"
  },
  "dependencies": {
    "marked": "^11.0.0",
    "marked-katex-extension": "^5.0.0",
    "gray-matter": "^4.0.3",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "serve": "^14.2.1"
  }
}
```

#### 3. Create Core Build Script
**File**: `build.js`

**Changes**: Create new file with:
```javascript
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';
import katex from 'marked-katex-extension';
import hljs from 'highlight.js';

// Configure marked
marked.use(katex());
marked.use({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return code;
  }
});

const SITE_URL = 'https://harm0n.com';

// Helper: Read template file
async function readTemplate(name) {
  return await fs.readFile(`templates/${name}.html`, 'utf-8');
}

// Helper: Get all posts
async function getPosts() {
  const files = await fs.readdir('posts');
  const posts = await Promise.all(
    files
      .filter(f => f.endsWith('.md'))
      .map(async (file) => {
        const content = await fs.readFile(`posts/${file}`, 'utf-8');
        const { data, content: markdown } = matter(content);
        const html = marked(markdown);
        const slug = file.replace('.md', '');

        return {
          ...data,
          slug,
          html,
          published: data.published || false,
          categories: data.categories || []
        };
      })
  );

  return posts
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate blog listing page
async function generateBlogList(posts, template) {
  // Get unique categories
  const allCategories = [...new Set(posts.flatMap(p => p.categories))].sort();

  const categoriesHTML = allCategories.map(cat =>
    `<button class="category-filter px-3 py-1 rounded-full text-sm border hover:bg-gray-100" data-category="${cat}">${cat}</button>`
  ).join('\n          ');

  const postsHTML = posts.map(post => `
    <article class="post-item mb-8 pb-8 border-b" data-categories="${post.categories.join(',')}">
      <h2 class="text-2xl font-bold mb-2">
        <a href="/blog/${post.slug}" class="hover:text-blue-600">${post.title}</a>
      </h2>
      <time class="text-gray-600 text-sm">${formatDate(post.date)}</time>
      <div class="mt-2">
        ${post.categories.map(cat =>
          `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm mr-2">${cat}</span>`
        ).join('')}
      </div>
      <p class="mt-3 text-gray-700">${post.description}</p>
    </article>
  `).join('');

  const html = template
    .replace('{{TITLE}}', 'Blog - Harmon Bhasin')
    .replace('{{CONTENT}}', `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold mb-8">Blog</h1>

        <!-- Search -->
        <div class="mb-6">
          <input
            type="text"
            id="search-input"
            placeholder="Search posts..."
            class="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <!-- Category Filters -->
        <div class="mb-8 flex flex-wrap gap-2">
          <button class="category-filter px-3 py-1 rounded-full text-sm border bg-blue-500 text-white" data-category="all">All</button>
          ${categoriesHTML}
        </div>

        <!-- Posts -->
        <div id="posts-container">
          ${postsHTML}
        </div>

        <div id="no-results" class="hidden text-center text-gray-500 py-8">
          No posts found matching your search.
        </div>
      </div>
    `);

  await fs.writeFile('dist/blog/index.html', html);
}

// Generate individual post page
async function generatePost(post, template) {
  const html = template
    .replace('{{TITLE}}', `${post.title} - Harmon Bhasin`)
    .replace('{{CONTENT}}', `
      <article class="max-w-3xl mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-4xl font-bold mb-4">${post.title}</h1>
          <time class="text-gray-600">${formatDate(post.date)}</time>
          <div class="mt-2">
            ${post.categories.map(cat =>
              `<a href="/blog?category=${cat}" class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm mr-2 hover:bg-gray-300">${cat}</a>`
            ).join('')}
          </div>
        </header>
        <div class="prose prose-lg max-w-none">
          ${post.html}
        </div>
      </article>
    `);

  await fs.mkdir(`dist/blog/${post.slug}`, { recursive: true });
  await fs.writeFile(`dist/blog/${post.slug}/index.html`, html);
}

// Generate static pages
async function generateStaticPages(template) {
  // Home page
  const homeContent = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-4">Harmon Bhasin</h1>
      <p class="text-xl text-gray-700 mb-8">
        I work at SecureBio on computational biology and biosecurity.
      </p>
      <nav class="space-x-4">
        <a href="/about" class="text-blue-600 hover:underline">About</a>
        <a href="/blog" class="text-blue-600 hover:underline">Blog</a>
      </nav>

      <!-- Social Links -->
      <footer class="mt-16 pt-8 border-t">
        <div class="flex flex-wrap gap-4">
          <a href="https://github.com/harmonbhasin" class="text-gray-600 hover:text-blue-600">GitHub</a>
          <a href="https://x.com/harmonbhasin" class="text-gray-600 hover:text-blue-600">Twitter</a>
          <a href="https://bsky.app/profile/harmonbhasin.com" class="text-gray-600 hover:text-blue-600">Bluesky</a>
          <a href="https://scholar.google.com/citations?user=9l-r5VAAAAAJ&hl=en" class="text-gray-600 hover:text-blue-600">Google Scholar</a>
          <a href="mailto:harmonbhasin@gmail.com" class="text-gray-600 hover:text-blue-600">Email</a>
          <a href="https://www.linkedin.com/in/harmon-bhasin-55b1a01ba/" class="text-gray-600 hover:text-blue-600">LinkedIn</a>
        </div>
      </footer>
    </div>
  `;

  await fs.writeFile('dist/index.html',
    template.replace('{{TITLE}}', 'Harmon Bhasin').replace('{{CONTENT}}', homeContent)
  );

  // About page (read from pages/about.md if exists, otherwise use default)
  let aboutContent = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold mb-8">About</h1>
      <div class="prose prose-lg">
        <p>Information about Harmon Bhasin.</p>
      </div>
    </div>
  `;

  try {
    const aboutMd = await fs.readFile('pages/about.md', 'utf-8');
    const { content: markdown } = matter(aboutMd);
    const html = marked(markdown);
    aboutContent = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="prose prose-lg max-w-none">
          ${html}
        </div>
      </div>
    `;
  } catch (e) {
    // Use default if file doesn't exist
  }

  await fs.mkdir('dist/about', { recursive: true });
  await fs.writeFile('dist/about/index.html',
    template.replace('{{TITLE}}', 'About - Harmon Bhasin').replace('{{CONTENT}}', aboutContent)
  );
}

// Generate sitemap
async function generateSitemap(posts) {
  const urls = [
    { url: SITE_URL, changefreq: 'monthly', priority: '1.0' },
    { url: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.8' },
    { url: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.9' },
    ...posts.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: '0.7'
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  await fs.writeFile('dist/sitemap.xml', xml);
}

// Copy public assets
async function copyAssets() {
  const copyDir = async (src, dest) => {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  };

  await copyDir('public', 'dist');
}

// Main build function
async function build() {
  console.log('Building site...');

  // Clean dist folder
  await fs.rm('dist', { recursive: true, force: true });
  await fs.mkdir('dist/blog', { recursive: true });

  // Read template
  const template = await readTemplate('base');

  // Get all posts
  const posts = await getPosts();
  console.log(`Found ${posts.length} published posts`);

  // Generate pages
  await generateBlogList(posts, template);
  for (const post of posts) {
    await generatePost(post, template);
  }
  await generateStaticPages(template);

  // Copy assets and generate sitemap
  await copyAssets();
  await generateSitemap(posts);

  console.log('✓ Build complete!');
}

build().catch(console.error);
```

#### 4. Create Base HTML Template
**File**: `templates/base.html`

**Changes**: Create new file with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="Harmon Bhasin - Computational Biology and Biosecurity">
  <meta name="robots" content="index, follow">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Highlight.js CSS -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">

  <!-- KaTeX CSS for LaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">

  <!-- Umami Analytics -->
  <script defer src="https://cloud.umami.is/script.js" data-website-id="27d21137-87c1-42a6-9f44-77815c153950"></script>

  <style>
    /* Custom prose styles */
    .prose {
      max-width: 100%;
      color: #1F2937;
    }
    .prose h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: bold;
    }
    .prose h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    .prose h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    .prose a {
      color: #000;
      text-decoration: underline;
    }
    .prose a:hover {
      color: #2563EB;
    }
    .prose ul {
      list-style-type: disc;
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .prose ol {
      list-style-type: decimal;
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .prose p {
      margin-bottom: 1rem;
      margin-top: 1rem;
      line-height: 1.7;
    }
    .prose blockquote {
      font-style: italic;
      margin: 1.5em 0;
      padding: 0 1em;
      border-left: 4px solid #ccc;
      color: #4B5563;
    }
    .prose pre {
      background: #f6f8fa;
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    .prose code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }
    .prose pre code {
      background: none;
      padding: 0;
    }
  </style>
</head>
<body class="bg-white">
  <!-- Header Navigation -->
  <header class="border-b">
    <nav class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <a href="/" class="text-xl font-bold">Harmon Bhasin</a>
        <div class="space-x-6">
          <a href="/" class="hover:text-blue-600">Home</a>
          <a href="/about" class="hover:text-blue-600">About</a>
          <a href="/blog" class="hover:text-blue-600">Blog</a>
          <a href="https://x.com/harmonbhasin" class="hover:text-blue-600">Twitter</a>
        </div>
      </div>
    </nav>
  </header>

  <!-- Main Content -->
  <main>
    {{CONTENT}}
  </main>

  <!-- Search and Filter JavaScript -->
  <script>
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const postsContainer = document.getElementById('posts-container');
    const noResults = document.getElementById('no-results');

    if (searchInput) {
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
    }

    // Category filtering
    const categoryButtons = document.querySelectorAll('.category-filter');

    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;
        const posts = document.querySelectorAll('.post-item');

        // Update active button
        categoryButtons.forEach(btn => {
          btn.classList.remove('bg-blue-500', 'text-white');
          btn.classList.add('hover:bg-gray-100');
        });
        button.classList.add('bg-blue-500', 'text-white');
        button.classList.remove('hover:bg-gray-100');

        // Filter posts
        let visibleCount = 0;
        posts.forEach(post => {
          const categories = post.dataset.categories.split(',');
          const matches = category === 'all' || categories.includes(category);

          post.style.display = matches ? 'block' : 'none';
          if (matches) visibleCount++;
        });

        // Clear search when filtering by category
        if (searchInput) searchInput.value = '';
        noResults.classList.toggle('hidden', visibleCount > 0);
      });
    });

    // Support category filtering from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      const button = document.querySelector(`[data-category="${categoryParam}"]`);
      if (button) button.click();
    }
  </script>
</body>
</html>
```

### Success Criteria:

#### Automated Verification:
- [ ] Dependencies install successfully: `npm install`
- [ ] Build script runs without errors: `node build.js`
- [ ] `dist/` directory is created
- [ ] No TypeScript errors (none expected - using JavaScript)

#### Manual Verification:
- [ ] Base template file exists and is valid HTML
- [ ] Build script completes in under 5 seconds
- [ ] Console shows "Found X published posts" message

---

## Phase 2: Migrate Content and Assets

### Overview
Move markdown posts, convert Svelte components to HTML templates, and migrate static assets.

### Changes Required:

#### 1. Move Markdown Posts
**Source**: `src/posts/*.md`
**Destination**: `posts/*.md`

**Changes**: Copy files as-is (frontmatter is already compatible)
```bash
cp src/posts/cmc-intro.md posts/
cp src/posts/second-post.md posts/
```

#### 2. Create About Page Content
**File**: `pages/about.md`

**Changes**: Extract content from `src/routes/about/+page.svelte` and create markdown file:
```markdown
# About

[Content from the Svelte component converted to markdown]
```

#### 3. Copy Static Assets
**Source**: `static/*`
**Destination**: `public/*`

**Changes**:
```bash
cp static/favicon.png public/
cp static/robots.txt public/
```

#### 4. Remove Old Directories
**Changes**: After verifying the build works, remove:
- `src/` (entire SvelteKit source directory)
- `static/` (moved to `public/`)
- `svelte.config.js`
- `vite.config.ts`
- `tailwind.config.cjs`
- `postcss.config.cjs`
- `tsconfig.json`
- `.svelte-kit/` (build artifacts)

### Success Criteria:

#### Automated Verification:
- [ ] Build runs successfully: `node build.js`
- [ ] All posts generate HTML files: `ls dist/blog/*/index.html`
- [ ] Static pages exist: `ls dist/index.html dist/about/index.html dist/blog/index.html`
- [ ] Assets copied: `ls dist/favicon.png dist/robots.txt`
- [ ] Sitemap generated: `ls dist/sitemap.xml`

#### Manual Verification:
- [ ] Posts render correctly with proper formatting
- [ ] Blockquotes appear with left border and italic styling
- [ ] Links are underlined and clickable
- [ ] About page content matches original
- [ ] Home page shows social links at bottom

---

## Phase 3: Add Features and Polish

### Overview
Implement search, tag filtering, and ensure all features from the original site work.

### Changes Required:

#### 1. Verify Search Functionality
The search is already included in `templates/base.html` script section. Test:
- Type in search box on `/blog`
- Verify posts filter by title and description
- Verify "No results" message appears when no matches

#### 2. Verify Tag Filtering
The tag filtering is already included. Test:
- Click "All" button - shows all posts
- Click category button - filters to that category
- Verify URL parameter works: `/blog?category=code-meets-cell`

#### 3. Add Syntax Highlighting Test
**File**: Create `posts/test-post.md` (temporary)

**Changes**: Add a test post with code block:
````markdown
---
title: "Test Post"
description: "Testing syntax highlighting"
date: '2025-01-01'
categories:
  - 'test'
published: false
---

Test code highlighting:

```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

Build and verify code is highlighted.

#### 4. Test LaTeX Support
Add LaTeX to a test post:
```markdown
Inline equation: $E = mc^2$

Block equation:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

Build and verify equations render correctly.

### Success Criteria:

#### Automated Verification:
- [ ] Build completes: `node build.js`
- [ ] No JavaScript errors in console (check with browser dev tools)
- [ ] Search input element exists in HTML: `grep 'search-input' dist/blog/index.html`
- [ ] Category filter buttons exist: `grep 'category-filter' dist/blog/index.html`

#### Manual Verification:
- [ ] Search filters posts in real-time as you type
- [ ] Search matches both title and description
- [ ] "No results" appears when search has no matches
- [ ] Clicking category buttons filters posts correctly
- [ ] "All" button shows all posts
- [ ] Active category button is highlighted in blue
- [ ] Code blocks have syntax highlighting with proper colors
- [ ] LaTeX equations render correctly (if tested)
- [ ] Clicking category tag on post goes to filtered blog page

---

## Phase 4: Deployment Configuration

### Overview
Configure Vercel for the new build system and deploy to production.

### Changes Required:

#### 1. Create Vercel Configuration
**File**: `vercel.json`

**Changes**: Create new file with:
```json
{
  "buildCommand": "node build.js",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

#### 2. Update .gitignore
**File**: `.gitignore`

**Changes**: Replace SvelteKit-specific entries with:
```
node_modules/
dist/
.DS_Store
.env
.env.local
```

#### 3. Test Local Build and Preview
**Commands**:
```bash
# Clean build
rm -rf dist node_modules
npm install
node build.js

# Preview locally
npx serve dist
```

Then visit `http://localhost:3000` and test all pages.

#### 4. Deploy to Vercel Preview
**Commands**:
```bash
# Commit changes
git add .
git commit -m "Migrate to vanilla JS static site generator"

# Push to new branch
git checkout -b vanilla-migration
git push origin vanilla-migration
```

Vercel will automatically create a preview deployment.

#### 5. Verify Preview Deployment
Test the preview URL:
- [ ] Home page loads
- [ ] About page loads
- [ ] Blog listing loads
- [ ] Individual posts load
- [ ] Search works
- [ ] Category filtering works
- [ ] Analytics tracking fires (check Umami dashboard)
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Favicon appears

#### 6. Merge to Main
Once verified, merge to main branch:
```bash
git checkout main
git merge vanilla-migration
git push origin main
```

### Success Criteria:

#### Automated Verification:
- [ ] Git status is clean: `git status`
- [ ] Build succeeds on Vercel (check deployment logs)
- [ ] Vercel deployment status is "Ready"
- [ ] All URLs return 200 status codes

#### Manual Verification:
- [ ] Production site (harm0n.com) loads correctly
- [ ] All pages accessible and render properly
- [ ] Search functionality works on production
- [ ] Category filtering works on production
- [ ] Umami Analytics shows page views in dashboard
- [ ] Mobile responsive design works
- [ ] No console errors in browser dev tools
- [ ] Site loads faster than before (noticeable improvement)

---

## Testing Strategy

### Unit Testing (Manual)
Since this is a simple build script with no framework:
- Test `getPosts()` returns correct number of published posts
- Test `formatDate()` formats dates correctly
- Test markdown parsing handles blockquotes, lists, links
- Test frontmatter parsing extracts all fields

### Integration Testing (Manual)
- Build with 0 posts (should succeed with empty blog)
- Build with 1 post (should create proper structure)
- Build with posts that have no categories
- Build with posts that have multiple categories
- Test unpublished posts are filtered out

### End-to-End Testing (Manual)
1. Navigate to home page → verify social links work
2. Navigate to about page → verify content displays
3. Navigate to blog → verify all posts listed
4. Use search → type query → verify filtering works
5. Click category tag → verify navigation to filtered blog
6. Click "All" → verify all posts show again
7. Click individual post → verify content renders
8. Verify blockquotes styled correctly
9. Verify links are clickable
10. Test on mobile device (responsive design)

### Performance Testing
- Measure build time: should be <1 second
- Measure page load time: should be <500ms (faster than before)
- Check bundle size: should be minimal (no framework JS)

---

## Performance Considerations

### Build Time:
- **Current**: ~5-10 seconds (Vite + SvelteKit)
- **Expected**: <1 second (simple Node script)

### Page Load Time:
- No framework JavaScript to download
- Only Tailwind CDN (~50KB) + search script (~2KB)
- Faster time-to-interactive

### Asset Optimization:
- Static HTML pre-rendered at build time
- No hydration overhead
- No client-side routing

### Future Optimizations:
- Minify HTML output (not needed initially)
- Self-host Tailwind CSS (reduce CDN dependency)
- Add service worker for offline support
- Optimize images (if/when images are added)

---

## Migration Notes

### Data Migration:
- Markdown files require no changes (frontmatter compatible)
- URLs remain identical (no redirects needed)
- Analytics ID preserved (no tracking interruption)

### Rollback Plan:
If issues occur:
1. Keep `vanilla-migration` branch separate
2. Main branch preserves SvelteKit code until verified
3. Can revert by checking out main branch
4. Vercel automatically deploys from main

### Post-Migration Cleanup:
After successful deployment:
1. Delete old SvelteKit dependencies from `package.json`
2. Remove unused config files
3. Update README with new build instructions
4. Archive `vanilla-migration` branch (or delete)

---

## Future Enhancements (Out of Scope)

These can be added later if desired:

### Dark Mode:
- Add toggle button in header
- Use localStorage to persist preference
- Apply dark: classes via JavaScript

### RSS Feed:
- Generate `rss.xml` in build script
- Include in sitemap

### Reading Time Estimate:
- Calculate words in markdown
- Display "X min read" on blog listing

### Related Posts:
- Match by categories
- Show at bottom of post pages

### Image Optimization:
- Add sharp library for image processing
- Generate responsive image sizes

### Comments:
- Integrate utterances (GitHub-based comments)
- Or giscus (GitHub discussions)

---

## References

- Original proposal: `/Users/harmonbhasin/programming/projects/harm0n/proposal.md`
- Current SvelteKit structure: `/Users/harmonbhasin/programming/projects/harm0n/src/routes/`
- Current posts: `/Users/harmonbhasin/programming/projects/harm0n/src/posts/`
- Marked documentation: https://marked.js.org/
- Tailwind CDN: https://tailwindcss.com/docs/installation/play-cdn

---

## Implementation Checklist

- [x] Phase 1: Create build system foundation
  - [x] Create directory structure
  - [x] Install dependencies
  - [x] Create `build.js`
  - [x] Create `templates/base.html`
  - [x] Test build runs

- [x] Phase 2: Migrate content and assets
  - [x] Move markdown posts
  - [x] Create about page
  - [x] Copy static assets
  - [ ] Remove old SvelteKit files (deferred until after verification)
  - [x] Test full build

- [x] Phase 3: Add features and polish
  - [x] Test search functionality
  - [x] Test tag filtering
  - [x] Test syntax highlighting
  - [x] Test LaTeX support (optional)
  - [x] Test all links work

- [x] Phase 4: Deployment
  - [x] Create `vercel.json`
  - [x] Update `.gitignore`
  - [x] Test local build
  - [ ] Deploy to preview
  - [ ] Verify preview deployment
  - [ ] Merge to main
  - [ ] Verify production deployment

**Estimated Time**: 4-5 hours total
