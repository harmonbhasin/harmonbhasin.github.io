# Blog Styling Guide

This guide shows you exactly where to change styling for your blog.

## Quick Reference

| What to Change | File | Line Range |
|---------------|------|------------|
| **Text colors, fonts, sizes** | `templates/base.html` | Lines 27-127 |
| **Background color** | `templates/base.html` | Line ~196 |
| **Navigation header** | `templates/base.html` | Lines 198-215 |
| **Content width** | `build.js` | Line 179 |
| **Sidenote styling** | `templates/base.html` | Lines 129-202 |

---

## 1. Main Content Styling

**File:** `templates/base.html` (Lines 27-127)

### Text Color
```css
.prose {
  color: #1F2937;  /* Main text color */
}
```

### Heading Sizes
```css
.prose h1 {
  font-size: 2rem;  /* 32px - Main post title */
}
.prose h2 {
  font-size: 1.5rem;  /* 24px - Section headings */
}
.prose h3 {
  font-size: 1.25rem;  /* 20px - Subsection headings */
}
```

### Link Colors
```css
.prose a {
  color: #000;  /* Default link color (black) */
}
.prose a:hover {
  color: #2563EB;  /* Hover color (blue) */
}
```

### Line Height
```css
.prose p {
  line-height: 1.7;  /* Spacing between lines - increase for more breathing room */
}
```

### Code Blocks
```css
.prose pre {
  background: #f6f8fa;  /* Code block background (light gray) */
}
.prose code {
  background: #f6f8fa;  /* Inline code background */
}
```

### Blockquotes
```css
.prose blockquote {
  border-left: 4px solid #ccc;  /* Left border color */
  color: #4B5563;  /* Quote text color (gray) */
}
```

---

## 2. Page Layout

### Background Color

**File:** `templates/base.html` (Line ~196)
```html
<body class="bg-white">
```

**Common alternatives:**
- `bg-gray-50` - Very light gray
- `bg-gray-100` - Light gray
- `bg-slate-50` - Subtle blue-gray

### Content Width

**File:** `build.js` (Line 179)
```javascript
<article class="max-w-3xl mx-auto px-4 py-8">
```

**Width options:**
- `max-w-2xl` - Narrower (672px)
- `max-w-3xl` - Current (768px) ← Default
- `max-w-4xl` - Wider (896px)
- `max-w-5xl` - Very wide (1024px)
- `max-w-prose` - Optimal reading width (~65ch)

---

## 3. Navigation Header

**File:** `templates/base.html` (Lines 198-215)

### Header Border
```html
<header class="border-b">
```

Remove `border-b` for no border, or change to:
- `border-b-2` - Thicker border
- `border-b border-gray-300` - Custom border color

### Navigation Link Colors
```html
<a href="/" class="hover:text-blue-600">Home</a>
```

**Color options:**
- `hover:text-blue-600` - Blue (default)
- `hover:text-purple-600` - Purple
- `hover:text-green-600` - Green
- `hover:text-red-600` - Red

### Site Title
```html
<a href="/" class="text-xl font-bold">Harmon Bhasin</a>
```

Change "Harmon Bhasin" to your name.

---

## 4. Sidenote Styling

**File:** `templates/base.html` (Lines 129-202)

### Desktop Sidenotes
```css
.sidenote {
  margin-right: -60%;  /* How far to the right */
  width: 50%;          /* Sidenote width */
  font-size: 0.9rem;   /* Text size */
  color: #4B5563;      /* Text color (gray) */
}
```

### Mobile Sidenotes
```css
@media (max-width: 1024px) {
  .sidenote {
    background: #f9fafb;      /* Background color */
    border-left: 3px solid #3B82F6;  /* Left border (blue) */
  }
}
```

### Footnote Number Color (Mobile)
```css
.sidenote-number {
  color: #3B82F6;  /* Blue - indicates it's clickable */
}
```

---

## 5. Common Customizations

### Dark Theme

To create a dark theme, change these values:

**Background:**
```html
<body class="bg-gray-900">  <!-- Dark background -->
```

**Text colors:**
```css
.prose {
  color: #E5E7EB;  /* Light gray text */
}
.prose a {
  color: #60A5FA;  /* Light blue links */
}
.prose a:hover {
  color: #93C5FD;  /* Lighter blue on hover */
}
```

**Code blocks:**
```css
.prose pre {
  background: #1F2937;  /* Dark code background */
}
```

### Serif Font

Add to `<style>` section:
```css
.prose {
  font-family: Georgia, Cambria, "Times New Roman", Times, serif;
}
```

### Larger Text

```css
.prose {
  font-size: 1.125rem;  /* 18px instead of 16px */
}
```

### Centered Layout

**Change in `build.js` line 179:**
```javascript
<article class="max-w-3xl mx-auto px-4 py-8 text-center">
```

### Custom Accent Color

Pick a color and replace all blues:
```css
/* Replace #2563EB (blue) with your color */
.prose a:hover {
  color: #059669;  /* Example: Green */
}
.sidenote-number {
  color: #059669;
}
```

---

## Color Reference

Use these Tailwind color codes or hex values:

| Color | Tailwind | Hex |
|-------|----------|-----|
| Black | `text-black` | `#000000` |
| White | `text-white` | `#FFFFFF` |
| Gray (dark) | `text-gray-900` | `#111827` |
| Gray (medium) | `text-gray-600` | `#4B5563` |
| Gray (light) | `text-gray-300` | `#D1D5DB` |
| Blue | `text-blue-600` | `#2563EB` |
| Purple | `text-purple-600` | `#9333EA` |
| Green | `text-green-600` | `#059669` |
| Red | `text-red-600` | `#DC2626` |

Full color palette: https://tailwindcss.com/docs/customizing-colors

---

## After Making Changes

Always rebuild after editing:
```bash
npm run build
npm run dev  # Preview at localhost:3000
```

---

## Need More Help?

- Tailwind CSS docs: https://tailwindcss.com/docs
- CSS color picker: https://htmlcolorcodes.com/
- Font pairing: https://fontpair.co/
