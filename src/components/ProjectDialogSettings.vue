<template>
  <section class="dialog-content">
    <v-form class="mt-4" lazy-validation>
      <v-text-field label="Name" v-model="local.name" :readonly="submitType === 'update'" :error-messages="errors.name" />

      <v-textarea
        label="Description"
        v-model="local.description"
        auto-grow
        rows="3"
        max-rows="3"
      />

      <v-text-field label="Port" type="number" v-model="local.uiPort" :error-messages="errors.uiPort" />

      <v-row>
        <v-col cols="12">
          <v-checkbox v-model="local.autoStart" label="Auto start" />
          <v-checkbox v-model="local.settings.https.enabled" label="Enabled HTTPS" />
          <v-checkbox v-model="local.settings.editorTheme.projects.enabled" label="Enabled project (required git)" />
          <v-checkbox v-model="local.adminAuth" label="Enabled security" />
        </v-col>
      </v-row>

      <template v-if="local.adminAuth">
        <v-text-field label="User" type="text" v-model="local.settings.adminAuth.users[0].username" :error-messages="errors.user" />
        <v-text-field label="Password" type="password" v-model="local.settings.adminAuth.users[0].password" :error-messages="errors.password" />
      </template>

      <v-text-field label="http Admin Root" v-model="local.settings.httpAdminRoot" :error-messages="errors.httpAdminRoot" />

      <v-text-field label="http Node Root" v-model="local.settings.httpNodeRoot" :error-messages="errors.httpNodeRoot" />

      <v-text-field label="Flow file name" v-model="local.settings.flowFile" :error-messages="errors.flowFile" />

      <v-text-field label="Folder static files" v-model="local.settings.StaticFolder" :error-messages="errors.StaticFolder" />

      <v-text-field label="Admin title" v-model="local.settings.editorTheme.page.title" :error-messages="errors.adminTitle" />

      <v-text-field label="Url admin Node-RED" v-model="local.UrlAdmin" :error-messages="errors.UrlAdmin" />

      <v-text-field label="Url Dashboard Node-RED" v-model="local.UrlDashboard" :error-messages="errors.UrlDashboard" />

      <v-text-field label="HTTPS key file" v-model="local.settings.https.key" :error-messages="errors.httpsKey" />

      <v-text-field label="HTTPS cert file" v-model="local.settings.https.cert" :error-messages="errors.httpsCert" />
    </v-form>
  </section>
</template>

<script setup>
defineProps({
  local: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    required: true
  },
  submitType: {
    type: String,
    required: true
  },
  submitLabel: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.dialog-content {
  min-width: 0;
}
</style>
