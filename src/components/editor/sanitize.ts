import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "img",
  "blockquote",
  "pre",
  "code",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "span",
  "div",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "class",
  "data-user-id",
  "target",
  "rel",
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}

// For old plain-text posts, wrap in <p> tags
export function renderPostContent(content: string): string {
  // If content looks like HTML (contains tags), sanitize and return
  if (
    content.includes("<p>") ||
    content.includes("<br") ||
    content.includes("<strong>") ||
    content.includes("<img")
  ) {
    return sanitizeHtml(content);
  }

  // Plain text — wrap paragraphs in <p> tags
  return content
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
