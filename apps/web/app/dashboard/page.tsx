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
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setUser(d.user))
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
          <Link href="/api/v1/auth/logout" style={{ fontSize: '0.85em', opacity: 0.6 }}
            onClick={async (e) => {
              e.preventDefault();
              await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
              window.location.href = '/login';
            }}>
            Sair
          </Link>
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
