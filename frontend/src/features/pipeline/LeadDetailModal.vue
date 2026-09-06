<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && lead"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto"
        @click="$emit('close')"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out transform"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in transform"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="open && lead"
            class="relative w-full max-w-xl sm:max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
            @click.stop
          >
            <!-- Modal Header -->
            <div class="p-5 border-b border-border bg-muted/20 space-y-3">
              <!-- Header Badges with proper spacing and solid colors -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    v-if="lead.category && lead.category !== '—'"
                    class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-muted border border-border text-foreground shadow-2xs"
                  >
                    {{ lead.category }}
                  </span>

                  <span
                    v-if="lead.rating"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-2xs"
                  >
                    ⭐ {{ lead.rating }}
                    <span v-if="lead.reviewCount" class="opacity-80 font-normal text-[11px]">
                      ({{ lead.reviewCount }} reviews)
                    </span>
                  </span>

                  <span
                    class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-semibold border shadow-2xs"
                    :class="currentStatusMeta.pillClass"
                  >
                    {{ currentStatusMeta.step }}. {{ currentStatusMeta.label }}
                  </span>
                </div>

                <button
                  type="button"
                  class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                  title="Close modal"
                  @click="$emit('close')"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- Business Name & Address -->
              <div class="space-y-1">
                <h3 class="text-xl sm:text-2xl font-bold text-foreground truncate tracking-tight" :title="lead.name">
                  {{ lead.name }}
                </h3>

                <div v-if="lead.address" class="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                  <MapPin class="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/80" />
                  <span class="break-words">{{ lead.address }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Action Shortcuts Bar -->
            <div class="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/10 overflow-x-auto flex-nowrap text-xs">
              <a
                v-if="lead.phone"
                :href="`tel:${lead.phone}`"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0 font-mono text-xs"
                title="Call phone number"
              >
                <Phone class="h-3 w-3 text-blue-500" />
                <span>{{ lead.phone }}</span>
              </a>

              <a
                v-if="lead.emails && lead.emails[0]"
                :href="`mailto:${lead.emails[0]}`"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0 font-mono text-xs"
                title="Send email"
              >
                <Mail class="h-3 w-3 text-emerald-500" />
                <span>{{ lead.emails[0] }}</span>
              </a>

              <a
                v-if="lead.website"
                :href="lead.website"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0 font-mono text-xs"
                title="Open website in new tab"
              >
                <Globe class="h-3 w-3 text-indigo-500" />
                <span>Website</span>
                <ExternalLink class="h-2.5 w-2.5 text-muted-foreground" />
              </a>

              <a
                v-if="lead.mapsUrl"
                :href="lead.mapsUrl"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0 font-mono text-xs"
                title="Open on Google Maps"
              >
                <MapPin class="h-3 w-3 text-rose-500" />
                <span>Google Maps</span>
                <ExternalLink class="h-2.5 w-2.5 text-muted-foreground" />
              </a>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 font-mono text-xs ml-auto cursor-pointer"
                title="Copy all lead details to clipboard"
                @click="copyAllDetails"
              >
                <Copy class="h-3 w-3" />
                <span>{{ copied ? 'Copied!' : 'Copy Summary' }}</span>
              </button>
            </div>

            <!-- Colored Segmented Navigation Tabs (Client Details FIRST with Colors) -->
            <div class="px-5 py-3 border-b border-border bg-background flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border">
                <!-- Tab 1: Client Details (First Tab, Colored Blue when active) -->
                <button
                  type="button"
                  :class="[
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs',
                    activeTab === 'details'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  ]"
                  @click="activeTab = 'details'"
                >
                  <User class="h-3.5 w-3.5" />
                  <span>Client Details</span>
                </button>

                <!-- Tab 2: Workflow Status (Second Tab, Colored Purple when active) -->
                <button
                  type="button"
                  :class="[
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs',
                    activeTab === 'timeline'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  ]"
                  @click="activeTab = 'timeline'"
                >
                  <Clock class="h-3.5 w-3.5" />
                  <span>Workflow Status</span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="activeTab === 'timeline' ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'"
                  >
                    Step {{ currentStatusMeta.step }}/7
                  </span>
                </button>
              </div>

              <span class="text-xs font-mono text-muted-foreground hidden sm:inline">
                {{ activeTab === 'details' ? 'Client Profile & Channels' : '7 Lifecycle Stages' }}
              </span>
            </div>

            <!-- Status Update Error Banner (No browser alerts) -->
            <div
              v-if="statusError"
              class="mx-5 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 font-mono flex items-center justify-between gap-2"
            >
              <span>Failed to update status: {{ statusError }}</span>
              <button
                type="button"
                class="text-red-500 hover:text-red-400 p-0.5"
                @click="statusError = ''"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="overflow-y-auto p-5 space-y-5 flex-1 text-sm">
              <!-- ======================================================== -->
              <!-- TAB 1: CLIENT DETAILS (Understood by Common People) -->
              <!-- ======================================================== -->
              <div v-if="activeTab === 'details'" class="space-y-5">
                <!-- 1. Quick Contact Channels (4 Grid Cards) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Phone Card -->
                  <div class="rounded-xl border border-border bg-background p-3.5 flex items-start gap-3 shadow-2xs">
                    <div class="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <Phone class="h-4 w-4" />
                    </div>
                    <div class="space-y-1 min-w-0 flex-1">
                      <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Phone Number</div>
                      <div v-if="lead.phone" class="font-mono text-xs font-semibold text-foreground truncate">
                        {{ lead.phone }}
                      </div>
                      <div v-else class="text-xs text-muted-foreground italic">Not listed on Maps</div>
                      <div v-if="lead.phone" class="pt-1 flex items-center gap-2">
                        <a
                          :href="`tel:${lead.phone}`"
                          class="text-[11px] font-mono text-blue-500 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Call Now →
                        </a>
                        <button
                          type="button"
                          class="text-[11px] font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
                          @click="copyField('phone', lead.phone)"
                        >
                          {{ copiedField === 'phone' ? 'Copied!' : 'Copy' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Email Card -->
                  <div class="rounded-xl border border-border bg-background p-3.5 flex items-start gap-3 shadow-2xs">
                    <div class="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Mail class="h-4 w-4" />
                    </div>
                    <div class="space-y-1 min-w-0 flex-1">
                      <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Email Address</div>
                      <div v-if="lead.emails && lead.emails.length" class="font-mono text-xs font-semibold text-foreground truncate">
                        {{ lead.emails[0] }}
                        <span v-if="lead.emails.length > 1" class="text-muted-foreground font-normal text-[10px]">
                          (+{{ lead.emails.length - 1 }} more)
                        </span>
                      </div>
                      <div v-else class="text-xs text-muted-foreground italic">No email discovered yet</div>
                      <div v-if="lead.emails && lead.emails.length" class="pt-1 flex items-center gap-2">
                        <a
                          :href="`mailto:${lead.emails[0]}`"
                          class="text-[11px] font-mono text-emerald-500 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Send Email →
                        </a>
                        <button
                          type="button"
                          class="text-[11px] font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
                          @click="copyField('email', lead.emails[0])"
                        >
                          {{ copiedField === 'email' ? 'Copied!' : 'Copy' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Website Card -->
                  <div class="rounded-xl border border-border bg-background p-3.5 flex items-start gap-3 shadow-2xs">
                    <div class="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                      <Globe class="h-4 w-4" />
                    </div>
                    <div class="space-y-1 min-w-0 flex-1">
                      <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Official Website</div>
                      <div v-if="lead.website" class="font-mono text-xs font-semibold text-foreground truncate" :title="lead.website">
                        {{ cleanUrl(lead.website) }}
                      </div>
                      <div v-else class="text-xs text-muted-foreground italic">Missing website</div>
                      <div v-if="lead.website" class="pt-1 flex items-center gap-2">
                        <a
                          :href="lead.website"
                          target="_blank"
                          rel="noreferrer"
                          class="text-[11px] font-mono text-indigo-500 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Visit Site <ExternalLink class="h-2.5 w-2.5" />
                        </a>
                        <button
                          type="button"
                          class="text-[11px] font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
                          @click="copyField('website', lead.website)"
                        >
                          {{ copiedField === 'website' ? 'Copied!' : 'Copy' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Google Rating Card -->
                  <div class="rounded-xl border border-border bg-background p-3.5 flex items-start gap-3 shadow-2xs">
                    <div class="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Star class="h-4 w-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div class="space-y-1 min-w-0 flex-1">
                      <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Reputation on Google</div>
                      <div v-if="lead.rating" class="font-mono text-xs font-semibold text-foreground">
                        ⭐ {{ lead.rating }} / 5.0
                        <span v-if="lead.reviewCount" class="text-muted-foreground font-normal text-[11px]">
                          ({{ lead.reviewCount }} reviews)
                        </span>
                      </div>
                      <div v-else class="text-xs text-muted-foreground italic">No rating on record</div>
                      <div v-if="lead.mapsUrl" class="pt-1">
                        <a
                          :href="lead.mapsUrl"
                          target="_blank"
                          rel="noreferrer"
                          class="text-[11px] font-mono text-amber-500 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          View on Maps <ExternalLink class="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Business Overview Card -->
                <div class="rounded-xl border border-border bg-background p-4 space-y-3.5 shadow-xs">
                  <div class="flex items-center justify-between pb-2 border-b border-border">
                    <div class="flex items-center gap-2">
                      <Building2 class="h-4 w-4 text-foreground" />
                      <h4 class="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                        Business Overview
                      </h4>
                    </div>
                    <span class="text-[11px] font-mono text-muted-foreground">
                      Captured from Google Maps
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div class="space-y-1">
                      <span class="text-[11px] font-mono text-muted-foreground uppercase">Business Name</span>
                      <div class="font-semibold text-foreground text-sm flex items-center justify-between gap-2">
                        <span>{{ lead.name }}</span>
                        <button
                          type="button"
                          class="text-muted-foreground hover:text-foreground"
                          title="Copy name"
                          @click="copyField('name', lead.name)"
                        >
                          <Copy class="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div class="space-y-1">
                      <span class="text-[11px] font-mono text-muted-foreground uppercase">Industry / Category</span>
                      <div class="font-mono text-foreground font-medium flex items-center gap-1.5">
                        <span class="inline-block px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                          {{ lead.category || 'General Business' }}
                        </span>
                      </div>
                    </div>

                    <div class="space-y-1 sm:col-span-2">
                      <span class="text-[11px] font-mono text-muted-foreground uppercase">Complete Address</span>
                      <div class="text-foreground text-xs leading-relaxed flex items-start justify-between gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/70">
                        <span>{{ lead.address || 'Address not listed' }}</span>
                        <button
                          v-if="lead.address"
                          type="button"
                          class="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                          title="Copy address"
                          @click="copyField('address', lead.address)"
                        >
                          <Copy class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Hours (if available) -->
                    <div v-if="lead.hours && lead.hours.length" class="space-y-1.5 sm:col-span-2">
                      <span class="text-[11px] font-mono text-muted-foreground uppercase">Opening Hours</span>
                      <div class="bg-muted/30 rounded-lg p-2.5 border border-border/70 space-y-1 text-xs font-mono">
                        <div v-for="h in lead.hours" :key="h" class="text-muted-foreground">
                          {{ h }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. Current Pipeline Stage Banner -->
                <div class="rounded-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div class="space-y-1">
                    <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Current Lead Workflow Status
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-semibold shadow-xs"
                        :class="currentStatusMeta.pillClass"
                      >
                        {{ currentStatusMeta.step }}. {{ currentStatusMeta.label }}
                      </span>
                    </div>
                    <p class="text-xs text-muted-foreground pt-0.5">
                      {{ currentStatusMeta.detail }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="h-9 px-3 rounded-lg border border-purple-500/40 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                    @click="activeTab = 'timeline'"
                  >
                    <span>Change Status</span>
                    <span>→</span>
                  </button>
                </div>

           
              </div>

              <!-- ======================================================== -->
              <!-- TAB 2: WORKFLOW STATUS (Timeline 1 to 7) -->
              <!-- ======================================================== -->
              <div v-else class="space-y-5">
                <!-- Current Active Status Banner -->
                <div class="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div class="space-y-1">
                    <div class="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Current Lead Status
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-semibold shadow-xs"
                        :class="currentStatusMeta.pillClass"
                      >
                        {{ currentStatusMeta.step }}. {{ currentStatusMeta.label }}
                      </span>
                      <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                        ACTIVE
                      </span>
                    </div>
                    <p class="text-xs text-muted-foreground pt-0.5">
                      {{ currentStatusMeta.detail }}
                    </p>
                  </div>

                  <div v-if="isUpdating" class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <Loader2 class="h-4 w-4 animate-spin text-foreground" />
                    <span>Saving...</span>
                  </div>
                </div>

                <!-- Timeline of Status Pills (1 to 7 from top to bottom) -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
                      Lifecycle Progression (1 to 7)
                    </h4>
                    <span class="text-[11px] font-mono text-muted-foreground">
                      Click any pill to update
                    </span>
                  </div>

                  <div class="relative pl-6 space-y-3 pt-2">
                    <!-- Vertical Continuous Connector Line -->
                    <div class="absolute left-3 top-4 bottom-4 w-0.5 bg-border/80 -translate-x-1/2"></div>

                    <!-- Timeline Step Cards -->
                    <div
                      v-for="status in STATUS_STEPS"
                      :key="status.id"
                      class="relative group"
                    >
                      <!-- Step Indicator Circle (Number or Checkmark) -->
                      <div
                        :class="[
                          'absolute -left-6 top-3 -translate-x-1/2 flex items-center justify-center h-6 w-6 rounded-full border text-[11px] font-mono font-bold transition-all z-10',
                          isCurrent(status.id)
                            ? status.activeStepColor
                            : 'bg-background border-border text-muted-foreground group-hover:border-foreground/40 group-hover:text-foreground'
                        ]"
                      >
                        <Check v-if="isCurrent(status.id)" class="h-3.5 w-3.5 stroke-[3]" />
                        <span v-else>{{ status.step }}</span>
                      </div>

                      <!-- Interactive Pill Card -->
                      <button
                        type="button"
                        :disabled="isUpdating"
                        :class="[
                          'w-full text-left rounded-xl border p-3 sm:p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer',
                          isCurrent(status.id)
                            ? 'border-foreground/40 bg-muted/60 ring-1 ring-foreground/20 shadow-xs'
                            : 'border-border/80 bg-background hover:bg-muted/30 hover:border-foreground/30 shadow-2xs'
                        ]"
                        @click="selectStatus(status.id)"
                      >
                        <div class="space-y-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span
                              :class="[
                                'inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all',
                                isCurrent(status.id)
                                  ? status.activePillClass
                                  : status.pillClass
                              ]"
                            >
                              <span>{{ status.step }}. {{ status.label }}</span>
                            </span>

                            <span
                              v-if="isCurrent(status.id)"
                              class="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-semibold"
                            >
                              ✓ Current Stage
                            </span>
                          </div>

                          <p class="text-xs text-muted-foreground pl-1">
                            {{ status.detail }}
                          </p>
                        </div>

                        <div class="sm:text-right shrink-0">
                          <span
                            v-if="isCurrent(status.id)"
                            class="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-foreground text-background font-bold"
                          >
                            Selected
                          </span>
                          <span
                            v-else
                            class="text-[11px] font-mono text-muted-foreground/80 group-hover:text-foreground group-hover:underline inline-flex items-center gap-1"
                          >
                            <span>Apply</span>
                            <span class="text-xs">→</span>
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between border-t border-border px-5 py-3.5 bg-muted/20">
              <div class="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span>Status:</span>
                <span
                  class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border"
                  :class="currentStatusMeta.pillClass"
                >
                  {{ currentStatusMeta.label }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="activeTab === 'details'"
                  type="button"
                  class="text-xs font-mono text-purple-400 hover:text-purple-300 underline mr-2 cursor-pointer"
                  @click="activeTab = 'timeline'"
                >
                  Go to Status Timeline →
                </button>
                <AppButton variant="outline" size="sm" @click="$emit('close')">
                  Done
                </AppButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  X
} from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import { STATUS_STEPS, getStatusStep } from "./status-constants";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  lead: {
    type: Object,
    default: null
  },
  initialTab: {
    type: String,
    default: "details" // 'details' | 'timeline'
  }
});

const emit = defineEmits(["close", "statusUpdated"]);

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const activeTab = ref(props.initialTab || "details");
const isUpdating = ref(false);
const copied = ref(false);
const copiedField = ref("");
const showAdvanced = ref(false);
const statusError = ref("");

watch(
  () => props.initialTab,
  (tab) => {
    if (tab) activeTab.value = tab;
  }
);

watch(
  () => props.open,
  (isOpen) => {
    statusError.value = "";
    copiedField.value = "";
    if (isOpen) {
      activeTab.value = props.initialTab || "details";
    }
  }
);

const currentStatusMeta = computed(() => {
  if (!props.lead) return STATUS_STEPS[0];
  return getStatusStep(props.lead.status);
});

function isCurrent(statusId) {
  if (!props.lead) return false;
  const curr = (props.lead.status || "Just Got").trim().toLowerCase();
  return curr === statusId.toLowerCase();
}

async function selectStatus(newStatus) {
  if (!props.lead) return;
  const leadId = props.lead.id;
  if (!leadId) return;

  statusError.value = "";
  const previousStatus = props.lead.status;
  props.lead.status = newStatus;

  try {
    isUpdating.value = true;
    if (workspaceStore && typeof workspaceStore.updateBusinessStatus === "function") {
      await workspaceStore.updateBusinessStatus(authStore.token, leadId, newStatus);
    } else {
      const res = await api.updateBusinessStatus(authStore.token, leadId, newStatus);
      const updatedBusiness = res?.business;
      if (Array.isArray(workspaceStore.businesses)) {
        const bIndex = workspaceStore.businesses.findIndex((b) => b.id === leadId);
        if (bIndex !== -1) {
          workspaceStore.businesses[bIndex] = {
            ...workspaceStore.businesses[bIndex],
            status: newStatus,
            ...(updatedBusiness || {})
          };
        }
      }
      if (workspaceStore.jobResults) {
        Object.keys(workspaceStore.jobResults).forEach((jobId) => {
          workspaceStore.jobResults[jobId] = (workspaceStore.jobResults[jobId] || []).map((r) => {
            if (r.business?.id === leadId || r.business_id === leadId) {
              return {
                ...r,
                business: {
                  ...(r.business || {}),
                  status: newStatus,
                  ...(updatedBusiness || {})
                }
              };
            }
            return r;
          });
        });
      }
    }
    emit("statusUpdated", { leadId, status: newStatus });
  } catch (err) {
    console.error("Failed to update status:", err);
    props.lead.status = previousStatus;
    statusError.value = err.message || String(err);
  } finally {
    isUpdating.value = false;
  }
}

const technicalFields = computed(() => {
  if (!props.lead) return [];
  const l = props.lead;
  const items = [];
  if (l.id) items.push({ label: "Database ID", value: String(l.id) });
  if (l.placeId || l.place_id) items.push({ label: "Google Place ID", value: String(l.placeId || l.place_id) });
  if (l.dedupeKey || l.dedupe_key) items.push({ label: "Dedupe Key", value: String(l.dedupeKey || l.dedupe_key) });
  if (l.latitude && l.longitude) items.push({ label: "Coordinates (Lat, Lng)", value: `${l.latitude}, ${l.longitude}` });
  if (l.createdAt || l.created_at) {
    items.push({ label: "Created At", value: new Date(l.createdAt || l.created_at).toLocaleString() });
  }
  return items;
});

function cleanUrl(url) {
  if (!url) return "";
  try {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  } catch {
    return url;
  }
}

function copyField(field, text) {
  if (!text || text === "—") return;
  navigator.clipboard?.writeText(text);
  copiedField.value = field;
  setTimeout(() => {
    if (copiedField.value === field) copiedField.value = "";
  }, 2000);
}

function copyText(text) {
  if (!text || text === "—") return;
  navigator.clipboard?.writeText(text);
}

function copyAllDetails() {
  if (!props.lead) return;
  const l = props.lead;
  const lines = [
    `Name: ${l.name || "—"}`,
    `Category: ${l.category || "—"}`,
    `Phone: ${l.phone || "—"}`,
    `Email: ${(l.emails || []).join(", ") || "—"}`,
    `Website: ${l.website || "—"}`,
    `Address: ${l.address || "—"}`,
    `Rating: ${l.rating ? `${l.rating} (${l.reviewCount || 0} reviews)` : "—"}`,
    `Status: ${currentStatusMeta.value.label}`
  ];
  navigator.clipboard?.writeText(lines.join("\n"));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>
