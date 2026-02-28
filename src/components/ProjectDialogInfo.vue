<template>
  <section class="dialog-content">
    <v-card-text class="pt-2 pb-0">
      <v-row class="mt-0">
        <v-col cols="12" class="d-flex align-center">
          <v-chip small class="ma-0 mr-2" text-color="white" :color="projectsStatus.color">
            <template v-if="projectsStatus.pid">
              {{ projectsStatus.text }} ({{ projectsStatus.pid }})
            </template>
            <template v-else>
              {{ projectsStatus.text }}
            </template>
          </v-chip>
          <v-chip small class="ma-0 mr-2" color="grey-lighten-2">
            RAM: {{ formatRam(projectsStatus.ramBytes) }}
          </v-chip>
          <v-chip small class="ma-0 mr-2" color="grey-lighten-2">
            CPU: {{ formatCpu(projectsStatus.cpuPercent) }}
          </v-chip>
          <v-chip small class="ma-0" color="grey-lighten-2">
            Disk: R {{ formatRate(projectsStatus.diskReadBytesPerSec) }} W {{
              formatRate(projectsStatus.diskWriteBytesPerSec)
            }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>

    <v-row class="mt-4">
      <v-col cols="4">
        <v-btn size="small" block color="grey" @click="emit('open-action', 'open_editor')">Editor local</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn size="small" block color="grey" @click="emit('open-action', 'open_editor_web')">Editor web</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-btn size="small" block color="grey" @click="emit('open-action', 'open_dashboard')">Dashboard local</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn size="small" block color="grey" @click="emit('open-action', 'open_dashboard_web')">Dashboard web</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-btn size="small" block color="green" @click="emit('open-action', 'start_project')">
          <v-icon class="mr-1">mdi-play</v-icon>
          start
        </v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn size="small" block color="red" @click="emit('open-action', 'stop_project')">
          <v-icon class="mr-1">mdi-stop</v-icon>
          stop
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="4">
        <v-btn size="small" block color="grey" @click="emit('open-action', 'open_folder')">folder window</v-btn>
      </v-col>
      <v-col cols="4">
        <v-btn size="small" block v-if="submitLabel === 'Update'" color="red" @click="emit('confirm-delete')">Delete Project</v-btn>
      </v-col>
    </v-row>
  </section>
</template>

<script setup>
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
.dialog-content {
  min-width: 0;
}
</style>
