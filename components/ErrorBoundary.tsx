import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Fängt Renderfehler ab, damit die App nicht weiß bleibt. Zeigt eine
 * lesbare Meldung mit Reload und (falls möglich) Reset des Baums.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Hizbul Azam] Renderfehler:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          background: '#F7F5F0',
          color: '#1a1a18',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, margin: 0 }}>
          Etwas ist schiefgelaufen
        </h1>
        <p style={{ maxWidth: 420, lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>
          Die Ansicht konnte nicht gerendert werden. Deine Favoriten und Einstellungen bleiben
          gespeichert.
        </p>
        <pre
          style={{
            maxWidth: 520,
            overflowX: 'auto',
            background: '#fff',
            border: '1px solid #E0DDD5',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            textAlign: 'left',
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={this.reset}
            style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #E0DDD5', background: '#fff', cursor: 'pointer' }}
          >
            Erneut versuchen
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1B4332', color: '#fff', cursor: 'pointer' }}
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }
}
