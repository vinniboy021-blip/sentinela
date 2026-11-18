'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError('Credenciais inválidas ou conta bloqueada.');
        return;
      }

      const data = await response.json();
      sessionStorage.setItem('csrf_token', data.csrf_token ?? '');
      router.push('/dashboard');
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <main className="main">
      <div className="card">
        <h1>Entrar</h1>
        <form onSubmit={submit}>
          <p>
            <label>
              E-mail
              <br />
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </p>
          <p>
            <label>
              Senha
              <br />
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </p>
          <button type="submit" disabled={loading}>
            {loading ? 'Aguarde…' : 'Entrar'}
          </button>
          {error && <p role="alert" className="error">{error}</p>}
        </form>
      </div>
    </main>
  );
}
