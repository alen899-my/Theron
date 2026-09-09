<template>
  <article class="lead-card" @click="$emit('view', lead)">

    <!-- Image Panel -->
    <div class="card-media">
      <img
        v-if="firstImage"
        :src="firstImage"
        :alt="lead.name"
        loading="lazy"
        class="card-media-img"
      />
      <div v-else class="card-media-placeholder">
        <Building2 class="placeholder-icon" />
      </div>

      <!-- Status chip over image -->
      <div class="card-status-wrap">
        <span class="card-status" :class="statusClass">{{ statusLabel }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="card-content">

      <!-- Header -->
      <div class="card-header">
        <div class="card-title-block">
          <h3 class="card-title">{{ lead.name }}</h3>
          <span v-if="lead.category" class="card-tag">{{ lead.category }}</span>
        </div>

        <!-- Actions (only delete, visible on hover via CSS) -->
        <div class="card-actions" @click.stop>
          <button
            type="button"
            class="action-btn action-btn--delete"
            title="Delete lead"
            :disabled="deleteDisabled"
            @click.stop="$emit('delete', lead)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Meta row: rating + address -->
      <div class="card-meta">
        <span v-if="lead.rating" class="meta-item">
          <Star class="meta-icon" />
          <span class="meta-text">{{ lead.rating }}<span v-if="lead.reviewCount" class="meta-sub"> ({{ lead.reviewCount }})</span></span>
        </span>
        <span v-if="lead.address" class="meta-item meta-item--address">
          <MapPin class="meta-icon" />
          <span class="meta-text meta-truncate">{{ lead.address }}</span>
        </span>
      </div>

      <!-- Divider -->
      <div class="card-divider" />

      <!-- Contacts -->
      <div class="card-contacts">
        <a v-if="lead.phone" :href="`tel:${lead.phone}`" class="contact-row" @click.stop>
          <Phone class="contact-icon" />
          <span class="contact-text">{{ lead.phone }}</span>
        </a>

        <a v-if="lead.website" :href="lead.website" target="_blank" rel="noreferrer" class="contact-row" @click.stop>
          <Globe class="contact-icon" />
          <span class="contact-text contact-truncate">{{ cleanUrl(lead.website) }}</span>
          <ExternalLink class="contact-ext" />
        </a>

        <button
          v-for="email in (lead.emails || []).slice(0, 2)"
          :key="email"
          type="button"
          class="contact-row contact-row--email"
          :title="`Click to copy ${email}`"
          @click.stop="copyText(email)"
        >
          <Mail class="contact-icon" />
          <span class="contact-text contact-truncate">{{ email }}</span>
          <Copy class="contact-ext contact-copy-hint" />
        </button>

        <span v-if="!lead.phone && !lead.website && !(lead.emails && lead.emails.length)" class="no-contacts">
          No contact info found
        </span>
      </div>

      <!-- Footer: map link -->
      <div v-if="lead.mapsUrl" class="card-footer">
        <a
          :href="lead.mapsUrl"
          target="_blank"
          rel="noreferrer"
          class="maps-chip"
          @click.stop
          title="Open on Google Maps"
        >
          <MapPin class="w-3 h-3" />
          <span>View on Maps</span>
          <ExternalLink class="w-2.5 h-2.5 opacity-50" />
        </a>
      </div>

    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import { Building2, Copy, ExternalLink, Globe, Mail, MapPin, Phone, Star, Trash2 } from "lucide-vue-next";
import { getStatusStep } from "./status-constants";

const props = defineProps({
  lead: { type: Object, required: true },
  deleteDisabled: { type: Boolean, default: false }
});

defineEmits(["view", "delete"]);

const firstImage = computed(() => (props.lead.images || [])[0] || null);
const statusStep = computed(() => getStatusStep(props.lead.status));
const statusLabel = computed(() => statusStep.value.label);
const statusClass = computed(() => statusStep.value.pillClass);

function cleanUrl(url) {
  try { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); } catch { return url; }
}
function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════════ */
.lead-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: hsl(var(--card));
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
  position: relative;
  min-height: 100px;
}
.lead-card:hover {
  border-color: hsl(var(--foreground) / 0.15);
  box-shadow: 0 1px 8px hsl(0 0% 0% / 0.06), 0 0 0 1px hsl(var(--foreground) / 0.04);
}

/* ═══════════════════════════════════════════════════════
   MEDIA PANEL
═══════════════════════════════════════════════════════ */
.card-media {
  flex-shrink: 0;
  width: 120px;
  position: relative;
  background: hsl(var(--muted));
  overflow: hidden;
}
@media (min-width: 480px) { .card-media { width: 140px; } }

.card-media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;
}
.lead-card:hover .card-media-img { transform: scale(1.05); }

.card-media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}
.placeholder-icon {
  width: 1.5rem; height: 1.5rem;
  color: hsl(var(--muted-foreground) / 0.25);
}

/* Status chip overlaid on image */
.card-status-wrap {
  position: absolute;
  bottom: 0.375rem;
  left: 0.375rem;
}
.card-status {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-family: monospace;
  font-weight: 700;
  border: 1px solid;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════
   CONTENT
═══════════════════════════════════════════════════════ */
.card-content {
  flex: 1;
  min-width: 0;
  padding: 0.6875rem 0.875rem 0.6875rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

/* ── Header ── */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.card-title-block {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
}
.card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.card-tag {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-family: monospace;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

/* ── Delete action (shown only on card hover) ── */
.card-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.14s ease;
}
.lead-card:hover .card-actions { opacity: 1; }

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.13s;
  color: hsl(var(--muted-foreground) / 0.6);
}
.action-btn--delete:hover {
  background: hsl(0 72% 55% / 0.1);
  border-color: hsl(0 72% 55% / 0.25);
  color: hsl(0 72% 52%);
}
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Meta ── */
.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.69rem;
  color: hsl(var(--muted-foreground));
}
.meta-item--address {
  min-width: 0;
  flex: 1;
}
.meta-icon {
  width: 0.7rem;
  height: 0.7rem;
  flex-shrink: 0;
  color: hsl(var(--muted-foreground) / 0.7);
}
.meta-text { line-height: 1; }
.meta-sub { opacity: 0.65; margin-left: 0.1rem; }
.meta-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 28ch;
}

/* ── Divider ── */
.card-divider {
  height: 1px;
  background: hsl(var(--border) / 0.7);
  margin: 0.125rem 0;
}

/* ── Contacts ── */
.card-contacts {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.contact-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.1rem 0;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.12s;
  color: hsl(var(--muted-foreground));
}
.contact-row:hover { color: hsl(var(--foreground)); }
.contact-row--email { color: hsl(142 52% 40%); }
.contact-row--email:hover { color: hsl(142 52% 35%); }
.contact-icon {
  width: 0.7rem;
  height: 0.7rem;
  flex-shrink: 0;
  opacity: 0.7;
}
.contact-text {
  font-size: 0.72rem;
  font-family: monospace;
  line-height: 1.2;
  flex: 1;
  min-width: 0;
}
.contact-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-ext {
  width: 0.65rem;
  height: 0.65rem;
  flex-shrink: 0;
  opacity: 0.4;
}
.contact-copy-hint { opacity: 0; transition: opacity 0.12s; }
.contact-row--email:hover .contact-copy-hint { opacity: 0.5; }

.no-contacts {
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground) / 0.45);
  font-style: italic;
  padding: 0.125rem 0;
}

/* ── Footer ── */
.card-footer {
  margin-top: 0.125rem;
}
.maps-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-family: monospace;
  color: hsl(var(--muted-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  text-decoration: none;
  background: hsl(var(--muted) / 0.4);
  transition: all 0.13s;
}
.maps-chip:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  border-color: hsl(var(--foreground) / 0.2);
}
</style>
