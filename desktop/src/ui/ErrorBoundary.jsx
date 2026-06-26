/* ============================================================
   LAUNCHPAD — top-level error boundary.
   Last-resort guard so an unexpected render error in any surface
   (habitat / cats / model-viewer subtree / overlays) can never leave
   a kid staring at a blank white window. Instead we show a calm,
   friendly fallback with a single "try again" action that reloads the
   shell. Pure inline styles (CSP-safe: no external CSS needed) so the
   boundary itself can render even if a stylesheet failed to apply.
   ============================================================ */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface to the console for diagnostics; never rethrow.
    // eslint-disable-next-line no-console
    console.error('[launchpad] render error caught by boundary:', error, info);
  }

  handleReload = () => {
    try { window.location.reload(); } catch (e) { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100000, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 18, textAlign: 'center', padding: 32, color: '#eaf0ff',
          background: 'radial-gradient(120% 120% at 50% 30%, #122150, #070d22 70%)',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 64 }}>🐱</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>Kurze Pause …</div>
        <div style={{ fontSize: 18, color: '#9fb2e6', maxWidth: 460 }}>
          Da ist etwas durcheinandergekommen. Kein Problem — wir starten einfach neu.
        </div>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: 12, padding: '12px 24px', borderRadius: 999, cursor: 'pointer',
            background: 'linear-gradient(135deg,#2a6f8e,#1c3f6e)', border: 'none',
            color: '#eaf0ff', font: 'inherit', fontSize: 16, fontWeight: 700,
          }}
        >
          Nochmal starten
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
