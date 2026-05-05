import "./globals.css";

export const metadata = {
  title: "Foodspv",
  description: "Plataforma de gestión",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
