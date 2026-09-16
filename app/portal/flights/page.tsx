"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Plane,
  AlertCircle,
  RotateCw,
  Radio,
} from "lucide-react";
import { Button, Input, Table, toast, Pagination } from "@heroui/react";
import {
  trackFlight,
  trackFlightOpenSky,
  getFlightTrackingHistory,
  type FlightTracking,
  type OpenSkyFlightState,
} from "@/lib/api/bookings";
import PageSizeSelect from "@/components/common/PageSizeSelect";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

const SOURCE_KEY = "flight_tracking_source";

type FlightSource = "aviationstack" | "opensky";

export default function FlightTrackingPage() {
  const { t } = useI18n();
  const [source, setSource] = useState<FlightSource>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(SOURCE_KEY) as FlightSource) || "aviationstack";
    }
    return "aviationstack";
  });

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [aviationResult, setAviationResult] = useState<FlightTracking | null>(null);
  const [openSkyResults, setOpenSkyResults] = useState<OpenSkyFlightState[]>([]);

  const [history, setHistory] = useState<FlightTracking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") toast.success(message);
    else toast.danger(message);
  };

  const switchSource = useCallback((s: FlightSource) => {
    setSource(s);
    localStorage.setItem(SOURCE_KEY, s);
    setQuery("");
    setAviationResult(null);
    setOpenSkyResults([]);
    setSearchError("");
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getFlightTrackingHistory();
      setHistory(data);
    } catch {
      showToast("Lỗi kết nối với API", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTrack = async () => {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setAviationResult(null);
    setOpenSkyResults([]);
    setSearchError("");

    try {
      if (source === "aviationstack") {
        const result = await trackFlight(q);
        setAviationResult(result);
        fetchHistory();
      } else {
        const results = await trackFlightOpenSky(q);
        setOpenSkyResults(results);
        if (results.length === 0) {
          setSearchError(`Không tìm thấy chuyến bay nào đang hoạt động với callsign "${q.toUpperCase()}" trên OpenSky.`);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Không thể tra cứu. Vui lòng thử lại sau.";
      setSearchError(msg);
      showToast(msg, "error");
    } finally {
      setSearching(false);
    }
  };

  const filteredHistory = history.filter((f) =>
    f.flightNumber.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setHistoryPage(1);
  }, [query]);

  const paginatedHistory = useMemo(
    () =>
      filteredHistory.slice(
        (historyPage - 1) * pageSize,
        historyPage * pageSize
      ),
    [filteredHistory, historyPage, pageSize]
  );

  const historyPageCount = Math.max(
    1,
    Math.ceil(filteredHistory.length / pageSize)
  );
  const historyPages = Array.from(
    { length: historyPageCount },
    (_, i) => i + 1
  );
  const historyStart =
    filteredHistory.length === 0
      ? 0
      : (historyPage - 1) * pageSize + 1;
  const historyEnd = Math.min(
    historyPage * pageSize,
    filteredHistory.length
  );

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatUnixTime = (ts?: number | null) => {
    if (ts == null) return "-";
    try {
      return new Date(ts * 1000).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const statusColor = (status?: string) => {
    if (!status) return "text-slate-400";
    const s = status.toLowerCase();
    if (s.includes("arrived") || s.includes("landed"))
      return "text-emerald-600 dark:text-emerald-400";
    if (s.includes("delay")) return "text-amber-600 dark:text-amber-400";
    if (s.includes("cancel")) return "text-red-600 dark:text-red-400";
    if (s.includes("scheduled") || s.includes("active"))
      return "text-blue-600 dark:text-blue-400";
    return "text-slate-600 dark:text-slate-400";
  };

  const velocityKmh = (ms?: number | null) => {
    if (ms == null) return null;
    return Math.round(ms * 3.6);
  };

  const altitudeMToFt = (m?: number | null) => {
    if (m == null) return null;
    return Math.round(m * 3.28084);
  };

  return (
    <div className="w-full space-y-6">
      {/* Source Toggle */}
      <div className="flex items-center gap-2 bg-white dark:bg-[var(--bg-card)] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
        <button
          onClick={() => switchSource("aviationstack")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            source === "aviationstack"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Plane size={14} className="inline mr-1.5" />
          Aviationstack
        </button>
        <button
          onClick={() => switchSource("opensky")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            source === "opensky"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Radio size={14} className="inline mr-1.5" />
          OpenSky
        </button>
      </div>

      {/* Search Section */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-[var(--bg-card)] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-4xl">
          <div className="relative flex-grow min-w-[240px]">
            {source === "aviationstack" ? (
              <Plane className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            ) : (
              <Radio className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            )}
            <Input
              type="text"
              placeholder={
                source === "aviationstack"
                  ? "Nhập số hiệu chuyến bay (e.g., VN123, VJ301)..."
                  : "Nhập số hiệu (callsign) (e.g., VN123, VJ301)..."
              }
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-surface)] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleTrack(); }}
            />
          </div>
          <Button
            className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
            onPress={handleTrack}
            isDisabled={searching || !query.trim()}
          >
            {searching ? (
              <RotateCw size={16} className="animate-spin mr-1.5" />
            ) : (
              <Search size={16} className="mr-1.5" />
            )}
            Tra cứu
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onPress={fetchHistory}
          >
            <RefreshCw size={16} className="mr-1.5" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Aviationstack Result Card */}
      {source === "aviationstack" && aviationResult && (
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Plane size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {aviationResult.flightNumber}
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {aviationResult.airlineName}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${statusColor(aviationResult.status)} bg-slate-100 dark:bg-[var(--bg-card)]`}
              >
                {aviationResult.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khởi hành</span>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{aviationResult.departureAirport || "-"}</span>
                <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{formatTime(aviationResult.scheduledDeparture)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đến</span>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{aviationResult.arrivalAirport || "-"}</span>
                <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{formatTime(aviationResult.scheduledArrival)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ thực tế đi</span>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{formatTime(aviationResult.actualDeparture)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giờ thực tế đến</span>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{formatTime(aviationResult.actualArrival)}</span>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 font-semibold">
              Tra cứu lúc: {formatDateTime(aviationResult.lastCheckedAt)}
            </div>
          </div>
        </div>
      )}

      {/* OpenSky Results List */}
      {source === "opensky" && openSkyResults.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500">
            Tìm thấy {openSkyResults.length} kết quả cho "{query.trim().toUpperCase()}"
          </p>
          {openSkyResults.map((s, i) => (
            <div key={`${s.icao24}-${i}`} className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                      <Radio size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-mono">
                        {s.callsign}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400">
                        ICAO: {s.icao24} &middot; {s.originCountry}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${s.onGround ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} bg-slate-100 dark:bg-[var(--bg-card)]`}>
                    {s.onGround ? "Đang đỗ" : "Đang bay"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vĩ độ</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{s.latitude?.toFixed(4) ?? "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kinh độ</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{s.longitude?.toFixed(4) ?? "-"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Độ cao</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {(() => {
                        const alt = altitudeMToFt(s.barometricAltitude);
                        return alt != null ? `${alt.toLocaleString()} ft` : "-";
                      })()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tốc độ</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {(() => {
                        const v = velocityKmh(s.velocity);
                        return v != null ? `${v} km/h` : "-";
                      })()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hướng</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {s.trueTrack != null ? `${s.trueTrack}°` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vận tốc đứng</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {s.verticalRate != null ? `${Math.round(s.verticalRate)} m/s` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cập nhật</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {formatUnixTime(s.lastContact)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-[var(--bg-page)] rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí lần cuối</span>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {s.timePosition != null ? formatUnixTime(s.timePosition) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Tra cứu thất bại</p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">{searchError}</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Lịch sử tra cứu</h3>
          <PageSizeSelect
            value={pageSize}
            onChange={(val) => {
              setPageSize(val);
              setHistoryPage(1);
            }}
          />
        </div>
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RotateCw className="animate-spin text-primary" size={28} />
            <p className="text-sm font-bold text-slate-500">Đang tải lịch sử tra cứu...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Plane className="text-slate-300 dark:text-slate-700 mb-4" size={40} />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Chưa có lịch sử tra cứu</h3>
            <p className="text-xs text-slate-500 max-w-sm">Nhập số hiệu chuyến bay để tra cứu thông tin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Lịch sử tra cứu chuyến bay" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-[var(--bg-muted)] border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.flights(t).map((col) => (
                      <Table.Column key={col.id} id={col.id} isRowHeader={col.isRowHeader} className={col.className}>
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedHistory.map((f) => (
                      <Table.Row
                        key={f.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                      >
                        <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-slate-100 font-bold">{f.flightNumber}</Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{f.airlineName || "-"}</Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-350">{f.departureAirport || "?"} → {f.arrivalAirport || "?"}</Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs text-slate-500">{formatDateTime(f.scheduledDeparture)}</Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <span className={`text-xs font-extrabold ${statusColor(f.status)}`}>{f.status || "-"}</span>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-xs text-slate-400">{formatDateTime(f.lastCheckedAt)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>
                <Pagination size="sm">
                  <Pagination.Summary>{historyStart} - {historyEnd} / {filteredHistory.length} kết quả</Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous isDisabled={historyPage <= 1} onPress={() => setHistoryPage((p) => Math.max(1, p - 1))}>
                        <Pagination.PreviousIcon /> Trước
                      </Pagination.Previous>
                    </Pagination.Item>
                    {historyPages.map((p) => (
                      <Pagination.Item key={p}>
                        <Pagination.Link isActive={p === historyPage} onPress={() => setHistoryPage(p)}>{p}</Pagination.Link>
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next isDisabled={historyPage >= historyPageCount} onPress={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))}>
                        Sau <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </Table.Footer>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
