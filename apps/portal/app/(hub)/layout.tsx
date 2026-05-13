import Link from "next/link";
import { DEPARTMENTS } from "~/lib/departments";
import { logout } from "~/app/actions";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#363636] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-[#fafafa]">
              Plantcor OS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#242424] text-[#898989] text-xs border border-[#363636]">
              Hub
            </span>
          </div>
          <form
            action={logout}
            className="inline"
          >
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-[#363636] bg-[#171717] min-h-[calc(100vh-53px)]">
          <nav className="p-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
            >
              Dashboard
            </Link>
            <div className="pt-4 pb-1 px-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
              Departments
            </div>
            {DEPARTMENTS.map((dept) => (
              <Link
                key={dept.name}
                href={`/${dept.name}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
              >
                {dept.displayName}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
