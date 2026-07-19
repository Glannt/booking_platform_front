"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Tooltip,
  ScrollShadow,
  Dropdown,
  Label,
} from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import clsx from "clsx";

export interface SidebarSubItem {
  key: string;
  label: string;
  path: string;
}

export interface SidebarItem {
  key: string;
  label: string;
  path?: string; // If undefined, can be a parent item that only toggles children
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  children?: SidebarSubItem[];
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface SidebarProps {
  groups: SidebarGroup[];
  user?: UserProfile;
  logo?: React.ReactNode;
  brandName?: string;
  onLogout?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
  isShowCollapsedBadge?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  user,
  logo,
  brandName = "Minh Khoa Travel",
  onLogout,
  onSettingsClick,
  onProfileClick,
  className,
  isShowCollapsedBadge = true,
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleSubMenu = (key: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path && pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.path);
    }
    return false;
  };

  const isSubItemActive = (child: SidebarSubItem) => {
    return pathname === child.path;
  };

  return (
    <aside
      className={clsx(
        "relative flex flex-col h-screen border-r border-divider bg-background/70 backdrop-blur-md transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-divider">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center min-w-[40px] h-[40px] rounded-lg bg-primary/10 text-primary">
            {logo || <span className="font-bold text-lg">TG</span>}
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-wide text-foreground animate-fade-in truncate">
              {brandName}
            </span>
          )}
        </div>

        {/* Floating Toggle Button */}
        {isShowCollapsedBadge && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            className="absolute -right-3 top-4 z-50 bg-background border border-divider shadow-sm hover:bg-default-100 min-w-0 w-6 h-6 rounded-full"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </Button>
        )}
      </div>

      {/* Sidebar Content */}
      <ScrollShadow className="flex-grow py-4 px-3 overflow-y-auto">
        <div className="space-y-6">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && !isCollapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  {group.title}
                </p>
              )}

              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openSubMenus[item.key] || false;
                const active = isItemActive(item);

                const itemContent = (
                  <div
                    className={clsx(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground-500 hover:bg-default-100 hover:text-foreground",
                      isCollapsed ? "justify-center" : ""
                    )}
                    onClick={() => {
                      if (hasChildren && !isCollapsed) {
                        toggleSubMenu(item.key);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx("flex items-center justify-center", active ? "text-primary" : "text-foreground-400")}>
                        {item.icon}
                      </div>
                      {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span
                            className={clsx(
                              "px-2 py-0.5 text-2xs font-semibold rounded-full",
                              item.badgeColor === "primary" && "bg-primary/20 text-primary",
                              item.badgeColor === "success" && "bg-success/20 text-success",
                              item.badgeColor === "warning" && "bg-warning/20 text-warning",
                              item.badgeColor === "danger" && "bg-danger/20 text-danger",
                              (!item.badgeColor || item.badgeColor === "default") && "bg-default-200 text-default-700"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronDown
                            size={16}
                            className={clsx(
                              "transition-transform duration-200 text-foreground-400",
                              isOpen ? "rotate-180" : ""
                            )}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );

                return (
                  <div key={item.key} className="space-y-1">
                    {/* Render Nav Link or Toggle Parent */}
                    {item.path && (!hasChildren || isCollapsed) ? (
                      isCollapsed ? (
                        <Tooltip>
                          <Tooltip.Trigger>
                            <div>
                              <NextLink href={item.path} className="block w-full">{itemContent}</NextLink>
                            </div>
                          </Tooltip.Trigger>
                          <Tooltip.Content placement="right">
                            {item.label}
                          </Tooltip.Content>
                        </Tooltip>
                      ) : (
                        <NextLink href={item.path} className="block w-full">{itemContent}</NextLink>
                      )
                    ) : (
                      itemContent
                    )}

                    {/* Sub items */}
                    {hasChildren && isOpen && !isCollapsed && (
                      <div className="pl-9 pr-2 py-1 space-y-1 border-l border-divider/60 ml-5">
                        {item.children?.map((child) => {
                          const childActive = isSubItemActive(child);
                          return (
                            <NextLink
                              key={child.key}
                              href={child.path}
                              className={clsx(
                                "block px-3 py-2 text-xs rounded-lg transition-all duration-200 no-underline",
                                childActive
                                  ? "text-primary font-medium bg-primary/5"
                                  : "text-foreground-500 hover:text-foreground hover:bg-default-50"
                              )}
                            >
                              {child.label}
                            </NextLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollShadow>

      {/* Sidebar Footer (User Profile) */}
      {user && (
        <div className="p-4 border-t border-divider bg-background/50">
          <Dropdown>
            <Dropdown.Trigger>
              <div
                className={clsx(
                  "flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-default-100 transition-all duration-200 w-full bg-transparent border-none text-left outline-none",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <Avatar size="sm" className="flex-shrink-0">
                  {user.avatarUrl && <Avatar.Image src={user.avatarUrl} alt={user.name} />}
                  <Avatar.Fallback>{user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {user.name}
                    </span>
                    <span className="text-2xs text-foreground-400 truncate">
                      {user.email}
                    </span>
                  </div>
                )}
              </div>
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-[200px]">
              <Dropdown.Menu
                aria-label="User Profile Actions"
                onAction={(key) => {
                  if (key === "logout" && onLogout) onLogout();
                  if (key === "settings" && onSettingsClick) onSettingsClick();
                  if (key === "profile" && onProfileClick) onProfileClick();
                }}
              >
                <Dropdown.Item id="profile" textValue="My Profile">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <Label>My Profile</Label>
                  </div>
                </Dropdown.Item>
                {onSettingsClick && (
                  <Dropdown.Item id="settings" textValue="Settings">
                    <div className="flex items-center gap-2">
                      <Settings size={16} />
                      <Label>Account Settings</Label>
                    </div>
                  </Dropdown.Item>
                )}
                <Dropdown.Item id="logout" textValue="Log Out" variant="danger" className="text-danger">
                  <div className="flex items-center gap-2">
                    <LogOut size={16} />
                    <Label className="text-danger">Log Out</Label>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      )}
    </aside>
  );
};
