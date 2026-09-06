<template>
  <div class="rounded-xl border border-border bg-card p-5 sm:p-7 transition-all shadow-sm">
    <!-- Document Header / Title -->
    <div class="mb-6 flex flex-col gap-2">
      <div class="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider">
        <span class="inline-block h-2 w-2 rounded-full bg-foreground/70"></span>
        Google Maps Lead Pipeline
      </div>
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <span>🗺️</span>
          <span>Google Maps Lead Engine</span>
        </h2>
      </div>
      <p class="text-xs sm:text-sm text-muted-foreground">
        Scrape local businesses, extract verified phone numbers, crawl company websites for contact emails, and archive structured leads.
      </p>
    </div>

    <!-- Notion Property Table -->
    <form class="space-y-4" @submit.prevent="handleSubmit" @keydown.ctrl.enter="handleSubmit" @keydown.meta.enter="handleSubmit">
      <div class="rounded-lg border border-border divide-y divide-border bg-background/50 overflow-hidden text-sm">
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
              placeholder="e.g. dentists in Brooklyn, NY or software companies in Austin"
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
              placeholder="e.g. Software, Real Estate, Dental Clinic, Restaurant"
              class="w-full bg-transparent px-2.5 py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 border border-transparent hover:border-border focus:border-foreground/40 rounded-md outline-none transition-colors"
            />
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] text-muted-foreground font-mono mr-1">Quick Select:</span>
              <button
                v-for="cat in categoryPresets"
                :key="cat"
                type="button"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-mono border transition-colors',
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

        <!-- Property: Depth / Limit -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            <span>Target Depth</span>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="form.maxResults"
              type="number"
              min="1"
              max="500"
              class="w-20 rounded-md border border-border bg-background px-2.5 py-1 text-sm font-mono text-foreground outline-none focus:border-foreground/50"
            />
            <span class="text-xs text-muted-foreground">leads maximum (1-500)</span>
            <div class="hidden sm:flex gap-1.5 ml-auto">
              <button
                v-for="preset in [25, 50, 100, 250, 500]"
                :key="preset"
                type="button"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-mono border transition-colors',
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

        <!-- Property: Schema Fields (Notion tags) -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1">
            <Table2 class="h-3.5 w-3.5" />
            <span>Extracted Schema</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="field in fieldOptions"
              :key="field.value"
              type="button"
              :class="[
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono transition-all',
                form.requestedFields.includes(field.value)
                  ? 'border border-foreground/30 bg-muted text-foreground font-medium'
                  : 'border border-border/70 text-muted-foreground hover:border-foreground/20'
              ]"
              @click="toggleField(field.value)"
            >
              <Check v-if="form.requestedFields.includes(field.value)" class="h-3 w-3" />
              <span>{{ field.label }}</span>
            </button>
          </div>
        </div>

        <!-- Property: Execution Options -->
        <div class="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center p-3 gap-2">
          <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Cpu class="h-3.5 w-3.5" />
            <span>Engine Flags</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono border transition-colors',
                form.headless
                  ? 'border-border bg-muted text-foreground font-medium'
                  : 'border-border/70 bg-background text-muted-foreground'
              ]"
              @click="form.headless = !form.headless"
            >
              <span>{{ form.headless ? '⚡ Headless (Fast)' : '🖥️ Visible Browser (Debug)' }}</span>
            </button>

            <button
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono border transition-colors',
                form.collectEmailsFromWebsite
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-medium'
                  : 'border-border/70 bg-background text-muted-foreground'
              ]"
              @click="form.collectEmailsFromWebsite = !form.collectEmailsFromWebsite"
            >
              <Mail class="h-3 w-3" />
              <span>{{ form.collectEmailsFromWebsite ? 'Enrich Emails: ON' : 'Enrich Emails: OFF' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500 font-mono"
      >
        {{ errorMessage }}
      </div>

      <!-- Submit Action Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div class="text-xs text-muted-foreground flex items-center gap-1.5">
          <kbd class="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono bg-muted">⌘ Enter</kbd>
          <span>to launch pipeline immediately</span>
        </div>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :disabled="loading"
          class="w-full sm:w-auto"
        >
          <Play class="h-3.5 w-3.5 fill-current" />
          <span>{{ loading ? 'Launching engine...' : 'Launch Pipeline' }}</span>
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { Check, Cpu, Mail, Play, Search, SlidersHorizontal, Table2, Tag } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

defineProps({
  loading: {
    type: Boolean,
    default: false
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
  maxResults: 25,
  headless: true,
  collectEmailsFromWebsite: true,
  requestedFields: ["name", "category", "phone", "emails", "website", "rating", "reviewCount", "address"]
});

const fieldOptions = [
  { value: "name", label: "name" },
  { value: "category", label: "category" },
  { value: "phone", label: "phone" },
  { value: "emails", label: "emails" },
  { value: "website", label: "website" },
  { value: "rating", label: "rating" },
  { value: "reviewCount", label: "reviews" },
  { value: "address", label: "address" },
  { value: "hours", label: "hours" },
  { value: "mapsUrl", label: "mapsUrl" }
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
    errorMessage.value = "Please enter a target search query for Google Maps.";
    return;
  }

  if (!form.category.trim()) {
    errorMessage.value = "Category is required. Please enter or select a business category.";
    return;
  }

  emit("submit", {
    searchQuery: form.searchQuery.trim(),
    category: form.category.trim(),
    maxResults: form.maxResults,
    headless: form.headless,
    collectEmailsFromWebsite: form.collectEmailsFromWebsite,
    requestedFields: [...form.requestedFields]
  });
}
</script>
