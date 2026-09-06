import { createRouter, createWebHistory } from "vue-router";
import AuthLayout from "@/layouts/AuthLayout.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import LoginView from "@/views/LoginView.vue";
import SignupView from "@/views/SignupView.vue";
import DashboardView from "@/views/DashboardView.vue";
import PipelineView from "@/views/PipelineView.vue";
import LeadsView from "@/views/LeadsView.vue";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login"
    },
    {
      path: "/",
      component: AuthLayout,
      children: [
        {
          path: "login",
          name: "login",
          component: LoginView,
          meta: {
            guestOnly: true,
            title: "Login"
          }
        },
        {
          path: "signup",
          name: "signup",
          component: SignupView,
          meta: {
            guestOnly: true,
            title: "Create Account"
          }
        }
      ]
    },
    {
      path: "/app",
      component: DashboardLayout,
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: "",
          name: "overview",
          component: DashboardView,
          meta: {
            requiresAuth: true,
            title: "Overview"
          }
        },
        {
          path: "pipeline",
          name: "pipeline",
          component: PipelineView,
          meta: {
            requiresAuth: true,
            title: "Pipeline Studio"
          }
        },
        {
          path: "leads",
          name: "leads",
          component: LeadsView,
          meta: {
            requiresAuth: true,
            title: "Lead Archive"
          }
        }
      ]
    }
  ]
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);
  authStore.hydrate();

  if (authStore.token && !authStore.user && !authStore.profileResolved) {
    try {
      await authStore.fetchMe();
    } catch (error) {
      authStore.logout();
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return {
      name: "overview"
    };
  }

  document.title = `${to.meta.title || "Router Command"} | Router Command`;
  return true;
});

export default router;
