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
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto"
        @click="$emit('close')"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out transform"
          enter-from-class="opacity-0 scale-98 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in transform"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-98 translate-y-1"
        >
          <div
            v-if="open && lead"
            class="relative w-full max-w-lg sm:max-w-xl rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            @click.stop
          >
            <!-- Minimal Modal Header -->
            <div class="px-4 py-4 sm:px-5 sm:py-4 border-b border-border bg-background">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1 min-w-0 flex-1">
                  <!-- Meta line: Category & Rating (clean text, no excessive badges) -->
                  <div class="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span v-if="lead.category && lead.category !== '—'" class="font-medium text-foreground">
                      {{ lead.category }}
                    </span>
                    <span v-if="lead.category && lead.category !== '—' && lead.rating">•</span>
                    <span v-if="lead.rating" class="inline-flex items-center gap-1 font-mono text-foreground">
                      <span>⭐</span>
                      <span>{{ lead.rating }}</span>
                      <span v-if="lead.reviewCount" class="text-muted-foreground">({{ lead.reviewCount }})</span>
                    </span>
                  </div>

                  <!-- Business Name -->
                  <h3 class="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight" :title="lead.name">
                    {{ lead.name }}
                  </h3>

                  <!-- Address line -->
                  <div v-if="lead.address" class="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <MapPin class="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span class="truncate">{{ lead.address }}</span>
                  </div>
                </div>

                <!-- Close button -->
                <button
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                  title="Close"
                  @click="$emit('close')"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- Minimal Segmented Tabs -->
              <div class="mt-4 flex rounded-lg border border-border p-0.5 bg-muted/40 text-xs font-medium">
                <button
                  type="button"
                  :class="[
                    'flex-1 py-1.5 px-3 rounded-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5',
                    activeTab === 'details'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                  @click="activeTab = 'details'"
                >
                  <User class="h-3.5 w-3.5" />
                  <span>Contact & Info</span>
                </button>

                <button
                  type="button"
                  :class="[
                    'flex-1 py-1.5 px-3 rounded-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5',
                    activeTab === 'timeline'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                  @click="activeTab = 'timeline'"
                >
                  <Clock class="h-3.5 w-3.5" />
                  <span>Status</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shadow-xs"
                    :class="currentStatusMeta.pillClass"
                  >
                    {{ currentStatusMeta.label }}
                  </span>
                </button>

                <button
                  type="button"
                  :class="[
                    'flex-1 py-1.5 px-3 rounded-md transition-all text-center cursor-pointer flex items-center justify-center gap-1.5',
                    activeTab === 'ai'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                  @click="activeTab = 'ai'"
                >
                  <Sparkles class="h-3.5 w-3.5" />
                  <span>AI Outreach</span>
                </button>
              </div>
            </div>

            <!-- Error Banner -->
            <div
              v-if="statusError"
              class="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500 font-mono flex items-center justify-between gap-2"
            >
              <span>{{ statusError }}</span>
              <button
                type="button"
                class="text-red-500 hover:text-red-400 p-0.5"
                @click="statusError = ''"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>

            <!-- Modal Body (Scrollable, mobile-first) -->
            <div class="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 text-sm">
              <!-- ======================================================== -->
              <!-- TAB 1: CONTACT & INFO -->
              <!-- ======================================================== -->
              <div v-if="activeTab === 'details'" class="space-y-4">
                <!-- Contact Channels List -->
                <div class="rounded-lg border border-border divide-y divide-border bg-background overflow-hidden text-xs">
                  <!-- Phone Row -->
                  <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <Phone class="h-4 w-4 text-muted-foreground shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[10px] text-muted-foreground uppercase font-mono">Phone</div>
                        <div v-if="lead.phone" class="font-mono font-medium text-foreground truncate">
                          {{ lead.phone }}
                        </div>
                        <div v-else class="text-muted-foreground italic">Not listed</div>
                      </div>
                    </div>
                    <div v-if="lead.phone" class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <a
                        :href="`tel:${lead.phone}`"
                        class="px-2.5 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-mono"
                      >
                        Call
                      </a>
                      <button
                        type="button"
                        class="px-2.5 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono cursor-pointer"
                        @click="copyField('phone', lead.phone)"
                      >
                        {{ copiedField === 'phone' ? 'Copied' : 'Copy' }}
                      </button>
                    </div>
                  </div>

                  <!-- Email Row -->
                  <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <Mail class="h-4 w-4 text-muted-foreground shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[10px] text-muted-foreground uppercase font-mono">Email</div>
                        <div v-if="lead.emails && lead.emails.length" class="font-mono font-medium text-foreground truncate" :title="lead.emails.join(', ')">
                          {{ lead.emails[0] }}
                          <span v-if="lead.emails.length > 1" class="text-muted-foreground text-[10px]">
                            (+{{ lead.emails.length - 1 }})
                          </span>
                        </div>
                        <div v-else class="text-muted-foreground italic">No email found</div>
                      </div>
                    </div>
                    <div v-if="lead.emails && lead.emails.length" class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <a
                        :href="`mailto:${lead.emails[0]}`"
                        class="px-2.5 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-mono"
                      >
                        Email
                      </a>
                      <button
                        type="button"
                        class="px-2.5 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono cursor-pointer"
                        @click="copyField('email', lead.emails[0])"
                      >
                        {{ copiedField === 'email' ? 'Copied' : 'Copy' }}
                      </button>
                    </div>
                  </div>

                  <!-- Website Row -->
                  <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <Globe class="h-4 w-4 text-muted-foreground shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[10px] text-muted-foreground uppercase font-mono">Website</div>
                        <div v-if="lead.website" class="font-mono font-medium text-foreground truncate" :title="lead.website">
                          {{ cleanUrl(lead.website) }}
                        </div>
                        <div v-else class="text-muted-foreground italic">No website listed</div>
                      </div>
                    </div>
                    <div v-if="lead.website" class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <a
                        :href="lead.website"
                        target="_blank"
                        rel="noreferrer"
                        class="px-2.5 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-mono inline-flex items-center gap-1"
                      >
                        <span>Visit</span>
                        <ExternalLink class="h-2.5 w-2.5 opacity-60" />
                      </a>
                      <button
                        type="button"
                        class="px-2.5 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-mono cursor-pointer"
                        @click="copyField('website', lead.website)"
                      >
                        {{ copiedField === 'website' ? 'Copied' : 'Copy' }}
                      </button>
                    </div>
                  </div>

                  <!-- Google Maps Row -->
                  <div v-if="lead.mapsUrl" class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <MapPin class="h-4 w-4 text-muted-foreground shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[10px] text-muted-foreground uppercase font-mono">Google Maps Listing</div>
                        <div class="text-foreground truncate">
                          {{ lead.address || lead.name }}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <a
                        :href="lead.mapsUrl"
                        target="_blank"
                        rel="noreferrer"
                        class="px-2.5 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-mono inline-flex items-center gap-1"
                      >
                        <span>View on Maps</span>
                        <ExternalLink class="h-2.5 w-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Opening Hours (if present) -->
                <div v-if="lead.hours && lead.hours.length" class="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div class="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Opening Hours
                  </div>
                  <div class="space-y-1 text-xs text-muted-foreground font-mono">
                    <div v-for="h in lead.hours" :key="h" class="truncate">
                      {{ h }}
                    </div>
                  </div>
                </div>

                <!-- Quick Status Banner -->
                <div class="rounded-lg border border-border bg-muted/20 p-3 flex items-center justify-between gap-3 text-xs">
                  <div class="space-y-1">
                    <div class="text-[10px] text-muted-foreground uppercase font-mono">Current Status</div>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold shadow-xs"
                      :class="currentStatusMeta.pillClass"
                    >
                      {{ currentStatusMeta.step }}. {{ currentStatusMeta.label }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="text-xs font-mono text-foreground hover:underline cursor-pointer"
                    @click="activeTab = 'timeline'"
                  >
                    Change status →
                  </button>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- TAB 2: STATUS MANAGEMENT -->
              <!-- ======================================================== -->
              <div v-else-if="activeTab === 'timeline'" class="space-y-3">
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Select lead status:</span>
                  <span v-if="isUpdating" class="flex items-center gap-1.5 text-foreground font-mono">
                    <Loader2 class="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </span>
                </div>

                <!-- Status Step List (Clean, minimal, 1-7 with colors) -->
                <div class="rounded-lg border border-border divide-y divide-border bg-background overflow-hidden text-xs">
                  <button
                    v-for="status in STATUS_STEPS"
                    :key="status.id"
                    type="button"
                    :disabled="isUpdating"
                    :class="[
                      'w-full text-left p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer',
                      isCurrent(status.id)
                        ? 'bg-muted/60 font-medium'
                        : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                    ]"
                    @click="selectStatus(status.id)"
                  >
                    <div class="space-y-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold shadow-xs"
                          :class="isCurrent(status.id) ? status.activePillClass : status.pillClass"
                        >
                          {{ status.step }}. {{ status.label }}
                        </span>
                        <span v-if="isCurrent(status.id)" class="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-semibold">
                          ✓ Current Stage
                        </span>
                      </div>
                      <p class="text-[11px] text-muted-foreground truncate">
                        {{ status.detail }}
                      </p>
                    </div>

                    <div class="shrink-0">
                      <span
                        v-if="isCurrent(status.id)"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-foreground text-background font-medium"
                      >
                        <Check class="h-3 w-3" />
                        <span>Active</span>
                      </span>
                      <span
                        v-else
                        class="text-[11px] text-muted-foreground hover:text-foreground font-mono"
                      >
                        Set →
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- ======================================================== -->
              <!-- TAB 3: AI OUTREACH -->
              <!-- ======================================================== -->
              <div v-else class="space-y-4">
                <!-- AI Generator Bar -->
                <div class="rounded-lg border border-border bg-background p-3.5 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="space-y-0.5">
                      <div class="text-xs font-semibold text-foreground">Draft Outreach Message</div>
                      <p class="text-[11px] text-muted-foreground">
                        Generate tailored email and WhatsApp copy for {{ lead.name }}.
                      </p>
                    </div>

                    <AppButton
                      variant="primary"
                      size="sm"
                      :disabled="generatingPitch"
                      class="shrink-0"
                      @click="generatePitch"
                    >
                      <Loader2 v-if="generatingPitch" class="h-3.5 w-3.5 animate-spin" />
                      <Sparkles v-else class="h-3.5 w-3.5" />
                      <span>{{ generatingPitch ? 'Drafting...' : (pitchData ? 'Regenerate' : 'Generate Message') }}</span>
                    </AppButton>
                  </div>

                  <!-- Goal presets -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                    <span class="text-[11px] text-muted-foreground font-mono">Goal:</span>
                    <button
                      v-for="goal in ['Intro Call', 'Product Demo', 'Partnership', 'Service Inquiry']"
                      :key="goal"
                      type="button"
                      :class="[
                        'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer',
                        selectedGoal === goal
                          ? 'bg-foreground text-background border-foreground font-medium'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      ]"
                      @click="selectedGoal = goal"
                    >
                      {{ goal }}
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <div
                  v-if="pitchError"
                  class="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500 font-mono"
                >
                  {{ pitchError }}
                </div>

                <!-- Results -->
                <div v-if="pitchData" class="space-y-3">
                  <!-- Angle / Hook -->
                  <div v-if="pitchData.valueAngle" class="rounded-lg border border-border bg-muted/20 p-2.5 text-xs text-foreground">
                    <span class="font-mono text-muted-foreground text-[11px]">Hook: </span>
                    <span>{{ pitchData.valueAngle }}</span>
                  </div>

                  <!-- Email Box -->
                  <div class="rounded-lg border border-border bg-background p-3.5 space-y-2 text-xs">
                    <div class="flex items-center justify-between border-b border-border pb-2">
                      <span class="font-medium text-foreground">Cold Email</span>
                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          class="px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-[11px] cursor-pointer"
                          @click="copyEmailContent"
                        >
                          {{ copiedEmail ? 'Copied' : 'Copy' }}
                        </button>
                        <a
                          v-if="lead.emails && lead.emails[0]"
                          :href="`mailto:${lead.emails[0]}?subject=${encodeURIComponent(pitchData.subject || '')}&body=${encodeURIComponent(pitchData.emailBody || '')}`"
                          class="px-2 py-0.5 rounded bg-foreground text-background font-mono text-[11px]"
                        >
                          Open in Mail
                        </a>
                      </div>
                    </div>
                    <div class="space-y-1">
                      <div class="font-mono text-muted-foreground text-[11px]">
                        Subject: <strong class="text-foreground font-sans font-medium">{{ pitchData.subject }}</strong>
                      </div>
                      <div class="rounded border border-border/60 bg-muted/20 p-2.5 text-xs whitespace-pre-line leading-relaxed text-foreground">
                        {{ pitchData.emailBody }}
                      </div>
                    </div>
                  </div>

                  <!-- WhatsApp Box (if phone available) -->
                  <div class="rounded-lg border border-border bg-background p-3.5 space-y-2 text-xs">
                    <div class="flex items-center justify-between border-b border-border pb-2">
                      <span class="font-medium text-foreground">WhatsApp Pitch</span>
                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          class="px-2 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-mono text-[11px] cursor-pointer"
                          @click="copyWhatsAppContent"
                        >
                          {{ copiedWhatsApp ? 'Copied' : 'Copy' }}
                        </button>
                        <a
                          v-if="whatsAppUrl"
                          :href="whatsAppUrl"
                          target="_blank"
                          rel="noreferrer"
                          class="px-2 py-0.5 rounded bg-foreground text-background font-mono text-[11px]"
                        >
                          WhatsApp Web
                        </a>
                      </div>
                    </div>
                    <div class="rounded border border-border/60 bg-muted/20 p-2.5 text-xs whitespace-pre-line leading-relaxed text-foreground">
                      {{ pitchData.whatsAppPitch }}
                    </div>
                  </div>
                </div>

                <!-- Company Insights / Enrichment -->
                <div class="rounded-lg border border-border bg-background p-3.5 space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-foreground">Company Overview & Roles</span>
                    <button
                      v-if="!enrichmentData"
                      type="button"
                      :disabled="enriching"
                      class="font-mono text-[11px] text-foreground hover:underline cursor-pointer"
                      @click="enrichLead"
                    >
                      {{ enriching ? 'Analyzing...' : 'Generate Overview' }}
                    </button>
                  </div>

                  <div v-if="enrichmentData" class="space-y-2 text-xs pt-1">
                    <p class="text-muted-foreground leading-relaxed">{{ enrichmentData.summary }}</p>
                    <div v-if="enrichmentData.targetDecisionMakers && enrichmentData.targetDecisionMakers.length" class="space-y-1">
                      <span class="text-[10px] font-mono uppercase text-muted-foreground">Target Roles:</span>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="role in enrichmentData.targetDecisionMakers"
                          :key="role"
                          class="px-2 py-0.5 rounded border border-border bg-muted text-[11px] font-mono text-foreground"
                        >
                          {{ role }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="!enriching" class="text-muted-foreground italic text-xs">
                    Get an instant company overview and buyer personas.
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5 bg-muted/10 text-xs">
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground font-mono cursor-pointer inline-flex items-center gap-1.5"
                @click="copyAllDetails"
              >
                <Copy class="h-3.5 w-3.5" />
                <span>{{ copied ? 'Copied Summary!' : 'Copy Summary' }}</span>
              </button>

              <AppButton variant="outline" size="sm" @click="$emit('close')">
                Done
              </AppButton>
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
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
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
    default: "details" // 'details' | 'timeline' | 'ai'
  }
});

const emit = defineEmits(["close", "statusUpdated"]);

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const activeTab = ref(props.initialTab || "details");
const isUpdating = ref(false);
const copied = ref(false);
const copiedField = ref("");
const statusError = ref("");

// AI Outreach State
const selectedGoal = ref("Intro Call");
const generatingPitch = ref(false);
const pitchData = ref(null);
const pitchError = ref("");
const copiedEmail = ref(false);
const copiedWhatsApp = ref(false);
const enriching = ref(false);
const enrichmentData = ref(null);

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
      pitchData.value = null;
      pitchError.value = "";
      enrichmentData.value = null;
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

const whatsAppUrl = computed(() => {
  if (!props.lead?.phone) return "";
  const cleanPhone = props.lead.phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) return "";
  const text = encodeURIComponent(pitchData.value?.whatsAppPitch || "");
  return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
});

async function generatePitch() {
  if (!props.lead?.id) return;
  generatingPitch.value = true;
  pitchError.value = "";
  try {
    const res = await api.generateLeadPitch(authStore.token, props.lead.id, {
      pitchGoal: selectedGoal.value
    });
    pitchData.value = res.pitch;
  } catch (err) {
    pitchError.value = err.message || "Failed to generate pitch.";
  } finally {
    generatingPitch.value = false;
  }
}

async function enrichLead() {
  if (!props.lead?.id) return;
  enriching.value = true;
  try {
    const res = await api.aiEnrichLead(authStore.token, props.lead.id);
    enrichmentData.value = res.enrichment;
  } catch (err) {
    console.error("Failed to enrich lead:", err);
  } finally {
    enriching.value = false;
  }
}

function copyEmailContent() {
  if (!pitchData.value) return;
  const content = `Subject: ${pitchData.value.subject}\n\n${pitchData.value.emailBody}`;
  navigator.clipboard?.writeText(content);
  copiedEmail.value = true;
  setTimeout(() => (copiedEmail.value = false), 2000);
}

function copyWhatsAppContent() {
  if (!pitchData.value?.whatsAppPitch) return;
  navigator.clipboard?.writeText(pitchData.value.whatsAppPitch);
  copiedWhatsApp.value = true;
  setTimeout(() => (copiedWhatsApp.value = false), 2000);
}
</script>
