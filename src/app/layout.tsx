import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ApplicationsProvider } from '@/context/ApplicationsContext';

export const metadata = {
  title: 'OCM Staff Portal — 2026 Applications',
  description: 'Ottawa Christmas Market staff portal for reviewing applications',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ApplicationsProvider>
            {children}
          </ApplicationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}