'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewInvestigation() {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrf = sessionStorage.getItem('csrf_token') ?? '';
      const response = await fetch('/api/v1/investigations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        body: JSON.stringify({ title, objective, scope: '' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body?.detail ?? `Erro ${response.status} ao criar investigação.`);
        return;
      }

      router.push('/investigations');
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="main">
      <div className="card">
        <h1>Nova investigação</h1>
        <form onSubmit={save}>
          <p>
            <label>
              Título
              <br />
              <input
                required
                placeholder="Título da investigação"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </p>
          <p>
            <label>
              Objetivo
              <br />
              <textarea
                placeholder="Descreva o objetivo desta investigação"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </label>
          </p>
          <button type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Criar'}
          </button>
          {error && <p role="alert" className="error">{error}</p>}
        </form>
      </div>
    </main>
  );
}
