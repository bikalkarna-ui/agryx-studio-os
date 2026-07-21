import Sidebar from '@/components/Sidebar';

// This layout wraps ONLY the authenticated app pages (dashboard, leads,
// quotes, bookings, galleries, invoices, reviews, landing-pages, settings —
// everything inside the (app) route group). Public pages like the landing
// page, /login, /inquire, and /portal render through the root layout
// instead, so they never get the sidebar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
