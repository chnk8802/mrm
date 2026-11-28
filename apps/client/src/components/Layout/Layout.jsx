import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Wrench, Settings, Menu } from "lucide-react";
import Sidebar from "@/components/Layout/Sidebar";
import Topbar from "@/components/Layout/Topbar";
import { usePermission } from "@/hooks/usePermission";

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app", minRole: null },
  { icon: Users, label: "Customers", path: "/app/customers", minRole: "manager" },
  { icon: Wrench, label: "Repairs", path: "/app/repairs", minRole: null },
  { icon: Settings, label: "Settings", path: "/app/settings", minRole: null },
];

const Layout = () => {
  const { hasRole } = usePermission();
  const visibleNavItems = mobileNavItems.filter((item) => !item.minRole || hasRole(item.minRole));

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored === null ? true : stored === "true";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div
          className={`hidden md:flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? "w-60" : "w-16"
            }`}
        >
          <Sidebar collapsed={!sidebarOpen} onToggleCollapse={() => setSidebarOpen((o) => !o)} />
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-60 z-50 bg-[hsl(var(--sidebar-bg))]">
            <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[hsl(var(--topbar-bg))] border-t border-border z-30">
        <div className="flex items-center justify-around py-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground text-xs font-medium"
          >
            <Menu className="w-5 h-5" />
            More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
