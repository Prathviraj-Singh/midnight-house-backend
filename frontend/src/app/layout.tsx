import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ClientWrapper from '@/components/ClientWrapper';
import Navbar from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Midnight House | Your Own Private Space',
  description:
    'Experience premium private theater slots, customizable birthday celebration packages, and high-quality cafe dining in Indore.',
  keywords:
    'Private Theater Indore, Midnight Cafe Indore, Birthday celebration space, Vijay Nagar Cafe, Scheme 74, Private Lounge Indore',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-black text-white relative overflow-x-hidden">
        {/* Deep ambient glow backgrounds */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none" />

        {/* AuthProvider wraps the entire app so any page can access user state */}
        <AuthProvider>
  <ClientWrapper>
    {children}
  </ClientWrapper>
</AuthProvider>
      </body>
    </html>
  );
}
