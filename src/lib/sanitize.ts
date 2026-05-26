import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML produced by the admin's Tiptap editor before storing.
 * Allows the tags + attributes Tiptap emits with our extension set
 * (heading, lists, link, image, blockquote, bold/italic/underline, code).
 *
 * Stripping `<script>`, inline event handlers, `javascript:` URLs, etc.
 * protects visitors from a compromised admin account or future XSS bug
 * in the editor pipeline.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title", "width", "height",
      "class",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    ADD_ATTR: ["target"],
  });
}
