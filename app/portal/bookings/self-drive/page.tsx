"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Car,
  MapPin,
  Calendar,
  Edit3
} from "lucide-react";
import {
  Button,
  Input,
  Table,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  toast,
  Label,
  Select,
  ListBox
} from "@heroui/react";
import clsx from "clsx";

import { StatusChip } from "@/components/StatusChip";
import BookingEditModal from "@/components/admin/bookings/BookingEditModal";
import {
  BookingDto,
  BookingItemDto,
  getBookings,
  updateBooking,
  UpdateBookingRequest,
  BookingStatus
} from "@/lib/api/bookings";

interface RentalBookingItem {
  booking: BookingDto;
  item: BookingItemDto;
}

export default function SelfDriveBookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [selectedItem, setSelectedItem] = useState<RentalBookingItem | null>(null);
  const [editStatus, setEditStatus] = useState<BookingStatus>("pending");

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

  const rentalItems = useMemo(() => {
    const items: RentalBookingItem[] = [];
    for (const booking of bookings) {
      if (!booking.items) continue;
      for (const item of booking.items) {
        if (item.selfDriveBookingDetailId) {
          items.push({ booking, item });
        }
      }
    }
    return items;
  }, [bookings]);

  const filteredItems = useMemo(() => {
    return rentalItems.filter((ri) => {
      const b = ri.booking;
      const codeMatch = b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = b.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());
      const queryMatch = codeMatch || nameMatch || phoneMatch;

      const statusMatch = statusFilter === "all" || b.bookingStatus === statusFilter;

      return queryMatch && statusMatch;
    });
  }, [rentalItems, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleViewDetail = (ri: RentalBookingItem) => {
    setSelectedItem(ri);
    setSelectedBooking(ri.booking);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (ri: RentalBookingItem) => {
    setSelectedBooking(ri.booking);
    setSelectedItem(ri);
    setEditStatus(ri.booking.bookingStatus);
    setEditModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedBooking) return;
    try {
      const dto: UpdateBookingRequest = { bookingStatus: editStatus };
      await updateBooking(selectedBooking.id, dto);
      showToast("Cập nhật trạng thái thành công", "success");
      setEditModalOpen(false);
      setSelectedBooking(null);
      setSelectedItem(null);
      fetchBookings();
    } catch (err: any) {
      console.error("Failed to update booking:", err);
      showToast("Cập nhật trạng thái thất bại", "error");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Car className="text-violet-600 dark:text-violet-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Đơn đặt xe tự lái
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quản lý danh sách đơn đặt xe tự lái, trạng thái và thông tin khách hàng.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
            <div className="relative flex-grow min-w-[240px]">
              <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
              <Input
                type="text"
                placeholder="Tìm mã đặt chỗ, khách hàng, SĐT..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(key as string)}
              className="w-48"
            >
              <Select.Trigger className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer h-[42px] flex items-center justify-between min-w-[170px]">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
                <ListBox>
                  <ListBox.Item id="all" textValue="Tất cả trạng thái">
                    Tất cả trạng thái
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

          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
              onClick={fetchBookings}
            >
              <RefreshCw size={16} className="mr-1.5" />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-slate-500">Đang tải danh sách đơn đặt xe tự lái...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Car className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Không tìm thấy đơn đặt nào
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Không có đơn đặt xe tự lái nào khớp với bộ lọc tìm kiếm hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý đơn đặt xe tự lái" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Table.Column isRowHeader className="px-6 py-4">ID</Table.Column>
                    <Table.Column className="px-6 py-4">Mã đặt chỗ</Table.Column>
                    <Table.Column className="px-6 py-4">Khách hàng</Table.Column>
                    <Table.Column className="px-6 py-4">Tài chính</Table.Column>
                    <Table.Column className="px-6 py-4">Thanh toán & Xe</Table.Column>
                    <Table.Column className="px-6 py-4">Trạng thái</Table.Column>
                    <Table.Column className="px-6 py-4 text-right">Thao tác</Table.Column>
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedItems.map((ri) => {
                      const deposit = ri.booking.depositAmount ?? 0;
                      const received = ri.booking.receivedAmount ?? 0;
                      const paid = ri.booking.paidAmount ?? (deposit + received);
                      const remaining = ri.booking.remainingAmount ?? Math.max(0, Number(ri.booking.totalAmount) - paid);

                      return (
                      <Table.Row
                        key={`${ri.booking.id}-${ri.item.id}`}
                        className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                      >
                        <Table.Cell className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                          {ri.booking.id}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-slate-100 font-bold">
                          {ri.booking.bookingCode}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{ri.booking.customerName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{ri.booking.customerPhone} | {ri.booking.customerEmail}</div>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {formatPrice(Number(ri.booking.totalAmount))}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                              {deposit > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Cọc: {formatPrice(deposit)}
                                </span>
                              )}
                              {received > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Nhận: {formatPrice(received)}
                                </span>
                              )}
                            </div>
                            {remaining > 0 && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                Còn nợ: {formatPrice(remaining)}
                              </span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ri.booking.paymentStatus === "PAID"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : ri.booking.paymentStatus === "DEPOSITED"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : ri.booking.paymentStatus === "REFUNDED"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                            }`}>
                              {ri.booking.paymentStatus === "PAID" ? "Đã thanh toán" : ri.booking.paymentStatus === "DEPOSITED" ? "Đã đặt cọc" : ri.booking.paymentStatus === "REFUNDED" ? "Đã hoàn tiền" : "Chưa thanh toán"}
                            </span>
                            {ri.booking.assignedVehicle && (
                              <span className="font-mono text-xs font-bold text-primary mt-0.5">
                                Xe: {ri.booking.assignedVehicle}
                              </span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <StatusChip status={ri.booking.bookingStatus} type="booking" />
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                              onClick={() => handleViewDetail(ri)}
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-2 text-slate-600 dark:text-slate-350 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                              onClick={() => handleOpenEdit(ri)}
                              title="Cập nhật trạng thái"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )})}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        {!loading && filteredItems.length > rowsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Hiển thị {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredItems.length)} / {filteredItems.length} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-bold text-xs"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "primary" : "outline"}
                  size="sm"
                  className={clsx(
                    "rounded-lg font-bold text-xs min-w-[32px]",
                    page === currentPage && "bg-[#C9A227] text-white"
                  )}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-bold text-xs"
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - backdrop fix: ModalBackdrop wraps ModalContainer */}
      <Modal isOpen={detailModalOpen} onOpenChange={(open) => { if (!open) { setDetailModalOpen(false); setSelectedItem(null); setSelectedBooking(null); } }} aria-labelledby="self-drive-detail-title">
        <ModalBackdrop>
          <ModalContainer size="lg">
            <ModalDialog>
              <ModalCloseTrigger />
              <ModalHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col gap-1">
                  <h2 id="self-drive-detail-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Chi tiết đơn đặt xe tự lái
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedBooking?.bookingCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    if (selectedItem) handleOpenEdit(selectedItem);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Chỉnh sửa
                </Button>
              </ModalHeader>
              <ModalBody className="py-6">
                {selectedBooking && selectedItem && (
                  <div className="space-y-6">
                    {/* Booking Info */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Thông tin đặt chỗ
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Mã đặt chỗ</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{selectedBooking.bookingCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trạng thái</p>
                          <StatusChip status={selectedBooking.bookingStatus} type="booking" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Khách hàng</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBooking.customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Số điện thoại</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBooking.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Email</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBooking.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tổng tiền</p>
                          <p className="text-sm font-extrabold text-primary">{formatPrice(Number(selectedBooking.totalAmount))}</p>
                        </div>
                        {selectedBooking.customerNotes && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ghi chú</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedBooking.customerNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Self-Drive Detail */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Chi tiết thuê xe tự lái
                      </h3>
                      <SelfDriveDetail item={selectedItem.item} />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200"
                  onClick={() => { setDetailModalOpen(false); setSelectedItem(null); setSelectedBooking(null); }}
                >
                  Đóng
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Edit Booking & Operations Modal */}
      <BookingEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBooking(null);
          setSelectedItem(null);
        }}
        booking={selectedBooking}
        language="vi"
        onSaveSuccess={() => {
          fetchBookings();
        }}
        showToast={showToast}
      />
    </div>
  );
}

function SelfDriveDetail({ item }: { item: BookingItemDto }) {
  const details = (() => {
    try {
      return item.dynamicDetails ? JSON.parse(item.dynamicDetails) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="bg-violet-50/50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {details.startDate && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ngày nhận xe</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar size={14} /> {details.startDate}
            </p>
          </div>
        )}
        {details.endDate && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ngày trả xe</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar size={14} /> {details.endDate}
            </p>
          </div>
        )}
        {details.rentalDays && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Số ngày thuê</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{details.rentalDays} ngày</p>
          </div>
        )}
      </div>
      {details.pickupLocation && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Điểm nhận xe</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <MapPin size={14} className="text-emerald-500" /> {details.pickupLocation}
          </p>
        </div>
      )}
      {details.dropoffLocation && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Điểm trả xe</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <MapPin size={14} className="text-rose-500" /> {details.dropoffLocation}
          </p>
        </div>
      )}
      {details.note && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ghi chú</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{details.note}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-violet-100 dark:border-violet-900/30">
        {details.basePrice && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Giá gốc</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(details.basePrice)}</p>
          </div>
        )}
        {details.deposit && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tiền cọc</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatPrice(details.deposit)}</p>
          </div>
        )}
        {details.totalPrice && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tổng cộng</p>
            <p className="text-sm font-extrabold text-primary">{formatPrice(details.totalPrice)}</p>
          </div>
        )}
        {details.depositStatus && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trạng thái cọc</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {details.depositStatus === "PENDING" ? "Chờ xử lý" : details.depositStatus === "PAID" ? "Đã thanh toán" : details.depositStatus === "REFUNDED" ? "Đã hoàn tiền" : details.depositStatus === "PARTIAL" ? "Thanh toán một phần" : details.depositStatus}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(price);
}
