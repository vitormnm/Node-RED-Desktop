<template>
  <v-card class="pa-4 project-card">
    <!-- <v-card-title>
      
    </v-card-title> -->
    <!-- 🔹 BARRA DE AÇÕES -->
    <div class="table-actions">
      <v-btn size="small" class="action-btn" color="grey" prepend-icon="mdi-plus" @click="openNewProject">
        New Project
      </v-btn>
    </div>

    <div class="table-actions sticky-actions">
      <v-btn size="small" class="action-btn" color="green" prepend-icon="mdi-play" @click="startSelected()">
        start
      </v-btn>

      <v-btn size="small" class="action-btn" color="red" prepend-icon="mdi-stop" @click="stopSelected()">
        stop
      </v-btn>

      <v-text-field v-model="search" label="search" density="compact" variant="outlined" hide-details clearable
        class="search-field" />
    </div>

    <div class="table-wrapper">
      <v-data-table
        :items="projects"
        :headers="headers"
        :search="search"
        :row-props="getRowProps"
        class="elevation-1 fixed-table"
        item-key="id"
        :items-per-page="-1"
        hide-default-footer
      >

        <!-- ✅ HEADER DO CHECKBOX -->
        <template #header.select>
          <v-checkbox :model-value="allSelected" :indeterminate="isIndeterminate" @update:model-value="toggleAll"
            density="compact" hide-details class="ma-0 pa-0" />
        </template>

        <template #item.select="{ item }">
          <v-checkbox v-model="selected" :value="item.id" density="compact" hide-details class="ma-0 pa-0" />
        </template>

        <template #item.name="{ item }">
          <v-chip
            size="small"
            class="ma-0 name-chip"
            text-color="white"
            :color="item.projectsStatus.color"
            @mousedown="onNameMouseDown($event, item)"
            @click="onNameClick($event, item)"
            @contextmenu.prevent="openContextMenu($event, item)"
          >
            <v-icon v-if="item.adminAuth" size="16" class="mr-1 name-icon"
              title="Security enabled">mdi-shield-lock</v-icon>
            <v-icon v-if="item.autoStart" size="16" class="mr-1 name-icon" title="Auto start">mdi-play</v-icon>
            <v-icon v-if="item.autoRestart" size="16" class="mr-1 name-icon" title="Auto restart">mdi-restart</v-icon>
            <v-icon v-if="item.settings?.https?.enabled" size="16" class="mr-1 name-icon"
              title="HTTPS enabled">mdi-lock</v-icon>
            <v-icon v-if="item.settings?.editorTheme?.projects?.enabled" size="16" class="mr-1 name-icon"
              title="Projects enabled">mdi-git</v-icon>
            <v-icon v-if="item.settings?.telemetry?.enabled" size="16" class="mr-1 name-icon"
              title="Telemetry enabled">mdi-chart-line</v-icon>
            {{ item.name }}
          </v-chip>
        </template>

        <template #item.description="{ item }">
          <span :title="item.description">
            {{ formatDescription(item.description) }}
          </span>
        </template>

      </v-data-table>
    </div>

  </v-card>

  <!-- Dialog de edição -->
  <ProjectDialog v-model:model-value="dialog" :project="selectedProject" :title="dialogTitle"
    :submitLabel="dialogSubmitLabel" :readonlyName="false" :submitType="dialogSubmitType" @save="onDialogSave" />

  <!-- Menu de contexto -->
  <ProjectContextMenu
    v-model="contextMenuVisible"
    :x="contextMenuX"
    :y="contextMenuY"
    :project="contextMenuProject"
    @action="handleContextMenuAction"
  />

  <!-- Modal de confirmação de exclusão -->
  <v-dialog v-model="deleteDialog" max-width="420">
    <v-card class="pa-4">
      <v-card-title class="text-h6 font-weight-bold">
        Confirm Deletion
      </v-card-title>
      <v-card-text>
        Are you sure you want to delete the project
        <strong>{{ selectedToDelete?.name }}</strong>?
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="grey" @click="deleteDialog = false">
          Cancel
        </v-btn>
        <v-btn color="red" @click="confirmDeleteYes">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 🔹 FLOATING DRAG PREVIEW GHOST -->
  <div
    v-if="isDragging && draggedItem"
    class="drag-preview-ghost"
    :style="{ top: `${dragMouseY + 12}px`, left: `${dragMouseX + 12}px` }"
  >
    <v-chip
      small
      text-color="white"
      :color="draggedItem.projectsStatus?.color || 'grey'"
      elevation="6"
    >
      <v-icon size="16" class="mr-1">mdi-drag</v-icon>
      {{ draggedItem.name }}
    </v-chip>
  </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import ProjectDialog from "@/components/ProjectDialog.vue";
import ProjectContextMenu from "@/components/ProjectContextMenu.vue";

const headers = [
  { title: "", key: "select", sortable: false, width: "48px" },
  { title: "Name", key: "name" },
  { title: "Description", key: "description" },
  { title: "Port", key: "uiPort" },
];

var projects = ref([]);
const selected = ref([]);
const search = ref("");
// ---------- DRAG & DROP REORDERING ----------
const isDragging = ref(false);
const draggedItem = ref(null);
const dragOverItem = ref(null);
const dragMouseX = ref(0);
const dragMouseY = ref(0);
let activeDragCleanup = null;

function getRowProps(data) {
  const item = data?.item?.raw ?? data?.item ?? data;
  const isDragged = draggedItem.value && item && draggedItem.value.id === item.id;
  const isOver = dragOverItem.value && item && dragOverItem.value.id === item.id;

  return {
    "data-project-id": String(item?.id),
    class: {
      "draggable-row": true,
      "is-dragging": !!isDragged,
      "drag-over-row": !!(isOver && !isDragged),
    }
  };
}

function onNameMouseDown(event, item) {
  if (event.button !== 0) return; // Only left mouse button

  const startX = event.clientX;
  const startY = event.clientY;
  let hasMoved = false;
  let isCancelled = false;

  function onKeyDown(e) {
    if (e.key === "Escape" || e.key === "Esc") {
      isCancelled = true;
      cleanup();
    }
  }

  function onMouseMove(e) {
    if (isCancelled) return;

    dragMouseX.value = e.clientX;
    dragMouseY.value = e.clientY;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasMoved = true;
      isDragging.value = true;
      draggedItem.value = item;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    if (isDragging.value) {
      // Find element under cursor
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const row = element.closest("tr");
        if (row && row.dataset && row.dataset.projectId) {
          const targetId = row.dataset.projectId;
          const found = projects.value.find(p => String(p.id) === String(targetId));
          if (found && found.id !== item.id) {
            dragOverItem.value = found;
          }
        }
      }

      // Auto-scroll when cursor is near top/bottom edge of window
      const threshold = 90;
      const viewportHeight = window.innerHeight;
      if (e.clientY < threshold) {
        const speed = -Math.max(4, Math.floor((threshold - Math.max(0, e.clientY)) / 3));
        window.scrollBy(0, speed);
      } else if (e.clientY > viewportHeight - threshold) {
        const speed = Math.max(4, Math.floor((e.clientY - (viewportHeight - threshold)) / 3));
        window.scrollBy(0, speed);
      }
    }
  }

  function cleanup() {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    activeDragCleanup = null;

    setTimeout(() => {
      isDragging.value = false;
      draggedItem.value = null;
      dragOverItem.value = null;
    }, 50);
  }

  function onMouseUp() {
    if (isCancelled) {
      cleanup();
      return;
    }

    if (isDragging.value && dragOverItem.value && item) {
      const fromIndex = projects.value.findIndex(p => p.id === item.id);
      const toIndex = projects.value.findIndex(p => p.id === dragOverItem.value.id);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        moveProject(fromIndex, toIndex);
      }
    }

    cleanup();
  }

  activeDragCleanup = cleanup;
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);
}

function onNameClick(event, item) {
  if (isDragging.value) return;
  openEditDialog(item);
}

async function moveProject(fromIndex, toIndex) {
  const updatedProjects = [...projects.value];
  const [moved] = updatedProjects.splice(fromIndex, 1);
  updatedProjects.splice(toIndex, 0, moved);

  projects.value = updatedProjects;

  const orderedIds = updatedProjects.map(p => p.id);
  try {
    const res = await window.api.put("/ctl_project_reorderProjects", { orderedIds });
    if (res && res.status === false) {
      console.error("Failed to reorder projects:", res.message);
    }
  } catch (err) {
    console.error("Error calling reorder API:", err);
  }
}

let renderTimer = null;

onMounted(async () => {
  renderTable();
  renderTimer = setInterval(() => {
    renderTable();
  }, 1000);
});

onUnmounted(() => {
  if (renderTimer) {
    clearInterval(renderTimer);
    renderTimer = null;
  }
  if (activeDragCleanup) {
    activeDragCleanup();
  }
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
  if (isDragging.value) return;

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
      flowFile: 'flows.json',
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


// ---------- CONTROLE DO CONTEXT MENU ----------
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuProject = ref(null);

function openContextMenu(event, item) {
  event.preventDefault();
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuProject.value = item;
  contextMenuVisible.value = true;
}

function handleContextMenuAction({ action, project }) {
  if (!project) return;
  switch (action) {
    case "start":
      startProject(project);
      break;
    case "stop":
      stopProject(project);
      break;
    case "restart":
      restartProject(project);
      break;
    case "open_editor":
      openProjectAction("open_editor", project);
      break;
    case "open_dashboard":
      openProjectAction("open_dashboard", project);
      break;
    case "open_folder":
      openProjectAction("open_folder", project);
      break;
    case "delete":
      confirmDelete(project);
      break;
  }
}

function restartProject(item) {
  const idx = projects.value.findIndex((p) => p.id === item.id);
  if (idx === -1) return;
  const data = { id: projects.value[idx].id, name: projects.value[idx].name };
  window.api.post("/ctl_project_restartWoker", data);
}

function openProjectAction(action, item) {
  const payload = {
    action,
    id: item.id,
    fullscreen: false,
  };
  window.api.post("/ctl_project_windows_openEditor", payload);
}

function formatDescription(desc) {
  if (!desc) return "";
  return desc.length > 20 ? desc.slice(0, 20) + "..." : desc;
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
  user-select: none;
}

.name-chip:active {
  cursor: grabbing;
}

.btn-small {
  padding: 4px 8px !important;
  font-size: 12px !important;
  min-width: 50px !important;
}

.action-btn {
  width: 160px;
  justify-content: start !important;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-field {
  max-width: 280px;
}

.project-card {
  overflow: visible !important;
}

.sticky-actions {
  position: sticky;
  top: 48px; /* Sticks right below the compact v-tabs top menu */
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  /* Extend to cover card padding margins so table content scrolls behind it cleanly */
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
  margin-top: -12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.draggable-row {
  transition: background-color 0.15s ease, border 0.15s ease;
}

:deep(tr.is-dragging) {
  opacity: 0.35 !important;
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
}

:deep(tr.drag-over-row) {
  border-top: 3px solid rgb(var(--v-theme-primary)) !important;
  border-bottom: 3px solid rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.18) !important;
}

:deep(tr.drag-over-row td) {
  background-color: rgba(var(--v-theme-primary), 0.18) !important;
}

.drag-preview-ghost {
  position: fixed;
  z-index: 99999;
  pointer-events: none;
  opacity: 0.92;
  user-select: none;
  transform: translate(0, 0);
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.4));
}
</style>
