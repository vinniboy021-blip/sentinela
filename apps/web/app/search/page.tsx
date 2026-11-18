'use client';

import { useState } from 'react';
import Link from 'next/link';

type SearchResults = Record<string, unknown[]>;

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        setError('Informe pelo menos dois caracteres ou faça login.');
        return;
      }

      setResults(await response.json());
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/dashboard">← Dashboard</Link>
      </aside>
      <main className="main">
        <h1>Pesquisa global</h1>
        <form onSubmit={run} className="card">
          <label>
            Termo de busca
            <br />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="domínio, username, URL ou indicador"
              minLength={2}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Pesquisando…' : 'Pesquisar'}
          </button>
          {error && <p role="alert" className="error">{error}</p>}
        </form>
        {hasResults &&
          Object.entries(results).map(([kind, items]) => (
            <section className="card" key={kind}>
              <h2>{kind}</h2>
              {items.length > 0 ? (
                <pre>{JSON.stringify(items, null, 2)}</pre>
              ) : (
                <p className="muted">Nenhum resultado.</p>
              )}
            </section>
          ))}
      </main>
    </div>
  );
}
