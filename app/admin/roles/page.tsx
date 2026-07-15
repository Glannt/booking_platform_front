"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Users,
  Settings,
  Loader2,
} from "lucide-react";
import { Button, Spinner, toast } from "@heroui/react";

import {
  getRoles,
  getAllPermissions,
  updateRolePermissions,
  RoleDto,
  PermissionDto,
} from "@/lib/api/roles";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getAllPermissions(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);
    } catch {
      toast.danger("Không thể tải dữ liệu phân quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openRole = (roleName: string) => {
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

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await updateRolePermissions(selectedRole, Array.from(editingPermissions));
      await loadData();
      toast.success(`Đã cập nhật quyền cho ${selectedRole}`);
      setSelectedRole(null);
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

  const groupLabels: Record<string, string> = {
    AIRPORT: "Sân bay",
    SURCHARGE: "Phụ thu",
    TOUR: "Tour",
    VEHICLE: "Xe",
    INTERCITY: "Liên tỉnh",
    BOOKING: "Đặt xe",
    MEDIA: "Media",
    LANGUAGE: "Ngôn ngữ",
    FEEDBACK: "Phản hồi",
    USER: "Người dùng",
    ROLE: "Vai trò",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">Quản lý Phân quyền</h1>
        <Button isIconOnly variant="ghost" onPress={loadData} className="ml-auto">
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" /> Vai trò
          </h2>
          {roles.map(role => (
            <button
              key={role.name}
              onClick={() => openRole(role.name)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedRole === role.name
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-default-200 hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-lg">{role.name}</span>
                  <p className="text-sm text-default-500 mt-1">
                    {role.permissions.length} quyền
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-default-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Permissions editor */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Quyền của <span className="text-primary">{selectedRole}</span>
                </h2>
              </div>

              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group} className="border border-default-200 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 text-default-700">
                    {groupLabels[group] || group}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(perm => {
                      const active = editingPermissions.has(perm.code);
                      return (
                        <button
                          key={perm.code}
                          onClick={() => togglePerm(perm.code)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                            active
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-default-50 text-default-500 border border-transparent hover:bg-default-100"
                          }`}
                        >
                          {active ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <X className="w-4 h-4 text-default-400" />
                          )}
                          {perm.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onPress={savePermissions}
                  isDisabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button variant="outline" onPress={() => setSelectedRole(null)}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-default-400">
              <Shield className="w-16 h-16 mb-4 opacity-30" />
              <p>Chọn một vai trò để chỉnh sửa quyền</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
