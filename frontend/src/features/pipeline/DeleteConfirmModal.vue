<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="handleCancel"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out transform"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in transform"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="open"
            class="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 my-auto"
            @click.stop
          >
            <!-- Header with Warning Icon -->
            <div class="flex items-start gap-3.5">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-500">
                <Trash2 class="h-5 w-5" />
              </div>

              <div class="space-y-1 min-w-0 flex-1">
                <h3 class="text-base font-bold text-foreground">
                  {{ title }}
                </h3>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  {{ message }}
                </p>
              </div>

              <button
                type="button"
                class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                :disabled="loading"
                @click="handleCancel"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Target Lead Snippet Box (if target name provided) -->
            <div
              v-if="targetName"
              class="rounded-xl border border-border bg-muted/30 p-3 flex items-center gap-2.5 text-xs font-mono"
            >
              <span class="text-muted-foreground uppercase text-[10px]">Target:</span>
              <span class="font-semibold text-foreground truncate" :title="targetName">
                {{ targetName }}
              </span>
            </div>

            <!-- Error Banner (if error occurred during deletion) -->
            <div
              v-if="errorMessage"
              class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 font-mono leading-relaxed"
            >
              {{ errorMessage }}
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-1">
              <AppButton
                variant="outline"
                size="sm"
                :disabled="loading"
                @click="handleCancel"
              >
                Cancel
              </AppButton>

              <AppButton
                variant="destructive"
                size="sm"
                :disabled="loading"
                @click="handleConfirm"
              >
                <Trash2 class="h-3.5 w-3.5" />
                <span>{{ loading ? 'Deleting...' : confirmText }}</span>
              </AppButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Trash2, X } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: "Confirm Deletion"
  },
  message: {
    type: String,
    default: "Are you sure you want to permanently delete this item? This action cannot be undone."
  },
  targetName: {
    type: String,
    default: ""
  },
  confirmText: {
    type: String,
    default: "Delete Permanently"
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["confirm", "cancel"]);

function handleCancel() {
  if (props.loading) return;
  emit("cancel");
}

function handleConfirm() {
  emit("confirm");
}
</script>
