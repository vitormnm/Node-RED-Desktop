<template>
  <div class="project-dialog-preview-panel">
    <v-alert v-if="!url" type="warning" density="compact" class="mb-2">
      {{ missingUrlMessage }}
    </v-alert>

    <div class="project-dialog-preview-actions mt-0">
      <v-btn size="small" color="grey" @click="emit('open-action', localAction)">
        Open extenal
      </v-btn>
      <v-btn size="small" color="grey" @click="emit('open-action', webAction)">
        Open web
      </v-btn>
    </div>

    <iframe
      v-if="url"
      class="project-dialog-preview-iframe mt-2"
      :src="url"
      :title="frameTitle"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  panelType: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["open-action"]);

const isEditor = computed(() => props.panelType === "editor");
const missingUrlMessage = computed(() =>
  isEditor.value
    ? "URL do editor nao cadastrada para este projeto."
    : "URL do dashboard nao cadastrada para este projeto."
);
const localAction = computed(() => (isEditor.value ? "open_editor" : "open_dashboard"));
const webAction = computed(() => (isEditor.value ? "open_editor_web" : "open_dashboard_web"));
const frameTitle = computed(() => (isEditor.value ? "Node-RED Editor" : "Node-RED Dashboard"));
</script>

<style scoped>
.project-dialog-preview-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.project-dialog-preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.project-dialog-preview-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 6px;
  background: #fff;
}
</style>
