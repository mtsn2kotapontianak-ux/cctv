alter table public.cameras
add column if not exists snapshot_source_name text;

comment on column public.cameras.snapshot_source_name is
  'Optional go2rtc source name used only for JPEG snapshots, for example kamera_tes_snapshot.';
