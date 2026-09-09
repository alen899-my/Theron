<template>
  <div class="lead-map-wrap" :class="{ 'lead-map-wrap--expanded': isExpanded }">
    <!-- Map Canvas Container (Full Bleed - No Card Header) -->
    <div class="map-viewport">
      <div ref="mapEl" class="map-canvas" />



      <!-- Floating Interactive Lead Card (Mobbin-style) -->
      <Transition name="card-pop">
        <div v-if="activeLead" class="floating-lead-card">
          <!-- Card Image Header -->
          <div class="card-img-header">
            <img
              v-if="activeLead.images?.[0]"
              :src="activeLead.images[0]"
              :alt="activeLead.name"
              class="card-img"
              loading="lazy"
            />
            <div v-else class="card-img-placeholder">
              <MapPin class="w-6 h-6 text-muted-foreground opacity-50" />
            </div>
            <div class="card-img-gradient" />

            <!-- Category & Index Badges -->
            <div class="card-header-badges">
              <span class="badge-idx">#{{ activeLead.position || '—' }}</span>
              <span class="badge-cat" v-if="activeLead.category">{{ activeLead.category }}</span>
            </div>

            <!-- Close Button -->
            <button class="card-close-btn" @click="closeLeadCard" title="Close">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <div class="card-title-row">
              <h3 class="card-name" :title="activeLead.name">{{ activeLead.name }}</h3>
              <div v-if="activeLead.rating" class="card-rating">
                <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
                <span class="font-semibold">{{ activeLead.rating }}</span>
                <span v-if="activeLead.reviewCount" class="text-muted-foreground text-[10px]">
                  ({{ activeLead.reviewCount }})
                </span>
              </div>
            </div>

            <p v-if="activeLead.address" class="card-address">
              {{ activeLead.address }}
            </p>

            <!-- Quick Action Links -->
            <div class="card-actions">
              <a
                v-if="activeLead.mapsUrl"
                :href="activeLead.mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="act-btn act-btn--maps"
              >
                <MapPin class="w-3 h-3 text-red-400" />
                <span>Google Maps</span>
                <ExternalLink class="w-2.5 h-2.5 opacity-60" />
              </a>

              <a
                v-if="activeLead.website"
                :href="formatUrl(activeLead.website)"
                target="_blank"
                rel="noopener noreferrer"
                class="act-btn act-btn--web"
              >
                <Globe class="w-3 h-3 text-sky-400" />
                <span class="truncate max-w-[90px]">Website</span>
                <ExternalLink class="w-2.5 h-2.5 opacity-60" />
              </a>

              <a
                v-if="activeLead.phone"
                :href="'tel:' + activeLead.phone"
                class="act-btn act-btn--phone"
              >
                <Phone class="w-3 h-3 text-emerald-400" />
                <span class="truncate max-w-[100px]">{{ activeLead.phone }}</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  Layers,
  Maximize2,
  Minimize2,
  MapPin,
  ExternalLink,
  Phone,
  Globe,
  Star,
  X,
  Radio
} from "lucide-vue-next";
import "leaflet/dist/leaflet.css";

const props = defineProps({
  leads: { type: Array, default: () => [] },
  isRunning: { type: Boolean, default: false },
  jobId: { type: String, default: "" },
  searchQuery: { type: String, default: "" }
});

const emit = defineEmits(["select-lead"]);

const mapEl = ref(null);
let L = null;
let map = null;
let currentTileLayer = null;
const markersMap = new Map(); // id -> L.Marker
let resizeObserver = null;

const isExpanded = ref(false);
const selectedCategory = ref("all");
const activeLead = ref(null);

// ── Satellite Tile Provider (100% Free & High-Resolution) ──
const SATELLITE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_TILE_OPTIONS = {
  maxZoom: 19,
  attribution: "&copy; <a href='https://www.esri.com' target='_blank'>Esri</a>, Maxar, Earthstar Geographics"
};

// ── Validate coordinates ─────────────────────────────────
function isValidCoord(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

// ── Mappable leads ───────────────────────────────────────
const mappable = computed(() => {
  return props.leads.filter((l) => isValidCoord(l.latitude, l.longitude));
});

// ── Filtered leads by category ───────────────────────────
const displayedLeads = computed(() => {
  if (selectedCategory.value === "all") return mappable.value;
  return mappable.value.filter((l) => (l.category || "Other") === selectedCategory.value);
});

// ── Category colors & palette ────────────────────────────
const CATEGORY_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#84cc16"  // lime
];

const categoryColorCache = new Map();
let colorIdx = 0;
function getCategoryColor(cat) {
  const key = (cat || "Other").trim().toLowerCase();
  if (!categoryColorCache.has(key)) {
    categoryColorCache.set(key, CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length]);
    colorIdx++;
  }
  return categoryColorCache.get(key);
}

// ── Categories List for Filters ──────────────────────────
const categories = computed(() => {
  const counts = new Map();
  for (const l of mappable.value) {
    const cat = l.category || "Other";
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({
    name,
    count,
    color: getCategoryColor(name)
  }));
});

// ── Custom Leaflet HTML Pin Icon ─────────────────────────
function makePinIcon(lead, idx, isSelected) {
  const color = getCategoryColor(lead.category);
  const position = lead.position || idx + 1;

  const html = `
    <div class="lead-pin ${isSelected ? 'lead-pin--selected' : ''}" style="--pin-color: ${color}">
      <div class="pin-pulse"></div>
      <div class="pin-marker">
        <svg class="pin-svg" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 9.334 14 20 14 20s14-10.666 14-20C28 6.268 21.732 0 14 0z" fill="${color}"/>
          <circle cx="14" cy="14" r="7" fill="#ffffff"/>
          <text x="14" y="17.5" text-anchor="middle" font-size="9" font-weight="800" fill="${color}" font-family="monospace">
            ${position}
          </text>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "lead-leaflet-icon-wrapper",
    html,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    tooltipAnchor: [0, -34]
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function onPinClick(lead) {
  activeLead.value = lead;
  emit("select-lead", lead);
  if (map) {
    map.setView([lead.latitude, lead.longitude], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.6
    });
  }
}

function closeLeadCard() {
  activeLead.value = null;
}

function selectCategory(cat) {
  selectedCategory.value = cat;
  syncMarkers();
  nextTick(() => {
    fitBounds();
  });
}

function formatUrl(url) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// ── Initialize Map with Leaflet ──────────────────────────
async function initMap() {
  if (!mapEl.value) return;

  try {
    const leafletModule = await import("leaflet");
    L = leafletModule.default || leafletModule;

    map = L.map(mapEl.value, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false
    });

    // Custom positioned zoom and attribution
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    // Set satellite tile layer
    L.tileLayer(SATELLITE_TILE_URL, SATELLITE_TILE_OPTIONS).addTo(map);

    // Map click outside pins deselects active card
    map.on("click", (e) => {
      if (!e.originalEvent?.target?.closest(".lead-pin")) {
        closeLeadCard();
      }
    });

    // Ensure map computes proper container size
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        syncMarkers();
        if (mappable.value.length > 0) {
          fitBounds();
        }
      }
    }, 150);

    // ResizeObserver to handle expanding map container or window resize
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (map) map.invalidateSize();
      });
      resizeObserver.observe(mapEl.value);
    }
  } catch (err) {
    console.error("Failed to initialize Leaflet Map:", err);
  }
}

// ── Clear All Markers ─────────────────────────────────────
function clearAllMarkers() {
  if (staggerTimer) {
    clearTimeout(staggerTimer);
    staggerTimer = null;
  }
  if (map) {
    for (const [, marker] of markersMap) {
      map.removeLayer(marker);
    }
  }
  markersMap.clear();
  activeLead.value = null;
}

// ── Sync Markers One-by-One with Smooth Animation ─────────
let staggerTimer = null;

function syncMarkers() {
  if (!map || !L) return;

  const targetLeads = displayedLeads.value;
  const currentIds = new Set(targetLeads.map((l) => String(l.id)));

  // Remove markers no longer visible
  for (const [id, marker] of markersMap) {
    if (!currentIds.has(id)) {
      map.removeLayer(marker);
      markersMap.delete(id);
    }
  }

  // Find unplaced leads
  const unplacedLeads = targetLeads.filter((l) => !markersMap.has(String(l.id)));
  if (unplacedLeads.length === 0) {
    // Update existing marker icons if selection state changed
    targetLeads.forEach((lead, idx) => {
      const id = String(lead.id);
      if (markersMap.has(id)) {
        const isSelected = activeLead.value?.id === lead.id;
        const icon = makePinIcon(lead, idx, isSelected);
        markersMap.get(id).setIcon(icon);
      }
    });
    return;
  }

  // Mark unplaced pins one-by-one with a smooth lightweight stagger
  function dropNext(index) {
    if (index >= unplacedLeads.length) {
      fitBounds();
      return;
    }

    const lead = unplacedLeads[index];
    const id = String(lead.id);

    if (!markersMap.has(id)) {
      const overallIdx = targetLeads.indexOf(lead);
      const isSelected = activeLead.value?.id === lead.id;
      const icon = makePinIcon(lead, overallIdx >= 0 ? overallIdx : index, isSelected);

      const marker = L.marker([lead.latitude, lead.longitude], {
        icon,
        riseOnHover: true
      }).addTo(map);

      marker.on("click", () => {
        onPinClick(lead);
      });

      const safeName = escapeHtml(lead.name || "Business");
      const ratingHtml = lead.rating ? ` ⭐ ${lead.rating}` : "";
      marker.bindTooltip(`<strong>${safeName}</strong>${ratingHtml}`, {
        direction: "top",
        offset: [0, -34],
        className: "lead-leaflet-tooltip"
      });

      markersMap.set(id, marker);

      // On first marker, smoothly pan to it
      if (markersMap.size === 1) {
        map.setView([lead.latitude, lead.longitude], 14, { animate: true });
      } else if (markersMap.size <= 4) {
        fitBounds();
      }
    }

    // 100ms lightweight stagger interval
    staggerTimer = setTimeout(() => {
      dropNext(index + 1);
    }, 100);
  }

  clearTimeout(staggerTimer);
  dropNext(0);
}

// ── Fit Bounds ───────────────────────────────────────────
function fitBounds() {
  if (!map || !L) return;
  const list = displayedLeads.value;
  if (list.length === 0) return;

  if (list.length === 1) {
    map.setView([list[0].latitude, list[0].longitude], 14, { animate: true });
    return;
  }

  const bounds = L.latLngBounds(list.map((l) => [l.latitude, l.longitude]));
  map.fitBounds(bounds, {
    padding: [45, 45],
    maxZoom: 15,
    animate: true
  });
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  nextTick(() => {
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        fitBounds();
      }
    }, 250);
  });
}

// ── Watchers ─────────────────────────────────────────────
// When a new search starts (isRunning goes true) or job ID changes: remove previous pins
watch(
  () => props.isRunning,
  (running, wasRunning) => {
    if (running && !wasRunning) {
      clearAllMarkers();
    }
  }
);

watch(
  () => props.jobId,
  (newId, oldId) => {
    if (newId !== oldId) {
      clearAllMarkers();
      nextTick(() => {
        syncMarkers();
      });
    }
  }
);

watch(
  () => mappable.value.length,
  () => {
    nextTick(() => {
      syncMarkers();
    });
  }
);

watch(
  () => activeLead.value?.id,
  () => {
    syncMarkers();
  }
);

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (staggerTimer) {
    clearTimeout(staggerTimer);
    staggerTimer = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
  markersMap.clear();
});
</script>

<style scoped>
.lead-map-wrap {
  position: relative;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid hsl(var(--border) / 0.85);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.25);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.map-viewport {
  position: relative;
  width: 100%;
}

.map-canvas {
  width: 100%;
  height: 380px;
  background: #0b0f19;
  transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.lead-map-wrap--expanded .map-canvas {
  height: 580px;
}

.map-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.map-canvas {
  width: 100%;
  height: 380px;
  background: #111418;
}



/* ── Floating Interactive Lead Card (Mobbin-style) ── */
.floating-lead-card {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 290px;
  background: hsl(var(--card) / 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.85);
  border-radius: 12px;
  box-shadow: 0 12px 36px -4px hsl(0 0% 0% / 0.4);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.card-img-header {
  position: relative;
  width: 100%;
  height: 90px;
  background: hsl(var(--muted));
  overflow: hidden;
}
.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted) / 0.7);
}
.card-img-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, hsl(var(--card)) 0%, transparent 65%);
}

.card-header-badges {
  position: absolute;
  bottom: 8px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.badge-idx {
  font-size: 0.65rem;
  font-weight: 800;
  font-family: monospace;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
}
.badge-cat {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: hsl(var(--card) / 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}

.card-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(8px);
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
}
.card-close-btn:hover {
  background: hsl(var(--destructive));
  color: #fff;
  border-color: hsl(var(--destructive));
}

.card-content {
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.card-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.card-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  flex-shrink: 0;
}
.card-address {
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
  text-decoration: none;
  transition: all 0.12s ease;
}
.act-btn:hover {
  background: hsl(var(--muted));
  border-color: hsl(var(--foreground) / 0.3);
}

/* Card pop transition */
.card-pop-enter-active,
.card-pop-leave-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-pop-enter-from,
.card-pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
</style>

<!-- Global / Unscoped Styles for Leaflet Elements & Custom Pins -->
<style>
/* Leaflet container fixes */
.lead-leaflet-icon-wrapper {
  background: transparent !important;
  border: none !important;
}

.lead-pin {
  position: relative;
  width: 28px;
  height: 34px;
  cursor: pointer;
  transform-origin: bottom center;
  animation: pin-drop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pin-drop {
  0% {
    opacity: 0;
    transform: translateY(-22px) scale(0.35);
  }
  65% {
    opacity: 1;
    transform: translateY(2px) scale(1.08);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.lead-pin:hover {
  transform: scale(1.22) translateY(-4px);
  z-index: 9999 !important;
}

.lead-pin--selected {
  transform: scale(1.28) translateY(-6px);
  z-index: 10000 !important;
}

.pin-marker {
  width: 28px;
  height: 34px;
}

.pin-svg {
  width: 28px;
  height: 34px;
  display: block;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45));
}

.pin-pulse {
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border-radius: 50%;
  border: 2px solid var(--pin-color, #6366f1);
  transform: scale(0.5);
  animation: pin-pulse-wave 2s infinite ease-out;
  pointer-events: none;
  opacity: 0.6;
}

@keyframes pin-pulse-wave {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.6); opacity: 0; }
}

/* Custom Leaflet Tooltip */
.lead-leaflet-tooltip {
  background: hsl(var(--card) / 0.95) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 6px !important;
  padding: 0.25rem 0.5rem !important;
  color: hsl(var(--foreground)) !important;
  font-size: 0.7rem !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
  white-space: nowrap !important;
}
.lead-leaflet-tooltip::before {
  border-top-color: hsl(var(--border)) !important;
}

/* Leaflet control overrides */
.leaflet-control-zoom {
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  overflow: hidden !important;
  background: hsl(var(--card)) !important;
}
.leaflet-control-zoom a {
  background: hsl(var(--card)) !important;
  color: hsl(var(--foreground)) !important;
  border-bottom: 1px solid hsl(var(--border)) !important;
  width: 28px !important;
  height: 28px !important;
  line-height: 28px !important;
}
.leaflet-control-zoom a:hover {
  background: hsl(var(--muted)) !important;
  color: hsl(var(--foreground)) !important;
}
.leaflet-control-attribution {
  background: hsl(var(--card) / 0.8) !important;
  border-radius: 4px !important;
  font-size: 0.6rem !important;
  padding: 2px 6px !important;
  color: hsl(var(--muted-foreground)) !important;
}
.leaflet-control-attribution a {
  color: hsl(var(--muted-foreground)) !important;
}
</style>
