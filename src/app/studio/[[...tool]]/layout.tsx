// The Studio owns the full viewport and ships its own styling, so it opts
// out of the site chrome (fonts, globals.css) applied in the root layout.
export default function StudioLayout({children}: {children: React.ReactNode}) {
  return <>{children}</>;
}
