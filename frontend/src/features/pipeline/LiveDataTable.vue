<template>
  <div class="rounded-xl border border-border bg-card overflow-hidden transition-all shadow-sm">
    <!-- Quick Preset Tabs Header -->
    <div class="border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
      <div class="flex items-center gap-1.5 flex-nowrap min-w-max">
        <button
          v-for="preset in quickPresets"
          :key="preset.id"
          type="button"
          :class="[
            'px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 border',
            filters.quickPreset === preset.id
              ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
          ]"
          @click="selectQuickPreset(preset.id)"
        >
          <span>{{ preset.label }}</span>
          <span
            :class="[
              'px-1 py-0.2 rounded text-[10px]',
              filters.quickPreset === preset.id ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
            ]"
          >
            {{ preset.count }}
          </span>
        </button>
      </div>

      <!-- Live Beacon / Total Counter -->
      <div class="flex items-center gap-2 min-w-max ml-auto">
        <div v-if="isRunning" class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono text-emerald-500 dark:text-emerald-400">
          <span class="live-beacon"></span>
          <span class="font-semibold">Live</span>
          <span class="text-foreground/70">({{ rows.length }})</span>
        </div>
        <div v-else class="text-xs text-muted-foreground font-mono">
          <span class="font-semibold text-foreground">{{ filteredAndSortedRows.length }}</span>
          <span v-if="filteredAndSortedRows.length !== rows.length"> / {{ rows.length }}</span>
          <span> leads</span>
        </div>
      </div>
    </div>

    <!-- Main Toolbar (Search, Filter Toggle, Export) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border bg-background">
      <!-- Search Input (Larger, High-Visibility) -->
      <div class="relative flex-1 md:max-w-md lg:max-w-lg">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="filters.searchQuery"
          type="text"
          placeholder="Search name, category, phone, email, address..."
          class="h-11 sm:h-12 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all shadow-xs"
        />
        <button
          v-if="filters.searchQuery"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Clear search"
          @click="filters.searchQuery = ''"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Action Buttons (Touch-friendly, larger sizes) -->
      <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <!-- Advanced Filters Toggle Button -->
        <button
          type="button"
          :class="[
            'h-11 px-4 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer shadow-xs',
            showFilterPanel || activeFiltersCount > 0
              ? 'border-foreground/50 bg-muted text-foreground font-semibold shadow-xs ring-1 ring-foreground/20'
              : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40'
          ]"
          @click="showFilterPanel = !showFilterPanel"
        >
          <SlidersHorizontal class="h-4 w-4" />
          <span>Filters</span>
          <span
            v-if="activeFiltersCount > 0"
            class="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono bg-foreground text-background font-bold"
          >
            {{ activeFiltersCount }}
          </span>
          <ChevronDown v-if="!showFilterPanel" class="h-3.5 w-3.5 ml-0.5 opacity-60" />
          <ChevronUp v-else class="h-3.5 w-3.5 ml-0.5 opacity-60" />
        </button>

        <!-- Reset Button -->
        <button
          v-if="activeFiltersCount > 0"
          type="button"
          class="h-11 px-3.5 rounded-lg border border-border hover:border-red-500/40 bg-background text-sm text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Reset all active filters"
          @click="resetFilters"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <!-- CSV Export -->
        <AppButton variant="outline" size="md" class="h-11 px-3.5" @click="exportToCsv" title="Export matching leads to CSV">
          <Download class="h-4 w-4" />
          <span class="hidden sm:inline">Export CSV ({{ filteredAndSortedRows.length }})</span>
          <span class="sm:hidden">CSV</span>
        </AppButton>

        <!-- JSON Export -->
        <AppButton variant="outline" size="md" class="h-11 px-3.5" @click="exportToJson" title="Export matching leads to JSON">
          <FileCode class="h-4 w-4" />
          <span class="hidden sm:inline">JSON</span>
        </AppButton>

        <!-- Clear All Button -->
        <button
          type="button"
          :disabled="deleteModal.loading || !rows.length"
          class="h-11 px-3.5 rounded-lg border border-border/80 hover:border-red-500/50 bg-background hover:bg-red-500/10 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          title="Delete all leads in your archive"
          @click="confirmClearAll"
        >
          <Trash2 class="h-4 w-4" />
          <span class="hidden sm:inline">Clear All</span>
        </button>
      </div>
    </div>

    <!-- Collapsible Advanced Filter Panel (Larger inputs, comfortable spacing) -->
    <div
      v-if="showFilterPanel"
      class="border-b border-border bg-muted/20 p-4 sm:p-6 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <!-- Filter Panel Header -->
      <div class="flex items-center justify-between pb-3.5 mb-4 sm:mb-5 border-b border-border/70">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="h-4 w-4 text-foreground" />
          <h4 class="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
            Filter & Segment Engine
          </h4>
          <span class="text-xs text-muted-foreground font-mono">
            ({{ filteredAndSortedRows.length }} matches)
          </span>
        </div>
        <button
          v-if="activeFiltersCount > 0"
          type="button"
          class="text-xs font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
          @click="resetFilters"
        >
          Reset all
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        <!-- 1. Category Filter -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <Layers class="h-3.5 w-3.5" />
              <span>Category / Industry</span>
            </span>
          </label>
          <select
            v-model="filters.category"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">All Categories ({{ rows.length }})</option>
            <option
              v-for="cat in availableCategories"
              :key="cat.name"
              :value="cat.name"
            >
              {{ cat.name }} ({{ cat.count }})
            </option>
          </select>
        </div>

        <!-- 2. Status Filter -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5" />
            <span>Status</span>
          </label>
          <select
            v-model="filters.status"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">All Statuses ({{ rows.length }})</option>
            <option
              v-for="st in STATUS_STEPS"
              :key="st.id"
              :value="st.id"
            >
              {{ st.step }}. {{ st.label }} ({{ countByStatus(st.id) }})
            </option>
          </select>
        </div>

        <!-- 3. Email Availability -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Mail class="h-3.5 w-3.5" />
            <span>Email Status</span>
          </label>
          <select
            v-model="filters.hasEmail"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">Any Email Status</option>
            <option value="yes">Verified Email Available</option>
            <option value="no">No Email Discovered</option>
          </select>
        </div>

        <!-- 3. Phone Availability -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Phone class="h-3.5 w-3.5" />
            <span>Phone Number</span>
          </label>
          <select
            v-model="filters.hasPhone"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">Any Phone Status</option>
            <option value="yes">Phone Number Available</option>
            <option value="no">No Phone Listed</option>
          </select>
        </div>

        <!-- 4. Website Availability -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe class="h-3.5 w-3.5" />
            <span>Website</span>
          </label>
          <select
            v-model="filters.hasWebsite"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">Any Website Status</option>
            <option value="yes">Has Website</option>
            <option value="no">Missing Website (Opportunity)</option>
          </select>
        </div>

        <!-- 5. Rating Threshold -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Star class="h-3.5 w-3.5" />
            <span>Minimum Rating</span>
          </label>
          <select
            v-model="filters.minRating"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">Any Rating</option>
            <option value="4.5">4.5+ ⭐ (Prime / Top Tier)</option>
            <option value="4.0">4.0+ ⭐ (High Quality)</option>
            <option value="3.5">3.5+ ⭐</option>
            <option value="3.0">3.0+ ⭐</option>
            <option value="unrated">Unrated / No Stars</option>
          </select>
        </div>

        <!-- 6. Review Count Threshold -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 class="h-3.5 w-3.5" />
            <span>Review Volume</span>
          </label>
          <select
            v-model="filters.minReviews"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="all">Any Review Volume</option>
            <option value="10">10+ Reviews</option>
            <option value="25">25+ Reviews</option>
            <option value="50">50+ Reviews</option>
            <option value="100">100+ Reviews (Established)</option>
            <option value="500">500+ Reviews (High Profile)</option>
          </select>
        </div>

        <!-- 7. City / Location Keyword -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin class="h-3.5 w-3.5" />
            <span>City / Region / Zip</span>
          </label>
          <div class="relative">
            <MapPin class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              v-model="filters.location"
              type="text"
              placeholder="e.g. Austin, London, NY..."
              class="w-full h-11 rounded-lg border border-border bg-background pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all shadow-xs"
            />
            <button
              v-if="filters.location"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              @click="filters.location = ''"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- 8. Sort By -->
        <div class="space-y-1.5">
          <label class="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal class="h-3.5 w-3.5" />
            <span>Sort Ordering</span>
          </label>
          <select
            v-model="filters.sortBy"
            class="w-full h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none hover:border-foreground/30 focus:border-foreground focus:ring-2 focus:ring-foreground/10 transition-all cursor-pointer shadow-xs"
          >
            <option value="default">Default Order (#)</option>
            <option value="name_asc">Business Name (A → Z)</option>
            <option value="name_desc">Business Name (Z → A)</option>
            <option value="rating_desc">Highest Rating (5 → 0)</option>
            <option value="rating_asc">Lowest Rating (0 → 5)</option>
            <option value="reviews_desc">Most Reviews (High → Low)</option>
            <option value="emails_desc">Most Emails Discovered</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filter Chips Bar (Spacious, easy touch targets) -->
    <div
      v-if="activeFilterPills.length"
      class="flex flex-wrap items-center gap-2 p-3 sm:px-4 sm:py-3 border-b border-border bg-muted/25 text-xs"
    >
      <span class="text-xs font-mono text-muted-foreground mr-1">Active:</span>
      <span
        v-for="pill in activeFilterPills"
        :key="pill.id"
        class="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-mono text-foreground shadow-2xs"
      >
        <span>{{ pill.label }}</span>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
          @click="pill.clear()"
        >
          <X class="h-3 w-3" />
        </button>
      </span>

      <button
        type="button"
        class="text-xs font-mono text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer"
        @click="resetFilters"
      >
        Clear all
      </button>

      <span class="ml-auto text-xs font-mono text-muted-foreground hidden sm:inline">
        Showing {{ filteredAndSortedRows.length }} of {{ rows.length }} leads
      </span>
    </div>

    <!-- Multi-Select Bulk Actions Bar (Appears when >= 1 rows are checked) -->
    <div
      v-if="selectedIds.size > 0"
      class="flex items-center justify-between px-4 py-3 bg-muted border-b border-border text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <div class="flex items-center gap-2.5">
        <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-foreground text-background font-bold text-xs">
          {{ selectedIds.size }}
        </span>
        <span class="text-foreground font-semibold text-xs">lead(s) selected</span>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer text-xs"
          @click="clearSelection"
        >
          Deselect all
        </button>
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="destructive"
          size="sm"
          :disabled="deleteModal.loading"
          class="h-9 px-3 text-xs"
          @click="confirmBulkDelete"
        >
          <Trash2 class="h-3.5 w-3.5" />
          <span>{{ deleteModal.loading ? 'Deleting...' : `Delete Selected (${selectedIds.size})` }}</span>
        </AppButton>
      </div>
    </div>

    <!-- Responsive Table Container -->
    <div class="overflow-x-auto min-h-[300px] max-h-[600px]">
      <table class="w-full text-left text-xs border-collapse">
        <!-- Table Header -->
        <thead class="sticky top-0 z-10 border-b border-border bg-muted/90 backdrop-blur-md">
          <tr>
            <!-- 1st Column: Select Checkbox -->
            <th class="py-2.5 px-3 w-10 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                class="h-4 w-4 rounded border-border text-foreground accent-foreground cursor-pointer"
                title="Select / Deselect all visible rows"
                @change="toggleSelectAll"
              />
            </th>
            <th class="py-2.5 px-3 font-mono font-medium text-muted-foreground w-12 text-center">#</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[200px]">Business Name</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground w-20 text-center">Photos</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[130px]">Category</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[130px]">Status</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[130px]">Phone</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[180px]">Email</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[160px]">Website</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[110px]">Rating</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground min-w-[220px]">Address</th>
            <th class="py-2.5 px-3 font-medium text-muted-foreground w-16 text-center">Map</th>
            <!-- End Column: Actions Buttons (Eye + Trash) -->
            <th class="py-2.5 px-3 font-medium text-muted-foreground w-20 text-center">Actions</th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody v-if="filteredAndSortedRows.length" class="divide-y divide-border/60">
          <tr
            v-for="(item, index) in filteredAndSortedRows"
            :key="item.id || item.dedupeKey || index"
            :class="[
              'group hover:bg-muted/40 cursor-pointer transition-colors',
              selectedIds.has(item.id) ? 'bg-muted/60' : ''
            ]"
            @click="openLeadModal(item, 'details')"
          >
            <!-- 1st Column: Row Checkbox -->
            <td class="py-3 px-3 text-center" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.has(item.id)"
                class="h-4 w-4 rounded border-border text-foreground accent-foreground cursor-pointer"
                @change="toggleSelect(item.id)"
              />
            </td>
            <td class="py-3 px-3 font-mono text-muted-foreground text-center">
              {{ item.position || index + 1 }}
            </td>
            <td class="py-3 px-3">
              <div class="font-medium text-foreground group-hover:text-foreground/90">{{ item.name }}</div>
            </td>
            <!-- Photos Column (Max 2 thumbnails) -->
            <td class="py-3 px-3 text-center" @click.stop>
              <div v-if="item.images && item.images.length" class="flex items-center justify-center gap-1">
                <a
                  v-for="(img, idx) in (item.images || []).slice(0, 2)"
                  :key="idx"
                  :href="img"
                  target="_blank"
                  rel="noreferrer"
                  class="group/thumb block h-8 w-8 rounded-md overflow-hidden border border-border/80 bg-muted hover:border-foreground/60 transition-all shrink-0 relative shadow-2xs"
                  :title="`Open photo ${idx + 1}`"
                >
                  <img
                    :src="img"
                    :alt="item.name"
                    class="h-full w-full object-cover transition-transform group-hover/thumb:scale-110"
                    loading="lazy"
                  />
                </a>
              </div>
              <span v-else class="text-muted-foreground/40 font-mono text-[11px]">—</span>
            </td>
            <td class="py-3 px-3">
              <span class="inline-block rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground font-mono">
                {{ item.category || '—' }}
              </span>
            </td>
            <!-- Workflow Status Pill Column -->
            <td class="py-3 px-3" @click.stop="openLeadModal(item, 'timeline')">
              <button
                type="button"
                class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all hover:opacity-90 hover:scale-105 cursor-pointer shadow-xs whitespace-nowrap"
                :class="getStatusPillClass(item.status)"
                title="Click to view & change workflow status"
              >
                <span>{{ getStatusStep(item.status).label }}</span>
              </button>
            </td>
            <td class="py-3 px-3">
              <a
                v-if="item.phone"
                :href="`tel:${item.phone}`"
                class="font-mono text-foreground hover:underline"
                @click.stop
              >
                {{ item.phone }}
              </a>
              <span v-else class="text-muted-foreground/60">—</span>
            </td>
            <td class="py-3 px-3">
              <div v-if="item.emails && item.emails.length" class="flex flex-wrap gap-1">
                <span
                  v-for="email in item.emails"
                  :key="email"
                  class="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-mono text-emerald-500 dark:text-emerald-400"
                  title="Click to copy"
                  @click.stop="copyText(email)"
                >
                  <Mail class="h-2.5 w-2.5" />
                  {{ email }}
                </span>
              </div>
              <span v-else class="text-muted-foreground/50 text-[11px]">None found</span>
            </td>
            <td class="py-3 px-3">
              <a
                v-if="item.website"
                :href="item.website"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground hover:underline"
                @click.stop
              >
                <Globe class="h-3 w-3 text-muted-foreground" />
                <span class="truncate max-w-[140px]">{{ cleanUrl(item.website) }}</span>
                <ExternalLink class="h-2.5 w-2.5 text-muted-foreground" />
              </a>
              <span v-else class="text-muted-foreground/50">—</span>
            </td>
            <td class="py-3 px-3 font-mono">
              <span v-if="item.rating" class="font-semibold text-foreground">
                ⭐ {{ item.rating }}
                <span v-if="item.reviewCount" class="text-muted-foreground font-normal text-[10px]">
                  ({{ item.reviewCount }})
                </span>
              </span>
              <span v-else class="text-muted-foreground/50">—</span>
            </td>
            <td class="py-3 px-3 text-muted-foreground truncate max-w-[240px]" :title="item.address">
              {{ item.address || '—' }}
            </td>
            <td class="py-3 px-3 text-center" @click.stop>
              <a
                v-if="item.mapsUrl"
                :href="item.mapsUrl"
                target="_blank"
                rel="noreferrer"
                class="inline-flex p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Open on Google Maps"
              >
                <MapPin class="h-3.5 w-3.5" />
              </a>
              <span v-else class="text-muted-foreground/40">—</span>
            </td>
            <!-- End Column: Actions Buttons (Eye + Delete) -->
            <td class="py-3 px-3 text-center" @click.stop>
              <div class="flex items-center justify-center gap-1">
                <button
                  type="button"
                  class="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Inspect client details"
                  @click.stop="openLeadModal(item, 'details')"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                  title="Delete this lead"
                  :disabled="deleteModal.loading"
                  @click.stop="confirmDeleteRow(item)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="!filteredAndSortedRows.length" class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="rounded-full border border-border bg-muted/40 p-3 mb-3">
          <Inbox class="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 class="text-sm font-semibold text-foreground">
          {{ isRunning ? 'Collecting leads in real-time...' : (activeFiltersCount > 0 ? 'No matching leads found' : 'No leads to display yet') }}
        </h4>
        <p class="text-xs text-muted-foreground mt-1 max-w-sm">
          {{
            isRunning
              ? 'The crawler is currently scrolling Google Maps and visiting company websites. Discovered leads will pop into this table automatically.'
              : (activeFiltersCount > 0 ? 'Try clearing or relaxing some of your search and filter criteria.' : 'Launch a Google Maps scrape job using the form above or pick an earlier run from history.')
          }}
        </p>
        <button
          v-if="activeFiltersCount > 0 && !isRunning"
          type="button"
          class="mt-3 text-xs font-mono text-foreground underline hover:text-foreground/80"
          @click="resetFilters"
        >
          Reset all filters
        </button>
      </div>
    </div>

    <!-- Single Unified Lead Detail & Status Modal (No Slideover) -->
    <LeadDetailModal
      :open="modalOpen"
      :lead="activeLead"
      :initial-tab="activeModalTab"
      @close="closeModal"
      @status-updated="handleStatusUpdated"
    />

    <!-- Deletion Confirmation Modal (Custom UI, No native window.confirm) -->
    <DeleteConfirmModal
      :open="deleteModal.open"
      :title="deleteModal.title"
      :message="deleteModal.message"
      :target-name="deleteModal.targetName"
      :confirm-text="deleteModal.confirmText"
      :loading="deleteModal.loading"
      :error-message="deleteModal.error"
      @confirm="executeConfirmedDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  Globe,
  Inbox,
  Layers,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X
} from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import LeadDetailModal from "./LeadDetailModal.vue";
import DeleteConfirmModal from "./DeleteConfirmModal.vue";
import { getStatusStep, STATUS_STEPS } from "./status-constants";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const props = defineProps({
  title: {
    type: String,
    default: "Google Maps Leads Table"
  },
  rows: {
    type: Array,
    default: () => []
  },
  isRunning: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["deleteLead", "bulkDelete", "clearAll", "statusUpdated"]);

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const showFilterPanel = ref(false);
const selectedIds = ref(new Set());

// Custom Deletion Confirmation Modal State
const deleteModal = reactive({
  open: false,
  title: "",
  message: "",
  targetName: "",
  confirmText: "",
  loading: false,
  error: "",
  type: "single", // 'single' | 'bulk' | 'clear_all'
  targetItem: null,
  targetIds: []
});

// Single Unified Lead Modal State (No Slideover)
const modalOpen = ref(false);
const activeLead = ref(null);
const activeModalTab = ref("details");

function openLeadModal(item, tab = "details") {
  activeLead.value = item;
  activeModalTab.value = tab;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  activeLead.value = null;
}

function handleStatusUpdated({ leadId, status }) {
  if (activeLead.value?.id === leadId) {
    activeLead.value.status = status;
  }
  emit("statusUpdated", { leadId, status });
}

function getStatusPillClass(status) {
  return getStatusStep(status).pillClass;
}

function countByStatus(statusId) {
  const target = String(statusId).toLowerCase();
  return props.rows.filter((r) => (r.status || "Just Got").trim().toLowerCase() === target).length;
}

// Clean up selection if underlying rows change
watch(
  () => props.rows,
  (newRows) => {
    if (!selectedIds.value.size) return;
    const validIds = new Set(newRows.map((r) => r.id).filter(Boolean));
    const next = new Set([...selectedIds.value].filter((id) => validIds.has(id)));
    if (next.size !== selectedIds.value.size) {
      selectedIds.value = next;
    }
  }
);

// Selection status
const isAllSelected = computed(() => {
  const visible = filteredAndSortedRows.value;
  if (!visible.length) return false;
  return visible.every((r) => r.id && selectedIds.value.has(r.id));
});

const isIndeterminate = computed(() => {
  const visible = filteredAndSortedRows.value;
  if (!visible.length) return false;
  const count = visible.filter((r) => r.id && selectedIds.value.has(r.id)).length;
  return count > 0 && count < visible.length;
});

function toggleSelect(id) {
  if (!id) return;
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
}

function toggleSelectAll() {
  const visible = filteredAndSortedRows.value;
  if (!visible.length) return;
  const next = new Set(selectedIds.value);
  if (isAllSelected.value) {
    for (const r of visible) {
      if (r.id) next.delete(r.id);
    }
  } else {
    for (const r of visible) {
      if (r.id) next.add(r.id);
    }
  }
  selectedIds.value = next;
}

function clearSelection() {
  selectedIds.value = new Set();
}

const filters = reactive({
  searchQuery: "",
  category: "all",
  status: "all",
  hasEmail: "all",
  hasPhone: "all",
  hasWebsite: "all",
  minRating: "all",
  minReviews: "all",
  location: "",
  sortBy: "default",
  quickPreset: "all"
});

// Category counts from active rows
const availableCategories = computed(() => {
  const counts = {};
  for (const r of props.rows) {
    const cat = (r.category || "").trim();
    if (cat && cat !== "—") {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});

// Quick Presets
const quickPresets = computed(() => {
  const allCount = props.rows.length;
  const withEmailCount = props.rows.filter((r) => r.emails && r.emails.length > 0).length;
  const withPhoneCount = props.rows.filter((r) => r.phone && r.phone.trim()).length;
  const withImagesCount = props.rows.filter((r) => r.images && r.images.length > 0).length;
  const highRatedCount = props.rows.filter((r) => r.rating !== null && Number(r.rating) >= 4.0).length;
  const missingWebsiteCount = props.rows.filter((r) => !r.website || !r.website.trim()).length;

  return [
    { id: "all", label: "All Leads", count: allCount },
    { id: "with_email", label: "With Email", count: withEmailCount },
    { id: "with_phone", label: "With Phone", count: withPhoneCount },
    { id: "with_images", label: "With Photos", count: withImagesCount },
    { id: "high_rating", label: "Rated 4.0+ ⭐", count: highRatedCount },
    { id: "needs_website", label: "Missing Website", count: missingWebsiteCount }
  ];
});

function selectQuickPreset(id) {
  filters.quickPreset = id;
}

// Active filters count
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.searchQuery.trim()) count++;
  if (filters.category !== "all") count++;
  if (filters.status !== "all") count++;
  if (filters.hasEmail !== "all") count++;
  if (filters.hasPhone !== "all") count++;
  if (filters.hasWebsite !== "all") count++;
  if (filters.minRating !== "all") count++;
  if (filters.minReviews !== "all") count++;
  if (filters.location.trim()) count++;
  if (filters.sortBy !== "default") count++;
  if (filters.quickPreset !== "all") count++;
  return count;
});

// Active filter pills for instant visual display and quick removal
const activeFilterPills = computed(() => {
  const pills = [];

  if (filters.quickPreset !== "all") {
    const label = quickPresets.value.find((p) => p.id === filters.quickPreset)?.label || filters.quickPreset;
    pills.push({
      id: "quickPreset",
      label: `Preset: ${label}`,
      clear: () => (filters.quickPreset = "all")
    });
  }

  if (filters.category !== "all") {
    pills.push({
      id: "category",
      label: `Category: ${filters.category}`,
      clear: () => (filters.category = "all")
    });
  }

  if (filters.status !== "all") {
    const step = getStatusStep(filters.status);
    pills.push({
      id: "status",
      label: `Status: ${step.label}`,
      clear: () => (filters.status = "all")
    });
  }

  if (filters.hasEmail !== "all") {
    pills.push({
      id: "hasEmail",
      label: filters.hasEmail === "yes" ? "Has Email" : "No Email",
      clear: () => (filters.hasEmail = "all")
    });
  }

  if (filters.hasPhone !== "all") {
    pills.push({
      id: "hasPhone",
      label: filters.hasPhone === "yes" ? "Has Phone" : "No Phone",
      clear: () => (filters.hasPhone = "all")
    });
  }

  if (filters.hasWebsite !== "all") {
    pills.push({
      id: "hasWebsite",
      label: filters.hasWebsite === "yes" ? "Has Website" : "No Website",
      clear: () => (filters.hasWebsite = "all")
    });
  }

  if (filters.minRating !== "all") {
    pills.push({
      id: "minRating",
      label: filters.minRating === "unrated" ? "Unrated" : `Rating: ≥ ${filters.minRating} ⭐`,
      clear: () => (filters.minRating = "all")
    });
  }

  if (filters.minReviews !== "all") {
    pills.push({
      id: "minReviews",
      label: `Reviews: ≥ ${filters.minReviews}`,
      clear: () => (filters.minReviews = "all")
    });
  }

  if (filters.location.trim()) {
    pills.push({
      id: "location",
      label: `Location: "${filters.location}"`,
      clear: () => (filters.location = "")
    });
  }

  if (filters.sortBy !== "default") {
    const sortLabels = {
      name_asc: "Name (A→Z)",
      name_desc: "Name (Z→A)",
      rating_desc: "Top Rating",
      rating_asc: "Lowest Rating",
      reviews_desc: "Most Reviews",
      emails_desc: "Most Emails"
    };
    pills.push({
      id: "sortBy",
      label: `Sort: ${sortLabels[filters.sortBy] || filters.sortBy}`,
      clear: () => (filters.sortBy = "default")
    });
  }

  if (filters.searchQuery.trim()) {
    pills.push({
      id: "searchQuery",
      label: `Search: "${filters.searchQuery}"`,
      clear: () => (filters.searchQuery = "")
    });
  }

  return pills;
});

function resetFilters() {
  filters.searchQuery = "";
  filters.category = "all";
  filters.status = "all";
  filters.hasEmail = "all";
  filters.hasPhone = "all";
  filters.hasWebsite = "all";
  filters.minRating = "all";
  filters.minReviews = "all";
  filters.location = "";
  filters.sortBy = "default";
  filters.quickPreset = "all";
}

// Filter and Sort Engine
const filteredAndSortedRows = computed(() => {
  let result = props.rows;

  // 1. Quick Presets
  if (filters.quickPreset === "with_email") {
    result = result.filter((r) => r.emails && r.emails.length > 0);
  } else if (filters.quickPreset === "with_phone") {
    result = result.filter((r) => r.phone && r.phone.trim());
  } else if (filters.quickPreset === "with_images") {
    result = result.filter((r) => r.images && r.images.length > 0);
  } else if (filters.quickPreset === "high_rating") {
    result = result.filter((r) => r.rating !== null && Number(r.rating) >= 4.0);
  } else if (filters.quickPreset === "needs_website") {
    result = result.filter((r) => !r.website || !r.website.trim());
  }

  // 2. Global Search
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter((item) => {
      const text = `${item.name || ""} ${item.category || ""} ${item.phone || ""} ${(item.emails || []).join(" ")} ${item.website || ""} ${item.address || ""} ${item.status || ""}`.toLowerCase();
      return text.includes(q);
    });
  }

  // 3. Category Filter
  if (filters.category !== "all") {
    result = result.filter(
      (item) => (item.category || "").toLowerCase() === filters.category.toLowerCase()
    );
  }

  // 4. Status Filter
  if (filters.status !== "all") {
    const s = filters.status.toLowerCase();
    result = result.filter(
      (item) => (item.status || "Just Got").trim().toLowerCase() === s
    );
  }

  // 5. Contact Filters
  if (filters.hasEmail === "yes") {
    result = result.filter((item) => item.emails && item.emails.length > 0);
  } else if (filters.hasEmail === "no") {
    result = result.filter((item) => !item.emails || item.emails.length === 0);
  }

  if (filters.hasPhone === "yes") {
    result = result.filter((item) => item.phone && item.phone.trim());
  } else if (filters.hasPhone === "no") {
    result = result.filter((item) => !item.phone || !item.phone.trim());
  }

  if (filters.hasWebsite === "yes") {
    result = result.filter((item) => item.website && item.website.trim());
  } else if (filters.hasWebsite === "no") {
    result = result.filter((item) => !item.website || !item.website.trim());
  }

  // 5. Min Rating
  if (filters.minRating === "unrated") {
    result = result.filter((item) => item.rating === null || item.rating === undefined);
  } else if (filters.minRating !== "all") {
    const threshold = Number(filters.minRating);
    result = result.filter((item) => item.rating !== null && Number(item.rating) >= threshold);
  }

  // 6. Min Reviews
  if (filters.minReviews !== "all") {
    const threshold = Number(filters.minReviews);
    result = result.filter(
      (item) => item.reviewCount !== null && Number(item.reviewCount) >= threshold
    );
  }

  // 7. Location Filter
  if (filters.location.trim()) {
    const loc = filters.location.toLowerCase().trim();
    result = result.filter((item) => (item.address || "").toLowerCase().includes(loc));
  }

  // 8. Sorting
  const sorted = [...result];
  if (filters.sortBy === "name_asc") {
    sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (filters.sortBy === "name_desc") {
    sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (filters.sortBy === "rating_desc") {
    sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  } else if (filters.sortBy === "rating_asc") {
    sorted.sort((a, b) => (a.rating ?? 999) - (b.rating ?? 999));
  } else if (filters.sortBy === "reviews_desc") {
    sorted.sort((a, b) => (b.reviewCount ?? -1) - (a.reviewCount ?? -1));
  } else if (filters.sortBy === "emails_desc") {
    sorted.sort((a, b) => (b.emails || []).length - (a.emails || []).length);
  }

  return sorted;
});

function inspectRecord(record) {
  selectedRecord.value = record;
  drawerOpen.value = true;
}

function cleanUrl(url) {
  try {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch {
    return url;
  }
}

function copyText(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

function exportToCsv() {
  const itemsToExport = filteredAndSortedRows.value;
  if (!itemsToExport.length) return;
  const keys = Object.keys(itemsToExport[0]).filter((k) => k !== "rawPayload" && k !== "raw_payload");
  const headerRow = keys.join(",");
  const dataRows = itemsToExport.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        const text = Array.isArray(val) ? val.join("; ") : String(val ?? "");
        return `"${text.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `google_maps_leads_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJson() {
  const itemsToExport = filteredAndSortedRows.value;
  if (!itemsToExport.length) return;
  const jsonContent =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itemsToExport, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", jsonContent);
  link.setAttribute("download", `google_maps_leads_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function closeDeleteModal() {
  if (deleteModal.loading) return;
  deleteModal.open = false;
  deleteModal.error = "";
  deleteModal.targetItem = null;
  deleteModal.targetIds = [];
}

function confirmDeleteRow(item) {
  if (!item) return;
  const name = item.name && item.name !== "—" ? item.name : "this lead";
  deleteModal.type = "single";
  deleteModal.targetItem = item;
  deleteModal.targetName = name;
  deleteModal.title = "Delete Lead";
  deleteModal.message = `Are you sure you want to permanently delete "${name}"? This will remove this lead and all associated details.`;
  deleteModal.confirmText = "Delete Lead";
  deleteModal.error = "";
  deleteModal.open = true;
}

function confirmBulkDelete() {
  const ids = Array.from(selectedIds.value);
  if (!ids.length) return;
  deleteModal.type = "bulk";
  deleteModal.targetIds = ids;
  deleteModal.targetName = `${ids.length} selected lead(s)`;
  deleteModal.title = "Delete Selected Leads";
  deleteModal.message = `Are you sure you want to permanently delete ${ids.length} selected lead(s)? This action cannot be undone.`;
  deleteModal.confirmText = `Delete ${ids.length} Leads`;
  deleteModal.error = "";
  deleteModal.open = true;
}

function confirmClearAll() {
  const total = props.rows.length;
  if (!total) return;
  deleteModal.type = "clear_all";
  deleteModal.targetName = `All ${total} leads`;
  deleteModal.title = "Clear All Leads";
  deleteModal.message = `Are you sure you want to permanently wipe ALL ${total} lead(s) in your archive? All business records and discovered contacts will be permanently removed.`;
  deleteModal.confirmText = "Wipe All Leads";
  deleteModal.error = "";
  deleteModal.open = true;
}

async function executeConfirmedDelete() {
  deleteModal.loading = true;
  deleteModal.error = "";

  try {
    if (deleteModal.type === "single") {
      const item = deleteModal.targetItem;
      if (!item) return;
      const leadId = item.id;

      if (typeof leadId === "string" && UUID_REGEX.test(leadId)) {
        if (workspaceStore && typeof workspaceStore.deleteBusiness === "function") {
          await workspaceStore.deleteBusiness(authStore.token, leadId);
        } else {
          await api.deleteBusiness(authStore.token, leadId);
          if (Array.isArray(workspaceStore.businesses)) {
            workspaceStore.businesses = workspaceStore.businesses.filter((b) => b.id !== leadId);
          }
          if (workspaceStore.jobResults) {
            Object.keys(workspaceStore.jobResults).forEach((jobId) => {
              workspaceStore.jobResults[jobId] = (workspaceStore.jobResults[jobId] || []).filter(
                (r) => r.business?.id !== leadId && r.business_id !== leadId
              );
            });
          }
        }
      } else {
        if (Array.isArray(workspaceStore.businesses)) {
          workspaceStore.businesses = workspaceStore.businesses.filter((b) => b.id !== leadId);
        }
      }

      const next = new Set(selectedIds.value);
      next.delete(leadId);
      selectedIds.value = next;

      if (activeLead.value?.id === leadId) {
        closeModal();
      }
      emit("deleteLead", leadId);
    } else if (deleteModal.type === "bulk") {
      const ids = deleteModal.targetIds;
      if (!ids.length) return;

      const validUuids = ids.filter((id) => typeof id === "string" && UUID_REGEX.test(id));
      if (validUuids.length) {
        if (workspaceStore && typeof workspaceStore.bulkDeleteBusinesses === "function") {
          await workspaceStore.bulkDeleteBusinesses(authStore.token, validUuids);
        } else {
          await api.bulkDeleteBusinesses(authStore.token, validUuids);
          const idSet = new Set(validUuids);
          if (Array.isArray(workspaceStore.businesses)) {
            workspaceStore.businesses = workspaceStore.businesses.filter((b) => !idSet.has(b.id));
          }
          if (workspaceStore.jobResults) {
            Object.keys(workspaceStore.jobResults).forEach((jobId) => {
              workspaceStore.jobResults[jobId] = (workspaceStore.jobResults[jobId] || []).filter(
                (r) => !idSet.has(r.business?.id) && !idSet.has(r.business_id)
              );
            });
          }
        }
      }

      const allSet = new Set(ids);
      if (Array.isArray(workspaceStore.businesses)) {
        workspaceStore.businesses = workspaceStore.businesses.filter((b) => !allSet.has(b.id));
      }

      if (activeLead.value && ids.includes(activeLead.value.id)) {
        closeModal();
      }
      selectedIds.value = new Set();
      emit("bulkDelete", ids);
    } else if (deleteModal.type === "clear_all") {
      if (workspaceStore && typeof workspaceStore.clearAllBusinesses === "function") {
        await workspaceStore.clearAllBusinesses(authStore.token);
      } else {
        await api.clearAllBusinesses(authStore.token);
        workspaceStore.businesses = [];
        workspaceStore.jobResults = {};
      }
      selectedIds.value = new Set();
      closeModal();
      emit("clearAll");
    }

    deleteModal.open = false;
  } catch (err) {
    console.error("Failed to execute delete:", err);
    deleteModal.error = err.message || String(err);
  } finally {
    deleteModal.loading = false;
  }
}
</script>
