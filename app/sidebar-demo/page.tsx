"use client";
import { useState } from "react";
import { Sidebar, SidebarGroup, UserProfile } from "@/components/sidebar";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  TrendingUp,
  Settings,
  ShieldAlert,
  Plane,
  Home,
  Compass,
  Heart,
  Ticket,
  MessageSquare,
  Briefcase,
  Layers,
} from "lucide-react";
import { Card, Button, Switch } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";

export default function SidebarDemoPage() {
  const [isAdminMode, setIsAdminMode] = useState(true);
  const { t } = useI18n();
  const [log, setLog] = useState<string[]>(["Sidebar demo initialized."]);

  const addLog = (message: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 10)]);
  };

  // Define Admin Sidebar Groups
  const adminGroups: SidebarGroup[] = [
    {
      title: "Overview",
      items: [
        {
          key: "admin-dashboard",
          label: "Dashboard",
          path: "/sidebar-demo/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          key: "admin-stats",
          label: "Analytics & Reports",
          path: "/sidebar-demo/analytics",
          icon: <TrendingUp size={20} />,
          badge: "New",
          badgeColor: "success",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          key: "admin-bookings",
          label: "Bookings",
          icon: <CalendarDays size={20} />,
          badge: 12,
          badgeColor: "primary",
          children: [
            { key: "admin-bookings-flights", label: "Flight Bookings", path: "/sidebar-demo/bookings/flights" },
            { key: "admin-bookings-hotels", label: "Hotel Bookings", path: "/sidebar-demo/bookings/hotels" },
            { key: "admin-bookings-tours", label: "Tour Bookings", path: "/sidebar-demo/bookings/tours" },
          ],
        },
        {
          key: "admin-customers",
          label: "Customers",
          path: "/sidebar-demo/customers",
          icon: <Users size={20} />,
        },
        {
          key: "admin-services",
          label: "Travel Services",
          path: "/sidebar-demo/services",
          icon: <Layers size={20} />,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          key: "admin-settings",
          label: "Settings",
          path: "/sidebar-demo/settings",
          icon: <Settings size={20} />,
        },
        {
          key: "admin-security",
          label: "Security Audit",
          path: "/sidebar-demo/security",
          icon: <ShieldAlert size={20} />,
        },
      ],
    },
  ];

  // Define Customer Sidebar Groups
  const customerGroups: SidebarGroup[] = [
    {
      title: "Explore",
      items: [
        {
          key: "cust-home",
          label: t.nav.home,
          path: "/sidebar-demo/home",
          icon: <Home size={20} />,
        },
        {
          key: "cust-explore",
          label: "Discover Deals",
          path: "/sidebar-demo/explore",
          icon: <Compass size={20} />,
        },
      ],
    },
    {
      title: "Personal",
      items: [
        {
          key: "cust-bookings",
          label: "My Bookings",
          path: "/sidebar-demo/my-bookings",
          icon: <Briefcase size={20} />,
          badge: 2,
          badgeColor: "warning",
        },
        {
          key: "cust-favorites",
          label: "Saved Places",
          path: "/sidebar-demo/favorites",
          icon: <Heart size={20} />,
        },
        {
          key: "cust-vouchers",
          label: "Vouchers & Offers",
          path: "/sidebar-demo/vouchers",
          icon: <Ticket size={20} />,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          key: "cust-help",
          label: "Help Center",
          path: "/sidebar-demo/help",
          icon: <MessageSquare size={20} />,
        },
      ],
    },
  ];

  // Define User Profiles
  const adminUser: UserProfile = {
    name: "Alex Sterling",
    email: "alex.admin@travelgo.com",
    avatarUrl: "https://i.pravatar.cc/150?img=33",
    role: t.demo.admin,
  };

  const customerUser: UserProfile = {
    name: "John Doe",
    email: "john.doe@gmail.com",
    avatarUrl: "https://i.pravatar.cc/150?img=60",
    role: t.demo.customer,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Section */}
      <Sidebar
        groups={isAdminMode ? adminGroups : customerGroups}
        user={isAdminMode ? adminUser : customerUser}
        brandName={isAdminMode ? "TG Admin" : "TravelGo"}
        logo={
          isAdminMode ? (
            <ShieldAlert className="text-primary" size={24} />
          ) : (
            <Plane className="text-primary rotate-45" size={24} />
          )
        }
        onLogout={() => addLog("Logout clicked!")}
        onSettingsClick={() => addLog("Settings clicked!")}
      />

      {/* Main Content Preview Area */}
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Controls Card */}
          <Card className="bg-default-50 border border-divider">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{t.demo.title}</h1>
                  <p className="text-sm text-foreground-400">
                    {t.demo.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground-500">{t.demo.customer}</span>
                  <Switch
                    isSelected={isAdminMode}
                    onChange={(val) => {
                      setIsAdminMode(val);
                      addLog(`Switched role to ${val ? "Admin" : "Customer"}`);
                    }}
                  />
                  <span className="text-sm font-semibold text-foreground-500">{t.demo.admin}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Guidelines & Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-divider">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold">{t.demo.config}</h2>
                <div className="text-sm space-y-3 text-foreground-500">
                  <p>
                    <strong>{t.demo.config.split(" ")[0]}:</strong> {t.demo.configDesc}
                  </p>
                  <p>
                    <strong>{t.demo.submenus.split(":")[0]}:</strong> {t.demo.submenus.split(":")[1]}
                  </p>
                  <p>
                    <strong>{t.demo.badges.split(":")[0]}:</strong> {t.demo.badges.split(":")[1]}
                  </p>
                  <p>
                    <strong>{t.demo.activeRoute.split(":")[0]}:</strong> {t.demo.activeRoute.split(":")[1]}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-divider">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t.demo.activityLog}</h2>
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-50" onClick={() => setLog([])}>
                    {t.demo.clear}
                  </Button>
                </div>
                <div className="bg-default-100 rounded-lg p-4 font-mono text-xs h-[150px] overflow-y-auto space-y-1">
                  {log.length === 0 ? (
                    <span className="text-foreground-400">No logs. Click buttons inside sidebar.</span>
                  ) : (
                    log.map((entry, idx) => <div key={idx}>{entry}</div>)
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Mock Route Setup */}
          <Card className="border border-divider">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold">{t.demo.mockRoute}</h2>
              <p className="text-sm text-foreground-500">
                {t.demo.mockRouteDesc}
              </p>
              <div className="flex flex-wrap gap-2">
                {isAdminMode ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/dashboard")}>
                      {t.demo.goDashboard}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/analytics")}>
                      {t.demo.goAnalytics}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/bookings/flights")}>
                      {t.demo.goFlights}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/bookings/hotels")}>
                      {t.demo.goHotels}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/home")}>
                      {t.demo.goSearchHome}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/explore")}>
                      {t.demo.goDiscover}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.history.pushState({}, "", "/sidebar-demo/my-bookings")}>
                      {t.demo.goMyBookings}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
