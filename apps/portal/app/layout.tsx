import "@repo/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arch-Systems",
  description: "Multi-departmental operations portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0f0f] text-[#fafafa] min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
