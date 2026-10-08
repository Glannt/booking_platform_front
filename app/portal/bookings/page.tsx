"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Calendar,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Filter,
  X,
  ArrowUpDown
} from "lucide-react";
import {
  Button,
  Input,
  Table,
  toast,
  Select,
  ListBox,
  Pagination,
  Popover,
  Checkbox
} from "@heroui/react";
import { BookingDto, getBookings } from "@/lib/api/bookings";
import { StatusChip } from "@/components/StatusChip";
import {
  BookingDetailModal,
  BookingEditModal,
  BookingDeleteModal,
} from "@/components/admin/bookings";
import {
  PageSizeSelect,
  TableLoadingState,
  TableEmptyState,
  PaymentStatusChip,
  RowActionButtons,
} from "@/components/common";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

export default function BookingsManagementPage() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filters
  const [selectedBookingStatuses, setSelectedBookingStatuses] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [selectedDispatchFilters, setSelectedDispatchFilters] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("date_desc");

  const [pageSize, setPageSize] = useState<number>(10);
  const [bookingPage, setBookingPage] = useState<number>(1);

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

  const handleSaveSuccess = async () => {
    await fetchBookings();
  };

  // Toggle filter helpers
  const toggleBookingStatus = (statusKey: string) => {
    setSelectedBookingStatuses(prev =>
      prev.includes(statusKey) ? prev.filter(s => s !== statusKey) : [...prev, statusKey]
    );
  };

  const togglePaymentStatus = (statusKey: string) => {
    setSelectedPaymentStatuses(prev =>
      prev.includes(statusKey) ? prev.filter(s => s !== statusKey) : [...prev, statusKey]
    );
  };

  const toggleDispatchFilter = (key: string) => {
    setSelectedDispatchFilters(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resetFilters = () => {
    setSelectedBookingStatuses([]);
    setSelectedPaymentStatuses([]);
    setSelectedDispatchFilters([]);
  };

  const activeFilterCount =
    selectedBookingStatuses.length +
    selectedPaymentStatuses.length +
    selectedDispatchFilters.length;

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const codeMatch = b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = b.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = b.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());
      const queryMatch = codeMatch || nameMatch || emailMatch || phoneMatch;

      // Booking status filter
      const bStatus = (b.bookingStatus || "").toLowerCase();
      const bStatusMatch =
        selectedBookingStatuses.length === 0 || selectedBookingStatuses.includes(bStatus);

      // Payment status filter
      const pStatus = (b.paymentStatus || "UNPAID").toUpperCase();
      const pStatusMatch =
        selectedPaymentStatuses.length === 0 || selectedPaymentStatuses.includes(pStatus);

      // Dispatch filter
      const hasDriver = !!b.assignedDriver;
      const hasVehicle = !!b.assignedVehicle;
      let dispatchMatch = true;
      if (selectedDispatchFilters.length > 0) {
        dispatchMatch = selectedDispatchFilters.some(f => {
          if (f === "has_driver") return hasDriver;
          if (f === "has_vehicle") return hasVehicle;
          if (f === "unassigned") return !hasDriver && !hasVehicle;
          return false;
        });
      }

      // Exclude bookings where ALL items are rental (intercity/self-drive)
      const hasOnlyRentalItems =
        b.items &&
        b.items.length > 0 &&
        b.items.every(item => item.intercityBookingDetailId || item.selfDriveBookingDetailId);

      return queryMatch && bStatusMatch && pStatusMatch && dispatchMatch && !hasOnlyRentalItems;
    });
  }, [
    bookings,
    searchTerm,
    selectedBookingStatuses,
    selectedPaymentStatuses,
    selectedDispatchFilters
  ]);

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      if (sortOption === "date_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === "amount_desc") {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      if (sortOption === "amount_asc") {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      // default: date_desc
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredBookings, sortOption]);

  // Reset pagination on search/filter changes
  useEffect(() => {
    setBookingPage(1);
  }, [searchTerm, selectedBookingStatuses, selectedPaymentStatuses, selectedDispatchFilters, sortOption]);

  const paginatedBookings = useMemo(
    () =>
      sortedBookings.slice(
        (bookingPage - 1) * pageSize,
        bookingPage * pageSize
      ),
    [sortedBookings, bookingPage, pageSize]
  );

  const bookingPageCount = Math.max(1, Math.ceil(sortedBookings.length / pageSize));

  const bookingPages = Array.from(
    { length: bookingPageCount },
    (_, i) => i + 1
  );

  const bookingStart = sortedBookings.length === 0 ? 0 : (bookingPage - 1) * pageSize + 1;
  const bookingEnd = Math.min(bookingPage * pageSize, sortedBookings.length);

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

  // Status mapping constants
  const bookingStatusOptions = [
    { key: "pending", label: t.status.pending },
    { key: "confirmed", label: t.status.confirmed },
    { key: "completed", label: t.status.completed },
    { key: "cancelled", label: t.status.cancelled },
    { key: "cancellation_requested", label: t.status.cancellationRequested },
  ];

  const paymentStatusOptions = [
    { key: "UNPAID", label: t.adminBookings.unpaid },
    { key: "DEPOSITED", label: t.adminBookings.deposited },
    { key: "PAID", label: t.adminBookings.paid },
    { key: "REFUNDED", label: t.adminBookings.refunded },
  ];

  const dispatchOptions = [
    { key: "has_driver", label: "Đã có tài xế" },
    { key: "has_vehicle", label: "Đã có xe" },
    { key: "unassigned", label: "Chưa phân công" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
          <Calendar className="text-primary" size={26} />
          Quản lý Đơn đặt
        </h1>
        <p className="text-xs text-foreground/60 mt-1">
          Theo dõi và quản lý tất cả các đơn đặt dịch vụ trong hệ thống.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-separator shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input & Popover Filter */}
          <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
            <div className="relative flex-grow min-w-[240px]">
              <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
              <Input
                type="text"
                placeholder="Tìm kiếm mã đơn, khách hàng..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Popover */}
            <Popover>
              <Button
                type="button"
                variant="outline"
                className={`rounded-xl font-bold text-xs h-10 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeFilterCount > 0 ? "border-accent/60 bg-accent/5 text-accent dark:text-accent font-extrabold" : ""
                }`}
              >
                <Filter size={15} className={activeFilterCount > 0 ? "text-accent" : "text-slate-500"} />
                <span>{t.common.filter}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <Popover.Content
                placement="bottom start"
                className="w-80 p-0 rounded-2xl bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
              >
                <Popover.Dialog className="p-4 space-y-4 outline-none max-h-[80vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Filter size={15} className="text-accent" />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {t.common.filterTitle}
                      </span>
                      {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold text-[10px]">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      >
                        {t.common.filterReset}
                      </button>
                    )}
                  </div>

                  {/* Section 1: Trạng thái đơn */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                      {t.adminBookings.bookingStatus}
                    </span>
                    <div className="space-y-1">
                      {bookingStatusOptions.map(opt => (
                        <Checkbox
                          key={opt.key}
                          isSelected={selectedBookingStatuses.includes(opt.key)}
                          onChange={() => toggleBookingStatus(opt.key)}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>{opt.label}</span>
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Trạng thái thanh toán */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                      {t.adminBookings.paymentStatus}
                    </span>
                    <div className="space-y-1">
                      {paymentStatusOptions.map(opt => (
                        <Checkbox
                          key={opt.key}
                          isSelected={selectedPaymentStatuses.includes(opt.key)}
                          onChange={() => togglePaymentStatus(opt.key)}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>{opt.label}</span>
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Điều phối vận hành */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 block">
                      {t.adminBookings.dispatch}
                    </span>
                    <div className="space-y-1">
                      {dispatchOptions.map(opt => (
                        <Checkbox
                          key={opt.key}
                          isSelected={selectedDispatchFilters.includes(opt.key)}
                          onChange={() => toggleDispatchFilter(opt.key)}
                          className="w-full flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Checkbox.Content className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <span>{opt.label}</span>
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            {/* Sort Dropdown */}
            <Select
              selectedKey={sortOption}
              onSelectionChange={(key) => {
                if (key) setSortOption(key as string);
              }}
              className="w-48"
            >
              <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-bold flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown size={13} className="text-slate-400 shrink-0" />
                  <Select.Value />
                </div>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xl z-50">
                <ListBox>
                  <ListBox.Item id="date_desc" textValue="Mới nhất trước" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Mới nhất trước
                  </ListBox.Item>
                  <ListBox.Item id="date_asc" textValue="Cũ nhất trước" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Cũ nhất trước
                  </ListBox.Item>
                  <ListBox.Item id="amount_desc" textValue="Tổng tiền: Cao đến thấp" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Tổng tiền: Cao đến thấp
                  </ListBox.Item>
                  <ListBox.Item id="amount_asc" textValue="Tổng tiền: Thấp đến cao" className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-[var(--bg-elevated)]">
                    Tổng tiền: Thấp đến cao
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <PageSizeSelect
              value={pageSize}
              onChange={(size) => {
                setPageSize(size);
                setBookingPage(1);
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent cursor-pointer"
              onClick={fetchBookings}
            >
              <RefreshCw size={16} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {t.common.appliedFilters}:
            </span>
            {selectedBookingStatuses.map(st => {
              const opt = bookingStatusOptions.find(o => o.key === st);
              return (
                <span
                  key={`bs-${st}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span>{opt?.label || st}</span>
                  <button
                    type="button"
                    onClick={() => toggleBookingStatus(st)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
            {selectedPaymentStatuses.map(st => {
              const opt = paymentStatusOptions.find(o => o.key === st);
              return (
                <span
                  key={`ps-${st}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span>{opt?.label || st}</span>
                  <button
                    type="button"
                    onClick={() => togglePaymentStatus(st)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
            {selectedDispatchFilters.map(df => {
              const opt = dispatchOptions.find(o => o.key === df);
              return (
                <span
                  key={`df-${df}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <span>{opt?.label || df}</span>
                  <button
                    type="button"
                    onClick={() => toggleDispatchFilter(df)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-accent/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline transition-colors cursor-pointer ml-1"
            >
              {t.common.clearAll}
            </button>
          </div>
        )}
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-black rounded-2xl border border-separator shadow-sm overflow-hidden">
        {loading ? (
          <TableLoadingState message="Đang tải danh sách đơn đặt tour..." />
        ) : filteredBookings.length === 0 ? (
          <TableEmptyState
            icon={Calendar}
            title="Không tìm thấy đơn đặt nào"
            description="Không có đơn đặt tour nào khớp với bộ lọc tìm kiếm hiện tại."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý đơn đặt" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] border-b border-separator text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.bookings(t).map((col) => (
                      <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-separator">
                    {paginatedBookings.map((b) => {
                      const deposit = b.depositAmount ?? 0;
                      const received = b.receivedAmount ?? 0;
                      const paid = b.paidAmount ?? (deposit + received);
                      const remaining = b.remainingAmount ?? Math.max(0, b.totalAmount - paid);

                      return (
                        <Table.Row
                          key={b.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
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
                          <Table.Cell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {formatPrice(b.totalAmount)}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] mt-0.5">
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
                              <PaymentStatusChip status={b.paymentStatus} />
                              {(b.assignedDriver || b.assignedVehicle) && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col mt-0.5">
                                  {b.assignedDriver && <span>TX: <strong className="text-slate-700 dark:text-slate-300">{b.assignedDriver}</strong></span>}
                                  {b.assignedVehicle && <span className="font-mono text-primary font-bold">Xe: {b.assignedVehicle}</span>}
                                </div>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <StatusChip status={b.bookingStatus} type="booking" />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {formatDate(b.createdAt)}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <RowActionButtons
                              className="justify-end"
                              onView={() => {
                                setSelectedBooking(b);
                                setDetailsModalOpen(true);
                              }}
                              viewLabel="Xem chi tiết"
                              onEdit={() => {
                                setSelectedBooking(b);
                                setEditModalOpen(true);
                              }}
                              editLabel="Chỉnh sửa"
                              onDelete={() => {
                                setSelectedBooking(b);
                                setDeleteModalOpen(true);
                              }}
                              deleteLabel="Xóa"
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>
                    {bookingStart} - {bookingEnd} / {filteredBookings.length} kết quả
                  </Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={bookingPage <= 1}
                        onPress={() => setBookingPage((p) => Math.max(1, p - 1))}
                      >
                        <Pagination.PreviousIcon />
                        Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {bookingPages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link
                          isActive={p === bookingPage}
                          onPress={() => setBookingPage(p)}
                        >
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={bookingPage >= bookingPageCount}
                        onPress={() => setBookingPage((p) => Math.min(bookingPageCount, p + 1))}
                      >
                        Sau
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            </Table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <BookingDetailModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        language="vi"
        onEdit={() => {
          setDetailsModalOpen(false);
          setEditModalOpen(true);
        }}
        onStatusChanged={async () => {
          setDetailsModalOpen(false);
          setSelectedBooking(null);
          await fetchBookings();
        }}
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
