import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-7xl font-bold text-[#45645e] mb-4">404</div>
        <h1 className="text-xl font-semibold text-[#2d3a33] mb-2">
          Page not found
        </h1>
        <p className="text-[#6b7c72] mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#45645e] text-white font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          Back to TaskMax
        </Link>
      </div>
    </div>
  );
}
