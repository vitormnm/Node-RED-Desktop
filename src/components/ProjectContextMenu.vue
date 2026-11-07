<template>
  <v-menu
    v-model="isOpen"
    :target="[x, y]"
    location="bottom start"
    :close-on-content-click="true"
  >
    <v-list density="compact" class="project-context-menu pa-1 elevation-5">
      <template v-for="(item, index) in menuItems" :key="item.action || index">
        <v-divider v-if="item.divider" class="my-1" />
        <v-list-item
          v-else
          :value="item.action"
          class="context-menu-item"
          @click="handleAction(item.action)"
        >
          <template #prepend>
            <v-icon :icon="item.icon" :color="item.color" class="mr-2" size="small" />
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ item.title }}
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  project: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "action"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const menuItems = [
  { title: "Start", action: "start", icon: "mdi-play", color: "green" },
  { title: "Stop", action: "stop", icon: "mdi-stop", color: "red" },
  { title: "Restart", action: "restart", icon: "mdi-restart", color: "orange" },
  { divider: true },
  { title: "Open editor", action: "open_editor", icon: "mdi-monitor", color: "grey" },
  { title: "Open dashboard", action: "open_dashboard", icon: "mdi-view-dashboard", color: "grey" },
  { title: "Open folder", action: "open_folder", icon: "mdi-folder-open", color: "grey" },
  { divider: true },
  { title: "Delete", action: "delete", icon: "mdi-delete", color: "red" },
];

function handleAction(action) {
  emit("action", { action, project: props.project });
  isOpen.value = false;
}
</script>

<style scoped>
.project-context-menu {
  min-width: 180px;
  border-radius: 8px;
}

.context-menu-item {
  min-height: 36px !important;
  border-radius: 4px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}
</style>
