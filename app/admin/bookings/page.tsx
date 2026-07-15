"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Button, Input, Table, toast, Select, ListBox } from "@heroui/react";
import { BookingDto, getBookings } from "@/lib/api/bookings";
import { StatusChip } from "@/components/StatusChip";
import BookingDetailsModal from "@/components/admin/bookings/BookingDetailsModal";
import BookingEditModal from "@/components/admin/bookings/BookingEditModal";
import BookingDeleteModal from "@/components/admin/bookings/BookingDeleteModal";

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");

  // Modal Triggers
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.danger(message);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookings();
      if (res.data) {
        setBookings(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      showToast("Lỗi kết nối với API", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDeleteSuccess = (id: number) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    if (selectedBooking?.id === id) {
      setSelectedBooking(null);
    }
  };

  const handleSaveSuccess = () => {
    fetchBookings();
  };

  const filteredBookings = bookings.filter(b => {
    const codeMatch = b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = b.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = b.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());
    const queryMatch = codeMatch || nameMatch || emailMatch || phoneMatch;

    const bStatusMatch = bookingStatusFilter === "all" || b.bookingStatus === bookingStatusFilter;

    return queryMatch && bStatusMatch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Search Input & Status Selectors */}
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
          <div className="relative flex-grow min-w-[240px]">
            <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            <Input
              type="text"
              placeholder="Tìm kiếm mã đơn, khách hàng..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            selectedKey={bookingStatusFilter}
            onSelectionChange={(key) => setBookingStatusFilter(key as string)}
            className="w-56"
          >
            <Select.Trigger className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer h-[42px] flex items-center justify-between min-w-[200px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="all" textValue="Tất cả trạng thái đơn">
                  Tất cả trạng thái đơn
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="pending" textValue="Chờ xử lý">
                  Chờ xử lý
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="confirmed" textValue="Đã xác nhận">
                  Đã xác nhận
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="completed" textValue="Đã hoàn thành">
                  Đã hoàn thành
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="cancelled" textValue="Đã hủy">
                  Đã hủy
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={fetchBookings}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-slate-500">Đang tải danh sách đơn đặt...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Calendar className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Không tìm thấy đơn đặt nào
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Không có đơn đặt du lịch nào khớp với bộ lọc tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý đơn đặt" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Table.Column isRowHeader className="px-6 py-4">Mã đơn đặt</Table.Column>
                    <Table.Column className="px-6 py-4">Khách hàng</Table.Column>
                    <Table.Column className="px-6 py-4">Tổng tiền</Table.Column>
                    <Table.Column className="px-6 py-4">Trạng thái đơn</Table.Column>
                    <Table.Column className="px-6 py-4">Ngày tạo</Table.Column>
                    <Table.Column className="px-6 py-4 text-right">Thao tác</Table.Column>
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredBookings.map((b) => {
                      return (
                        <Table.Row
                          key={b.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors duration-150"
                        >
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-slate-100 font-bold">
                            {b.bookingCode}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{b.customerName}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{b.customerPhone} | {b.customerEmail}</div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(b.totalAmount)}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <StatusChip status={b.bookingStatus} type="booking" />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {formatDate(b.createdAt)}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setDetailsModalOpen(true);
                                }}
                                title="Xem Chi Tiết"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 text-slate-600 dark:text-slate-350 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setEditModalOpen(true);
                                }}
                                title="Chỉnh sửa"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                className="p-2 text-slate-600 dark:text-slate-350 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedBooking(b);
                                  setDeleteModalOpen(true);
                                }}
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
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
      </div>

      {/* Details Modal */}
      <BookingDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        language="vi"
      />

      {/* Edit Modal */}
      <BookingEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        language="vi"
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
      />

      {/* Delete Modal */}
      <BookingDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        language="vi"
        onDeleteSuccess={handleDeleteSuccess}
        showToast={showToast}
      />
    </div>
  );
}
