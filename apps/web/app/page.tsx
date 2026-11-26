import Link from 'next/link';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Coleta Automatizada',
    desc: 'Conectores para fontes públicas com agendamento e rastreamento de proveniência.',
  },
  {
    icon: '🕸️',
    title: 'Grafo de Entidades',
    desc: 'Visualize relações entre pessoas, domínios, IPs e organizações em tempo real.',
  },
  {
    icon: '📋',
    title: 'Investigações Colaborativas',
    desc: 'Times com papéis distintos trabalham juntos em investigações segmentadas.',
  },
  {
    icon: '🛡️',
    title: 'Auditável por Design',
    desc: 'Cada ação é registrada com usuário, timestamp e contexto operacional.',
  },
  {
    icon: '🤖',
    title: 'Análise com IA',
    desc: 'Resumos, correlações e hipóteses geradas localmente via Ollama — sem dados na nuvem.',
  },
  {
    icon: '🔔',
    title: 'Alertas e Monitoramento',
    desc: 'Monitores periódicos com entrega via SMTP e webhooks HMAC assinados.',
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: '64px',
        borderBottom: '1px solid #1e293b', background: '#0a0f1e',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#e2e8f0' }}>
          ◈ Sentinela
        </span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Entrar</Link>
          <Link href="/register" style={{
            background: '#2563eb', color: '#fff', padding: '0.4rem 1rem',
            borderRadius: '6px', fontSize: '0.9rem',
          }}>Criar conta</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '5rem 2rem 3rem',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, #1e3a5f 0%, transparent 70%)',
      }}>
        <div style={{
          display: 'inline-block', background: '#0f2040', border: '1px solid #1e4080',
          borderRadius: '999px', padding: '0.3rem 1rem', marginBottom: '1.5rem',
          fontSize: '0.8rem', color: '#60a5fa', letterSpacing: '0.05em',
        }}>
          PLATAFORMA OSINT OPEN-SOURCE
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
          margin: '0 0 1rem', lineHeight: 1.1, maxWidth: '800px',
          background: 'linear-gradient(135deg, #e2e8f0 0%, #93c5fd 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Investigação de fontes públicas com proveniência auditável
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '560px', margin: '0 0 2.5rem' }}>
          Colete, correlacione e analise dados abertos com controle de acesso granular,
          rastreabilidade completa e análise por IA local.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" style={{
            background: '#2563eb', color: '#fff',
            padding: '0.75rem 2rem', borderRadius: '8px',
            fontWeight: 600, fontSize: '1rem',
          }}>
            Começar agora
          </Link>
          <Link href="/login" style={{
            background: 'transparent', color: '#93c5fd',
            border: '1px solid #334155',
            padding: '0.75rem 2rem', borderRadius: '8px',
            fontWeight: 500, fontSize: '1rem',
          }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <h2 style={{
          textAlign: 'center', fontSize: '1.6rem', fontWeight: 700,
          marginBottom: '2.5rem', color: '#e2e8f0',
        }}>
          Tudo que você precisa em uma plataforma
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: '12px', padding: '1.5rem',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 0.5rem', fontSize: '1rem' }}>
                {f.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 2rem', textAlign: 'center',
        borderTop: '1px solid #1e293b',
      }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 1rem', color: '#e2e8f0' }}>
          Pronto para começar?
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Crie sua conta gratuitamente. Sem cartão de crédito.
        </p>
        <Link href="/register" style={{
          background: '#2563eb', color: '#fff',
          padding: '0.75rem 2.5rem', borderRadius: '8px',
          fontWeight: 600, fontSize: '1rem',
        }}>
          Criar conta grátis
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1e293b', padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.5rem',
        color: '#475569', fontSize: '0.8rem',
      }}>
        <span>© 2026 Sentinela — MIT License</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/login" style={{ color: '#475569' }}>Login</Link>
          <Link href="/register" style={{ color: '#475569' }}>Cadastro</Link>
        </div>
      </footer>
    </div>
  );
}
