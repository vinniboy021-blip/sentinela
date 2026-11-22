import './globals.css';

export const metadata = {
  title: 'Sentinela',
  description: 'Plataforma de investigação de fontes públicas com proveniência auditável.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
