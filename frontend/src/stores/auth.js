import { defineStore } from "pinia";
import { api } from "@/lib/api";

const TOKEN_KEY = "router-command-token";
const USER_KEY = "router-command-user";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: "",
    user: null,
    loading: false,
    profileResolved: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    hydrate() {
      if (typeof window === "undefined" || this.token) {
        return;
      }

      this.token = window.localStorage.getItem(TOKEN_KEY) || "";

      const userPayload = window.localStorage.getItem(USER_KEY);
      this.user = userPayload ? JSON.parse(userPayload) : null;
      this.profileResolved = Boolean(this.user) || !this.token;
    },
    persistSession() {
      if (typeof window === "undefined") {
        return;
      }

      if (this.token) {
        window.localStorage.setItem(TOKEN_KEY, this.token);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
      }

      if (this.user) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      } else {
        window.localStorage.removeItem(USER_KEY);
      }
    },
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      this.profileResolved = true;
      this.persistSession();
    },
    async signup(payload) {
      this.loading = true;
      try {
        const response = await api.signup(payload);
        this.setSession(response);
        return response;
      } finally {
        this.loading = false;
      }
    },
    async login(payload) {
      this.loading = true;
      try {
        const response = await api.login(payload);
        this.setSession(response);
        return response;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) {
        return null;
      }

      const response = await api.me(this.token);
      this.user = response.user;
      this.profileResolved = true;
      this.persistSession();
      return response.user;
    },
    logout() {
      this.token = "";
      this.user = null;
      this.profileResolved = true;
      this.persistSession();
    }
  }
});
