<template>
  <div class="w-full max-w-sm sm:max-w-md">
    <div class="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div class="mb-6">
        <p class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Account Login</p>
        <h2 class="text-2xl font-bold tracking-tight text-foreground mt-1">
          Sign In
        </h2>
        <p class="text-xs text-muted-foreground mt-1.5">
          Enter your credentials to access your lead generation dashboard.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Email address</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@company.com"
            class="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground/50 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-foreground mb-1.5">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="••••••••"
            class="h-9 w-full rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground/50 transition-colors"
          />
        </div>

        <div
          v-if="errorMessage"
          class="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500 font-mono"
        >
          {{ errorMessage }}
        </div>

        <AppButton type="submit" variant="primary" size="md" block :disabled="authStore.loading">
          {{ authStore.loading ? "Signing in..." : "Sign In" }}
        </AppButton>
      </form>

      <div class="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
        <span class="text-muted-foreground">Need an account?</span>
        <RouterLink
          to="/signup"
          class="font-semibold text-foreground hover:underline"
        >
          Create an account →
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AppButton from "@/components/ui/AppButton.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref("");

const form = reactive({
  email: "",
  password: ""
});

async function handleSubmit() {
  errorMessage.value = "";

  try {
    await authStore.login(form);
    router.push(String(route.query.redirect || "/app"));
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>
