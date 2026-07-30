import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-accent-muted flex items-center justify-center">
        <Compass className="h-8 w-8 text-accent" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-6xl font-bold text-clean tracking-tighter">404</h1>
        <h2 className="text-lg font-semibold text-soft">Page not found</h2>
        <p className="text-sm text-muted leading-relaxed">
          This route doesn&apos;t exist in Trading OS. Check the URL or head back to your dashboard.
        </p>
      </div>

      <Link href="/" className="btn-primary">
        <Home className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
