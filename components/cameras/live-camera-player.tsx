"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { getHlsUrl, getWebRtcUrl } from "@/lib/go2rtc/urls";

export type LiveCamera = {
  id: string;
  nama_kamera: string;
  source_name: string;
  tunnel_url: string;
  deskripsi: string | null;
  is_active: boolean;
};

type LiveCameraPlayerProps = {
  camera: LiveCamera;
};

type PlayerMode = "webrtc" | "hls";

export function LiveCameraPlayer({ camera }: LiveCameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<PlayerMode>("webrtc");
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webRtcUrl = useMemo(() => getWebRtcUrl(camera), [camera]);
  const hlsUrl = useMemo(() => getHlsUrl(camera), [camera]);

  useEffect(() => {
    if (mode !== "webrtc") {
      return;
    }

    setIsLoading(true);
    setError(null);

    const hideLoadingId = window.setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => window.clearTimeout(hideLoadingId);
  }, [attempt, mode]);

  useEffect(() => {
    if (mode !== "hls") {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    setIsLoading(true);
    setError(null);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return;
    }

    if (!Hls.isSupported()) {
      setIsLoading(false);
      setError("Browser tidak mendukung HLS fallback.");
      return;
    }

    const hls = new Hls({
      lowLatencyMode: true
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setIsLoading(false);
        setError("Stream HLS gagal dimuat.");
        hls.destroy();
      }
    });

    return () => hls.destroy();
  }, [attempt, hlsUrl, mode]);

  function retry() {
    setMode("webrtc");
    setError(null);
    setIsLoading(true);
    setAttempt((current) => current + 1);
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{camera.nama_kamera}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{camera.source_name}</p>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              camera.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-[var(--danger)]"
            }`}
          >
            {camera.is_active ? "Aktif" : "Nonaktif"}
          </span>
        </div>
        {camera.deskripsi ? (
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{camera.deskripsi}</p>
        ) : null}
      </div>

      <div className="relative aspect-video bg-black">
        {mode === "webrtc" ? (
          <iframe
            className="h-full w-full"
            key={`${webRtcUrl}-${attempt}`}
            onError={(event) => {
              event.preventDefault();
              setIsLoading(false);
              setError("WebRTC gagal dimuat.");
            }}
            onLoad={() => setIsLoading(false)}
            src={webRtcUrl}
            title={`Live ${camera.nama_kamera}`}
          />
        ) : (
          <video
            autoPlay
            className="h-full w-full"
            controls
            muted
            onCanPlay={() => setIsLoading(false)}
            onError={(event) => {
              event.preventDefault();
              setIsLoading(false);
              setError("Stream gagal dimuat.");
            }}
            playsInline
            ref={videoRef}
          />
        )}

        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white">
            Memuat {mode === "webrtc" ? "WebRTC" : "HLS"}...
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-0 grid place-items-center bg-black/80 p-4 text-center text-white">
            <div>
              <p className="font-semibold">{error}</p>
              <button
                className="focus-ring mt-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black"
                onClick={retry}
                type="button"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
        <span>Mode: {mode === "webrtc" ? "WebRTC" : "HLS fallback"}</span>
        {mode === "webrtc" ? (
          <button
            className="font-semibold text-[var(--primary)]"
            onClick={() => setMode("hls")}
            type="button"
          >
            Pakai HLS
          </button>
        ) : (
          <button className="font-semibold text-[var(--primary)]" onClick={retry} type="button">
            Coba WebRTC
          </button>
        )}
      </div>
    </article>
  );
}
