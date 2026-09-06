<template>
  <div
    class="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs font-medium text-muted-foreground select-none"
  >
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      :class="[
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all duration-150',
        modelValue === item.value
          ? 'bg-background text-foreground shadow-sm font-semibold'
          : 'hover:text-foreground'
      ]"
      @click="$emit('update:modelValue', item.value)"
    >
      <component :is="item.icon" v-if="item.icon" class="h-3.5 w-3.5" />
      <span>{{ item.label }}</span>
      <span
        v-if="item.badge !== undefined"
        :class="[
          'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono',
          modelValue === item.value ? 'bg-muted text-foreground' : 'bg-background/80 text-muted-foreground'
        ]"
      >
        {{ item.badge }}
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
  }
});

defineEmits(["update:modelValue"]);
</script>
