import * as config from '$lib/config';

// Define the type for the post metadata
interface PostMetadata {
  title: string;
  description: string;
  date: string;
  categories: string[];
  published: boolean;
}

interface PostModule {
  metadata: PostMetadata;
  default: unknown;
}

// Import all blog posts using Vite's import.meta.glob
const postImports = import.meta.glob<PostModule>('/src/posts/*.md', { eager: true });

export async function GET() {
  // Static pages
  const pages = [
    '',
    'blog',
    // Add more static routes here as your site grows
  ];
  
  // Dynamically get blog posts
  const blogPosts = Object.entries(postImports)
    .filter(([_, post]) => post.metadata.published !== false)
    .map(([path, _]) => {
      // Extract slug from path
      const slug = path.split('/').pop()?.replace('.md', '') || '';
      return `blog/${slug}`;
    });
  
  // Combine all URLs
  const allUrls = [...pages, ...blogPosts];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="https://www.w3.org/1999/xhtml"
  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
>
  ${allUrls
    .map((url) => {
      return `
  <url>
    <loc>${config.url}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${url === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${url === '' ? '1.0' : url === 'blog' ? '0.9' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
} 