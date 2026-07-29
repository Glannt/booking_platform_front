"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Users,
  UserPlus,
  Edit3,
} from "lucide-react";
import { Button, Input, Table, toast } from "@heroui/react";
import { getUsers, AdminUserDto } from "@/lib/api/users";
import UserCreateModal from "@/components/admin/users/UserCreateModal";
import UserDetailsModal from "@/components/admin/users/UserDetailsModal";
import UserDeleteModal from "@/components/admin/users/UserDeleteModal";

const PAGE_SIZE = 8;

const roleColors: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  STAFF: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MODERATOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CUSTOMER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inactive: "bg-slate-100 text-slate-700 dark:bg-[var(--bg-card)] dark:text-slate-400",
  blocked: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const fetchUsers = async (page = 0, search = "") => {
    setLoading(true);
    try {
      const res = await getUsers({ search: search || undefined, page, size: PAGE_SIZE });
      if (res?.data) {
        setUsers(res.data.content);
        setTotalPages(res.data.page.totalPages);
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
    fetchUsers();
  }, []);

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

  return (
    <div className="w-full space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
          <div className="relative flex-grow min-w-[240px]">
            <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            <Input
              type="text"
              placeholder="Tìm kiếm theo email, tên, SĐT..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>
          <Button
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={handleSearch}
          >
            <Search size={16} className="mr-1.5" />
            Tìm kiếm
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={() => fetchUsers(currentPage, searchTerm)}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
          <Button
            className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-white shadow-sm border border-transparent"
            onClick={() => setCreateModalOpen(true)}
          >
            <UserPlus size={16} className="mr-1.5" />
            Thêm User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-accent" size={32} />
            <p className="text-sm font-bold text-slate-500">Đang tải danh sách user...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Users className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Không tìm thấy user nào
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Không có user nào khớp với bộ lọc tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý user" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Table.Column isRowHeader className="px-6 py-4">Email</Table.Column>
                    <Table.Column className="px-6 py-4">Họ và tên</Table.Column>
                    <Table.Column className="px-6 py-4">Điện thoại</Table.Column>
                    <Table.Column className="px-6 py-4">Vai trò</Table.Column>
                    <Table.Column className="px-6 py-4">Trạng thái</Table.Column>
                    <Table.Column className="px-6 py-4 text-right">Thao tác</Table.Column>
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {users.map((u) => (
                      <Table.Row
                        key={u.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                      >
                        <Table.Cell className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">
                          {u.email}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {u.fullname || "—"}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {u.phone || "—"}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleColors[u.role] || "bg-slate-100 text-slate-600"}`}>
                            {u.role}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[u.status] || "bg-slate-100 text-slate-600"}`}>
                            {u.status}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                              onClick={() => { setSelectedUser(u); setDetailsModalOpen(true); }}
                              title="Xem Chi Tiết"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-2 text-slate-600 dark:text-slate-350 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                              onClick={() => { setEditingUser(u); setCreateModalOpen(true); }}
                              title="Chỉnh Sửa"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="p-2 text-slate-600 dark:text-slate-350 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                              onClick={() => { setSelectedUser(u); setDeleteModalOpen(true); }}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-lg font-bold bg-slate-100 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200"
                isDisabled={currentPage === 0}
                onClick={() => fetchUsers(currentPage - 1, searchTerm)}
              >
                Trước
              </Button>
              <Button
                size="sm"
                className="rounded-lg font-bold bg-slate-100 dark:bg-[var(--bg-card)] text-slate-700 dark:text-slate-200"
                isDisabled={currentPage >= totalPages - 1}
                onClick={() => fetchUsers(currentPage + 1, searchTerm)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingUser(null); }}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
        editingUser={editingUser}
      />

      <UserDetailsModal
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
    </div>
  );
}
