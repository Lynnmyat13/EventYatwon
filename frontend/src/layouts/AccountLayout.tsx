import { useState, type ComponentType } from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Heart,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Tags,
  Ticket,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface AccountNavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const commonItems: AccountNavItem[] = [
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Saved events", to: "/saved-events", icon: Heart },
];

const roleItems: Record<UserRole, AccountNavItem[]> = {
  attendee: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
    { label: "Recommended", to: "/recommended", icon: Sparkles },
    { label: "My events", to: "/my-events", icon: CalendarDays },
    { label: "My tickets", to: "/my-tickets", icon: Ticket },
  ],
  organizer: [
    { label: "My events", to: "/organizer/events", icon: CalendarDays },
    { label: "Create event", to: "/events/create", icon: CalendarPlus },
  ],
  admin: [
    { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
    { label: "Users", to: "/admin/users", icon: UsersRound },
    { label: "Events", to: "/admin/events", icon: CalendarDays },
    { label: "Categories", to: "/admin/categories", icon: Tags },
  ],
};

export function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const items = user ? [...roleItems[user.role], ...commonItems] : commonItems;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      toast.success("You are logged out");
      navigate("/");
      setIsLoggingOut(false);
    }
  };

  const sidebar = (
    <>
      <div className="flex h-16 items-center border-b px-5">
        <div>
          <p className="text-sm font-semibold">Account</p>
          <p className="text-muted-foreground text-xs capitalize">
            {user?.role}
          </p>
        </div>
      </div>
      <nav
        className="flex-1 space-y-1 px-3 py-5"
        aria-label="Account navigation"
      >
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="size-4.5 shrink-0" /> {label}
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "mt-5 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
          onClick={() => setSidebarOpen(false)}
        >
          <Settings className="size-4.5 shrink-0" /> Account settings
        </NavLink>
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive h-11 w-full justify-start px-3"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          {isLoggingOut ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="bg-background min-h-[100dvh] w-full max-w-full overflow-x-clip">
      <Navbar />
      <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="bg-card sticky top-18 hidden h-[calc(100dvh-4.5rem)] min-w-0 flex-col border-r lg:flex">
          {sidebar}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/65"
              aria-label="Close account navigation"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="bg-card relative flex h-full w-72 max-w-[85vw] flex-col border-r shadow-2xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
                aria-label="Close account navigation"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-5" />
              </Button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="w-full min-w-0 overflow-x-clip">
          <div className="border-b px-4 py-3 sm:px-6 lg:hidden">
            <Button
              variant="outline"
              className="h-10 px-3"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" /> Account menu
            </Button>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
