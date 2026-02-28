<template>
  <v-app>
    <v-main class="ma-0 pa-0">
      <div class="main-top-menu">
        <v-tabs density="compact" class="ma-0 pa-0">
          <v-tab :to="{ name: 'projects' }" replace>PROJECTS</v-tab>
          <v-tab :to="{ name: 'settings' }" replace>SETTINGS</v-tab>
        </v-tabs>
      </div>

      <section class="page-content pa-4">
        <router-view />
      </section>
    </v-main>
  </v-app>
</template>

<script setup>
</script>

<style scoped>
.main-top-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: rgb(var(--v-theme-surface));
}

.page-content {
  padding-top: 56px !important;
}

:deep(.v-application__wrap) {
  padding-top: 0 !important;
}
</style>
