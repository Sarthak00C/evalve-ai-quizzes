import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Trophy,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Create Quiz", url: "/create-quiz", icon: PlusCircle },
  { title: "Join Quiz", url: "/join-quiz", icon: Users },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-base tracking-tight">
            {!collapsed && (
              <span className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
                  E
                </span>
                Evalve Tech
              </span>
            )}
            {collapsed && (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
                E
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="space-y-2 p-3">
        {!collapsed && profile && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{profile.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        )}
        <div className="flex items-center">
          {!collapsed && (
            <Button variant="ghost" size="sm" onClick={signOut} className="flex-1 justify-start gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
          {collapsed && (
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
