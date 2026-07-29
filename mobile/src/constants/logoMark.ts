/** Favicon-style mark (matches web logo tile / tab icon shape). */
export const cbrixiLogoMarkXml = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cbrixiMarkGradient" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3B82F6" />
      <stop offset="1" stop-color="#7C3AED" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#cbrixiMarkGradient)" />
  <g transform="translate(12 12)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 0L0 6L12 12L24 6L12 0Z" />
    <path d="M0 12L12 18L24 12" />
    <path d="M0 18L12 24L24 18" />
  </g>
</svg>
`;
