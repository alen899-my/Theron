<template>
  <!-- Trigger Button -->
  <button
    type="button"
    id="open-find-leads-dialog"
    @click="openDialog"
    class="find-leads-trigger"
  >
    <Search class="w-4 h-4" />
    <span>Find Leads</span>
  </button>

  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="isOpen" class="dialog-backdrop" @mousedown.self="onBackdropClick">
        <Transition name="dialog-slide">
          <div v-if="isOpen" class="dialog-panel" role="dialog" aria-modal="true" aria-label="Find Business Leads">

            <!-- Header -->
            <div class="dialog-header">
              <div class="dialog-header-left">
                <div class="dialog-icon-wrap">
                  <Search class="dialog-icon" />
                </div>
                <div>
                  <h2 class="dialog-title">Find Business Leads</h2>
                  <p class="dialog-subtitle">Configure your search and start extracting leads instantly.</p>
                </div>
              </div>
              <button type="button" class="dialog-close" @click="closeDialog" aria-label="Close">
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Scrollable Body -->
            <div class="dialog-body">
              <form @submit.prevent="handleSubmit" @keydown.ctrl.enter="handleSubmit" @keydown.meta.enter="handleSubmit">

                <!-- ① Search Method -->
                <section class="form-section">
                  <div class="section-label">
                    <Sparkles class="w-3.5 h-3.5" />
                    Search Method
                  </div>
                  <div class="engine-grid">
                    <button
                      v-for="eng in engines" :key="eng.value"
                      type="button"
                      :class="['engine-btn', form.engine === eng.value && 'engine-btn--active']"
                      @click="form.engine = eng.value"
                    >
                      <component :is="eng.icon" class="w-4 h-4 shrink-0" />
                      <div class="engine-info">
                        <span class="engine-name">{{ eng.label }}</span>
                        <span v-if="eng.badge" class="engine-badge">{{ eng.badge }}</span>
                      </div>
                    </button>
                  </div>
                  <div class="engine-hint">
                    <template v-if="form.engine === 'rpc'">⚡ <strong>Fast Google Maps</strong>: 100x faster, zero browser memory. Best for local businesses.</template>
                    <template v-else-if="form.engine === 'browser'">🌐 <strong>Google Maps (Browser)</strong>: Full Chromium automation via Playwright.</template>
                    <template v-else-if="form.engine === 'ai'">🤖 <strong>AI Search</strong>: Fast B2B directory search. Best for agencies &amp; corporate.</template>
                    <template v-else>🔀 <strong>AI + Website Emails</strong>: Finds corporate leads with AI and extracts contact emails.</template>
                  </div>
                </section>

                <div class="divider" />

                <!-- ② Search Query -->
                <section class="form-section">
                  <div class="section-label">
                    <Search class="w-3.5 h-3.5" />
                    Search Query <span class="required">*</span>
                  </div>
                  <input
                    v-model="form.searchQuery"
                    type="text"
                    id="search-query-input"
                    placeholder="e.g. gym in ernakulam"
                    class="field-input"
                    autofocus
                  />
                </section>

                <div class="divider" />

                <!-- ③ Category -->
                <section class="form-section">
                  <div class="section-label">
                    <Tag class="w-3.5 h-3.5" />
                    Category <span class="required">*</span>
                  </div>
                  <input
                    v-model="form.category"
                    type="text"
                    id="category-input"
                    placeholder="e.g. Gym, Restaurant, Dental"
                    class="field-input"
                  />
                  <div class="chip-row">
                    <button
                      v-for="cat in categoryPresets" :key="cat"
                      type="button"
                      :class="['chip', form.category === cat && 'chip--active']"
                      @click="form.category = cat"
                    >{{ cat }}</button>
                  </div>
                </section>

                <div class="divider" />

                <!-- ④ Number of Leads -->
                <section class="form-section">
                  <div class="section-label">
                    <SlidersHorizontal class="w-3.5 h-3.5" />
                    Number of Leads
                  </div>
                  <div class="leads-row">
                    <input
                      v-model.number="form.maxResults"
                      type="number" min="1" max="500"
                      class="leads-num-input"
                    />
                    <span class="leads-hint">leads (1–500)</span>
                  </div>
                  <div class="chip-row">
                    <button
                      v-for="preset in [25, 50, 100, 250, 500]" :key="preset"
                      type="button"
                      :class="['chip chip--mono', form.maxResults === preset && 'chip--active']"
                      @click="form.maxResults = preset"
                    >{{ preset }}</button>
                  </div>
                </section>

                <div class="divider" />

                <!-- ⑤ Columns to Collect -->
                <section class="form-section">
                  <div class="section-label">
                    <Table2 class="w-3.5 h-3.5" />
                    Columns to Collect
                  </div>
                  <div class="chip-row chip-row--field">
                    <button
                      v-for="field in fieldOptions" :key="field.value"
                      type="button"
                      :class="['chip chip--field', form.requestedFields.includes(field.value) && 'chip--active']"
                      @click="toggleField(field.value)"
                    >
                      <Check v-if="form.requestedFields.includes(field.value)" class="w-3 h-3 shrink-0" />
                      {{ field.label }}
                    </button>
                  </div>
                </section>

                <div class="divider" />

                <!-- ⑥ Search Options -->
                <section class="form-section">
                  <div class="section-label">
                    <Cpu class="w-3.5 h-3.5" />
                    Search Options
                  </div>
                  <div class="chip-row">
                    <button
                      v-if="form.engine === 'browser'"
                      type="button"
                      :class="['chip', form.headless && 'chip--active']"
                      @click="form.headless = !form.headless"
                    >{{ form.headless ? '⚡ Fast Background Mode' : '🖥️ Show Browser Window' }}</button>

                    <button
                      type="button"
                      :class="['chip chip--email', form.collectEmailsFromWebsite && 'chip--email-on']"
                      @click="form.collectEmailsFromWebsite = !form.collectEmailsFromWebsite"
                    >
                      <Mail class="w-3 h-3 shrink-0" />
                      {{ form.collectEmailsFromWebsite ? 'Find Website Emails: ON' : 'Find Website Emails: OFF' }}
                    </button>
                  </div>
                </section>

                <!-- Errors -->
                <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>
                <div v-if="submitError" class="form-error form-error--api">
                  <span class="shrink-0">✕</span>
                  <div>
                    <div class="font-semibold mb-0.5">Search failed</div>
                    <div class="opacity-75 font-mono text-[11px]">{{ submitError }}</div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="dialog-footer">
                  <span class="footer-hint">
                    <kbd>Ctrl+Enter</kbd> to search
                  </span>
                  <div class="footer-actions">
                    <button type="button" class="btn-cancel" @click="closeDialog">Cancel</button>
                    <button type="submit" class="btn-submit" :disabled="loading">
                      <template v-if="loading">
                        <span class="spinner" />
                        Searching...
                      </template>
                      <template v-else>
                        <Search class="w-4 h-4" />
                        Start Finding Leads
                      </template>
                    </button>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from "vue";
import {
  Bot, Check, Cpu, Globe, Mail, Search,
  SlidersHorizontal, Sparkles, Table2, Tag, X, Zap
} from "lucide-vue-next";

defineProps({
  loading: { type: Boolean, default: false },
  submitError: { type: String, default: "" }
});
const emit = defineEmits(["submit"]);

const isOpen = ref(false);
const errorMessage = ref("");

function openDialog() {
  isOpen.value = true;
  document.body.style.overflow = "hidden";
}
function closeDialog() {
  isOpen.value = false;
  document.body.style.overflow = "";
  errorMessage.value = "";
}
function onBackdropClick() { /* intentionally blocked */ }

const engines = [
  { value: "rpc",     label: "Fast Google Maps",      badge: "100x Faster", icon: Zap },
  { value: "browser", label: "Google Maps (Browser)", badge: null,           icon: Globe },
  { value: "ai",      label: "AI Search",             badge: null,           icon: Bot },
  { value: "hybrid",  label: "AI + Website Emails",   badge: null,           icon: Sparkles }
];

const categoryPresets = [
  "Software", "Real Estate", "Dentist", "Restaurant",
  "Lawyer", "Clinic", "Gym", "Plumber", "Marketing Agency"
];

const form = reactive({
  searchQuery: "",
  category: "",
  engine: "rpc",
  maxResults: 25,
  headless: true,
  collectEmailsFromWebsite: true,
  requestedFields: ["name", "category", "phone", "emails", "website", "rating", "reviewCount", "address", "images"]
});

const fieldOptions = [
  { value: "name",        label: "Business Name" },
  { value: "category",    label: "Category" },
  { value: "phone",       label: "Phone" },
  { value: "emails",      label: "Email" },
  { value: "website",     label: "Website" },
  { value: "rating",      label: "Rating & Reviews" },
  { value: "address",     label: "Address" },
  { value: "hours",       label: "Hours" },
  { value: "mapsUrl",     label: "Google Map Link" },
  { value: "images",      label: "Images / Photos" }
];

function toggleField(val) {
  if (val === "name") return;
  const idx = form.requestedFields.indexOf(val);
  if (idx >= 0) form.requestedFields.splice(idx, 1);
  else form.requestedFields.push(val);
}

function handleSubmit() {
  errorMessage.value = "";
  if (!form.searchQuery.trim()) { errorMessage.value = "Please enter a search query."; return; }
  if (!form.category.trim())    { errorMessage.value = "Category is required."; return; }
  emit("submit", {
    searchQuery: form.searchQuery.trim(),
    category: form.category.trim(),
    engine: form.engine || "rpc",
    maxResults: form.maxResults,
    headless: form.headless,
    collectEmailsFromWebsite: form.collectEmailsFromWebsite,
    requestedFields: [...form.requestedFields]
  });
  closeDialog();
}
</script>

<style scoped>
/* ── Trigger ───────────────────────────────────────────── */
.find-leads-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4375rem 0.875rem;
  border-radius: 0.5rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.find-leads-trigger:hover { opacity: 0.88; }
.find-leads-trigger:active { opacity: 0.75; }

/* ── Backdrop ──────────────────────────────────────────── */
.dialog-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: hsl(0 0% 0% / 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
@media (min-width: 640px) {
  .dialog-backdrop { align-items: center; padding: 1.5rem; }
}

/* ── Panel ─────────────────────────────────────────────── */
.dialog-panel {
  width: 100%;
  max-width: 640px;
  max-height: 96dvh;
  display: flex;
  flex-direction: column;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1.25rem 1.25rem 0 0;
  overflow: hidden;
  box-shadow: 0 -8px 60px hsl(0 0% 0% / 0.35);
}
@media (min-width: 640px) {
  .dialog-panel {
    border-radius: 1.25rem;
    box-shadow: 0 24px 80px hsl(0 0% 0% / 0.4);
  }
}

/* ── Header ────────────────────────────────────────────── */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.125rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.35);
  flex-shrink: 0;
}
.dialog-header-left { display: flex; align-items: center; gap: 0.75rem; }
.dialog-icon-wrap {
  display: flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
  background: hsl(var(--primary) / 0.12);
  border: 1px solid hsl(var(--primary) / 0.2);
  flex-shrink: 0;
}
.dialog-icon { width: 1rem; height: 1rem; color: hsl(var(--primary)); }
.dialog-title { font-size: 0.9375rem; font-weight: 700; color: hsl(var(--foreground)); line-height: 1.25; }
.dialog-subtitle { font-size: 0.72rem; color: hsl(var(--muted-foreground)); margin-top: 0.125rem; line-height: 1.4; }
.dialog-close {
  display: flex; align-items: center; justify-content: center;
  width: 1.875rem; height: 1.875rem; border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  background: transparent; color: hsl(var(--muted-foreground));
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.dialog-close:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }

/* ── Body ──────────────────────────────────────────────── */
.dialog-body {
  overflow-y: auto;
  flex: 1;
  padding: 0;
}
.dialog-body form {
  display: flex;
  flex-direction: column;
}

/* ── Sections ──────────────────────────────────────────── */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem 1.125rem;
}
.divider {
  height: 1px;
  background: hsl(var(--border));
  flex-shrink: 0;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.required { color: hsl(0 72% 56%); margin-left: 0.1rem; }

/* ── Inputs ────────────────────────────────────────────── */
.field-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.field-input::placeholder { color: hsl(var(--muted-foreground) / 0.5); }
.field-input:focus {
  border-color: hsl(var(--primary) / 0.5);
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
}

/* ── Engine Grid ───────────────────────────────────────── */
.engine-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
@media (min-width: 400px) {
  .engine-grid { grid-template-columns: repeat(4, 1fr); }
}
.engine-btn {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}
@media (min-width: 400px) {
  .engine-btn { flex-direction: column; }
}
.engine-btn:hover { border-color: hsl(var(--foreground) / 0.25); color: hsl(var(--foreground)); }
.engine-btn--active {
  border-color: hsl(var(--primary) / 0.55);
  background: hsl(var(--primary) / 0.07);
  color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.12);
}
.engine-info { display: flex; flex-direction: column; gap: 0.2rem; }
.engine-name { font-size: 0.72rem; font-weight: 600; line-height: 1.3; }
.engine-badge {
  display: inline-block;
  font-size: 0.58rem; font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 99px;
  background: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
  letter-spacing: 0.03em;
  width: fit-content;
}
.engine-hint {
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.55;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: hsl(var(--muted) / 0.5);
  border: 1px solid hsl(var(--border) / 0.6);
}

/* ── Number of Leads ───────────────────────────────────── */
.leads-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.leads-num-input {
  width: 5rem;
  padding: 0.4rem 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: monospace;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.leads-num-input:focus { border-color: hsl(var(--primary) / 0.5); }
.leads-hint { font-size: 0.72rem; color: hsl(var(--muted-foreground)); }

/* ── Chips ─────────────────────────────────────────────── */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.chip-row--field { gap: 0.45rem; }

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  line-height: 1.4;
}
.chip:hover { border-color: hsl(var(--foreground) / 0.3); color: hsl(var(--foreground)); }
.chip--mono { font-family: monospace; }
.chip--field { font-size: 0.75rem; padding: 0.3rem 0.7rem; }
.chip--active {
  background: hsl(var(--foreground));
  border-color: hsl(var(--foreground));
  color: hsl(var(--background));
  font-weight: 600;
}
.chip--email { color: hsl(var(--muted-foreground)); }
.chip--email-on {
  border-color: hsl(142 58% 44% / 0.45);
  background: hsl(142 58% 44% / 0.1);
  color: hsl(142 58% 44%);
  font-weight: 600;
}

/* ── Errors ────────────────────────────────────────────── */
.form-error {
  margin: 0 1.125rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(0 70% 55% / 0.3);
  background: hsl(0 70% 55% / 0.08);
  color: hsl(0 70% 55%);
  font-size: 0.75rem;
  font-family: monospace;
}
.form-error--api { display: flex; gap: 0.625rem; align-items: flex-start; }

/* ── Footer ────────────────────────────────────────────── */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.25);
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: 0.25rem;
}
.footer-hint {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground));
}
.footer-hint kbd {
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
  font-family: monospace;
  font-size: 0.63rem;
}
.footer-actions { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }

.btn-cancel {
  padding: 0.4375rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }

.btn-submit {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1.25rem;
  border-radius: 0.625rem;
  border: none;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%);
  color: hsl(var(--primary-foreground));
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 12px hsl(var(--primary) / 0.28);
  white-space: nowrap;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px hsl(var(--primary) / 0.4); }
.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* ── Spinner ───────────────────────────────────────────── */
.spinner {
  width: 0.875rem; height: 0.875rem;
  border: 2px solid hsl(var(--primary-foreground) / 0.3);
  border-top-color: hsl(var(--primary-foreground));
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Transitions ───────────────────────────────────────── */
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.22s ease; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }

.dialog-slide-enter-active, .dialog-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.08, 0.64, 1), opacity 0.22s ease;
}
.dialog-slide-enter-from { transform: translateY(36px); opacity: 0; }
.dialog-slide-leave-to   { transform: translateY(24px); opacity: 0; }
@media (min-width: 640px) {
  .dialog-slide-enter-from { transform: scale(0.97) translateY(6px); }
  .dialog-slide-leave-to   { transform: scale(0.97) translateY(6px); }
}
</style>
