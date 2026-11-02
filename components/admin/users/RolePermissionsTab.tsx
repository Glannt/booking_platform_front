"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  Check,
  X,
  Users,
  Save,
  CheckSquare,
  Square,
  Plus,
  Pencil,
} from "lucide-react";
import { Button, Spinner, Tooltip, toast } from "@heroui/react";
import {
  getRoles,
  getAllPermissions,
  updateRolePermissions,
  RoleDto,
  PermissionDto,
} from "@/lib/api/roles";
import PermissionCreateUpdateModal from "./PermissionCreateUpdateModal";

const groupLabels: Record<string, { label: string; desc: string }> = {
  AIRPORT: { label: "Đưa đón sân bay", desc: "Quản lý sân bay, tuyến xe và giá đưa đón sân bay" },
  SURCHARGE: { label: "Phụ thu", desc: "Quy tắc và liên kết phụ thu tự động" },
  TOUR: { label: "Tour Du lịch", desc: "Quản lý danh mục và lịch trình tour" },
  VEHICLE: { label: "Đội xe & Phân khúc", desc: "Quản lý phương tiện và phân khúc xe" },
  ADDON: { label: "Phụ kiện (Add-on)", desc: "Quản lý phụ kiện và danh mục phụ kiện của xe" },
  AMENITY: { label: "Tiện nghi (Amenity)", desc: "Quản lý tiện nghi và danh mục tiện nghi của xe" },
  INTERCITY: { label: "Tuyến Liên tỉnh", desc: "Quản lý các tuyến đường và bảng giá liên tỉnh" },
  BOOKING: { label: "Đơn đặt xe & Tour", desc: "Xem, duyệt và xử lý đơn đặt của khách hàng" },
  MEDIA: { label: "Media & Hình ảnh", desc: "Tải lên và quản lý thư viện hình ảnh" },
  LANGUAGE: { label: "Đa ngôn ngữ", desc: "Cấu hình các ngôn ngữ hỗ trợ" },
  FEEDBACK: { label: "Đánh giá & Phản hồi", desc: "Kiểm duyệt và quản lý đánh giá của khách" },
  USER: { label: "Người dùng & Khách hàng", desc: "Quản lý tài khoản và phân quyền" },
  ROLE: { label: "Vai trò & Quyền hạn", desc: "Xem và cập nhật ma trận phân quyền" },
  SECTION: { label: "Banner & Section", desc: "Quản lý nội dung trang chủ và banner" },
};

export default function RolePermissionsTab() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("STAFF");
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionDto | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getAllPermissions(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);

      if (rolesData.length > 0) {
        const activeRoleName = rolesData.some(r => r.name === selectedRole)
          ? selectedRole
          : rolesData[0].name;
        setSelectedRole(activeRoleName);
        const currentRole = rolesData.find(r => r.name === activeRoleName);
        setEditingPermissions(new Set(currentRole?.permissions || []));
      }
    } catch {
      toast.danger("Không thể tải dữ liệu phân quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (roleName: string) => {
    setSelectedRole(roleName);
    const role = roles.find(r => r.name === roleName);
    setEditingPermissions(new Set(role?.permissions || []));
  };

  const togglePerm = (code: string) => {
    setEditingPermissions(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSelectAll = () => {
    setEditingPermissions(new Set(allPermissions.map(p => p.code)));
  };

  const handleDeselectAll = () => {
    setEditingPermissions(new Set());
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await updateRolePermissions(selectedRole, Array.from(editingPermissions));

      setRoles(prev => prev.map(r => r.name === selectedRole ? { ...r, permissions: Array.from(editingPermissions) } : r));
      toast.success(`Đã cập nhật quyền cho vai trò ${selectedRole}!`);
    } catch {
      toast.danger("Không thể cập nhật quyền");
    } finally {
      setSaving(false);
    }
  };

  const groupedPerms = allPermissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    const group = p.code.split("_")[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] gap-3 bg-white dark:bg-[var(--bg-surface)] p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <Spinner size="lg" />
        <span className="text-xs font-bold text-neutral-500">Đang tải ma trận phân quyền...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Role Selector */}
      <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Shield className="text-accent" size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Phân quyền theo Vai trò
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Cấu hình chi tiết các hành động được phép thực hiện cho từng nhóm tài khoản
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              aria-label="Thêm quyền hạn mới"
              onClick={() => { setEditingPermission(null); setPermissionModalOpen(true); }}
              className="rounded-xl font-bold bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              Thêm quyền hạn
            </Button>
            <Button
              size="sm"
              aria-label="Làm mới ma trận phân quyền"
              onClick={loadData}
              className="rounded-xl font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-neutral-700 dark:text-neutral-200 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mr-1">
            Chọn Vai trò:
          </span>
          {roles.map(role => {
            const isSelected = selectedRole === role.name;
            return (
              <button
                key={role.name}
                type="button"
                aria-label={`Chọn vai trò ${role.name}`}
                onClick={() => handleSelectRole(role.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${isSelected
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-neutral-50 dark:bg-[var(--bg-card)] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-accent/40"
                  }`}
              >
                <Users size={14} />
                <span>{role.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isSelected
                    ? "bg-black/10 dark:bg-white/20 text-accent-foreground"
                    : "bg-neutral-200 dark:bg-[var(--bg-elevated)] text-neutral-600 dark:text-neutral-300"
                  }`}>
                  {role.permissions.length} quyền
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Editor */}
      {selectedRole && (
        <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-50 dark:bg-[var(--bg-page)] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Đang cấu hình: <strong className="text-neutral-900 dark:text-white uppercase">{selectedRole}</strong>
              </span>
              <span className="text-xs text-neutral-400">
                ({editingPermissions.size} / {allPermissions.length} quyền được chọn)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                aria-label="Chọn tất cả quyền hạn"
                onClick={handleSelectAll}
                className="bg-neutral-100 hover:bg-neutral-200 dark:bg-[var(--bg-card)] text-neutral-700 dark:text-neutral-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
              >
                <CheckSquare size={14} /> Chọn tất cả
              </Button>
              <Button
                size="sm"
                aria-label="Bỏ chọn tất cả quyền hạn"
                onClick={handleDeselectAll}
                className="bg-neutral-100 hover:bg-neutral-200 dark:bg-[var(--bg-card)] text-neutral-700 dark:text-neutral-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Square size={14} /> Bỏ chọn tất cả
              </Button>
              <Button
                size="sm"
                aria-label="Lưu phân quyền"
                onClick={savePermissions}
                isDisabled={saving}
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs rounded-xl shadow-sm border border-transparent cursor-pointer flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                Lưu quyền hạn
              </Button>
            </div>
          </div>

          {/* Grouped Permission Cards */}
          <div className="space-y-5">
            {Object.entries(groupedPerms).map(([group, perms]) => {
              const meta = groupLabels[group] || { label: group, desc: "" };
              const selectedInGroup = perms.filter(p => editingPermissions.has(p.code)).length;

              return (
                <div
                  key={group}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[var(--bg-card)] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <div>
                      <h3 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                        {meta.label}
                      </h3>
                      {meta.desc && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{meta.desc}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-400">
                      {selectedInGroup} / {perms.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {perms.map(perm => {
                      const active = editingPermissions.has(perm.code);
                      return (
                        <div
                          key={perm.code}
                          className={`flex items-stretch rounded-xl border transition-all overflow-hidden ${active
                              ? "border-accent/40 shadow-xs ring-1 ring-accent/20"
                              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                            }`}
                        >
                          <button
                            type="button"
                            aria-label={`Quyền ${perm.name} (${perm.code})`}
                            onClick={() => togglePerm(perm.code)}
                            className={`flex-1 flex items-center justify-between p-3 text-xs font-bold transition-all text-left cursor-pointer ${active
                                ? "bg-white dark:bg-[var(--bg-surface)] text-accent"
                                : "bg-white dark:bg-[var(--bg-surface)] text-neutral-600 dark:text-neutral-400"
                              }`}
                          >
                            <div className="flex flex-col pr-2">
                              <span className={active ? "text-neutral-900 dark:text-white" : ""}>
                                {perm.name}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 font-normal">
                                {perm.code}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${active
                                ? "bg-accent text-accent-foreground"
                                : "bg-neutral-100 dark:bg-[var(--bg-elevated)] text-neutral-400"
                              }`}>
                              {active ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                            </div>
                          </button>
                          <Tooltip delay={300} closeDelay={100}>
                            <Tooltip.Trigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={`Chỉnh sửa quyền ${perm.code}`}
                                onPress={() => { setEditingPermission(perm); setPermissionModalOpen(true); }}
                                className="bg-white dark:bg-[var(--bg-surface)] rounded-none border-l border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-accent cursor-pointer"
                              >
                                <Pencil size={13} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              <Tooltip.Arrow />
                              Sửa quyền
                            </Tooltip.Content>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              aria-label="Lưu phân quyền"
              onClick={savePermissions}
              isDisabled={saving}
              className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs rounded-xl shadow-sm border border-transparent px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
              Lưu phân quyền
            </Button>
          </div>
        </div>
      )}

      <PermissionCreateUpdateModal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        onSaved={loadData}
        editingPermission={editingPermission}
      />
    </div>
  );
}
