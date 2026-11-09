import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientSessionWrapper from '@/components/ClientSessionWrapper';
import ThemeProvider from '@/components/ThemeProvider';
import AIAssistantLoader from '@/components/AIAssistantLoader';

export const metadata: Metadata = {
  title: "Mening Uyim - Ko'chmas Mulk va Qurilish Platformasi",
  description: "Sotib olish, sotish, ijara, qurilish materiallari savdosi, arxitektorlar, quruvchilar va ta'mirlash ustalari xizmatlari.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="h-full">
      <body className="min-h-full flex flex-col">
        <ClientSessionWrapper>
          <ThemeProvider />
          <Navbar />
          <main className="flex-1 w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
              {children}
            </div>
          </main>
          <Footer />
          <AIAssistantLoader />
        </ClientSessionWrapper>
      </body>
    </html>
  );
}
