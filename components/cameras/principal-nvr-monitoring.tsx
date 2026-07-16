"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid,
  Layers,
  Maximize2,
  Monitor,
  PlayCircle,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  Video,
  X
} from "lucide-react";
import { getSnapshotUrl } from "@/lib/go2rtc/urls";
import { LiveCameraPlayer, type LiveCamera } from "@/components/cameras/live-camera-player";

export type PrincipalNvrCamera = LiveCamera & {
  snapshot_source_name?: string | null;
  snapshot_url?: string | null;
  class_names?: string[];
};

type PrincipalNvrMonitoringProps = {
  cameras: PrincipalNvrCamera[];
};

type GridMode = "2x2" | "3x3" | "4x4" | "all";

function appendQuery(url: string, values: Record<string, string | number>) {
  const separator = url.includes("?") ? "&" : "?";
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return `${url}${separator}${params.toString()}`;
}

function buildSnapshotUrl(camera: PrincipalNvrCamera, timestamp: number, slot: number) {
  if (camera.snapshot_url) {
    return appendQuery(camera.snapshot_url, {
      slot,
      t: timestamp
    });
  }

  return appendQuery(getSnapshotUrl(camera, timestamp), {
    slot
  });
}

export function PrincipalNvrMonitoring({ cameras }: PrincipalNvrMonitoringProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gridMode, setGridMode] = useState<GridMode>("3x3");
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [failedCameraIds, setFailedCameraIds] = useState<Set<string>>(() => new Set());
  const [liveCameraIds, setLiveCameraIds] = useState<Set<string>>(() => new Set());
  const [modalCamera, setModalCamera] = useState<PrincipalNvrCamera | null>(null);
  const [globalLiveMode, setGlobalLiveMode] = useState<boolean>(false);

  useEffect(() => {
    setTimestamp(Date.now());
    const intervalMs = Math.max(refreshInterval, 3) * 1000;
    const timerId = window.setInterval(() => {
      if (!globalLiveMode) {
        setTimestamp(Date.now());
      }
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [refreshInterval, globalLiveMode]);

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalCamera) {
        setModalCamera(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalCamera]);

  const filteredCameras = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cameras;
    return cameras.filter((cam) => {
      const matchName = cam.nama_kamera.toLowerCase().includes(q);
      const matchDesc = cam.deskripsi?.toLowerCase().includes(q) ?? false;
      const matchClass = cam.class_names?.some((cls) => cls.toLowerCase().includes(q)) ?? false;
      return matchName || matchDesc || matchClass;
    });
  }, [cameras, searchQuery]);

  const itemsPerPage = useMemo(() => {
    switch (gridMode) {
      case "2x2":
        return 4;
      case "3x3":
        return 9;
      case "4x4":
        return 16;
      case "all":
        return filteredCameras.length || 1;
    }
  }, [gridMode, filteredCameras.length]);

  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCameras = useMemo(() => {
    if (gridMode === "all") return filteredCameras;
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCameras.slice(start, start + itemsPerPage);
  }, [filteredCameras, gridMode, safeCurrentPage, itemsPerPage]);

  const gridClassName = useMemo(() => {
    switch (gridMode) {
      case "2x2":
        return "grid gap-4 sm:grid-cols-2";
      case "3x3":
        return "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
      case "4x4":
        return "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case "all":
        return "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    }
  }, [gridMode]);

  function toggleLiveTile(cameraId: string) {
    setLiveCameraIds((current) => {
      const next = new Set(current);
      if (next.has(cameraId)) {
        next.delete(cameraId);
      } else {
        next.add(cameraId);
      }
      return next;
    });
  }

  function handleManualRefresh() {
    setTimestamp(Date.now());
  }

  return (
    <div className="grid gap-6">
      {/* Top Command Bar */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-200">
              <Monitor aria-hidden="true" size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                  NVR Command Center • Akses Penuh Kepala Sekolah
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Monitoring NVR Semua Kamera ({cameras.length} CH)
              </h1>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setGlobalLiveMode((curr) => !curr)}
              type="button"
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition shadow-sm ${
                globalLiveMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Video aria-hidden="true" size={16} />
              {globalLiveMode ? "🔴 Stop Semua Live Stream" : "🟢 Putar Semua Live WebRTC"}
            </button>

            {!globalLiveMode && (
              <button
                onClick={handleManualRefresh}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                title="Refresh Snapshot Sekarang"
              >
                <RefreshCw aria-hidden="true" size={15} />
                Refresh Frame
              </button>
            )}
          </div>
        </div>

        {/* Filter & Layout Control Bar */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto] items-center">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kamera atau nama kelas (misal: Gerbang, 7A, 8B)..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition"
            />
          </div>

          {/* Grid Layout Selector */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <span className="px-2 text-xs font-semibold text-slate-500 hidden sm:inline">Grid:</span>
            <button
              onClick={() => { setGridMode("2x2"); setCurrentPage(1); }}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                gridMode === "2x2"
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2x2 (4 CH)
            </button>
            <button
              onClick={() => { setGridMode("3x3"); setCurrentPage(1); }}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                gridMode === "3x3"
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3x3 (9 CH)
            </button>
            <button
              onClick={() => { setGridMode("4x4"); setCurrentPage(1); }}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                gridMode === "4x4"
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              4x4 (16 CH)
            </button>
            <button
              onClick={() => { setGridMode("all"); setCurrentPage(1); }}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                gridMode === "all"
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua CH
            </button>
          </div>

          {/* Auto Refresh Speed */}
          {!globalLiveMode && (
            <div className="flex items-center gap-2">
              <label htmlFor="refresh-speed" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Refresh tiap:
              </label>
              <select
                id="refresh-speed"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-teal-500 focus:outline-none transition"
              >
                <option value={3}>3 Detik</option>
                <option value={5}>5 Detik</option>
                <option value={10}>10 Detik</option>
                <option value={30}>30 Detik</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Grid Status info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          Menampilkan <strong className="text-slate-900">{paginatedCameras.length}</strong> dari{" "}
          <strong className="text-slate-900">{filteredCameras.length}</strong> kamera
          {searchQuery ? ` (hasil pencarian "${searchQuery}")` : ""}
        </span>
        {globalLiveMode ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            <RadioTower aria-hidden="true" size={14} className="animate-pulse" />
            Mode Stream Live WebRTC Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
            <RadioTower aria-hidden="true" size={14} />
            Mode Snapshot NVR (Hemat Bandwidth)
          </span>
        )}
      </div>

      {/* Camera Grid Section */}
      {paginatedCameras.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="text-amber-500" size={36} />
          <h3 className="mt-4 font-bold text-slate-800 text-lg">Kamera Tidak Ditemukan</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            Tidak ada kamera CCTV yang cocok dengan kata kunci pencarian Anda. Coba reset pencarian atau periksa daftar kamera dari menu admin.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              type="button"
              className="mt-5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <section className={gridClassName}>
          {paginatedCameras.map((camera, index) => {
            const hasError = failedCameraIds.has(camera.id);
            const isLive = globalLiveMode || liveCameraIds.has(camera.id);
            const slotIndex = (safeCurrentPage - 1) * itemsPerPage + index + 1;
            const chLabel = `CH-${String(slotIndex).padStart(2, "0")}`;
            const classLabel = camera.class_names?.length
              ? `Kelas ${camera.class_names.join(", ")}`
              : "Area Umum / Sekolah";
            const snapshotUrl = buildSnapshotUrl(camera, timestamp, slotIndex);

            return (
              <article
                key={camera.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-teal-300 hover:shadow-md"
              >
                {/* Top Tile Header */}
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 text-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded bg-teal-600 px-1.5 py-0.5 text-[11px] font-mono font-bold tracking-tight">
                      {chLabel}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-100" title={camera.nama_kamera}>
                      {camera.nama_kamera}
                    </span>
                  </div>
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-950/80 px-2 py-0.5 text-[10px] font-bold text-green-400 ring-1 ring-green-500/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    LIVE
                  </span>
                </div>

                {/* Video/Snapshot Screen Area */}
                <div className="relative aspect-video bg-black flex-1 flex flex-col justify-center">
                  {isLive ? (
                    <div className="h-full w-full">
                      <LiveCameraPlayer camera={camera} />
                    </div>
                  ) : (
                    <>
                      <img
                        alt={`Snapshot ${camera.nama_kamera}`}
                        src={snapshotUrl}
                        loading="lazy"
                        onError={() => setFailedCameraIds((curr) => new Set(curr).add(camera.id))}
                        onLoad={() => {
                          setFailedCameraIds((curr) => {
                            if (!curr.has(camera.id)) return curr;
                            const next = new Set(curr);
                            next.delete(camera.id);
                            return next;
                          });
                        }}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                      />
                      {hasError ? (
                        <div className="absolute inset-0 grid place-items-center bg-black/85 p-4 text-center text-xs font-semibold text-white">
                          <span className="grid justify-items-center gap-1.5">
                            <AlertTriangle className="text-amber-400" size={20} />
                            <span>Snapshot belum tersedia / Offline</span>
                            <span className="text-[10px] text-slate-400 font-normal">Periksa koneksi Go2RTC</span>
                          </span>
                        </div>
                      ) : null}

                      {/* Hover Overlay Buttons */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModalCamera(camera)}
                            type="button"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-teal-500 transition"
                          >
                            <Maximize2 size={13} />
                            Perbesar Live Full
                          </button>
                          <button
                            onClick={() => toggleLiveTile(camera.id)}
                            type="button"
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-800/90 px-2.5 py-2 text-xs font-semibold text-white ring-1 ring-slate-600 hover:bg-slate-700 transition"
                            title="Putar stream live di dalam grid ini"
                          >
                            <Video size={13} />
                            Live Tile
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Info Bar */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate" title={classLabel}>
                      📍 {classLabel}
                    </span>
                    {!globalLiveMode && (
                      <button
                        onClick={() => toggleLiveTile(camera.id)}
                        type="button"
                        className={`text-[11px] font-bold underline transition ${
                          isLive ? "text-red-600 hover:text-red-700" : "text-teal-700 hover:text-teal-800"
                        }`}
                      >
                        {isLive ? "Stop Live Tile" : "Putar Live"}
                      </button>
                    )}
                  </div>
                  {camera.deskripsi && (
                    <p className="text-[11px] text-slate-500 line-clamp-1" title={camera.deskripsi}>
                      {camera.deskripsi}
                    </p>
                  )}
                  <button
                    onClick={() => setModalCamera(camera)}
                    type="button"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye size={14} className="text-teal-600" />
                    Fokus Layar Penuh
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Pagination Controls */}
      {gridMode !== "all" && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Halaman <strong className="text-slate-900">{safeCurrentPage}</strong> dari{" "}
            <strong className="text-slate-900">{totalPages}</strong> ({itemsPerPage} CH per halaman)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition"
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Focus Live Modal */}
      {modalCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 lg:p-10 animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600/20 text-teal-400 ring-1 ring-teal-500/30 font-mono font-bold text-sm">
                  CH
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {modalCamera.nama_kamera}
                    <span className="rounded-full bg-green-900/60 px-2 py-0.5 text-xs font-semibold text-green-400 ring-1 ring-green-500/40">
                      LIVE NVR STREAM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalCamera.class_names?.length
                      ? `Dipetakan untuk Kelas: ${modalCamera.class_names.join(", ")}`
                      : "Area Umum / Sekolah"}{" "}
                    • Source: <code>{modalCamera.source_name}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCamera(null)}
                type="button"
                className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-red-600 hover:text-white transition"
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Video Player */}
            <div className="flex-1 bg-black overflow-hidden flex items-center justify-center">
              <div className="w-full h-full">
                <LiveCameraPlayer camera={modalCamera} />
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="flex flex-wrap items-center justify-between bg-slate-950 px-6 py-3.5 text-xs text-slate-400 border-t border-slate-800">
              <span>💡 Gunakan tombol opsi di dalam video player untuk memilih mode WebRTC atau HLS.</span>
              <button
                onClick={() => setModalCamera(null)}
                type="button"
                className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-700 transition"
              >
                ✕ Tutup Layar Penuh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
