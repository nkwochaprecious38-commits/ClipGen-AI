import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'ClipGen AI: AI Video Generation and Creative Production', template: '%s | ClipGen AI' },
  description: 'Create, edit and organize video content with AI. Text to video, image animation, AI video editing and image generation in one creative workspace.',
  openGraph: { title: 'ClipGen AI', description: 'An AI creative production studio for video, images and campaigns.', type: 'website', siteName: 'ClipGen AI' },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
