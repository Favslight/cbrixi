export function slugify(input: string) {
  if (!input || typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

export default slugify;
