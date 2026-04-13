import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 h-14 flex items-center border-b bg-card/80 backdrop-blur-md px-4 md:px-6">
            <SidebarTrigger className="mr-4" />
            <h1 className="font-heading text-lg font-semibold tracking-tight">Evalve Tech</h1>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
export {
  AppLayout
};
