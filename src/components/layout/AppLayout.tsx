import { ReactNode, useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import {
  FileText,
  Home,
  FilePlus2,
  ReceiptText,
  Settings,
  LayoutTemplate,
  Users,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type MenuIcon = ComponentType<{ className?: string }>;

const trackerMenuItems: Array<{ title: string; url: string; icon: MenuIcon, roles?: string[] }> = [
  { title: "Ringkasan", url: "/tracker", icon: Home as MenuIcon, roles: ["owner", "admin", "manager", "user"] },
  { title: "Daftar Transaksi", url: "/tracker/invoices", icon: ReceiptText as MenuIcon, roles: ["owner", "admin", "manager", "user", "sales"] },
  { title: "Buat Transaksi Baru", url: "/tracker/invoices/new", icon: FilePlus2 as MenuIcon, roles: ["owner", "admin", "manager", "user", "sales"] },
  { title: "Produk", url: "/tracker/presets", icon: Tag as MenuIcon, roles: ["owner", "admin", "manager"] },
  { title: "Settings", url: "/settings", icon: Settings as MenuIcon, roles: ["owner", "admin", "manager", "user", "sales"] },
];
const heavyPrefetchRoutes = new Set(["/tracker/invoices/new", "/tracker/templates/new", "/tracker/presets"]);

function NavItem({
  item,
  isActive,
  collapsed,
}: {
  item: { title: string; url: string; icon: MenuIcon };
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <li title={collapsed ? item.title : undefined}>
      <Link
        href={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 pwa-no-select active:scale-[0.98]",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
    </li>
  );
}

function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const visibleMenuItems = trackerMenuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (path: string) => {
    if (path === "/tracker") return router.pathname === "/tracker" || router.pathname === "/tracker/index";
    if (path === "/tracker/invoices") {
      return router.pathname === "/tracker/invoices" || router.pathname === "/tracker/invoices/[id]";
    }
    if (path === "/tracker/invoices/new") return router.pathname === path;
    if (path === "/tracker/cv") return router.pathname === "/tracker/cv" || router.pathname === "/tracker/cv/index";
    if (path === "/tracker/templates") {
      return router.pathname.startsWith("/tracker/templates");
    }
    return router.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-card border-r border-border transition-all duration-200 ease-in-out flex-shrink-0 z-50 h-full pwa-no-select",
        collapsed
          ? "w-14 overflow-hidden"
          : "relative w-56 overflow-hidden"
      )}
    >
      {/* Logo and Toggle Header */}
      <div className={cn("flex items-center justify-between p-4 flex-shrink-0", collapsed && "flex-col gap-3 px-1 py-3 md:px-2 md:py-4")}>
        <div className="flex items-center gap-3">
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-foreground truncate leading-tight">Contoh Invoice</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">Invoice Manager</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 flex-shrink-0 active:scale-95",
            collapsed && "bg-accent/50 shadow-sm border border-border"
          )}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 md:w-4 md:h-4" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 md:w-4 md:h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-3 px-2 app-scroll", collapsed && "hidden md:block")}>
        <ul className="space-y-0.5 list-none">
          {visibleMenuItems.map((item) => (
            <NavItem key={item.title} item={item} isActive={isActive(item.url)} collapsed={collapsed} />
          ))}
        </ul>
      </nav>

    </aside>
  );
}

function MobileBottomNav() {
  const router = useRouter();
  const { user } = useAuth();

  const visibleMenuItems = trackerMenuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (path: string) => {
    if (path === "/tracker") return router.pathname === "/tracker" || router.pathname === "/tracker/index";
    if (path === "/tracker/invoices") return router.pathname === path || router.pathname === "/tracker/invoices/[id]";
    if (path === "/tracker/invoices/new") return router.pathname === path;
    if (path === "/tracker/templates") return router.pathname.startsWith("/tracker/templates");
    return router.pathname.startsWith(path);
  };

  const activeIndex = Math.max(
    0,
    trackerMenuItems.findIndex((item) => isActive(item.url))
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white md:hidden shadow-[0_-4px_16px_rgb(0,0,0,0.05)] pwa-no-select"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi utama"
    >
      <div className="h-[60px] relative">
        <ul className="relative z-10 flex h-full justify-around items-center">
        {visibleMenuItems.map((item) => {
          const active = isActive(item.url);
          const isCreateAction = item.url === "/tracker/invoices/new";
          return (
            <li key={item.url} className="flex-1">
              <Link
                href={item.url}
                title={item.title}
                aria-label={item.title}
                className={cn(
                  "flex flex-col h-full w-full items-center justify-center gap-1 transition-all duration-150 active:scale-95",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isCreateAction ? "h-6 w-6" : "",
                    active && "stroke-[2.5]"
                  )}
                />
                <span className={cn("text-[10px] font-medium transition-all duration-300", active ? "opacity-100" : "opacity-70")}>
                  {item.title}
                </span>
              </Link>
            </li>
          );
        })}
        </ul>
      </div>
    </nav>
  );
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const visibleMenuItems = trackerMenuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  useEffect(() => {
    const prefetchRoutes = () => {
      for (const item of visibleMenuItems) {
        if (item.url !== router.pathname && !heavyPrefetchRoutes.has(item.url)) {
          void router.prefetch(item.url);
        }
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchRoutes, {
        timeout: 1500,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(prefetchRoutes, 300);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const handleConflict = () => {
      toast({
        title: "⚠️ Konflik Data Terdeteksi",
        description: "Data ini telah diubah di perangkat lain. Sistem membatalkan sinkronisasi untuk mencegah penimpaan data. Silakan muat ulang halaman.",
        variant: "destructive",
      });
    };

    window.addEventListener("lokerhub:sync-conflict", handleConflict);
    return () => window.removeEventListener("lokerhub:sync-conflict", handleConflict);
  }, [toast]);

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header
          className="border-b border-border flex items-center px-4 gap-3 bg-card flex-shrink-0 z-10 md:px-4 pwa-no-select"
          style={{
            paddingTop: `calc(0.875rem + env(safe-area-inset-top))`,
            paddingBottom: "0.875rem",
            minHeight: "3.5rem",
          }}
        >
          {title && <h1 className="text-base font-semibold text-foreground truncate flex-1">{title}</h1>}
          {/* Sync status indicator — only shows when offline or pending sync */}
        </header>
        <main
          className="flex-1 app-scroll"
          style={{
            paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
