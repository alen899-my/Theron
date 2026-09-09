<template>
  <div class="rounded-xl border border-border bg-card p-5 sm:p-7 transition-all shadow-sm">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Search class="h-5 w-5 text-foreground" />
          <span>Find Business Leads</span>
        </h2>
      </div>
      <p class="text-xs sm:text-sm text-muted-foreground">
        Search local businesses or corporate directories, extract phone numbers and emails, and save them for outreach.
      </p>
    </div>

    <!-- Form Table -->
    <form class="space-y-4" @submit.prevent="handleSubmit" @keydown.ctrl.enter="handleSubmit" @keydown.meta.enter="handleSubmit">
      <div class="rounded-lg border border-border divide-y divide-border bg-background/50 overflow-hidden text-sm">
        <!-- Property: Search Method -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start p-3 gap-2 bg-muted/20">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1.5">
            <Sparkles class="h-3.5 w-3.5 text-foreground" />
            <span>Search Method</span>
          </div>
          <div class="space-y-2">
            <div class="inline-flex rounded-lg border border-border p-1 bg-background gap-1 flex-wrap">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer',
                  form.engine === 'rpc'
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="form.engine = 'rpc'"
              >
                <Zap class="h-3.5 w-3.5" />
                <span>Fast Google Maps</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono" :class="form.engine === 'rpc' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'">100x Faster</span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer',
                  form.engine === 'browser'
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="form.engine = 'browser'"
              >
                <Globe class="h-3.5 w-3.5" />
                <span>Google Maps (Browser)</span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer',
                  form.engine === 'ai'
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="form.engine = 'ai'"
              >
                <Bot class="h-3.5 w-3.5" />
                <span>AI Search</span>
              </button>

              <button
                type="button"
                :class="[
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 cursor-pointer',
                  form.engine === 'hybrid'
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="form.engine = 'hybrid'"
              >
                <Sparkles class="h-3.5 w-3.5" />
                <span>AI + Website Emails</span>
              </button>
            </div>

            <p class="text-[11px] text-muted-foreground">
              <template v-if="form.engine === 'rpc'">
                ⚡ <strong>Fast Google Maps (Direct HTTP)</strong>: 100x faster extraction directly from Google Maps with zero browser memory. Recommended for all local businesses.
              </template>
              <template v-else-if="form.engine === 'browser'">
                🌐 <strong>Google Maps (Browser)</strong>: Full Chromium automation via Playwright.
              </template>
              <template v-else-if="form.engine === 'ai'">
                🤖 <strong>AI Search</strong>: Fast B2B directory search powered by OpenRouter. Best for agencies, tech, and corporate companies.
              </template>
              <template v-else>
                🔀 <strong>AI + Website Emails</strong>: Finds corporate leads with AI and automatically visits their websites to extract contact emails.
              </template>
            </p>
          </div>
        </div>

        <!-- Property: Target Query -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1.5">
            <Search class="h-3.5 w-3.5" />
            <span class="flex items-center gap-1">
              Search Query
              <span class="text-red-500 font-bold" title="Required">*</span>
            </span>
          </div>
          <div>
            <input
              v-model="form.searchQuery"
              type="text"
              placeholder="e.g. Vehicle workshops in Ernakulam, or Dental clinics in Dallas"
              class="w-full bg-transparent px-2.5 py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 border border-transparent hover:border-border focus:border-foreground/40 rounded-md outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Property: Category / Industry (Required) -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1.5">
            <Tag class="h-3.5 w-3.5" />
            <span class="flex items-center gap-1">
              Category
              <span class="text-red-500 font-bold" title="Required">*</span>
            </span>
          </div>
          <div class="space-y-2">
            <input
              v-model="form.category"
              type="text"
              required
              placeholder="e.g. Automotive, Real Estate, Dental Clinic, Restaurant"
              class="w-full bg-transparent px-2.5 py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 border border-transparent hover:border-border focus:border-foreground/40 rounded-md outline-none transition-colors"
            />
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] text-muted-foreground font-mono mr-1">Quick Select:</span>
              <button
                v-for="cat in categoryPresets"
                :key="cat"
                type="button"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-mono border transition-colors cursor-pointer',
                  form.category === cat
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
                ]"
                @click="form.category = cat"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </div>

        <!-- Property: Number of Leads -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            <span>Number of Leads</span>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="form.maxResults"
              type="number"
              min="1"
              max="500"
              class="w-20 rounded-md border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground outline-none focus:border-foreground/50"
            />
            <span class="text-xs text-muted-foreground">leads to find (1-500)</span>
            <div class="hidden sm:flex gap-1.5 ml-auto">
              <button
                v-for="preset in [25, 50, 100, 250, 500]"
                :key="preset"
                type="button"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-mono border transition-colors cursor-pointer',
                  form.maxResults === preset
                    ? 'bg-foreground text-background border-foreground font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                ]"
                @click="form.maxResults = preset"
              >
                {{ preset }}
              </button>
            </div>
          </div>
        </div>

        <!-- Property: Columns to Collect -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1">
            <Table2 class="h-3.5 w-3.5" />
            <span>Columns to Collect</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="field in fieldOptions"
              :key="field.value"
              type="button"
              :class="[
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono transition-all cursor-pointer',
                form.requestedFields.includes(field.value)
                  ? 'border border-foreground/30 bg-muted text-foreground font-medium shadow-2xs'
                  : 'border border-border/70 text-muted-foreground hover:border-foreground/20'
              ]"
              @click="toggleField(field.value)"
            >
              <Check v-if="form.requestedFields.includes(field.value)" class="h-3 w-3" />
              <span>{{ field.label }}</span>
            </button>
          </div>
        </div>

        <!-- Property: Search Options -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Cpu class="h-3.5 w-3.5" />
            <span>Search Options</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <!-- If Browser mode, show Fast Background toggle -->
            <button
              v-if="form.engine === 'browser'"
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer',
                form.headless
                  ? 'border-border bg-muted text-foreground font-medium'
                  : 'border-border/70 bg-background text-muted-foreground'
              ]"
              @click="form.headless = !form.headless"
            >
              <span>{{ form.headless ? '⚡ Fast Background Mode' : '🖥️ Show Browser Window' }}</span>
            </button>

            <!-- Crawl Web Emails Toggle -->
            <button
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer',
                form.collectEmailsFromWebsite
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-medium'
                  : 'border-border/70 bg-background text-muted-foreground'
              ]"
              @click="form.collectEmailsFromWebsite = !form.collectEmailsFromWebsite"
            >
              <Mail class="h-3 w-3" />
              <span>{{ form.collectEmailsFromWebsite ? 'Find Website Emails: ON' : 'Find Website Emails: OFF' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Form Validation Error -->
      <div
        v-if="errorMessage"
        class="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500 font-mono"
      >
        {{ errorMessage }}
      </div>

      <!-- Server / API Error -->
      <div
        v-if="submitError"
        class="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-xs text-red-400 flex items-start gap-2.5"
      >
        <span class="mt-0.5 shrink-0 text-red-500">✕</span>
        <div>
          <div class="font-semibold text-red-400 mb-0.5">Search failed</div>
          <div class="font-mono text-red-400/80">{{ submitError }}</div>
        </div>
      </div>

      <!-- Submit Action Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div class="text-xs text-muted-foreground flex items-center gap-1.5">
          <kbd class="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono bg-muted">Ctrl + Enter</kbd>
          <span>to search immediately</span>
        </div>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :disabled="loading"
          class="w-full sm:w-auto"
        >
          <Search class="h-3.5 w-3.5" />
          <span>{{ loading ? 'Searching leads...' : 'Find Leads' }}</span>
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import {
  Bot,
  Check,
  Cpu,
  Globe,
  Mail,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Tag,
  Zap
} from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  submitError: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["submit"]);

const errorMessage = ref("");

const categoryPresets = [
  "Software",
  "Real Estate",
  "Dentist",
  "Restaurant",
  "Lawyer",
  "Clinic",
  "Gym",
  "Plumber",
  "Marketing Agency"
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
  { value: "name", label: "Business Name" },
  { value: "category", label: "Category" },
  { value: "phone", label: "Phone" },
  { value: "emails", label: "Email" },
  { value: "website", label: "Website" },
  { value: "rating", label: "Rating & Reviews" },
  { value: "address", label: "Address" },
  { value: "hours", label: "Hours" },
  { value: "mapsUrl", label: "Google Map Link" },
  { value: "images", label: "Images / Photos" }
];

function toggleField(val) {
  if (val === "name") return;
  const idx = form.requestedFields.indexOf(val);
  if (idx >= 0) {
    form.requestedFields.splice(idx, 1);
  } else {
    form.requestedFields.push(val);
  }
}

function handleSubmit() {
  errorMessage.value = "";

  if (!form.searchQuery.trim()) {
    errorMessage.value = "Please enter a target search query.";
    return;
  }

  if (!form.category.trim()) {
    errorMessage.value = "Category is required. Please enter or select a business category.";
    return;
  }

  emit("submit", {
    searchQuery: form.searchQuery.trim(),
    category: form.category.trim(),
    engine: form.engine || "rpc",
    maxResults: form.maxResults,
    headless: form.headless,
    collectEmailsFromWebsite: form.collectEmailsFromWebsite,
    requestedFields: [...form.requestedFields]
  });
}
</script>
