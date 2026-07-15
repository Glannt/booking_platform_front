import { redirect } from "next/navigation";

interface NotFoundProps {
  params: Promise<{
    locale: string;
    notFound: string[];
  }>;
}

export default async function NotFoundRedirectPage({ params }: NotFoundProps) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.notFound || [];

  if (pathParts.length > 0) {
    const firstSegment = pathParts[0];
    if (["admin", "dashboard", "staff"].includes(firstSegment)) {
      // Reconstruct target route without locale prefix
      const targetPath = "/" + pathParts.join("/");
      redirect(targetPath);
    }
  }

  // Fallback default 404 UI for other pages
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">404</h1>
      <p className="text-slate-500 text-sm font-semibold">Page Not Found</p>
    </div>
  );
}
