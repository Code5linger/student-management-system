import Link from 'next/link';
import { switchRole } from '@/app/actions';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/staff" className="font-display font-semibold text-lg">
              Registry <span className="text-brand">/ Staff</span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/staff" className="hover:text-brand">
                Dashboard
              </Link>
              <Link href="/staff/students" className="hover:text-brand">
                Students
              </Link>
              <Link href="/staff/assessments" className="hover:text-brand">
                Assessments
              </Link>
            </nav>
          </div>
          <form action={switchRole}>
            <button
              type="submit"
              className="text-sm text-ink/60 hover:text-brand"
            >
              Switch role
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
