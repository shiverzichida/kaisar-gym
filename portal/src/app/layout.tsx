import type { Metadata } from 'next';
import './globals.css';
import { PortalAuthProvider } from '@/context/PortalAuthContext';

export const metadata: Metadata = {
  title: 'KAISAR GYM — The Ultimate Luxury Fitness Experience in Pontianak',
  description: 'Website Resmi & Portal Member / Personal Trainer Kaisar Gym Pontianak. Pilates Reformer, Studio Classes, Olympic Lifting, & Dedicated Coaching.',
  icons: {
    icon: '/assets/img/kaisar-gym-logo-circle.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#070D1E] text-slate-100 font-sans antialiased selection:bg-[#FFC067] selection:text-slate-950">
        <PortalAuthProvider>
          {children}
        </PortalAuthProvider>
      </body>
    </html>
  );
}
