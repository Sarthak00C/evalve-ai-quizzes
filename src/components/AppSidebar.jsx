import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Trophy,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";

// FIXED: removed @ alias
import { NavLink } from "../components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "../components/ui/sidebar";

import { Button } from "../components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Create Quiz", url: "/create-quiz", icon: PlusCircle },
  { title: "Join Quiz", url: "/join-quiz", icon: Users },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>

          <SidebarGroupLabel className="font-heading text-base tracking-tight px-2 py-4">
            {!collapsed ? (
              <span className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground shadow-soft">
                  E
                </span>
                <span className="font-semibold">Evalve Tech</span>
              </span>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground shadow-soft">
                E
              </span>
            )}
          </SidebarGroupLabel>

          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>

                      {/* FIXED: removed activeClassName */}
                      <NavLink
                        to={item.url}
                        end
                        className={`rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-soft"
                            : ""
                        }`}
                      >
                        <item.icon className="mr-2.5 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>

                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>

        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-2 p-3">
        {!collapsed && profile && (
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-sm font-medium">{profile.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile.role}
            </p>
          </div>
        )}

        <div className="flex items-center">
          {!collapsed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex-1 justify-start gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };