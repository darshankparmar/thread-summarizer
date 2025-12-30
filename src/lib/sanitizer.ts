/**
 * HTML Sanitization Utilities
 * Protects against XSS attacks by sanitizing user-generated content
 */

/**
 * Basic HTML sanitizer for user-generated content
 * Removes potentially dangerous HTML while preserving safe formatting
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
  html = html.replace(/\s*javascript\s*:/gi, ''); // javascript: URLs
  html = html.replace(/\s*data\s*:/gi, ''); // data: URLs
  html = html.replace(/\s*vbscript\s*:/gi, ''); // vbscript: URLs
  
  // Remove dangerous tags
  const dangerousTags = [
    'script', 'object', 'embed', 'link', 'style', 'meta', 'iframe', 'frame', 
    'frameset', 'applet', 'base', 'form', 'input', 'button', 'textarea', 'select'
  ];
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    html = html.replace(regex, '');
  });

  // Allow only safe HTML tags
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ];

  // Remove any HTML tags not in the allowed list
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For allowed tags, remove any attributes to be extra safe
      return `<${tagName.toLowerCase()}>`;
    }
    return ''; // Remove disallowed tags
  });

  return html.trim();
}

/**
 * Sanitize text content for display (removes all HTML)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize and truncate text for previews
 */
export function sanitizePreview(text: string, maxLength: number = 150): string {
  const sanitized = sanitizeText(text);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  return sanitized.substring(0, maxLength).trim() + '...';
}

/**
 * Validate and sanitize URL for safe usage
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  return input
    .replace(/\0/g, '') // null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control characters
    .trim();
}