<template>
  <section class="info-panel">

    <!-- ── Status bar (compact, no icons) ── -->
    <div class="status-bar">
      <v-chip :color="projectsStatus.color" size="x-small" label class="status-chip">
        {{ projectsStatus.text }}
      </v-chip>
      <span class="status-meta" v-if="projectsStatus.pid">PID {{ projectsStatus.pid }}</span>
      <span class="status-meta">RAM {{ formatRam(projectsStatus.ramBytes) }}</span>
      <span class="status-meta">CPU {{ formatCpu(projectsStatus.cpuPercent) }}</span>
      <span class="status-meta">↓ {{ formatRate(projectsStatus.diskReadBytesPerSec) }}</span>
      <span class="status-meta">↑ {{ formatRate(projectsStatus.diskWriteBytesPerSec) }}</span>
    </div>

    <!-- ── Metric cards ── -->
    <div class="metric-grid">
      <div class="metric-card">
        <v-icon class="metric-icon" color="blue-lighten-2">mdi-memory</v-icon>
        <div class="metric-value">{{ formatRam(projectsStatus.ramBytes) }}</div>
        <div class="metric-label">RAM</div>
      </div>
      <div class="metric-card">
        <v-icon class="metric-icon" color="purple-lighten-2">mdi-cpu-64-bit</v-icon>
        <div class="metric-value">{{ formatCpu(projectsStatus.cpuPercent) }}</div>
        <div class="metric-label">CPU</div>
      </div>
      <div class="metric-card">
        <v-icon class="metric-icon" color="teal-lighten-2">mdi-arrow-down-bold</v-icon>
        <div class="metric-value">{{ formatRate(projectsStatus.diskReadBytesPerSec) }}</div>
        <div class="metric-label">Disk Read</div>
      </div>
      <div class="metric-card">
        <v-icon class="metric-icon" color="orange-lighten-2">mdi-arrow-up-bold</v-icon>
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
          color="green"
          prepend-icon="mdi-play"
          @click="emit('open-action', 'start_project')"
        >Start</v-btn>
        <v-btn
          class="action-btn"
          color="red"
          prepend-icon="mdi-stop"
          @click="emit('open-action', 'stop_project')"
        >Stop</v-btn>
        <v-btn
          class="action-btn"
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
          color="indigo"
          prepend-icon="mdi-monitor"
          @click="emit('open-action', 'open_editor', fullscreen)"
        >Editor local</v-btn>
        <v-btn
          class="action-btn"
          color="indigo"
          variant="outlined"
          prepend-icon="mdi-open-in-new"
          @click="emit('open-action', 'open_editor_web', false)"
        >Editor web</v-btn>
      </div>

      <div class="action-row mt-2">
        <v-btn
          class="action-btn"
          color="cyan-darken-1"
          prepend-icon="mdi-monitor"
          @click="emit('open-action', 'open_dashboard', fullscreen)"
        >Dashboard local</v-btn>
        <v-btn
          class="action-btn"
          color="cyan-darken-1"
          variant="outlined"
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

/* ── Status bar — compact single line ── */
.status-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.status-chip {
  font-weight: 700;
  letter-spacing: 0.03em;
}
.status-meta {
  font-size: 0.75rem;
  opacity: 0.55;
}

/* ── Metric grid ── */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}
.metric-icon {
  font-size: 22px !important;
  margin-bottom: 2px;
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

/* Uniform button size — slightly larger than before */
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.action-btn {
  width: 160px;
  min-height: 36px;
}
</style>
