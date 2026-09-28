"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
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
  ListBox,
  Tooltip
} from "@heroui/react";
import clsx from "clsx";
import {
  PageSizeSelect,
  TableLoadingState,
  TableEmptyState,
  PaymentStatusChip,
  RowActionButtons,
} from "@/components/common";

import { StatusChip } from "@/components/StatusChip";
import { BookingEditModal } from "@/components/admin/bookings";
import {
  BookingDto,
  BookingItemDto,
  getBookings,
  updateBooking,
  UpdateBookingRequest,
  BookingStatus
} from "@/lib/api/bookings";

import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

interface RentalBookingItem {
  booking: BookingDto;
  item: BookingItemDto;
}

export default function IntercityBookingsPage() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
        if (item.intercityBookingDetailId) {
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

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
      <div className="bg-white dark:bg-black p-6 rounded-2xl border border-separator shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Đơn đặt xe Liên tỉnh
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quản lý danh sách đơn đặt xe liên tỉnh, trạng thái và thông tin khách hàng.
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <PageSizeSelect
              value={pageSize}
              onChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
            <Select
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(key as string)}
              className="w-48"
            >
              <Select.Trigger className="px-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer h-[42px] flex items-center justify-between min-w-[170px]">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="bg-white dark:bg-black border border-border-secondary rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
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
      <div className="bg-white dark:bg-black rounded-2xl border border-separator shadow-sm overflow-hidden">
        {loading ? (
          <TableLoadingState message="Đang tải danh sách đơn đặt xe liên tỉnh..." />
        ) : paginatedItems.length === 0 ? (
          <TableEmptyState
            icon={MapPin}
            title="Không tìm thấy đơn đặt nào"
            description="Không có đơn đặt xe liên tỉnh nào khớp với bộ lọc tìm kiếm hiện tại."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý đơn đặt xe liên tỉnh" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] border-b border-separator text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.bookingIntercity(t).map((col) => (
                      <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-separator">
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
                            <PaymentStatusChip status={ri.booking.paymentStatus} />
                            {(ri.booking.assignedDriver || ri.booking.assignedVehicle) && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col mt-0.5">
                                {ri.booking.assignedDriver && <span>TX: <strong className="text-slate-700 dark:text-slate-300">{ri.booking.assignedDriver}</strong></span>}
                                {ri.booking.assignedVehicle && <span className="font-mono text-primary font-bold">Xe: {ri.booking.assignedVehicle}</span>}
                              </div>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <StatusChip status={ri.booking.bookingStatus} type="booking" />
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <RowActionButtons
                            className="justify-end"
                            onView={() => handleViewDetail(ri)}
                            viewLabel="Xem chi tiết"
                            onEdit={() => handleOpenEdit(ri)}
                            editLabel="Cập nhật trạng thái"
                          />
                        </Table.Cell>
                      </Table.Row>
                    )})}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-separator">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Hiển thị {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} / {filteredItems.length} kết quả
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg font-bold text-xs"
                isDisabled={currentPage <= 1}
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
                    page === currentPage && "bg-accent text-accent-foreground"
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
                isDisabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - backdrop fix */}
      <Modal isOpen={detailModalOpen} onOpenChange={(open) => { if (!open) { setDetailModalOpen(false); setSelectedItem(null); setSelectedBooking(null); } }} aria-labelledby="intercity-detail-title">
        <ModalBackdrop>
          <ModalContainer size="lg">
            <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <ModalCloseTrigger />
              <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex flex-col gap-1">
                  <h2 id="intercity-detail-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Chi tiết đơn đặt xe liên tỉnh
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedBooking?.bookingCode}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody className="p-6 overflow-y-auto">
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

                    {/* Intercity Detail */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Chi tiết chuyến liên tỉnh
                      </h3>
                      <IntercityDetail item={selectedItem.item} />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => { setDetailModalOpen(false); setSelectedItem(null); setSelectedBooking(null); }}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Đóng
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDetailModalOpen(false);
                    if (selectedItem) handleOpenEdit(selectedItem);
                  }}
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50 shadow-xs cursor-pointer transition-colors"
                >
                  <Edit3 size={15} className="mr-1.5" />
                  Chỉnh sửa
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
        onSaveSuccess={async () => {
          await fetchBookings();
        }}
        showToast={showToast}
      />
    </div>
  );
}

function IntercityDetail({ item }: { item: BookingItemDto }) {
  const details = (() => {
    try {
      return item.dynamicDetails ? JSON.parse(item.dynamicDetails) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {details.tripType && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Loại chuyến</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{details.tripType === "one_way" ? "Một chiều" : "Khứ hồi"}</p>
          </div>
        )}
        {details.passengerCount && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Số hành khách</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Users size={14} /> {details.passengerCount}
            </p>
          </div>
        )}
        {details.departureDate && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ngày đi</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar size={14} /> {details.departureDate}
            </p>
          </div>
        )}
        {details.departureTime && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Giờ đi</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{details.departureTime}</p>
          </div>
        )}
        {details.returnDate && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ngày về</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar size={14} /> {details.returnDate}
            </p>
          </div>
        )}
        {details.returnTime && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Giờ về</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{details.returnTime}</p>
          </div>
        )}
      </div>
      {details.pickupAddress && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Điểm đón</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <MapPin size={14} className="text-emerald-500" /> {details.pickupAddress}
          </p>
        </div>
      )}
      {details.dropoffAddress && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Điểm trả</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <MapPin size={14} className="text-rose-500" /> {details.dropoffAddress}
          </p>
        </div>
      )}
      {details.note && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Ghi chú</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{details.note}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100 dark:border-blue-900/30">
        {details.basePrice && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Giá gốc</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(details.basePrice)}</p>
          </div>
        )}
        {details.surchargeAmount && Number(details.surchargeAmount) > 0 && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Phụ phí</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">+{formatPrice(details.surchargeAmount)}</p>
          </div>
        )}
        {details.totalPrice && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Tổng cộng</p>
            <p className="text-sm font-extrabold text-primary">{formatPrice(details.totalPrice)}</p>
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
