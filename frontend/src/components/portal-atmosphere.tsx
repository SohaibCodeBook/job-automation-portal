/**
 * Decorative viewport layer: micro-grid + vignette (no scan beams).
 * pointer-events: none — does not affect form behavior.
 */
export function PortalAtmosphere() {
  return (
    <div className="portal-root" aria-hidden="true">
      <div className="portal-grid" />
      <div className="portal-vignette" />
    </div>
  );
}
