'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 12) {
      setError('A senha deve ter pelo menos 12 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 409) {
        setError('E-mail já cadastrado.');
        return;
      }
      if (response.status === 403) {
        setError('Cadastro público desabilitado. Contacte um administrador.');
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.detail ?? 'Erro ao criar conta.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login?registered=1'), 2000);
    } catch {
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [email, password, confirm, router]);

  return (
    <main className="main">
      <div className="card">
        <h1>Criar conta</h1>
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
              Senha <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(mín. 12 caracteres)</span>
              <br />
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </p>
          <p>
            <label>
              Confirmar senha
              <br />
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          </p>
          <button type="submit" disabled={loading || success}>
            {loading ? 'Aguarde…' : 'Criar conta'}
          </button>
          {success && (
            <p role="status" style={{ color: 'var(--color-success, #4ade80)', marginTop: '0.75rem' }}>
              Conta criada com sucesso! Redirecionando para o login…
            </p>
          )}
          {error && <p role="alert" className="error">{error}</p>}
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
          Já tem conta?{' '}
          <Link href="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
