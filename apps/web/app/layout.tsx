import { headers } from 'next/headers';
import './globals.css';

export const metadata = {
  title: 'Sentinela',
  description: 'Plataforma de investigação de fontes públicas com proveniência auditável.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <html lang="pt-BR">
      <body>
        <script
          nonce={nonce}
          // Prevents click-jacking at the browser level as a defence-in-depth
          // complement to the frame-ancestors CSP directive.
          dangerouslySetInnerHTML={{
            __html: `if(window.top!==window.self)window.top.location=window.self.location`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
