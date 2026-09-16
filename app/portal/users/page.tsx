"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Users,
  UserPlus,
  Edit3,
  Shield,
} from "lucide-react";
import { Button, Input, Table, toast, Tooltip } from "@heroui/react";
import { getUsers, AdminUserDto } from "@/lib/api/users";
import UserCreateModal from "@/components/admin/users/UserCreateModal";
import UserDetailModal from "@/components/admin/users/UserDetailModal";
import UserDeleteModal from "@/components/admin/users/UserDeleteModal";
import RolePermissionsTab from "@/components/admin/users/RolePermissionsTab";
import { useAuthStore } from "@/lib/store/authStore";
import PageSizeSelect from "@/components/common/PageSizeSelect";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";
import { AppStatusChip } from "@/components/common/AppStatusChip";

const roleColors: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  STAFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MODERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CUSTOMER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function UsersManagementPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const isModerator = currentUser?.role === "MODERATOR";
  const isStaff = currentUser?.role === "STAFF";
  const isAdmin = currentUser?.role === "ADMIN";

  const initialTab = searchParams.get("tab") === "roles" && isAdmin ? "roles" : "users";
  const [activeTab, setActiveTab] = useState<"users" | "roles">(initialTab);

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.danger(message);
  };

  const fetchUsers = async (page = 0, search = "", size = pageSize) => {
    setLoading(true);
    try {
      const res = await getUsers({ search: search || undefined, page, size });
      if (res?.data) {
        setUsers(res.data.content);
        setTotalPages(Math.max(1, res.data.page.totalPages));
        setCurrentPage(res.data.page.number);
      }
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      showToast("Lỗi kết nối với API", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "roles" && isAdmin) setActiveTab("roles");
    else setActiveTab("users");
  }, [searchParams, isAdmin]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSearch = () => {
    fetchUsers(0, searchTerm);
  };

  const handleDeleteSuccess = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  const handleSaveSuccess = () => {
    fetchUsers(currentPage, searchTerm);
    setEditingUser(null);
  };

  const switchTab = (tab: "users" | "roles") => {
    if (tab === "roles" && !isAdmin) return;
    setActiveTab(tab);
    router.replace(`/portal/users?tab=${tab}`);
  };

  const displayedUsers = useMemo(() => {
    if (isModerator) {
      return users.filter((u) => u.role !== "ADMIN");
    }
    if (isStaff) {
      return users.filter((u) => u.role === "STAFF" || u.role === "CUSTOMER");
    }
    return users;
  }, [users, isModerator, isStaff]);

  return (
    <div className="w-full space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          aria-label="Tab Tài khoản Người dùng"
          onClick={() => switchTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer border ${
            activeTab === "users"
              ? "bg-accent text-accent-foreground border-accent shadow-sm"
              : "bg-white dark:bg-[var(--bg-surface)] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-accent/40"
          }`}
        >
          <Users size={16} />
          <span>Tài khoản Người dùng</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            aria-label="Tab Phân quyền Vai trò"
            onClick={() => switchTab("roles")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer border ${
              activeTab === "roles"
                ? "bg-accent text-accent-foreground border-accent shadow-sm"
                : "bg-white dark:bg-[var(--bg-surface)] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-accent/40"
            }`}
          >
            <Shield size={16} />
            <span>Phân quyền Vai trò</span>
          </button>
        )}
      </div>

      {activeTab === "roles" && isAdmin ? (
        <RolePermissionsTab />
      ) : (
        <>
          {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
          <div className="relative flex-grow min-w-[240px]">
            <Search className="absolute left-3 top-3.5 text-neutral-400" size={16} />
            <Input
              type="text"
              placeholder="Tìm kiếm theo email, tên, SĐT..."
              aria-label="Tìm kiếm người dùng theo email, tên hoặc số điện thoại"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[var(--bg-page)] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>
          <Button
            aria-label="Tìm kiếm người dùng"
            className="rounded-xl font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-neutral-700 dark:text-neutral-200 shadow-sm border border-transparent"
            onClick={handleSearch}
          >
            <Search size={16} className="mr-1.5" />
            Tìm kiếm
          </Button>

          <PageSizeSelect
            value={pageSize}
            onChange={(size) => {
              setPageSize(size);
              fetchUsers(0, searchTerm, size);
            }}
          />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            aria-label="Làm mới danh sách người dùng"
            className="rounded-xl font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-neutral-700 dark:text-neutral-200 shadow-sm border border-transparent"
            onClick={() => fetchUsers(currentPage, searchTerm)}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
          {isAdmin && (
            <Button
              aria-label="Thêm người dùng mới"
              className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
              onClick={() => setCreateModalOpen(true)}
            >
              <UserPlus size={16} />
              <span>Thêm User</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-accent" size={32} />
            <p className="text-sm font-bold text-neutral-500">Đang tải danh sách user...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Users className="text-neutral-300 dark:text-neutral-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-1">
              Không tìm thấy user nào
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              Không có user nào khớp với bộ lọc tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý user" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-neutral-50 dark:bg-[var(--bg-page)]/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.users(t).map((col) => (
                      <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
                    {displayedUsers.map((u) => {
                      const isSelf = currentUser && (u.id === currentUser.id || u.email === currentUser.email);
                      return (
                        <Table.Row
                          key={u.id}
                          className="hover:bg-neutral-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                        >
                          <Table.Cell className="px-6 py-4 font-bold text-neutral-900 dark:text-white text-xs">
                            <div className="flex items-center gap-2">
                              <span>{u.email}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-accent/10 text-accent font-bold px-1.5 py-0.5 rounded">
                                  Bạn
                                </span>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            {u.fullname || "—"}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                            {u.phone || "—"}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColors[u.role] || "bg-neutral-100 text-neutral-600"}`}>
                              {u.role}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <AppStatusChip status={u.status} />
                              {u.reasonInactive && (
                                <span className="text-[10px] text-rose-500 font-medium truncate max-w-[160px]" title={u.reasonInactive}>
                                  Lý do: {u.reasonInactive}
                                </span>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="tertiary"
                                    aria-label={`Xem chi tiết ${u.fullname || u.email}`}
                                    onPress={() => { setSelectedUser(u); setDetailsModalOpen(true); }}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Xem chi tiết
                                </Tooltip.Content>
                              </Tooltip>

                              {!isSelf && !isStaff && (
                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="secondary"
                                      aria-label={`Chỉnh sửa ${u.fullname || u.email}`}
                                      onPress={() => { setEditingUser(u); setCreateModalOpen(true); }}
                                    >
                                      <Edit3 size={16} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content>
                                    <Tooltip.Arrow />
                                    {isModerator ? "Chỉnh sửa trạng thái" : "Chỉnh sửa"}
                                  </Tooltip.Content>
                                </Tooltip>
                              )}

                              {isAdmin && !isSelf && (
                                <Tooltip delay={300} closeDelay={100}>
                                  <Tooltip.Trigger>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="danger"
                                      aria-label={`Xóa ${u.fullname || u.email}`}
                                      onPress={() => { setSelectedUser(u); setDeleteModalOpen(true); }}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                    <Tooltip.Arrow />
                                    Xóa
                                  </Tooltip.Content>
                                </Tooltip>
                              )}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-bold text-neutral-500">
            Trang {currentPage + 1} / {Math.max(1, totalPages)}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              aria-label="Trang trước"
              className="rounded-lg font-bold bg-neutral-100 dark:bg-[var(--bg-card)] text-neutral-700 dark:text-neutral-200"
              isDisabled={currentPage === 0}
              onClick={() => fetchUsers(currentPage - 1, searchTerm)}
            >
              Trước
            </Button>
            <Button
              size="sm"
              aria-label="Trang sau"
              className="rounded-lg font-bold bg-neutral-100 dark:bg-[var(--bg-card)] text-neutral-700 dark:text-neutral-200"
              isDisabled={currentPage >= totalPages - 1}
              onClick={() => fetchUsers(currentPage + 1, searchTerm)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingUser(null); }}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
        editingUser={editingUser}
      />

      <UserDetailModal
        isOpen={detailsModalOpen}
        onClose={() => { setDetailsModalOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        onEdit={() => {
          setDetailsModalOpen(false);
          setEditingUser(selectedUser);
          setCreateModalOpen(true);
        }}
      />

      <UserDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
        user={selectedUser}
        onDeleteSuccess={handleDeleteSuccess}
        showToast={showToast}
      />
        </>
      )}
    </div>
  );
}
