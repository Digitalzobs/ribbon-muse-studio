function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildMockImage({ title, subtitle, palette, index }) {
  const [primary, secondary, accent] = palette;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primary}" />
        <stop offset="40%" stop-color="${secondary}" />
        <stop offset="100%" stop-color="${accent}" />
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.78)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.18)" />
      </linearGradient>
    </defs>
    <rect width="900" height="1200" rx="44" fill="url(#bg)" />
    <circle cx="700" cy="200" r="220" fill="rgba(255,255,255,0.22)" />
    <circle cx="170" cy="970" r="180" fill="rgba(255,255,255,0.18)" />
    <path d="M90 110C220 60 280 180 390 130C480 88 540 118 645 188" stroke="rgba(255,255,255,0.9)" stroke-width="18" stroke-linecap="round"/>
    <path d="M610 930C690 980 726 1060 814 1090" stroke="rgba(255,255,255,0.95)" stroke-width="16" stroke-linecap="round"/>
    <rect x="82" y="180" width="736" height="870" rx="36" fill="url(#card)" stroke="rgba(255,255,255,0.48)" />
    <text x="120" y="260" fill="#631038" font-size="28" font-family="Manrope, sans-serif" letter-spacing="5">RIBBON MUSE STUDIO</text>
    <text x="120" y="328" fill="#1f1720" font-size="62" font-weight="700" font-family="'Cormorant Garamond', serif">${escapeHtml(
      title
    )}</text>
    <text x="120" y="382" fill="#3f2b37" font-size="24" font-family="Manrope, sans-serif">Render ${index + 1}</text>
    <rect x="120" y="426" width="660" height="420" rx="28" fill="rgba(255,255,255,0.55)" />
    <circle cx="450" cy="558" r="118" fill="rgba(255,47,146,0.16)" />
    <path d="M308 610C355 504 553 504 598 610C629 686 563 770 450 784C338 770 276 684 308 610Z" fill="rgba(63,24,49,0.13)" />
    <text x="120" y="910" fill="#631038" font-size="22" font-family="Manrope, sans-serif" letter-spacing="4">SCENE DIRECTION</text>
    <foreignObject x="120" y="940" width="660" height="140">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Manrope, sans-serif; color: #2d1d29; font-size: 26px; line-height: 1.4;">
        ${escapeHtml(subtitle)}
      </div>
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
