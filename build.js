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
    <section class="max-w-3xl mx-auto px-4 py-12">
      <p> I work as a researcher at <a href="https://securebio.org/" class="underline text-blue-600">SecureBio</a> working on the <a href="https://naobservatory.org/" class="underline text-blue-600">Nucleic Acid Observatory (NAO).</a> </p>

      <br/>

      <p>
        Thinking about:
      </p>
      <ul class="list-disc list-inside">
        <li>MLsys</li>
        <li>Compiler optimization</li>
        <li>Hardware & chip design</li>
      </ul>
      <br>

      <p>
        Wanna chat? Reach out to me at <a href="mailto:harmonsbhasin@gmail.com" class="underline text-blue-600">harmonsbhasin@gmail.com</a>.
      </p>
    </section>

    <section class="max-w-2xl mx-auto px-4 py-12">
      <div class="flex space-x-4">
        <a href="https://github.com/harmonbhasin" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </a>
        <a href="https://x.com/_harm0n" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
        </a>
        <a href="https://bsky.app/profile/harm0n.bsky.social" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899a7 7 0 1 1 16 0v6a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-6z"/><path d="M8 9h8"/><path d="M8 13h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>
        </a>
        <a href="https://scholar.google.com/citations?user=60B9CO0AAAAJ" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </a>
        <a href="mailto:harmonsbhasin@gmail.com" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </a>
        <a href="https://www.linkedin.com/in/harmonbhasin/" target="_blank" rel="noopener noreferrer" class="text-gray-700 hover:text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
      </div>
    </section>
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
