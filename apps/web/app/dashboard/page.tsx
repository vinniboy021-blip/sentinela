'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS: [string, string][] = [
  ['Investigações', '/investigations'],
  ['Fontes OSINT', '/sources'],
  ['Monitoramento', '/monitors'],
  ['Observações', '/results'],
  ['Entidades', '/entities'],
  ['Grafo', '/graph'],
  ['Evidências', '/evidence'],
  ['Alertas', '/alerts'],
  ['Relatórios', '/reports'],
  ['Administração', '/admin'],
];

export default function Dashboard() {
  const [data, setData] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/dashboard', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Record<string, number>>;
      })
      .then(setData)
      .catch(() => setError('Não foi possível carregar o painel.'));
  }, []);

  return (
    <div className="shell">
      <aside className="side">
        <h2>OSINT</h2>
        <nav>
          {NAV_ITEMS.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
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
        <div className="card">
          <h2>Próximos passos</h2>
          <Link href="/investigations/new">Criar investigação</Link>
        </div>
      </main>
    </div>
  );
}
