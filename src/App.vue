<template>
  <router-view />
    <GlobalNotification />
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useTheme } from "vuetify";
import GlobalNotification from "@/components/GlobalNotification.vue";

const theme = useTheme();

// Helper to resolve theme based on config value and system preference
function applyTheme(themeValue) {
  if (themeValue === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme.global.name.value = isDark ? "dark" : "light";
  } else if (themeValue === "light") {
    theme.global.name.value = "light";
  } else {
    // default to dark, as requested
    theme.global.name.value = "dark";
  }
}

// Handler for system theme changes (e.g. from light to dark OS mode)
function handleSystemThemeChange(e) {
  window.api.get("/checkSettings").then(payload => {
    const currentTheme = payload?.app?.theme || "dark";
    if (currentTheme === "system") {
      theme.global.name.value = e.matches ? "dark" : "light";
    }
  }).catch(err => {
    console.error("Failed to load settings in system theme change handler:", err);
  });
}

// Handler for custom settings update events
function handleThemeChangedEvent(e) {
  applyTheme(e.detail);
}

onMounted(async () => {
  // Load settings on startup to apply the correct theme
  try {
    const payload = await window.api.get("/checkSettings");
    const currentTheme = payload?.app?.theme || "dark";
    applyTheme(currentTheme);
  } catch (err) {
    console.error("Failed to load theme settings on mount:", err);
    applyTheme("dark"); // fallback default
  }

  // Listen for manual settings updates
  window.addEventListener("theme-changed", handleThemeChangedEvent);

  // Listen for system preference theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemThemeChange);
  } else {
    mediaQuery.addListener(handleSystemThemeChange);
  }
});

onUnmounted(() => {
  window.removeEventListener("theme-changed", handleThemeChangedEvent);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  } else {
    mediaQuery.removeListener(handleSystemThemeChange);
  }
});
</script>
