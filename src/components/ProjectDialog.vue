<template>
  <v-dialog
    v-model:model-value="visible"
    :width="dialogWidth"
    :max-width="dialogMaxWidth"
    content-class="project-dialog-overlay-content"
  >
    <v-card class="project-dialog-card--fixed">
      <v-toolbar flat>
        <v-toolbar-title>{{ dialogTitle }}</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="onClose"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <div v-if="submitType === 'update'" class="panel-tabs-wrapper">
        <v-tabs density="compact" class="ma-0 pa-0" v-model="activePanel">
          <v-tab value="settings">SETTINGS</v-tab>
          <v-tab value="info">INFO</v-tab>
          <v-tab value="log">LOG</v-tab>
          <v-tab v-if="isProjectRunning" value="editor">EDITOR</v-tab>
          <v-tab v-if="isProjectRunning" value="dashboard">DASHBOARD</v-tab>
        </v-tabs>
      </div>

      <v-card-text
        :class="{
          'project-dialog-body--fixed': submitType === 'update',
          'project-dialog-body--fill-panel': submitType === 'update' && (activePanel === 'log' || activePanel === 'editor' || activePanel === 'dashboard')
        }"
      >
        <div
          v-if="submitType === 'update'"
          :class="{
            'project-dialog-panel-host': true,
            'project-dialog-panel-host--fill': activePanel === 'log' || activePanel === 'editor' || activePanel === 'dashboard'
          }"
        >
          <ProjectDialogLog
            v-if="activePanel === 'log'"
            ref="projectDialogLogRef"
            class="project-dialog-log-fill"
            :project-log-text="projectLogText"
            :log-file-name="logFileName"
            :log-error="logError"
            @refresh="fetchProjectLogs"
            @log-scroll="onLogScroll"
          />

          <ProjectDialogPreviewPanel
            v-else-if="(activePanel === 'editor' || activePanel === 'dashboard') && isProjectRunning"
            :panel-type="activePanel"
            :url="activePanel === 'editor' ? local.UrlAdmin : local.UrlDashboard"
            @open-action="onButtonOpenEditor"
          />

          <ProjectDialogInfo
            v-else-if="activePanel === 'info'"
            :projects-status="local.projectsStatus || getStatusData(local.name, null)"
            :submit-label="submitLabel"
            @open-action="onButtonOpenEditor"
            @confirm-delete="confirmDelete(local)"
          />

          <ProjectDialogSettings
            v-else
            :local="local"
            :errors="errors"
            :submit-type="submitType"
            :submit-label="submitLabel"
          />
        </div>

        <div v-else>
          <ProjectDialogSettings
            :local="local"
            :errors="errors"
            :submit-type="submitType"
            :submit-label="submitLabel"
          />
        </div>
      </v-card-text>

      <v-card-actions v-if="!isPreviewPanel" class="project-dialog-actions">
        <v-spacer />
        <v-btn variant="text" color="grey" @click="onClose">Cancel</v-btn>
        <v-btn color="success" @click="onSave">{{ submitLabel }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="420">
    <v-card>
      <v-card-title class="text-h6">
        Confirmar exclusao
      </v-card-title>

      <v-card-text>
        Are you sure you want to delete the project?
        <strong>{{ selectedToDelete?.name }}</strong>?
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn color="grey" @click="deleteDialog = false">
          Cancel
        </v-btn>

        <v-btn color="red" @click="confirmDeleteYes">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, watch, ref, toRaw, onUnmounted, computed } from "vue";
import { notify } from "@/utils/notify.js";
import ProjectDialogSettings from "@/components/ProjectDialogSettings.vue";
import ProjectDialogInfo from "@/components/ProjectDialogInfo.vue";
import ProjectDialogLog from "@/components/ProjectDialogLog.vue";
import ProjectDialogPreviewPanel from "@/components/ProjectDialogPreviewPanel.vue";

const props = defineProps({
  modelValue: Boolean,
  project: Object,
  title: String,
  submitLabel: String,
  readonlyName: Boolean,
  submitType: String
});

const dialogTitle = computed(() => {
  const baseTitle = props.title || "";
  if (props.submitType === "update" && local.name) {
    return `${baseTitle} - ${local.name}`;
  }
  return baseTitle;
});
const isProjectRunning = computed(() => local.projectsStatus?.text === "running");
const isPreviewPanel = computed(
  () => props.submitType === "update" && (activePanel.value === "editor" || activePanel.value === "dashboard")
);
const dialogWidth = computed(() => (isPreviewPanel.value ? "calc(100vw - 32px)" : null));
const dialogMaxWidth = computed(() => (isPreviewPanel.value ? "calc(100vw - 32px)" : 980));

const emit = defineEmits(["update:modelValue", "save"]);

const visible = ref(props.modelValue);
const activePanel = ref("settings");
const projectDialogLogRef = ref(null);

const projectLogText = ref("");
const logFileName = ref("");
const logError = ref("");
const isLogPinnedToBottom = ref(true);
const logScrollTop = ref(0);

const errors = reactive({
  name: [],
  uiPort: [],
  httpAdminRoot: [],
  httpNodeRoot: [],
  flowFile: [],
  StaticFolder: [],
  adminTitle: [],
  UrlAdmin: [],
  UrlDashboard: [],
  httpsKey: [],
  httpsCert: [],
  user: [],
  password: []
});

const local = reactive({
  id: null,
  name: "",
  uiPort: null,
  autoStart: false,
  UrlAdmin: "",
  UrlDashboard: "",
  adminAuth: false,
  description: "",
  projectsStatus: null,
  settings: {
    flowFile: "",
    httpAdminRoot: "",
    httpNodeRoot: "",
    uiPort: null,
    ui: { path: "/" },
    editorTheme: {
      page: { title: "" },
      projects: { enabled: false },
      tours: true
    },
    userDir: "",
    StaticPatch: "",
    functionGlobalContext: {},
    adminAuth: {
      type: "credentials",
      users: [
        {
          username: "",
          password: "",
          permissions: "*"
        }
      ]
    },
    StaticFolder: "",
    https: {
      enabled: false,
      key: "",
      cert: ""
    },
    telemetry: {
      enabled: false,
      updateNotification: false
    }
  }
});

let statusTimer = null;
let logTimer = null;

onUnmounted(() => {
  stopStatusPolling();
  stopLogPolling();
});

watch(() => props.modelValue, (v) => (visible.value = v));
watch(() => visible.value, (v) => emit("update:modelValue", v));

watch(
  () => props.project,
  (p) => {
    if (!p) return;
    Object.assign(local, JSON.parse(JSON.stringify(p)));
    if (!("description" in p)) {
      local.description = "";
    }
    activePanel.value = "settings";
    projectLogText.value = "";
    logFileName.value = "";
    logError.value = "";
    isLogPinnedToBottom.value = true;
  },
  { immediate: true }
);

watch(
  () => visible.value,
  (v) => {
    if (v && props.submitType === "update") {
      startStatusPolling();
      if (activePanel.value === "log") {
        fetchProjectLogs();
        startLogPolling();
      }
    } else {
      stopStatusPolling();
      stopLogPolling();
    }
  },
  { immediate: true }
);

watch(
  () => activePanel.value,
  (panel) => {
    if (panel === "log" && visible.value && props.submitType === "update") {
      if (!isLogPinnedToBottom.value) {
        restoreLogScrollPosition();
      }
      fetchProjectLogs();
      startLogPolling();
    } else {
      saveLogScrollPosition();
      stopLogPolling();
    }
  }
);

watch(
  () => isProjectRunning.value,
  (running) => {
    if (!running && (activePanel.value === "editor" || activePanel.value === "dashboard")) {
      activePanel.value = "settings";
    }
  }
);

watch(
  () => local,
  () => {
    if (local.settings.adminAuth == null) {
      local.settings.adminAuth = {
        type: "credentials",
        users: [
          {
            username: "",
            password: "",
            permissions: "*"
          }
        ]
      };
    }

    if (!Array.isArray(local.settings.adminAuth.users) || local.settings.adminAuth.users.length === 0) {
      local.settings.adminAuth.users = [
        {
          username: "",
          password: "",
          permissions: "*"
        }
      ];
    }

    local.settings.adminAuth.users.forEach((user) => {
      if (typeof user.username !== "string") {
        user.username = "";
      }

      if (typeof user.password !== "string") {
        user.password = "";
      }

      if (user.permissions !== "read" && user.permissions !== "*") {
        user.permissions = "*";
      }
    });
  },
  { deep: true }
);

async function validate() {
  Object.keys(errors).forEach((k) => (errors[k] = []));

  let ok = true;

  const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
  const fileNameRegex = /^[\w\-. ]+$/i;
  const pathRegex = /^\/.*$/;

  if (props.submitType === "new") {
    const checkSettings = await window.api.get("/checkSettings");
    const projectNameCheck = checkSettings.projects.some((u) => u.name === local.name);

    if (projectNameCheck) {
      errors.name.push("O nome ja existe");
      ok = false;
    }
  }

  if (!local.name.trim()) {
    errors.name.push("O nome nao pode estar vazio.");
    ok = false;
  }

  if (!local.uiPort || local.uiPort <= 0) {
    errors.uiPort.push("Porta invalida.");
    ok = false;
  }

  if (!urlRegex.test(local.UrlAdmin)) {
    errors.UrlAdmin.push("URL Admin invalida.");
    ok = false;
  }

  if (!urlRegex.test(local.UrlDashboard)) {
    errors.UrlDashboard.push("URL Dashboard invalida.");
    ok = false;
  }

  if (!pathRegex.test(local.settings.httpAdminRoot)) {
    errors.httpAdminRoot.push("Deve iniciar com '/'.");
    ok = false;
  }

  if (!pathRegex.test(local.settings.httpNodeRoot)) {
    errors.httpNodeRoot.push("Deve iniciar com '/'.");
    ok = false;
  }

  if (!fileNameRegex.test(local.settings.flowFile)) {
    errors.flowFile.push("Nome de arquivo invalido.");
    ok = false;
  }

  if (!fileNameRegex.test(local.settings.StaticFolder)) {
    errors.StaticFolder.push("Nome de pasta invalido.");
    ok = false;
  }

  if (!local.settings.editorTheme.page.title.trim()) {
    errors.adminTitle.push("Titulo nao pode estar vazio.");
    ok = false;
  }

  if (local.settings.https.key && !fileNameRegex.test(local.settings.https.key)) {
    errors.httpsKey.push("Nome de arquivo invalido.");
    ok = false;
  }

  if (local.settings.https.cert && !fileNameRegex.test(local.settings.https.cert)) {
    errors.httpsCert.push("Nome de arquivo invalido.");
    ok = false;
  }

  if (local.adminAuth) {
    if (!Array.isArray(local.settings.adminAuth.users) || local.settings.adminAuth.users.length === 0) {
      errors.user.push("Informe ao menos um usuario.");
      ok = false;
    } else {
      const normalizedUsernames = new Set();
      let hasDuplicateUsernames = false;

      local.settings.adminAuth.users.forEach((user, index) => {
        const username = String(user.username ?? "").trim();
        const normalizedUsername = username.toLowerCase();

        if (!username) {
          errors.user.push(`Usuario ${index + 1} nao pode estar vazio.`);
          ok = false;
        } else if (normalizedUsernames.has(normalizedUsername)) {
          hasDuplicateUsernames = true;
          ok = false;
        } else {
          normalizedUsernames.add(normalizedUsername);
        }

        if (!String(user.password ?? "").trim()) {
          errors.password.push(`Senha ${index + 1} nao pode estar vazia.`);
          ok = false;
        }
      });

      if (hasDuplicateUsernames) {
        errors.user.push("Duplicate usernames are not allowed.");
        notify.error("Duplicate usernames are not allowed.");
      }
    }
  }

  if (!ok) {
    if (!errors.user.includes("Duplicate usernames are not allowed.")) {
      notify.error("Existem erros no formulario. Verifique os campos.");
    }
  }

  return ok;
}

function onButtonOpenEditor(action) {
  if (action === "start_project") {
    window.api.post("/ctl_project_startWoker", { id: local.id, name: local.name });
    return;
  }

  if (action === "stop_project") {
    window.api.post("/ctl_project_stopWoker", { id: local.id, name: local.name });
    return;
  }

  const payload = {
    action,
    id: local.id
  };
  window.api.post("/ctl_project_windows_openEditor", payload);
}

const deleteDialog = ref(false);
const selectedToDelete = ref(null);

function confirmDelete(item) {
  selectedToDelete.value = item;
  deleteDialog.value = true;
}

function confirmDeleteYes() {
  if (!selectedToDelete.value) return;
  deleteProject(selectedToDelete.value);
  deleteDialog.value = false;
  selectedToDelete.value = null;
}

function deleteProject() {
  const data = { id: local.id, name: local.name };
  window.api.delete("/ctl_project_deleteProject", data);
  onClose();
}

async function onSave() {
  const isValidate = await validate();
  if (!isValidate) {
    return;
  }

  let payloadAddProject = null;

  if (props.submitType === "new") {
    payloadAddProject = await window.api.post("/ctl_project_addProject", toRaw(local));
  }

  if (props.submitType === "update") {
    payloadAddProject = await window.api.put("/ctl_project_updateProject", toRaw(local));
  }

  if (payloadAddProject.status === false) {
    notify.error(payloadAddProject.message || "Failed to save project.");
    return;
  }

  if (payloadAddProject.status === true) {
    notify.success("Projeto salvo com sucesso!");
    visible.value = false;
  }
}

function onClose() {
  stopLogPolling();
  stopStatusPolling();
  activePanel.value = "settings";
  visible.value = false;
}

function getStatusData(iName, iPayload) {
  if (!iPayload) {
    return {
      name: iName,
      text: "stopped",
      color: "red",
      pid: null,
      ramBytes: null,
      cpuPercent: null,
      diskReadBytesPerSec: null,
      diskWriteBytesPerSec: null
    };
  }

  if (iPayload.pid == null) {
    return {
      name: iName,
      text: "starting",
      color: "light-green",
      pid: null,
      ramBytes: null,
      cpuPercent: null,
      diskReadBytesPerSec: null,
      diskWriteBytesPerSec: null
    };
  }

  return {
    name: iName,
    text: "running",
    color: "green",
    pid: iPayload.pid,
    ramBytes: iPayload.rssBytes ?? null,
    cpuPercent: iPayload.cpuPercent ?? null,
    diskReadBytesPerSec: iPayload.diskReadBytesPerSec ?? null,
    diskWriteBytesPerSec: iPayload.diskWriteBytesPerSec ?? null
  };
}

function startStatusPolling() {
  stopStatusPolling();
  statusTimer = setInterval(async () => {
    if (!local.name) return;
    const payloadStatusProjects = await window.api.get("/ctl_project_getStatus");
    const resultado = payloadStatusProjects.find((item) => item.name === local.name);
    local.projectsStatus = getStatusData(local.name, resultado);
  }, 1000);
}

function stopStatusPolling() {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
}

async function fetchProjectLogs() {
  if (!local.id) return;
  const shouldAutoScroll = isLogPinnedToBottom.value;

  const payload = await window.api.post("/ctl_project_log_tail", { id: local.id, lines: 150 });

  if (payload?.status === true) {
    projectLogText.value = payload.text || "";
    logFileName.value = payload.file || "";
    logError.value = "";
    if (shouldAutoScroll) {
      await scrollLogToBottom();
    } else {
      await restoreLogScrollPosition();
    }
    return;
  }

  projectLogText.value = "";
  logFileName.value = "";
  logError.value = payload?.error || "Erro ao carregar logs.";
}

async function scrollLogToBottom() {
  if (!projectDialogLogRef.value) return;
  await projectDialogLogRef.value.scrollToBottom();
}

function onLogScroll(payload) {
  if (!payload) return;
  logScrollTop.value = payload.scrollTop;
  const threshold = 6;
  const distanceFromBottom = payload.scrollHeight - payload.scrollTop - payload.clientHeight;
  isLogPinnedToBottom.value = distanceFromBottom <= threshold;
}

function saveLogScrollPosition() {
  if (!projectDialogLogRef.value) return;
  logScrollTop.value = projectDialogLogRef.value.getScrollTop();
}

async function restoreLogScrollPosition() {
  if (!projectDialogLogRef.value) return;
  await projectDialogLogRef.value.setScrollTop(logScrollTop.value);
}

function startLogPolling() {
  stopLogPolling();
  logTimer = setInterval(() => {
    fetchProjectLogs();
  }, 1500);
}

function stopLogPolling() {
  if (logTimer) {
    clearInterval(logTimer);
    logTimer = null;
  }
}
</script>

<style scoped>
:deep(.project-dialog-overlay-content) {
  margin: 0;
  height: 100vh;
  max-height: 100vh;
}

.project-dialog-card--fixed {
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.project-dialog-body--fixed {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.project-dialog-body--fill-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.project-dialog-actions {
  flex-shrink: 0;
}

.project-dialog-log-fill {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.project-dialog-panel-host {
  width: 100%;
}

.project-dialog-panel-host--fill {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.panel-tabs-wrapper {
  width: 100%;
}
</style>
