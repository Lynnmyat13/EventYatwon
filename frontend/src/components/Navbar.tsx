import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Heart,
  LoaderCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { NotificationBell } from "@/components/NotificationBell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types/navigation";

const navigation: NavigationItem[] = [
  { label: "Home", to: "/" },
  { label: "Explore events", to: "/events" },
  { label: "Calendar", to: "/calendar" },
  { label: "About", to: "/about" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name ?? "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!isSearchOpen) return;

    const closeSearchOutside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        !target.closest("[data-header-search]")
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeSearchOutside);
    return () =>
      document.removeEventListener("pointerdown", closeSearchOutside);
  }, [isSearchOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("You are logged out");
    } catch {
      toast.success("You are logged out");
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
      accountMenuRef.current?.removeAttribute("open");
      navigate("/");
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = searchValue.trim();
    navigate(
      search ? `/events?search=${encodeURIComponent(search)}` : "/events",
    );
  };

  const toggleSearch = () => {
    setIsSearchOpen((open) => !open);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/75 text-white shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="block" onClick={() => setIsOpen(false)}>
          <BrandLogo />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-5 lg:flex"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  isActive ? "text-white" : "text-zinc-400",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          <button
            type="button"
            data-header-search
            className="grid size-9 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            aria-expanded={isSearchOpen}
            aria-controls="header-event-search"
            aria-label="Search events"
            title="Search events"
            onClick={toggleSearch}
          >
            <Search className="size-5" />
          </button>

          {isLoading ? (
            <LoaderCircle
              className="size-5 animate-spin text-zinc-400 motion-reduce:animate-none"
              aria-label="Loading session"
            />
          ) : user ? (
            <>
              <NotificationBell />
              <div className="flex items-center gap-1">
                <Link
                  to="/profile"
                  className="focus-visible:ring-primary rounded-full p-1 transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Account settings"
                  title="Account settings"
                >
                  <div className="grid size-9 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.name} profile`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="m-auto text-xs font-semibold text-white">
                        {initials}
                      </span>
                    )}
                  </div>
                </Link>
                <details
                  ref={accountMenuRef}
                  className="hidden"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      event.currentTarget.removeAttribute("open");
                    }
                  }}
                >
                  <summary
                    className="focus-visible:ring-primary grid size-8 cursor-pointer list-none place-items-center rounded-lg transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
                    aria-label="Open account menu"
                    title="Account menu"
                  >
                    <ChevronDown className="size-4 text-zinc-400 transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="absolute top-full right-0 mt-2 w-52 rounded-lg border border-zinc-800 bg-black/95 p-2 shadow-xl backdrop-blur-xl">
                    {user.role === "attendee" && (
                      <>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            accountMenuRef.current?.removeAttribute("open")
                          }
                        >
                          <LayoutDashboard className="size-4" /> Dashboard
                        </Link>
                        <Link
                          to="/my-events"
                          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            accountMenuRef.current?.removeAttribute("open")
                          }
                        >
                          <CalendarDays className="size-4" /> My events
                        </Link>
                        <Link
                          to="/my-tickets"
                          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            accountMenuRef.current?.removeAttribute("open")
                          }
                        >
                          <Ticket className="size-4" /> My tickets
                        </Link>
                      </>
                    )}
                    {user.role === "organizer" && (
                      <>
                        <Link
                          to="/organizer/events"
                          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            accountMenuRef.current?.removeAttribute("open")
                          }
                        >
                          <CalendarDays className="size-4" /> My events
                        </Link>
                        <Link
                          to="/events/create"
                          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                          onClick={() =>
                            accountMenuRef.current?.removeAttribute("open")
                          }
                        >
                          <CalendarPlus className="size-4" /> Create event
                        </Link>
                      </>
                    )}
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                        onClick={() =>
                          accountMenuRef.current?.removeAttribute("open")
                        }
                      >
                        <LayoutDashboard className="size-4" /> Admin dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                      onClick={() =>
                        accountMenuRef.current?.removeAttribute("open")
                      }
                    >
                      <UserRound className="size-4" /> Profile
                    </Link>
                    <Link
                      to="/saved-events"
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900"
                      onClick={() =>
                        accountMenuRef.current?.removeAttribute("open")
                      }
                    >
                      <Heart className="size-4" /> Saved events
                    </Link>
                    <Button
                      variant="ghost"
                      className="mt-1 h-10 w-full justify-start px-3 text-zinc-200 hover:bg-zinc-900 hover:text-white"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                      Log out
                    </Button>
                  </div>
                </details>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={cn(buttonVariants(), "h-10 rounded-lg px-4")}
              >
                Create account
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            data-header-search
            className="grid size-10 place-items-center rounded-lg border border-zinc-700 bg-black text-white transition-colors hover:bg-zinc-900"
            aria-expanded={isSearchOpen}
            aria-controls="header-event-search"
            aria-label="Search events"
            title="Search events"
            onClick={toggleSearch}
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-zinc-700 bg-black text-white transition-colors hover:bg-zinc-900"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            title={isOpen ? "Close navigation" : "Open navigation"}
            onClick={() => {
              setIsOpen((open) => !open);
              setIsSearchOpen(false);
            }}
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div
          id="header-event-search"
          data-header-search
          className="absolute inset-x-0 top-full border-b border-white/10 bg-black/95 shadow-xl backdrop-blur-xl"
        >
          <form
            className="mx-auto flex max-w-3xl gap-2 px-4 py-4 sm:px-6"
            onSubmit={submitSearch}
          >
            <label htmlFor="navbar-search" className="sr-only">
              Search event titles
            </label>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                ref={searchInputRef}
                id="navbar-search"
                name="search"
                autoFocus
                autoComplete="off"
                placeholder="Search events by title"
                value={searchValue}
                className="border-zinc-700 bg-zinc-950 pr-10 pl-9 text-white placeholder:text-zinc-500"
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsSearchOpen(false);
                }}
              />
              {searchValue && (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label="Clear search"
                  title="Clear search"
                  onClick={() => {
                    setSearchValue("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-11 px-5">
              Search
            </Button>
          </form>
        </div>
      )}

      {isOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-black/90 px-4 py-4 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-3 text-sm font-medium",
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                  )
                }
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            {!isLoading && user ? (
              <div className="mt-3 border-t border-zinc-800 pt-3">
                <div className="px-3 pb-3">
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-sm text-zinc-400 capitalize">
                    {user.role}
                  </p>
                </div>
                {user.role === "attendee" && (
                  <>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        cn(
                          "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="size-4" /> Dashboard
                    </NavLink>
                    <NavLink
                      to="/my-events"
                      className={({ isActive }) =>
                        cn(
                          "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <CalendarDays className="size-4" /> My events
                    </NavLink>
                    <NavLink
                      to="/my-tickets"
                      className={({ isActive }) =>
                        cn(
                          "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <Ticket className="size-4" /> My tickets
                    </NavLink>
                  </>
                )}
                {user.role === "organizer" && (
                  <>
                    <NavLink
                      to="/organizer/events"
                      className={({ isActive }) =>
                        cn(
                          "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <CalendarDays className="size-4" /> My events
                    </NavLink>
                    <NavLink
                      to="/events/create"
                      className={({ isActive }) =>
                        cn(
                          "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                          isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <CalendarPlus className="size-4" /> Create event
                    </NavLink>
                  </>
                )}
                {user.role === "admin" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn(
                        "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                        isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                      )
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="size-4" /> Admin dashboard
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    cn(
                      "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                    )
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <UserRound className="size-4" /> Profile
                </NavLink>
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    cn(
                      "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                    )
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Bell className="size-4" /> Notifications
                </NavLink>
                <NavLink
                  to="/saved-events"
                  className={({ isActive }) =>
                    cn(
                      "mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                      isActive ? "bg-zinc-900 text-white" : "text-zinc-400",
                    )
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="size-4" /> Saved events
                </NavLink>
                <Button
                  variant="outline"
                  className="h-10 w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-900 hover:text-white"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  Log out
                </Button>
              </div>
            ) : !isLoading ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 border-zinc-700 bg-transparent text-white hover:bg-zinc-900 hover:text-white",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className={cn(buttonVariants(), "h-10")}
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
