"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, PlayCircle, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSnapshotUrl } from "@/lib/go2rtc/urls";
import type { SnapshotCamera } from "@/components/cameras/snapshot-monitoring-grid";

type ParentSnapshotCamera = SnapshotCamera & {
  class_ids?: string[];
  class_names?: string[];
};

type ParentSnapshotGridProps = {
  cameras: ParentSnapshotCamera[];
  density?: "standard" | "compact" | "dashboard";
  maxItems?: number;
};

function appendQuery(url: string, values: Record<string, string | number>) {
  const separator = url.includes("?") ? "&" : "?";
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return `${url}${separator}${params.toString()}`;
}

function buildSnapshotUrl(camera: ParentSnapshotCamera, timestamp: number, slot: number) {
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

export function ParentSnapshotGrid({
  cameras,
  density = "standard",
  maxItems
}: ParentSnapshotGridProps) {
  const [timestamp, setTimestamp] = useState(0);
  const [failedCameraIds, setFailedCameraIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTimestamp(Date.now());
    const timerId = window.setInterval(() => {
      setTimestamp(Date.now());
      setFailedCameraIds(new Set());
    }, 15000);

    return () => window.clearInterval(timerId);
  }, []);

  const cameraUrls = useMemo(() => {
    const visibleCameras = typeof maxItems === "number" ? cameras.slice(0, maxItems) : cameras;

    return visibleCameras.map((camera, index) => ({
      camera,
      url: buildSnapshotUrl(camera, timestamp, index)
    }));
  }, [cameras, maxItems, timestamp]);
  const gridClassName = {
    compact: "grid gap-4 md:grid-cols-2",
    dashboard: "grid gap-4 sm:grid-cols-2",
    standard: "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
  }[density];

  return (
    <section className={gridClassName}>
      {cameraUrls.map(({ camera, url }) => {
        const hasError = failedCameraIds.has(camera.id);
        const primaryClassId = camera.class_ids?.[0];
        const classLabel = camera.class_names?.length
          ? camera.class_names.join(", ")
          : camera.source_name;

        return (
          <article
            className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:border-teal-200 hover:shadow-md"
            key={camera.id}
          >
            <div className="relative aspect-video bg-black">
              <img
                alt={`Snapshot ${camera.nama_kamera}`}
                className="h-full w-full object-cover"
                onError={() => setFailedCameraIds((current) => new Set(current).add(camera.id))}
                onLoad={() => {
                  setFailedCameraIds((current) => {
                    const next = new Set(current);
                    next.delete(camera.id);
                    return next;
                  });
                }}
                src={url}
              />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <RadioTower aria-hidden="true" size={14} />
                Snapshot
              </div>
              {hasError ? (
                <div className="absolute inset-0 grid place-items-center bg-black/80 p-5 text-center text-sm font-semibold text-white">
                  <span className="grid justify-items-center gap-2">
                    <AlertTriangle aria-hidden="true" size={22} />
                    Snapshot belum tersedia
                  </span>
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{camera.nama_kamera}</h3>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{classLabel}</p>
                </div>
                <span className="shrink-0 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">
                  Aktif
                </span>
              </div>
              {camera.deskripsi ? (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                  {camera.deskripsi}
                </p>
              ) : null}
              {primaryClassId ? (
                <Link
                  className="btn-primary focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--primary-strong)]"
                  href={`/parent/classes/${primaryClassId}`}
                >
                  <PlayCircle aria-hidden="true" size={17} />
                  Buka live
                  <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
