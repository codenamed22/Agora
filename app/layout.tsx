import type { Metadata } from "next";
import FeedbackWidget from "./feedback-widget";
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
  const feedbackEmail = process.env.FEEDBACK_EMAIL ?? "";

  return (
    <html lang="en">
      <body>
        {children}
        <FeedbackWidget email={feedbackEmail.trim()} />
      </body>
    </html>
  );
}
