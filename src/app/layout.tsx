import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "InfoQaz",
  description: "Информатика пәні бойынша білім беру платформасы",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <body className="flex flex-col min-h-screen bg-[url('/background.png')] bg-cover bg-center text-white">
        {/* 🔹 Жоғарғы меню */}
        <Header />

        {/* 🔹 Негізгі контент */}
        <main className="flex-1 bg-transparent">
          {children}
        </main>

        {/* 🔹 Footer */}
        <Footer />
      </body>
    </html>
  );
}
