'use client';

import { useCallback, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

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
    <div className="card">
      <h1>Entrar</h1>
      {justRegistered && (
        <p role="status" style={{ color: 'var(--color-success, #4ade80)', marginBottom: '1rem' }}>
          Conta criada com sucesso! Faça login para continuar.
        </p>
      )}
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
      <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
        Não tem conta?{' '}
        <Link href="/register">Criar conta</Link>
      </p>
    </div>
  );
}

export default function Login() {
  return (
    <main className="main">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
