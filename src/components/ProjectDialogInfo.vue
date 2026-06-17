<template>
  <section class="info-panel">

    <!-- ── Status bar ── -->
    <div class="status-bar">
      <v-chip
        class="status-chip"
        :color="projectsStatus.color"
        text-color="white"
        size="small"
        label
      >
        <v-icon start size="14">
          {{ projectsStatus.text === 'running' ? 'mdi-circle' : projectsStatus.text === 'starting' ? 'mdi-timer-sand' : 'mdi-circle-off-outline' }}
        </v-icon>
        {{ projectsStatus.text }}
        <span v-if="projectsStatus.pid" class="pid-label">&nbsp;· PID {{ projectsStatus.pid }}</span>
      </v-chip>
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
        <v-icon class="metric-icon" color="teal-lighten-2">mdi-harddisk</v-icon>
        <div class="metric-value">{{ formatRate(projectsStatus.diskReadBytesPerSec) }}</div>
        <div class="metric-label">Disk Read</div>
      </div>
      <div class="metric-card">
        <v-icon class="metric-icon" color="orange-lighten-2">mdi-harddisk</v-icon>
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
          size="small"
          color="green"
          prepend-icon="mdi-play"
          @click="emit('open-action', 'start_project')"
        >Start</v-btn>
        <v-btn
          size="small"
          color="red"
          prepend-icon="mdi-stop"
          @click="emit('open-action', 'stop_project')"
        >Stop</v-btn>
        <v-btn
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

      <!-- Fullscreen toggle -->
      <v-checkbox
        v-model="fullscreen"
        label="Open local window in fullscreen"
        density="compact"
        hide-details
        class="mb-3"
      />

      <div class="action-row">
        <v-btn
          size="small"
          color="indigo"
          prepend-icon="mdi-pencil-box"
          @click="emit('open-action', 'open_editor', fullscreen)"
        >Editor local</v-btn>
        <v-btn
          size="small"
          color="indigo-lighten-3"
          prepend-icon="mdi-open-in-new"
          @click="emit('open-action', 'open_editor_web', false)"
        >Editor web</v-btn>
      </div>
      <div class="action-row mt-2">
        <v-btn
          size="small"
          color="cyan-darken-1"
          prepend-icon="mdi-view-dashboard"
          @click="emit('open-action', 'open_dashboard', fullscreen)"
        >Dashboard local</v-btn>
        <v-btn
          size="small"
          color="cyan-lighten-3"
          prepend-icon="mdi-open-in-new"
          @click="emit('open-action', 'open_dashboard_web', false)"
        >Dashboard web</v-btn>
      </div>
    </div>

    <!-- ── Danger zone ── -->
    <template v-if="submitLabel === 'Update'">
      <v-divider class="my-4" />
      <div class="action-group">
        <div class="action-group-label danger-label">Danger Zone</div>
        <div class="action-row">
          <v-btn
            size="small"
            color="red-darken-3"
            variant="outlined"
            prepend-icon="mdi-delete-forever"
            @click="emit('confirm-delete')"
          >Delete Project</v-btn>
        </div>
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

/* ── Status bar ── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.status-chip {
  font-weight: 600;
  letter-spacing: 0.03em;
}
.pid-label {
  opacity: 0.75;
  font-size: 0.8em;
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
.danger-label {
  color: #ef5350;
  opacity: 0.85;
}
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
