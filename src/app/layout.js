import "./globals.css";

export const metadata = {
  title: "Empati & Zorbalık Farkındalık Aktivitesi",
  description:
    "Zorbalık senaryolarına empatiyle yaklaşmayı öğreten interaktif bir sınıf aktivitesi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
