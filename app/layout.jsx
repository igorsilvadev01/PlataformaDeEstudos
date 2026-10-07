import "./globals.css";

export const metadata = {
  title: "Codiva — programação em português",
  description: "Aprenda programação em português, uma pequena conquista por dia.",
};
export const viewport = { themeColor: "#7353de" };

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
