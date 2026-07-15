<template>
  <div class="project-dialog-preview-panel">
    <v-alert v-if="!url" type="warning" density="compact" class="mb-2">
      {{ missingUrlMessage }}
    </v-alert>

    <iframe
      v-if="url"
      class="project-dialog-preview-iframe"
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

const isEditor = computed(() => props.panelType === "editor");
const missingUrlMessage = computed(() =>
  isEditor.value
    ? "URL do editor nao cadastrada para este projeto."
    : "URL do dashboard nao cadastrada para este projeto."
);
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

.project-dialog-preview-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 6px;
  background: #fff;
}
</style>
