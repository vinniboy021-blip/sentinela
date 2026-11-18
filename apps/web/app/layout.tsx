import './globals.css';

export const metadata = {
  title: 'OSINT Tracker',
  description: 'Plataforma de investigação pública com proveniência auditável.',
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
