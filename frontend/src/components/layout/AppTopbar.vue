<template>
  <header class="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
    <div class="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
      <div class="flex items-center gap-3">
        <!-- Mobile Sidebar Toggle -->
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          @click="$emit('openSidebar')"
        >
          <PanelLeft class="h-4 w-4" />
        </button>

        <!-- Breadcrumb / Page Title -->
        <div class="flex items-center gap-2 text-xs font-mono">
          <span class="text-muted-foreground hidden sm:inline">Theron</span>
          <span class="text-muted-foreground hidden sm:inline">/</span>
          <h1 class="font-bold text-foreground tracking-tight text-sm uppercase">{{ title }}</h1>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <ThemeToggle />

        <div class="hidden sm:flex items-center gap-2 border border-border rounded-md px-2.5 py-1 text-xs bg-background">
          <span class="h-2 w-2 rounded-full bg-foreground/60"></span>
          <span class="font-medium text-foreground">{{ authStore.user?.full_name || "Admin" }}</span>
        </div>

        <AppButton variant="ghost" size="xs" @click="handleLogout" title="Sign out of operator session">
          <LogOut class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Sign out</span>
        </AppButton>
      </div>
    </div>
  </header>
</template>

<script setup>
import { LogOut, PanelLeft } from "lucide-vue-next";
import { useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import { useAuthStore } from "@/stores/auth";

defineProps({
  title: {
    type: String,
    required: true
  }
});

defineEmits(["openSidebar"]);

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>
