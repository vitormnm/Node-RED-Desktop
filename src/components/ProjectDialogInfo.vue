<template>
  <section class="info-panel">

    <!-- ── Metric cards ── -->
    <div class="metric-grid">
      <!-- Status card -->
      <div class="metric-card">
        <div class="metric-value status-text" :style="{ color: projectsStatus.color }">{{ projectsStatus.text }}</div>
        <div class="metric-label" v-if="projectsStatus.pid">PID {{ projectsStatus.pid }}</div>
        <div class="metric-label" v-else>—</div>
      </div>
      <!-- RAM -->
      <div class="metric-card">
        <div class="metric-value">{{ formatRam(projectsStatus.ramBytes) }}</div>
        <div class="metric-label">RAM</div>
      </div>
      <!-- CPU -->
      <div class="metric-card">
        <div class="metric-value">{{ formatCpu(projectsStatus.cpuPercent) }}</div>
        <div class="metric-label">CPU</div>
      </div>
      <!-- Disk Read -->
      <div class="metric-card">
        <div class="metric-value">{{ formatRate(projectsStatus.diskReadBytesPerSec) }}</div>
        <div class="metric-label">Disk Read</div>
      </div>
      <!-- Disk Write -->
      <div class="metric-card">
        <div class="metric-value">{{ formatRate(projectsStatus.diskWriteBytesPerSec) }}</div>
        <div class="metric-label">Disk Write</div>
      </div>
    </div>

    <v-divider class="my-4" />

    <!-- ── Worker controls ── -->
    <div class="action-group">
      <div class="action-group-label">Worker</div>
      <div class="action-row">
        <v-btn
          class="action-btn"
          size="small"
          color="green"
          prepend-icon="mdi-play"
          @click="emit('open-action', 'start_project')"
        >Start</v-btn>
        <v-btn
          class="action-btn"
          size="small"
          color="red"
          prepend-icon="mdi-stop"
          @click="emit('open-action', 'stop_project')"
        >Stop</v-btn>
        <v-btn
          class="action-btn"
          size="small"
          color="grey"
          prepend-icon="mdi-folder-open"
          @click="emit('open-action', 'open_folder')"
        >Open Folder</v-btn>
      </div>
    </div>

    <v-divider class="my-4" />

    <!-- ── Open windows ── -->
    <div class="action-group">
      <div class="action-group-label">Open</div>

      <v-checkbox
        v-model="fullscreen"
        label="Open local window in fullscreen"
        density="compact"
        hide-details
        class="mb-3"
      />

      <div class="action-row">
        <v-btn
          class="action-btn"
          size="small"
          color="grey"
          prepend-icon="mdi-monitor"
          @click="emit('open-action', 'open_editor', fullscreen)"
        >Editor local</v-btn>
        <v-btn
          class="action-btn"
          size="small"
          color="grey"
          prepend-icon="mdi-open-in-new"
          @click="emit('open-action', 'open_editor_web', false)"
        >Editor web</v-btn>
      </div>
      <div class="action-row">
        <v-btn
          class="action-btn"
          size="small"
          color="grey"
          prepend-icon="mdi-monitor"
          @click="emit('open-action', 'open_dashboard', fullscreen)"
        >Dashboard local</v-btn>
        <v-btn
          class="action-btn"
          size="small"
          color="grey"
          prepend-icon="mdi-open-in-new"
          @click="emit('open-action', 'open_dashboard_web', false)"
        >Dashboard web</v-btn>
      </div>
    </div>

    <!-- ── Delete ── -->
    <template v-if="submitLabel === 'Update'">
      <v-divider class="my-4" />
      <div class="action-row">
        <v-btn
          class="action-btn"
          size="small"
          color="red"
          prepend-icon="mdi-trash-can"
          @click="emit('confirm-delete')"
        >Delete Project</v-btn>
      </div>
    </template>

  </section>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  projectsStatus: {
    type: Object,
    required: true
  },
  submitLabel: {
    type: String,
    required: true
  }
});

const emit = defineEmits(["open-action", "confirm-delete"]);

const fullscreen = ref(false);

function formatRam(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "-";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatCpu(percent) {
  if (percent == null || Number.isNaN(percent)) return "-";
  return `${percent.toFixed(1)}%`;
}

function formatRate(bytesPerSec) {
  if (bytesPerSec == null || Number.isNaN(bytesPerSec)) return "-";
  const mb = bytesPerSec / 1024 / 1024;
  return `${mb.toFixed(1)} MB/s`;
}
</script>

<style scoped>
.info-panel {
  min-width: 0;
  padding: 4px 0;
}

/* ── Metric grid ── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

@media (max-width: 600px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}
.status-text {
  text-transform: capitalize;
}
.metric-value {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}
.metric-label {
  font-size: 0.7rem;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Action groups ── */
.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.action-group-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
  margin-bottom: 4px;
}

/* Buttons: Vuetify small size, width fixed so icons never get clipped */
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.action-btn {
  width: 160px;
}
</style>
