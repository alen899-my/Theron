import { ref, computed } from "vue";
import {
  STATUS_STEPS,
  STATUS_COLOR_PRESETS,
  getColorPreset,
  registerCustomStatus,
  unregisterCustomStatus
} from "../pipeline/status-constants";

const STORAGE_KEY = "theron_custom_statuses";
const ORDER_STORAGE_KEY = "theron_column_order";

// Shared reactive singleton state
const customStatuses = ref([]);
const columnOrder = ref([]);
const isInitialized = ref(false);

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customStatuses.value = parsed.map((item) => {
          const colorPreset = getColorPreset(item.colorId || "cyan");
          const formatted = {
            step: "•",
            id: item.id || item.label,
            label: item.label,
            detail: item.detail || "Custom workflow stage.",
            colorId: colorPreset.id,
            headerClass: colorPreset.headerClass,
            badgeClass: colorPreset.badgeClass,
            pillClass: colorPreset.pillClass,
            activePillClass: colorPreset.activePillClass,
            dotClass: colorPreset.dotClass,
            borderClass: colorPreset.borderClass,
            accentClass: colorPreset.accentClass,
            isCustom: true
          };
          registerCustomStatus(formatted);
          return formatted;
        });
      }
    }

    const orderRaw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (orderRaw) {
      const parsedOrder = JSON.parse(orderRaw);
      if (Array.isArray(parsedOrder)) {
        columnOrder.value = parsedOrder;
      }
    }
  } catch (err) {
    console.warn("Failed to parse custom statuses or column order from storage:", err);
  }
  isInitialized.value = true;
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    const payload = customStatuses.value.map((s) => ({
      id: s.id,
      label: s.label,
      colorId: s.colorId,
      detail: s.detail
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to save custom statuses to storage:", err);
  }
}

function saveOrderToStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(columnOrder.value));
  } catch (err) {
    console.warn("Failed to save column order to storage:", err);
  }
}

export function useStatusManager() {
  if (!isInitialized.value) {
    loadFromStorage();
  }

  const allStatuses = computed(() => {
    return [...STATUS_STEPS, ...customStatuses.value];
  });

  // Keep columnOrder synced with all active status IDs
  function ensureOrderSynced() {
    const allIds = allStatuses.value.map((s) => s.id);
    const existingOrder = columnOrder.value.filter((id) => allIds.includes(id));
    for (const id of allIds) {
      if (!existingOrder.includes(id)) {
        existingOrder.push(id);
      }
    }
    columnOrder.value = existingOrder;
  }

  const orderedStatuses = computed(() => {
    ensureOrderSynced();
    const orderMap = new Map();
    columnOrder.value.forEach((id, idx) => orderMap.set(id.toLowerCase(), idx));

    return [...allStatuses.value].sort((a, b) => {
      const idxA = orderMap.has(a.id.toLowerCase()) ? orderMap.get(a.id.toLowerCase()) : 999;
      const idxB = orderMap.has(b.id.toLowerCase()) ? orderMap.get(b.id.toLowerCase()) : 999;
      return idxA - idxB;
    });
  });

  function moveStatus(statusId, direction) {
    ensureOrderSynced();
    const target = String(statusId).toLowerCase();
    const index = columnOrder.value.findIndex((id) => id.toLowerCase() === target);
    if (index === -1) return;

    if (direction === "left" && index > 0) {
      const temp = columnOrder.value[index];
      columnOrder.value[index] = columnOrder.value[index - 1];
      columnOrder.value[index - 1] = temp;
      saveOrderToStorage();
    } else if (direction === "right" && index < columnOrder.value.length - 1) {
      const temp = columnOrder.value[index];
      columnOrder.value[index] = columnOrder.value[index + 1];
      columnOrder.value[index + 1] = temp;
      saveOrderToStorage();
    }
  }

  function reorderStatuses(fromIndex, toIndex) {
    ensureOrderSynced();
    if (
      fromIndex >= 0 &&
      fromIndex < columnOrder.value.length &&
      toIndex >= 0 &&
      toIndex < columnOrder.value.length
    ) {
      const item = columnOrder.value.splice(fromIndex, 1)[0];
      columnOrder.value.splice(toIndex, 0, item);
      saveOrderToStorage();
    }
  }

  function addCustomStatus({ label, colorId = "cyan", detail = "" }) {
    const trimmed = String(label || "").trim();
    if (!trimmed) {
      throw new Error("Status label cannot be empty.");
    }

    const exists = allStatuses.value.some(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase() || s.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error(`A status named "${trimmed}" already exists.`);
    }

    const colorPreset = getColorPreset(colorId);
    const newStatus = {
      step: "•",
      id: trimmed,
      label: trimmed,
      detail: detail.trim() || "Custom workflow stage.",
      colorId: colorPreset.id,
      headerClass: colorPreset.headerClass,
      badgeClass: colorPreset.badgeClass,
      pillClass: colorPreset.pillClass,
      activePillClass: colorPreset.activePillClass,
      dotClass: colorPreset.dotClass,
      borderClass: colorPreset.borderClass,
      accentClass: colorPreset.accentClass,
      isCustom: true
    };

    customStatuses.value.push(newStatus);
    columnOrder.value.push(newStatus.id);
    registerCustomStatus(newStatus);
    saveToStorage();
    saveOrderToStorage();
    return newStatus;
  }

  function deleteCustomStatus(statusId) {
    const target = String(statusId).trim().toLowerCase();
    const index = customStatuses.value.findIndex(
      (s) => s.id.toLowerCase() === target || s.label.toLowerCase() === target
    );
    if (index !== -1) {
      const removed = customStatuses.value.splice(index, 1)[0];
      unregisterCustomStatus(removed.id);
      columnOrder.value = columnOrder.value.filter((id) => id.toLowerCase() !== target);
      saveToStorage();
      saveOrderToStorage();
      return true;
    }
    return false;
  }

  function syncStatusesFromLeads(leads = []) {
    if (!Array.isArray(leads) || leads.length === 0) return;
    let changed = false;

    for (const lead of leads) {
      const statusStr = String(lead?.status || "").trim();
      if (!statusStr) continue;

      const matched = allStatuses.value.some(
        (s) => s.id.toLowerCase() === statusStr.toLowerCase() || s.label.toLowerCase() === statusStr.toLowerCase()
      );

      if (!matched) {
        let hash = 0;
        for (let i = 0; i < statusStr.length; i++) {
          hash = (hash << 5) - hash + statusStr.charCodeAt(i);
          hash |= 0;
        }
        const colorPreset = STATUS_COLOR_PRESETS[Math.abs(hash) % STATUS_COLOR_PRESETS.length];

        const autoStatus = {
          step: "•",
          id: statusStr,
          label: statusStr,
          detail: "Discovered workflow status.",
          colorId: colorPreset.id,
          headerClass: colorPreset.headerClass,
          badgeClass: colorPreset.badgeClass,
          pillClass: colorPreset.pillClass,
          activePillClass: colorPreset.activePillClass,
          dotClass: colorPreset.dotClass,
          borderClass: colorPreset.borderClass,
          accentClass: colorPreset.accentClass,
          isCustom: true
        };

        customStatuses.value.push(autoStatus);
        columnOrder.value.push(autoStatus.id);
        registerCustomStatus(autoStatus);
        changed = true;
      }
    }

    if (changed) {
      saveToStorage();
      saveOrderToStorage();
    }
  }

  return {
    customStatuses,
    allStatuses,
    orderedStatuses,
    columnOrder,
    moveStatus,
    reorderStatuses,
    addCustomStatus,
    deleteCustomStatus,
    syncStatusesFromLeads
  };
}
