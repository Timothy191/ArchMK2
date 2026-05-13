import Link from "next/link";
import { SecondaryButton } from "@repo/ui/SecondaryButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <h1 className="text-4xl font-medium text-[#fafafa]">404</h1>
        <p className="text-[#898989] text-sm">
          The page you are looking for does not exist.
        </p>
        <SecondaryButton asChild>
          <Link href="/">Return to Hub</Link>
        </SecondaryButton>
      </div>
    </div>
  );
}
