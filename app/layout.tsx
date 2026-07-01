import type { Metadata } from "next";
import FeedbackWidget from "./feedback-widget";
import SmoothScroll from "./smooth-scroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShardUp",
  description: "A technical community built on mentorship and real work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set the theme before first paint to avoid a flash of the wrong theme.
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbfaf3" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#151a23" />
      </head>
      <body>
        <SmoothScroll />
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
