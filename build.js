import fs from "fs/promises";
import path from "path";
import { marked } from "marked";
import matter from "gray-matter";
import katex from "marked-katex-extension";
import hljs from "highlight.js";
import markedFootnote from "marked-footnote";

// Configure marked
marked.use(katex());
marked.use(markedFootnote());
marked.use({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return code;
  },
});

const SITE_URL = "https://harm0n.com";
// ============================================================================
// SOCIAL MEDIA / OPEN GRAPH CONFIGURATION
// ============================================================================
// Change DEFAULT_OG_IMAGE to customize the image shown when sharing your site
// This image should be:
//   - 1200x630 pixels (recommended for Twitter/Facebook)
//   - Placed in the public/ folder
//   - Named og-image.png (or update the filename below)
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

// Helper: Read template file
async function readTemplate(name) {
  return await fs.readFile(`templates/${name}.html`, "utf-8");
}

// Helper: Replace meta tags in template
function replaceMetaTags(
  template,
  { title, description, url, type = "website", image = DEFAULT_OG_IMAGE },
) {
  return template
    .replaceAll("{{TITLE}}", title)
    .replaceAll("{{DESCRIPTION}}", description)
    .replaceAll("{{OG_TYPE}}", type)
    .replaceAll("{{OG_URL}}", url)
    .replaceAll("{{OG_TITLE}}", title)
    .replaceAll("{{OG_DESCRIPTION}}", description)
    .replaceAll("{{OG_IMAGE}}", image);
}

// Helper: Get all posts
async function getPosts() {
  const files = await fs.readdir("posts");
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".md"))
      .map(async (file) => {
        const content = await fs.readFile(`posts/${file}`, "utf-8");
        const { data, content: markdown } = matter(content);
        const html = marked(markdown);
        const slug = file.replace(".md", "");

        return {
          ...data,
          slug,
          html,
          published: data.published || false,
          categories: data.categories || [],
        };
      }),
  );

  return posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper: Format date
function formatDate(dateString) {
  // Parse date string as YYYY-MM-DD in local timezone (not UTC)
  // This prevents timezone offset issues that can shift the date
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate blog listing page
async function generateBlogList(posts, template) {
  // Get unique categories
  const allCategories = [...new Set(posts.flatMap((p) => p.categories))].sort();

  const categoriesHTML = allCategories
    .map(
      (cat) =>
        `<button class="category-filter px-3 py-1 rounded-full text-sm border hover:bg-gray-100" data-category="${cat}">${cat}</button>`,
    )
    .join("\n          ");

  const postsHTML = posts
    .map((post) => {
      const isExternal = post.link && post.external;
      const postUrl = isExternal ? post.link : `/blog/${post.slug}`;
      const linkTarget = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      const externalIcon = isExternal
        ? ' <svg class="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>'
        : "";
      const externalBadge = isExternal
        ? '<span class="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold mr-2">External</span>'
        : "";

      return `
    <article class="post-item mb-8 pb-8 border-b" data-categories="${post.categories.join(",")}">
      <h2 class="text-2xl font-bold mb-2">
        <a href="${postUrl}"${linkTarget} class="hover:text-blue-600">${post.title}${externalIcon}</a>
      </h2>
      <div class="flex items-center gap-2 mb-2">
        <time class="text-gray-600 text-sm">${formatDate(post.date)}</time>
        ${externalBadge}
      </div>
      <div class="mt-2">
        ${post.categories
          .map(
            (cat) =>
              `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm mr-2">${cat}</span>`,
          )
          .join("")}
      </div>
      <p class="mt-3 text-gray-700">${post.description}</p>
    </article>
  `;
    })
    .join("");

  const content = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="prose prose-lg max-w-none">
          <h1>Blog</h1>
        </div>

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
    `;

  // ============================================================================
  // BLOG LISTING PAGE METADATA - Change this to customize social media previews
  // ============================================================================
  const html = replaceMetaTags(template, {
    title: "Blog - Harmon Bhasin",
    description:
      "Blog posts about computational biology, biosecurity, and machine learning by Harmon Bhasin",
    url: `${SITE_URL}/blog`,
    type: "website",
  }).replace("{{CONTENT}}", content);

  await fs.writeFile("dist/blog/index.html", html);
}

// Generate individual post page
async function generatePost(post, template) {
  const content = `
      <article class="max-w-3xl mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-4xl font-bold mb-4">${post.title}</h1>
          <time class="text-gray-600">${formatDate(post.date)}</time>
          <div class="mt-2">
            ${post.categories
              .map(
                (cat) =>
                  `<a href="/blog?category=${cat}" class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm mr-2 hover:bg-gray-300">${cat}</a>`,
              )
              .join("")}
          </div>
        </header>
        <div class="prose prose-lg max-w-none">
          ${post.html}
        </div>
      </article>
    `;

  // ============================================================================
  // INDIVIDUAL BLOG POST METADATA - Change this to customize social previews
  // ============================================================================
  // Each post's metadata comes from:
  //   - title: From post frontmatter
  //   - description: From post frontmatter (falls back to generic message)
  //   - image: Custom per-post (add 'ogImage: /path/to/image.png' in frontmatter)
  //            or uses DEFAULT_OG_IMAGE
  const html = replaceMetaTags(template, {
    title: `${post.title} - Harmon Bhasin`,
    description: post.description || `Read ${post.title} by Harmon Bhasin`,
    url: `${SITE_URL}/blog/${post.slug}`,
    type: "article",
    image: post.ogImage || DEFAULT_OG_IMAGE,
  }).replace("{{CONTENT}}", content);

  await fs.mkdir(`dist/blog/${post.slug}`, { recursive: true });
  await fs.writeFile(`dist/blog/${post.slug}/index.html`, html);
}

// Generate static pages
async function generateStaticPages(template) {
  // Home page (read from pages/home.md if exists, otherwise use default)
  let homeContent = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="prose prose-lg max-w-none">
        <p>Welcome to my site.</p>
      </div>
    </div>
  `;

  try {
    const homeMd = await fs.readFile("pages/home.md", "utf-8");
    const { content: markdown } = matter(homeMd);
    const html = marked(markdown);
    homeContent = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="prose prose-lg max-w-none">
          ${html}
        </div>
      </div>
    `;
  } catch (e) {
    // Use default if file doesn't exist
  }

  // ============================================================================
  // HOME PAGE METADATA - Change this to customize your homepage social preview
  // ============================================================================
  const homeHtml = replaceMetaTags(template, {
    title: "Harmon Bhasin",
    description: "Tinkering in comp bio, and ml.",
    url: SITE_URL,
    type: "website",
  }).replace("{{CONTENT}}", homeContent);

  await fs.writeFile("dist/index.html", homeHtml);

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
    const aboutMd = await fs.readFile("pages/about.md", "utf-8");
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

  // ============================================================================
  // ABOUT PAGE METADATA - Change this to customize your about page social preview
  // ============================================================================
  const aboutHtml = replaceMetaTags(template, {
    title: "About - Harmon Bhasin",
    description: "About Harmon Bhasin",
    url: `${SITE_URL}/about`,
    type: "website",
  }).replace("{{CONTENT}}", aboutContent);

  await fs.mkdir("dist/about", { recursive: true });
  await fs.writeFile("dist/about/index.html", aboutHtml);
}

// Generate sitemap
async function generateSitemap(posts) {
  const urls = [
    { url: SITE_URL, changefreq: "monthly", priority: "1.0" },
    { url: `${SITE_URL}/about`, changefreq: "monthly", priority: "0.8" },
    { url: `${SITE_URL}/blog`, changefreq: "weekly", priority: "0.9" },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ url, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  await fs.writeFile("dist/sitemap.xml", xml);
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

  await copyDir("public", "dist");
}

// Main build function
async function build() {
  console.log("Building site...");

  // Clean dist folder
  await fs.rm("dist", { recursive: true, force: true });
  await fs.mkdir("dist/blog", { recursive: true });

  // Read template
  const template = await readTemplate("base");

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

  console.log("✓ Build complete!");
}

build().catch(console.error);
