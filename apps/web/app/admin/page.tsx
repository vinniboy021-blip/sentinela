'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type UserRow = { id: string; email: string; role: string; is_active: boolean; created_at: string };

const ROLES = ['admin', 'analyst', 'viewer'] as const;
type Role = typeof ROLES[number];

function rolePtBr(role: string) {
  return { admin: 'Administrador', analyst: 'Analista', viewer: 'Visualizador' }[role] ?? role;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // form novo usuário
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('analyst');
  const [creating, setCreating] = useState(false);

  const csrf = () => sessionStorage.getItem('csrf_token') ?? '';

  const load = useCallback(async () => {
    const r = await fetch('/api/v1/admin/users', { credentials: 'include' });
    if (r.status === 403) { setError('Acesso restrito a administradores.'); return; }
    if (!r.ok) { setError('Erro ao carregar usuários.'); return; }
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : (d.items ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = useCallback(async (id: string, role: Role) => {
    setMsg('');
    const r = await fetch(`/api/v1/admin/users/${id}/role`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ role }),
    });
    if (!r.ok) { setError('Erro ao alterar papel.'); return; }
    setMsg('Papel atualizado.');
    load();
  }, [load]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    setMsg('');
    const r = await fetch(`/api/v1/admin/users/${id}/active`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify({ is_active: active }),
    });
    if (!r.ok) { setError('Erro ao alterar status.'); return; }
    setMsg(active ? 'Usuário ativado.' : 'Usuário desativado.');
    load();
  }, [load]);

  const createUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    setCreating(true);
    try {
      const r = await fetch('/api/v1/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d?.detail ?? 'Erro ao criar usuário.');
        setNewPassword('');
        return;
      }
      setMsg('Usuário criado com sucesso.');
      setNewEmail(''); setNewPassword(''); setNewRole('analyst');
      load();
    } finally {
      setCreating(false);
    }
  }, [newEmail, newPassword, newRole, load]);

  return (
    <div className="shell">
      <aside className="side">
        <h2>Sentinela</h2>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin" style={{ fontWeight: 'bold' }}>Administração</Link>
        </nav>
      </aside>
      <main className="main">
        <h1>Administração</h1>

        {error && <p role="alert" className="error">{error}</p>}
        {msg && <p role="status" style={{ color: 'var(--color-success, #4ade80)' }}>{msg}</p>}

        {/* Criar usuário */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Novo usuário</h2>
          <form onSubmit={createUser}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ flex: 2, minWidth: '180px' }}>
                E-mail
                <br />
                <input
                  required type="email" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label style={{ flex: 2, minWidth: '180px' }}>
                Senha <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(mín. 12)</span>
                <br />
                <input
                  required type="password" minLength={12} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label style={{ flex: 1, minWidth: '120px' }}>
                Papel
                <br />
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                  {ROLES.map((r) => <option key={r} value={r}>{rolePtBr(r)}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={creating} style={{ marginTop: '0.75rem' }}>
              {creating ? 'Criando…' : 'Criar usuário'}
            </button>
          </form>
        </div>

        {/* Lista de usuários */}
        <div className="card">
          <h2>Usuários ({users.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>E-mail</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Papel</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{u.email}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      style={{ padding: '0.2rem 0.4rem' }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{rolePtBr(r)}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{ color: u.is_active ? '#4ade80' : '#f87171' }}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <button
                      onClick={() => toggleActive(u.id, !u.is_active)}
                      style={{ fontSize: '0.8em', padding: '0.2rem 0.6rem' }}
                    >
                      {u.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regras de acesso */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>Regras de acesso</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Ação</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Administrador</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Analista</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Visualizador</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Visualizar investigações próprias', true, true, true],
                ['Criar investigações', true, true, false],
                ['Criar entidades / observações', true, true, false],
                ['Gerenciar colaboradores', true, true, false],
                ['Visualizar todas as investigações', true, false, false],
                ['Gerenciar usuários', true, false, false],
                ['Gerenciar conectores', true, false, false],
                ['Acesso à área de administração', true, false, false],
              ].map(([action, adm, ana, vie]) => (
                <tr key={String(action)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{String(action)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{adm ? '✓' : '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{ana ? '✓' : '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{vie ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
