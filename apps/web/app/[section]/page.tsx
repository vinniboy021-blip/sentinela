'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const SECTION_TO_ENDPOINT: Record<string, string> = {
  investigations: 'investigations',
  alerts: 'alerts',
  evidence: 'evidence',
  reports: 'reports',
  monitors: 'monitors',
  entities: 'entities',
  results: 'observations',
  sources: 'connectors',
  admin: 'admin/users',
};

export default function Section({ params }: { params: Promise<{ section: string }> }) {
  const [items, setItems] = useState<unknown[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ section }) => {
      setTitle(section.replaceAll('-', ' '));
      const endpoint = SECTION_TO_ENDPOINT[section] ?? section;

      fetch(`/api/v1/${endpoint}`, { credentials: 'include' })
        .then((r) => {
          if (r.status === 401) throw new Error('Sessão expirada. Faça login novamente.');
          if (r.status === 403) throw new Error('Acesso não autorizado.');
          if (!r.ok) throw new Error(`Erro ${r.status} ao carregar dados.`);
          return r.json();
        })
        .then((x: { items?: unknown[] } | unknown[]) => {
          setItems(Array.isArray(x) ? x : (x as { items?: unknown[] }).items ?? []);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    });
  }, [params]);

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/dashboard">← Dashboard</Link>
      </aside>
      <main className="main">
        <h1 style={{ textTransform: 'capitalize' }}>{title}</h1>
        <div className="card">
          <p className="muted">
            Dados persistidos no backend. Selecione uma investigação para filtrar os resultados.
          </p>
          {loading && <p className="muted">Carregando…</p>}
          {error && <p role="alert" className="error">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p>Nenhum registro disponível.</p>
          )}
          {!loading && items.length > 0 && (
            <pre>{JSON.stringify(items, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
}
