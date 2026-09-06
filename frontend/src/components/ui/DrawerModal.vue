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
        v-if="open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        @click="$emit('close')"
      >
        <div class="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
          <Transition
            enter-active-class="transform transition duration-200 ease-out"
            enter-from-class="translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transform transition duration-150 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="translate-x-full"
          >
            <div
              v-if="open"
              class="w-screen max-w-md sm:max-w-xl border-l border-border bg-background shadow-2xl flex flex-col"
              @click.stop
            >
              <!-- Header -->
              <div class="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h3 class="text-base font-semibold text-foreground">{{ title }}</h3>
                  <p v-if="subtitle" class="text-xs text-muted-foreground mt-0.5">{{ subtitle }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  @click="$emit('close')"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <!-- Body -->
              <div class="flex-1 overflow-y-auto p-5 space-y-5">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="border-t border-border px-5 py-3 bg-muted/20">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from "lucide-vue-next";

defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: "Details"
  },
  subtitle: {
    type: String,
    default: ""
  }
});

defineEmits(["close"]);
</script>
