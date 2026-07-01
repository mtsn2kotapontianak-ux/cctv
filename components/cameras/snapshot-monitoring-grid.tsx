"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSnapshotUrl } from "@/lib/go2rtc/urls";

export type SnapshotCamera = {
  id: string;
  nama_kamera: string;
  snapshot_source_name: string | null;
  source_name: string;
  tunnel_url: string;
  snapshot_url: string | null;
  deskripsi: string | null;
};

type SnapshotMonitoringGridProps = {
  cameras: SnapshotCamera[];
};

function appendQuery(url: string, values: Record<string, string | number>) {
  const separator = url.includes("?") ? "&" : "?";
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return `${url}${separator}${params.toString()}`;
}

function buildSnapshotUrl(camera: SnapshotCamera, timestamp: number, slot: number) {
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

export function SnapshotMonitoringGrid({ cameras }: SnapshotMonitoringGridProps) {
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [timestamp, setTimestamp] = useState(0);
  const [failedCameraIds, setFailedCameraIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const intervalMs = Math.max(intervalSeconds, 3) * 1000;
    setTimestamp(Date.now());
    setFailedCameraIds(new Set());

    const timerId = window.setInterval(() => {
      setTimestamp(Date.now());
      setFailedCameraIds(new Set());
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [intervalSeconds]);

  const cameraUrls = useMemo(
    () =>
      cameras.map((camera, index) => ({
        camera,
        url: buildSnapshotUrl(camera, timestamp, index)
      })),
    [cameras, timestamp]
  );

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div>
          <h2 className="font-semibold">Monitoring snapshot</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Mode hemat bandwidth, hanya memuat frame JPEG berkala.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          Refresh
          <input
            className="focus-ring w-24 rounded-md border border-[var(--border)] px-3 py-2"
            min={3}
            onChange={(event) => {
              const value = Number(event.target.value);
              setIntervalSeconds(Number.isFinite(value) ? Math.max(value, 3) : 10);
            }}
            step={1}
            type="number"
            value={intervalSeconds}
          />
          detik
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cameraUrls.map(({ camera, url }) => {
          const hasError = failedCameraIds.has(camera.id);

          return (
            <article
              className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm"
              key={camera.id}
            >
              <div className="relative aspect-video bg-black">
                <img
                  alt={`Snapshot ${camera.nama_kamera}`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    setFailedCameraIds((current) => new Set(current).add(camera.id));
                  }}
                  onLoad={() => {
                    setFailedCameraIds((current) => {
                      const next = new Set(current);
                      next.delete(camera.id);
                      return next;
                    });
                  }}
                  src={url}
                />
                {hasError ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/75 p-4 text-center text-sm font-semibold text-white">
                    Snapshot gagal dimuat
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{camera.nama_kamera}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{camera.source_name}</p>
                  </div>
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    Aktif
                  </span>
                </div>
                {camera.deskripsi ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{camera.deskripsi}</p>
                ) : null}
                <Link
                  className="focus-ring mt-4 inline-flex rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]"
                  href={`/admin/cameras/${camera.id}`}
                >
                  Buka live
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
