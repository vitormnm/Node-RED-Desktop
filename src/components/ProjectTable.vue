<template>
  <v-card class="pa-4">
    <!-- <v-card-title>
      
    </v-card-title> -->
    <!-- 🔹 BARRA DE AÇÕES -->
    <div class="table-actions">
      <v-btn  size="small" class="btn-small mx-1" color="green" @click="startSelected()">
        <v-icon  left>mdi-play</v-icon>
        start
      </v-btn>

      <v-btn  size="small" class="btn-small mx-1" color="red" @click="stopSelected()">
        <v-icon left>mdi-stop</v-icon>
        stop
      </v-btn>

      <v-text-field
        v-model="search"
        label="search"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="search-field mx-1"
      />
    </div>

    <div class="table-wrapper">
      <v-data-table :items="projects" :headers="headers" :search="search" class="elevation-1 fixed-table" item-key="id"
        hide-default-footer>

        <!-- ✅ HEADER DO CHECKBOX -->
        <template #header.select>
          <v-checkbox :model-value="allSelected" :indeterminate="isIndeterminate" @update:model-value="toggleAll"
            hide-details />
        </template>

        <template #item.select="{ item }">
          <v-checkbox v-model="selected" :value="item.id" hide-details />
        </template>



        <template #item.name="{ item }">
          <v-chip small class="ma-0 name-chip" text-color="white" :color="item.projectsStatus.color"
            @click="openEditDialog(item)">
            {{ item.name }}
            <v-icon v-if="item.adminAuth" size="16" class="ml-2 name-icon"
              title="Security enabled">mdi-shield-lock</v-icon>
            <v-icon v-if="item.autoStart" size="16" class="ml-1 name-icon"
              title="Auto start">mdi-play</v-icon>
            <v-icon v-if="item.settings?.https?.enabled" size="16" class="ml-1 name-icon"
              title="HTTPS enabled">mdi-lock</v-icon>
            <v-icon v-if="item.settings?.editorTheme?.projects?.enabled" size="16" class="ml-1 name-icon"
              title="Projects enabled">mdi-git</v-icon>
            <v-icon v-if="item.settings?.telemetry?.enabled" size="16" class="ml-1 name-icon"
              title="Telemetry enabled">mdi-chart-line</v-icon>
          </v-chip>
        </template>

        <template #item.port="{ item }">
          {{ item.uiPort }}
        </template>


        
      </v-data-table>
    </div>

    <div class="actions-row">
      <v-spacer />
      <v-btn  size="small"  color="grey" class="mt-3" @click="openNewProject">
        <v-icon left>mdi-plus</v-icon>
        New Project
      </v-btn>
    </div>
  </v-card>

  <!-- Dialog de edição -->
  <ProjectDialog v-model:model-value="dialog" :project="selectedProject" :title="dialogTitle"
    :submitLabel="dialogSubmitLabel" :readonlyName="false" :submitType="dialogSubmitType" @save="onDialogSave" />


</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import ProjectDialog from "@/components/ProjectDialog.vue";

const headers = [
  { title: "", key: "select", sortable: false },
  { title: "Name", key: "name" },
  { title: "Port", key: "port" },

];

var projects = ref([]);
const selected = ref([]);
const search = ref("");


onMounted(async () => {

  renderTable();
  setInterval(() => {
    renderTable();
  }, 1000);
});

onUnmounted(() => {

});

// ---------- CONTROLE DO DELETE MODAL ----------
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
// ------------------------------------------------

async function renderTable() {
  const payload = await window.api.get("/checkSettings");
  let payloadStatusProjects = await window.api.get("/ctl_project_getStatus");

  for (let index = 0; index < payload.projects.length; index++) {
    let data = payload.projects[index];
    const resultado = payloadStatusProjects.find(item => item.name === data.name);
    payload.projects[index]["projectsStatus"] = getStatusData(data.name, resultado);
  }



  projects.value = payload.projects;
}

const dialog = ref(false);
const selectedProject = ref(null);

const dialogTitle = ref("Update");
const dialogSubmitLabel = ref("Update");
const dialogSubmitType = ref("update");

function openEditDialog(item) {
  selectedProject.value = { ...item };
  dialogTitle.value = "Update";
  dialogSubmitLabel.value = "Update";
  dialogSubmitType.value = "update";
  dialog.value = true;
}

function openNewProject() {


  let projecs_length = projects.value.length
  let uiPort = 1880 + projecs_length

  selectedProject.value = {
    id: null,
    name: `Project${projecs_length}`,
    uiPort: uiPort,
    autoStart: false,
    UrlAdmin: `http://localhost:${uiPort}/red/admin`,
    UrlDashboard: `http://localhost:${uiPort}/red/admin`,
    adminAuth: false,
    settings: {
      flowFile: 'flow.json',
      httpAdminRoot: '/red/admin',
      httpNodeRoot: '/',
      uiPort: uiPort,
      ui: { path: '/' },
      editorTheme: {
        page: { title: `Project${projecs_length}` },
        projects: { enabled: false },
        tours: true,
      },
      userDir: '',
      StaticPatch: '',
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
      StaticFolder: 'static',

      https: { enabled: false, key: '', cert: '' },
      telemetry: { enabled: false, updateNotification: false },
    },
  };

  dialogTitle.value = "New project";
  dialogSubmitLabel.value = "Save";
  dialogSubmitType.value = "new";
  dialog.value = true;
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

function onDialogSave(updated) {
  if (updated.id == null) {
    const maxId = projects.value.reduce((acc, p) => Math.max(acc, p.id ?? 0), 0);
    updated.id = maxId + 1;
    projects.value.push({ ...updated });
  } else {
    const idx = projects.value.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...updated };
    }
  }
  dialog.value = false;
}

function startSelected() {
  const selectedProjects = projects.value.filter(p =>
    selected.value.includes(p.id)
  )

  selectedProjects.forEach(element => {
    startProject(element)
  });
}

function stopSelected() {
  const selectedProjects = projects.value.filter(p =>
    selected.value.includes(p.id)
  )

  selectedProjects.forEach(element => {
    stopProject(element)
  });
}

function startProject(item) {

  const idx = projects.value.findIndex((p) => p.id === item.id);
  const data = { id: projects.value[idx].id, name: projects.value[idx].name };
  window.api.post("/ctl_project_startWoker", data);
}

function stopProject(item) {
  const idx = projects.value.findIndex((p) => p.id === item.id);
  const data = { id: projects.value[idx].id, name: projects.value[idx].name };
  window.api.post("/ctl_project_stopWoker", data);
}

function deleteProject(item) {
  const idx = projects.value.findIndex((p) => p.id === item.id);

  const data = { id: projects.value[idx].id, name: projects.value[idx].name };
  window.api.delete("/ctl_project_deleteProject", data);
}


//checkbox
function toggleAll(value) {
  if (value) {
    selected.value = projects.value.map(p => p.id)
  } else {
    selected.value = []
  }
}

</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.fixed-table table {
  border-collapse: separate !important;
  border-spacing: 0 8px !important;
  min-width: 950px;
  width: 950px;
  table-layout: fixed;
  white-space: nowrap;
}

.name-chip {
  cursor: pointer;
}

.btn-small {
  padding: 4px 8px !important;
  font-size: 12px !important;
  min-width: 50px !important;
}

.actions-row {
  justify-content: flex-start;
  align-items: center;
  margin-top: 8px;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  /* 👈 muda aqui */
  margin-bottom: 12px;
}

.search-field {
  max-width: 280px;
}
</style>




