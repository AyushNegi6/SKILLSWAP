import AppNavbar from "@/components/AppNavbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      {children}
    </div>
  );
}
