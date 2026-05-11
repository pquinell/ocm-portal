import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'OCM Staff Portal — 2026 Applications',
  description: 'Ottawa Christmas Market staff portal for reviewing applications',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}