import './globals.css';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

const unisonPro = localFont({
  src: "./fonts/UnisonProBold.otf",
  variable: "--font-unison-pro-bold",
  weight: '700',
});

const unisonLight = localFont({
  src: "./fonts/UnisonProLight.otf",
  variable: "--font-unison-pro-light",
  weight: '300',
});


export const metadata = {
  title: 'Space',
  description: 'Next + Three + GSAP + Lenis demo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${unisonPro.variable} ${unisonLight.variable}`}>{children}</body>
    </html>
  );
}
