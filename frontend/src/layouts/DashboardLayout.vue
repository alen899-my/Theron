<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="flex min-h-screen">
      <!-- Desktop Sidebar -->
      <div class="hidden lg:block lg:w-[260px] lg:flex-shrink-0">
        <SidebarNav :items="navItems" />
      </div>

      <!-- Mobile Sidebar Overlay & Drawer -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileSidebarOpen"
          class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          @click="mobileSidebarOpen = false"
        >
          <div class="h-full w-[260px]" @click.stop>
            <SidebarNav :items="navItems" @navigate="mobileSidebarOpen = false" />
          </div>
        </div>
      </Transition>

      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          :title="route.meta.title || 'Overview'"
          @open-sidebar="mobileSidebarOpen = true"
        />
        <main class="flex-1 px-3 py-4 sm:px-6 sm:py-6 max-w-7xl w-full mx-auto">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { LayoutDashboard, Rows3, TableProperties } from "lucide-vue-next";
import { ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppTopbar from "@/components/layout/AppTopbar.vue";
import SidebarNav from "@/components/layout/SidebarNav.vue";

const route = useRoute();
const mobileSidebarOpen = ref(false);

const navItems = [
  {
    label: "Overview",
    to: "/app",
    icon: LayoutDashboard
  },
  {
    label: "Pipeline Studio",
    to: "/app/pipeline",
    icon: Rows3
  },
  {
    label: "Lead Archive",
    to: "/app/leads",
    icon: TableProperties
  }
];
</script>
