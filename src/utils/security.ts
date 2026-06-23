export const sanitizeInput = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // remove <script> tags and content
    .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '') // remove <iframe> tags and content
    .replace(/javascript:/gi, '') // prevent javascript URI scheme execution
    .replace(/onload\s*=/gi, 'no_onload=') // neutralize event handlers
    .replace(/onerror\s*=/gi, 'no_onerror=')
    .replace(/onclick\s*=/gi, 'no_onclick=')
    .replace(/onmouseover\s*=/gi, 'no_onmouseover=')
    .replace(/<[^>]*>/g, ''); // strip remaining HTML tags completely
};
