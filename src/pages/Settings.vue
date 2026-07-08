<template>
  <v-card class="settings-card pa-4">
          <h2 class="heading">project start window</h2>

          <v-row class="mt-4" align="center">
            <v-checkbox v-model="settingsJson.app.startupProjectWindow.enabled" density="compact" label="enabled" />
          </v-row>

          <v-row align="center">
            <v-checkbox v-model="settingsJson.app.startupProjectWindow.fullscreen" density="compact" label="full screen" />
          </v-row>

          <!-- SELECT PROJECT -->
          <div class="field-label">Select Project</div>
          <v-select class="mb-4" :items="projects" item-title="name" item-value="id"
            v-model="settingsJson.app.startupProjectWindow.id" density="comfortable" hide-details
            :error="errors.project.length > 0" :error-messages="errors.project" />

          <div class="field-label">initial url</div>
          <v-text-field v-model="settingsJson.app.startupProjectWindow.url" hide-details class="mb-6"
            :error="errors.url.length > 0" :error-messages="errors.url" />

          <h3 class="subheading">Redudancy</h3>

          <v-row class="mb-2" align="center">
            <v-checkbox v-model="settingsJson.redundancy.enabled" label="Enabled redudancy" />
          </v-row>

          <div class="muted small">Application-level redundancy</div>

          <v-select class="mb-4 mt-2" :items="['primary', 'secondary']" v-model="settingsJson.redundancy.type"
            density="comfortable" hide-details />

          <div class="field-label">IP server</div>
          <v-text-field v-model="settingsJson.redundancy.ip" hide-details class="mb-1" :error="errors.ip.length > 0"
            :error-messages="errors.ip" />
          <div class="muted small mb-4">Primary→secondary IP. secondary→primary IP.</div>

          <div class="field-label">PORT UDP</div>
          <v-text-field type="number" v-model="settingsJson.redundancy.port" hide-details class="mb-6"
            :error="errors.port.length > 0" :error-messages="errors.port" />

          <div class="field-label">Theme</div>
          <v-select class="mb-6" :items="themeOptions" item-title="title" item-value="value"
            v-model="settingsJson.app.theme" density="comfortable" hide-details />

          <v-row>
            <v-col cols="auto">
              <v-btn size="small" class="action-btn" color="grey" prepend-icon="mdi-content-save" @click="save">Save</v-btn>
           
            </v-col>
          </v-row>

          <h3 class="subheading mt-8">Windows service</h3>

          <v-row class="mt-3" gap="3">
            <v-col cols="auto">
              <v-btn size="small" class="action-btn" color="grey" prepend-icon="mdi-plus" @click="service('install')">
                Install service
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn size="small" class="action-btn" color="grey" prepend-icon="mdi-delete" @click="service('delete')">
                Delete service
              </v-btn>
            </v-col>
          </v-row>


          <v-divider class="my-6"></v-divider>
          <div class="text-center text-caption text-grey">
            Version: {{ appVersion }}
          </div>
  </v-card>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
import { notify } from "@/utils/notify.js";

const appVersion = ref("");

// JSON base
const settingsJson = reactive({
  app: {
    name: null,
    version: null,
    theme: "dark",
    startupProjectWindow: {
      enabled: null,
      fullscreen: false,
      id: null,
      url: null,
    },
    description: null,
  },
  redundancy: {
    enabled: false,
    type: null,
    ip: null,
    port: null,
  },
});

// theme options
const themeOptions = [
  { title: "Dark", value: "dark" },
  { title: "Light", value: "light" },
  { title: "System default", value: "system" }
];

// lista de projetos
const projects = ref([]);

// erros
const errors = reactive({
  project: [],
  url: [],
  ip: [],
  port: [],
});

// carregar ao iniciar
onMounted(async () => {
  const payload = await window.api.get("/checkSettings");
  renderProjects(payload);
  rendersettingsJson(payload);
  appVersion.value = payload.appVersion || "";
});

// substitui JSON inteiro do settingsJson
function rendersettingsJson(iPayload) {
  const cleanPayload = JSON.parse(JSON.stringify(iPayload));
  delete cleanPayload.appVersion;
  if (cleanPayload.app && !cleanPayload.app.theme) {
    cleanPayload.app.theme = "dark";
  }
  Object.assign(settingsJson, cleanPayload);
}

// renderiza projetos no select
function renderProjects(payload) {
  projects.value = payload.projects.map(p => ({ name: p.name, id: p.id }));
}

// -----------------------------
// VALIDAÇÃO
// -----------------------------
function validate() {
  Object.values(errors).forEach(arr => arr.length = 0);
  let ok = true;

  if (!settingsJson.app.startupProjectWindow.id) {
    errors.project.push("Select a project.");
    ok = false;
  }

  if (!settingsJson.app.startupProjectWindow.url?.trim()) {
    errors.url.push("The URL cannot be empty.");
    ok = false;
  }

  const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (settingsJson.redundancy.enabled && !ipRegex.test(settingsJson.redundancy.ip)) {
    errors.ip.push("Invalid IP address.");
    ok = false;
  }

  if (settingsJson.redundancy.enabled && (!settingsJson.redundancy.port || settingsJson.redundancy.port <= 0)) {
    errors.port.push("Porta inválida.");
    ok = false;
  }

  if (!ok) {
    notify.error("Existem erros no settingsJsonulário");
  }

  return ok;
}

// -----------------------------
// save
// -----------------------------
async function save() {
  if (!validate()) return;

  const updated = JSON.parse(JSON.stringify(settingsJson));
  const result = await window.api.post("/ctl_serverConfig_settings_save", updated);

  if (result.status == true) {
    notify.success("Saved settings");
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: settingsJson.app.theme }));
  } else {
    notify.error("error while saving");
  }


}

// serviço windows

async function service(mode) {

  if (mode == 'install') {
    const payload = await window.api.post('/ctl_serverConfig_service');

    if (payload.status == true) {

      notify.success("Service create");
    } else {
      notify.error("Error service create");
    }

  }

  if (mode == 'delete') {
    const payload = await window.api.delete('/ctl_serverConfig_service');

    if (payload.status == true) {

      notify.success("Service deleted");
    } else {
      notify.error("Error service deleted");
    }
  }


}
</script>

<style scoped>
.settings-outlined-btn {
  background-color: transparent !important;
}

.action-btn {
  width: 160px;
  justify-content: start !important;
}
</style>
