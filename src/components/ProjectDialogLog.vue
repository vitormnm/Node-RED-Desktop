<template>
  <section class="log-panel">
    <div class="log-toolbar mb-2">
      <v-chip size="small" color="grey-lighten-2">
        {{ logFileName ? `File: ${logFileName}` : "File: -" }}
      </v-chip>
      <v-spacer />
      <v-btn size="small" variant="outlined" @click="emit('refresh')">Refresh</v-btn>
    </div>

    <v-alert v-if="logError" type="error" density="compact" class="mb-2">
      {{ logError }}
    </v-alert>

    <pre ref="logContentRef" class="log-content" @scroll="onScroll">{{ projectLogText || "Sem logs para este projeto." }}</pre>
  </section>
</template>

<script setup>
import { nextTick, ref } from "vue";

defineProps({
  projectLogText: {
    type: String,
    default: ""
  },
  logFileName: {
    type: String,
    default: ""
  },
  logError: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["refresh", "log-scroll"]);
const logContentRef = ref(null);

function onScroll() {
  const element = logContentRef.value;
  if (!element) return;
  emit("log-scroll", {
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight
  });
}

async function scrollToBottom() {
  await nextTick();
  if (!logContentRef.value) return;
  logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
}

async function setScrollTop(value) {
  await nextTick();
  if (!logContentRef.value) return;
  logContentRef.value.scrollTop = value;
}

function getScrollTop() {
  if (!logContentRef.value) return 0;
  return logContentRef.value.scrollTop;
}

defineExpose({
  scrollToBottom,
  setScrollTop,
  getScrollTop
});
</script>

<style scoped>
.log-toolbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.log-content {
  display: block;
  background: #111;
  color: #d6d6d6;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: auto;
  overflow-y: scroll;
  scrollbar-gutter: stable;
  scrollbar-width: auto;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  margin: 0;
}

.log-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
}
</style>
