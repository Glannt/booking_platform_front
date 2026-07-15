import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

type Params = Promise<{ locale: string }>;

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;

  return (
    <>
      <Navbar />
      <div className="w-full flex-grow flex flex-col">
        {children}
      </div>
      <Footer />
    </>
  );
}
