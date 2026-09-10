// src/components/app-sidebar.jsx
import * as React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconInnerShadowTop,
  IconListDetails,
  IconLogout,
  IconUser,
  IconArticle,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useAuthStore from "@/store/useAuthStore";

const data = {
  navMain: [
    { title: "Dashboard", url: "/", icon: IconDashboard },
    { title: "Blogs & Stories", url: "/blogs", icon: IconArticle },
    { title: "Testimonials", url: "/testimonials", icon: IconListDetails },
    { title: "Packages", url: "/packages", icon: IconChartBar },
    { title: "Services", url: "/services", icon: IconFileAi },
    { title: "Slider", url: "/slider", icon: IconInnerShadowTop },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      url: "/capture",
      items: [
        { title: "Gallery", url: "/capture/gallery" },
      ],
    },
    {
      title: "Enquiries",
      icon: IconFileDescription,
      url: "/enquiries",
      items: [{ title: "Active Enquiries", url: "/enquiries" }],
    },
  ],
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Use the correct method names from your auth store
  const { 
    user, 
    loading, 
    token,
    isAuthenticated,
    fetchProfile,    // ✅ This is the correct method name from your store
    logout,
    initializeAuth   // ✅ Use initializeAuth for proper setup
  } = useAuthStore();

  // ✅ Initialize authentication on component mount
  React.useEffect(() => {
    const initialize = async () => {
      if (token && !isAuthenticated) {
        // If we have a token but not authenticated, initialize
        await initializeAuth();
      } else if (token && !user) {
        // If we have token and authenticated but no user data, fetch profile
        await fetchProfile();
      }
    };

    initialize();
  }, [token, isAuthenticated, user, initializeAuth, fetchProfile]);

  // ✅ Handle logout with navigation
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderNavItems = (items) =>
    items.map(({ title, url, icon: Icon }) => (
      <SidebarMenuItem key={url}>
        <SidebarMenuButton asChild isActive={location.pathname === url}>
          <Link to={url} className="flex items-center gap-2">
            <Icon className="size-4" />
            <span>{title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const renderDropdownNavItems = (sections) =>
    sections.map(({ title, url, icon: Icon, items }) => (
      <React.Fragment key={url}>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={location.pathname.startsWith(url)}>
            <Link to={url} className="flex items-center gap-2">
              <Icon className="size-4" />
              <span>{title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {items.map((subItem) => (
          <SidebarMenuItem key={subItem.url} className="pl-8">
            <SidebarMenuButton asChild isActive={location.pathname === subItem.url}>
              <Link to={subItem.url}>{subItem.title}</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </React.Fragment>
    ));

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/" className="flex items-center gap-2">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Jaya Photography</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="mt-2">
          {renderNavItems(data.navMain)}
        </SidebarMenu>
        <SidebarMenu className="mt-4 border-t pt-2">
          {renderDropdownNavItems(data.navClouds)}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* User Profile Section */}
        {loading ? (
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 p-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold ${user.avatar ? 'hidden' : 'flex'}`}
            >
              {user.name?.charAt(0)?.toUpperCase() || <IconUser className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {user.name || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.email || "Email not available"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <IconUser className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Guest User</div>
              <div className="text-xs text-muted-foreground">Not authenticated</div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <SidebarMenu className="p-3 pt-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={loading}
            >
              <IconLogout className="size-4" />
              <span>{loading ? "Logging out..." : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
