import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopAppBar />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </>
  );
}
