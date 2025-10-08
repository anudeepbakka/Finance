import { SessionProvider } from 'next-auth/react';
import '../app/globals.css';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
          <Component {...pageProps} />
        </main>
      </div>
    </SessionProvider>
  );
}
