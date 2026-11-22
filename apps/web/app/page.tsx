import Link from 'next/link';

export default function Home() {
  return (
    <main className="main">
      <div className="card">
        <h1>Sentinela</h1>
        <p className="muted">
          Plataforma de investigação de fontes públicas com proveniência auditável.
        </p>
        <Link href="/login">Entrar</Link>
      </div>
    </main>
  );
}
