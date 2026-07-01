import type { Metadata } from "next";
import { LocaleProvider } from "@/components/locale-provider";
import { FutureModeProvider } from "@/components/future-mode-provider";
import { SignalAudioProvider } from "@/components/signal-audio-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGNAL — Anonymous Conversations",
  description: "One stranger. One real conversation. Anonymous ritual chat with frequency matching.",
  applicationName: "SIGNAL",
  openGraph: {
    title: "SIGNAL",
    description: "Anonymous conversations tuned to tonight's frequency.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LocaleProvider>
          <FutureModeProvider>
            <SignalAudioProvider>{children}</SignalAudioProvider>
          </FutureModeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
