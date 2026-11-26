'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type UserInfo = { id: string; email: string; role: string };

const NAV_ALL: [string, string][] = [
  ['Investigações', '/investigations'],
  ['Fontes OSINT', '/sources'],
  ['Monitoramento', '/monitors'],
  ['Observações', '/results'],
  ['Entidades', '/entities'],
  ['Grafo', '/graph'],
  ['Evidências', '/evidence'],
  ['Alertas', '/alerts'],
  ['Relatórios', '/reports'],
];

const NAV_ADMIN: [string, string][] = [
  ['Administração', '/admin'],
];

export default function Dashboard() {
  const [data, setData] = useState<Record<string, number>>({});
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/auth/me', { credentials: 'include' })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { window.location.href = '/login'; return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (d) setUser(d.user); })
      .catch(() => {});

    fetch('/api/v1/dashboard', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Record<string, number>>;
      })
      .then(setData)
      .catch(() => setError('Não foi possível carregar o painel.'));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst' || isAdmin;
  const navItems = [...NAV_ALL, ...(isAdmin ? NAV_ADMIN : [])];

  return (
    <div className="shell">
      <aside className="side">
        <h2>Sentinela</h2>
        {user && (
          <div style={{ fontSize: '0.8em', marginBottom: '1rem', opacity: 0.7 }}>
            <div>{user.email}</div>
            <div style={{ textTransform: 'capitalize' }}>{rolePtBr(user.role)}</div>
          </div>
        )}
        <nav>
          {navItems.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85em', cursor: 'pointer', padding: 0 }}
            onClick={async () => {
              const csrf = sessionStorage.getItem('csrf_token') ?? '';
              await fetch('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRF-Token': csrf },
              });
              sessionStorage.removeItem('csrf_token');
              window.location.href = '/login';
            }}>
            Sair
          </button>
        </div>
      </aside>
      <main className="main">
        <h1>Dashboard</h1>
        <p className="muted">Visão operacional das investigações autorizadas.</p>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="grid">
          {Object.entries(data).map(([key, value]) => (
            <div className="card" key={key}>
              <h3>{key}</h3>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {isAnalyst && (
          <div className="card">
            <h2>Próximos passos</h2>
            <Link href="/investigations/new">Criar investigação</Link>
          </div>
        )}
        {!isAnalyst && user && (
          <div className="card">
            <p className="muted">Sua conta é somente leitura. Contacte um administrador para obter permissões de edição.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function rolePtBr(role: string): string {
  const map: Record<string, string> = {
    admin: 'Administrador',
    analyst: 'Analista',
    viewer: 'Visualizador',
  };
  return map[role] ?? role;
}
