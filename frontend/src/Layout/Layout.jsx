import React from "react";
import { Outlet } from "react-router-dom";

// UI components
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";


const Layout = () => {
  return (
    <SidebarProvider>
      {/* Add the AppSidebar component here */}
      <AppSidebar />
      
      {/* Main layout area */}
      <SidebarInset>
        {/* Header with sidebar trigger and breadcrumb */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/"><Home/></BreadcrumbLink>
                {/* <span className="text-muted-foreground items-end p-3.5"><ThemeToggle /></span> */}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
