// Simple HTML sanitizer — no external dependencies needed
// Safe for server-side rendering (no DOM required)

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript\s*:/gi, "");
}

export function renderPostContent(content: string): string {
  if (/<(p|br|strong|em|img|blockquote|ul|ol|h[23])\b/i.test(content)) {
    return sanitizeHtml(content);
  }
  // Plain text → HTML paragraphs
  return content
    .split("\n\n")
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`)
    .join("");
}
