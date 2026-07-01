export type CameraStreamSource = {
  snapshot_source_name?: string | null;
  source_name: string;
  tunnel_url: string;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function getBaseUrl(camera: CameraStreamSource) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_GO2RTC_PUBLIC_BASE_URL;

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  try {
    return new URL(camera.tunnel_url).origin;
  } catch {
    return "";
  }
}

export function getWebRtcUrl(camera: CameraStreamSource) {
  if (camera.tunnel_url) {
    return camera.tunnel_url;
  }

  const baseUrl = getBaseUrl(camera);
  const params = new URLSearchParams({ src: camera.source_name });

  return `${baseUrl}/stream.html?${params.toString()}`;
}

export function getHlsUrl(camera: CameraStreamSource) {
  const baseUrl = getBaseUrl(camera);
  const params = new URLSearchParams({ src: camera.source_name });

  return `${baseUrl}/api/stream.m3u8?${params.toString()}`;
}

export function getSnapshotUrl(camera: CameraStreamSource, timestamp?: number) {
  const baseUrl = getBaseUrl(camera);
  const params = new URLSearchParams({ src: camera.snapshot_source_name || camera.source_name });

  if (timestamp) {
    params.set("t", String(timestamp));
  }

  return `${baseUrl}/api/frame.jpeg?${params.toString()}`;
}
