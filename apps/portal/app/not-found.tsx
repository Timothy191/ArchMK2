import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-4xl font-medium text-[#fafafa]">404</h1>
        <p className="text-[#898989] text-sm">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-[#0f0f0f] text-[#fafafa] text-sm font-medium border border-[#363636] hover:bg-[#1a1a1a] transition-colors"
        >
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
