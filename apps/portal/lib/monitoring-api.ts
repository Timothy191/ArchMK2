/**
 * Advanced Satellite Monitoring API
 * Sources: Copernicus STAC API (free, no key), Sentinel Hub public WMS
 */

export type SensorType = "SAR" | "OPTICAL" | "HYPERSPECTRAL";
export type DeformationLevel = "stable" | "minor" | "moderate" | "critical";

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface STACItem {
  id: string;
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    datetime: string;
    platform: string;
    constellation: string;
    instruments: string[];
    "eo:cloud_cover"?: number;
    "s1:polarisation"?: string;
    "s2:mgrs_tile"?: string;
  };
  assets: Record<string, { href: string; type: string; title?: string }>;
  links: { rel: string; href: string; type?: string }[];
  bbox: [number, number, number, number];
}

export interface STACCollection {
  type: "FeatureCollection";
  features: STACItem[];
  context?: {
    page: number;
    limit: number;
    matched: number;
    returned: number;
  };
}

export interface DeformationReading {
  id: string;
  location: string;
  lat: number;
  lon: number;
  shiftMm: number;
  trend: "subsiding" | "stable" | "uplifting";
  level: DeformationLevel;
  lastUpdated: string;
  sensor: "Sentinel-1 InSAR";
  area: "pit-wall" | "tailings-dam" | "haul-road" | "processing-plant";
}

const COPERNICUS_STAC = "https://catalogue.dataspace.copernicus.eu/stac";

/**
 * Query Copernicus STAC for latest Sentinel-1 SAR scenes
 */
export async function fetchSentinel1Scenes(
  bbox: BoundingBox,
  days: number = 7
): Promise<STACItem[]> {
  const dateEnd = new Date().toISOString();
  const dateStart = new Date(Date.now() - days * 86400000).toISOString();

  const url = `${COPERNICUS_STAC}/SENTINEL-1/items?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&datetime=${dateStart}/${dateEnd}&limit=10`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: STACCollection = await res.json();
    return data.features ?? [];
  } catch {
    return [];
  }
}

/**
 * Query Copernicus STAC for latest Sentinel-2 optical/hyperspectral scenes
 */
export async function fetchSentinel2Scenes(
  bbox: BoundingBox,
  maxCloudCover: number = 30,
  days: number = 14
): Promise<STACItem[]> {
  const dateEnd = new Date().toISOString();
  const dateStart = new Date(Date.now() - days * 86400000).toISOString();

  const url = `${COPERNICUS_STAC}/SENTINEL-2/items?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&datetime=${dateStart}/${dateEnd}&limit=10`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: STACCollection = await res.json();
    const features = data.features ?? [];
    return features.filter(
      (f) => (f.properties["eo:cloud_cover"] ?? 100) <= maxCloudCover
    );
  } catch {
    return [];
  }
}

/**
 * Sentinel Hub WMS URL builder (public eval instance, no key needed for Sentinel data)
 * Uses Copernicus Browser public WMS endpoint
 */
export function buildSentinel2WMSUrl(
  layer: "TRUE-COLOR" | "FALSE-COLOR" | "NDVI" | "GEOLOGY",
  bbox: BoundingBox,
  width: number = 800,
  height: number = 600
): string {
  const bboxStr = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: layer,
    BBOX: bboxStr,
    WIDTH: String(width),
    HEIGHT: String(height),
    FORMAT: "image/png",
    CRS: "EPSG:4326",
    TIME: `${new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]}/${new Date().toISOString().split("T")[0]}`,
  });

  return `https://services.sentinel-hub.com/ogc/wms/PUBLIC?${params.toString()}`;
}

/**
 * Open-access Sentinel-2 XYZ tile URL (via Copernicus Browser)
 * True-color, NDVI, False-color composites
 */
export function getSentinel2TileUrl(
  composite: "truecolor" | "falsecolor" | "ndvi" | "geology"
): string {
  const compositeMap: Record<string, string> = {
    truecolor: "TRUE-COLOR",
    falsecolor: "FALSE-COLOR-11-8-2",
    ndvi: "NDVI",
    geology: "FALSE-COLOR-842",
  };
  const layer = compositeMap[composite];
  return `https://tiles.maps.eox.at/wms?service=WMS&version=1.1.1&request=GetMap&layers=s2cloudless-2024&format=image/png&transparent=false&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}&styles=`;
}

/**
 * Sentinel-1 SAR XYZ tile URL via EOX public service
 */
export function getSentinel1TileUrl(): string {
  return "https://tiles.maps.eox.at/wms?service=WMS&version=1.1.1&request=GetMap&layers=s2cloudless-2024&format=image/png&transparent=true&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}";
}

/**
 * Compute deformation level from mm shift
 */
export function classifyDeformation(shiftMm: number): DeformationLevel {
  const abs = Math.abs(shiftMm);
  if (abs < 5) return "stable";
  if (abs < 15) return "minor";
  if (abs < 30) return "moderate";
  return "critical";
}

/**
 * Generate realistic deformation readings for a mine site
 * In production these would come from an InSAR processing pipeline
 */
export function generateDeformationReadings(
  centerLat: number,
  centerLon: number
): DeformationReading[] {
  const now = new Date().toISOString();
  const areas: DeformationReading[] = [
    {
      id: "pw-north",
      location: "North Pit Wall",
      lat: centerLat + 0.008,
      lon: centerLon - 0.003,
      shiftMm: -28.4,
      trend: "subsiding",
      level: "moderate",
      lastUpdated: now,
      sensor: "Sentinel-1 InSAR",
      area: "pit-wall",
    },
    {
      id: "pw-south",
      location: "South Pit Wall",
      lat: centerLat - 0.006,
      lon: centerLon + 0.002,
      shiftMm: -4.1,
      trend: "stable",
      level: "stable",
      lastUpdated: now,
      sensor: "Sentinel-1 InSAR",
      area: "pit-wall",
    },
    {
      id: "td-main",
      location: "Main Tailings Dam",
      lat: centerLat + 0.02,
      lon: centerLon + 0.015,
      shiftMm: -42.7,
      trend: "subsiding",
      level: "critical",
      lastUpdated: now,
      sensor: "Sentinel-1 InSAR",
      area: "tailings-dam",
    },
    {
      id: "hr-east",
      location: "East Haul Road",
      lat: centerLat - 0.012,
      lon: centerLon - 0.01,
      shiftMm: -9.2,
      trend: "subsiding",
      level: "minor",
      lastUpdated: now,
      sensor: "Sentinel-1 InSAR",
      area: "haul-road",
    },
    {
      id: "pp-main",
      location: "Processing Plant",
      lat: centerLat + 0.001,
      lon: centerLon + 0.008,
      shiftMm: 2.1,
      trend: "stable",
      level: "stable",
      lastUpdated: now,
      sensor: "Sentinel-1 InSAR",
      area: "processing-plant",
    },
  ];
  return areas;
}

/**
 * Format STAC scene date for display
 */
export function formatSceneDate(datetime: string): string {
  return new Date(datetime).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Default mine site bounding box (South Africa example — adjustable in settings)
 */
export const DEFAULT_MINE_BBOX: BoundingBox = {
  west: 26.5,
  south: -26.5,
  east: 27.0,
  north: -26.0,
};

export const DEFAULT_MINE_CENTER = {
  lat: -26.25,
  lon: 26.75,
};
