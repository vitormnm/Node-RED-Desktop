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
        <v-card class="mb-3" variant="outlined">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title :class="{ 'security-users-title': hasEmptyUserError }">
                Security Users
                <span v-if="hasEmptyUserError" class="security-users-warning">
                  One or more users have validation errors
                </span>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-expansion-panels multiple class="mb-3">
                  <v-expansion-panel
                    v-for="(user, index) in local.settings.adminAuth.users"
                    :key="`admin-auth-user-${index}`"
                    elevation="1"
                  >
                    <v-expansion-panel-title :class="{ 'security-user-title--error': userHasError(index) }">
                      {{ user.username || "User" }}
                    </v-expansion-panel-title>

                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="4">
                          <v-text-field
                            label="User"
                            type="text"
                            v-model="user.username"
                            :error-messages="getUserMessages(index)"
                          />
                        </v-col>

                        <v-col cols="12" md="4">
                          <v-text-field
                            label="Password"
                            type="password"
                            v-model="user.password"
                            :error-messages="getPasswordMessages(index)"
                          />
                        </v-col>

                        <v-col cols="12" md="4">
                          <v-select
                            label="Role"
                            v-model="user.permissions"
                            :items="permissionOptions"
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>

                      <v-btn
                        size="small"
                        color="red"
                        prepend-icon="mdi-delete"
                        :disabled="local.settings.adminAuth.users.length === 1"
                        @click="removeAdminUser(index)"
                      >
                        Delete
                      </v-btn>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-btn
                  size="small"
                  color="grey"
                  prepend-icon="mdi-plus"
                  @click="addAdminUser"
                >
                  Add user
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
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
import { computed } from "vue";

const permissionOptions = [
  { title: "Admin", value: "*" },
  { title: "Reader", value: "read" }
];

function addAdminUser() {
  const users = getAdminUsers();
  users.push({
    username: "",
    password: "",
    permissions: "*"
  });
}

function removeAdminUser(index) {
  const users = getAdminUsers();
  if (users.length <= 1) {
    return;
  }

  users.splice(index, 1);
}

function getAdminUsers() {
  if (!props.local.settings.adminAuth) {
    props.local.settings.adminAuth = {
      type: "credentials",
      users: []
    };
  }

  if (!Array.isArray(props.local.settings.adminAuth.users)) {
    props.local.settings.adminAuth.users = [];
  }

  return props.local.settings.adminAuth.users;
}

const props = defineProps({
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

const hasEmptyUserError = computed(() =>
  (Array.isArray(props.errors.user) && props.errors.user.some((message) => message.startsWith("User "))) ||
  (Array.isArray(props.errors.password) && props.errors.password.some((message) => message.startsWith("Password ")))
);

function getUserMessages(index) {
  if (!Array.isArray(props.errors.user)) {
    return [];
  }
  const marker = `User ${index + 1} `;
  return props.errors.user.filter((message) => message.startsWith(marker));
}

function getPasswordMessages(index) {
  if (!Array.isArray(props.errors.password)) {
    return [];
  }
  const marker = `Password ${index + 1} `;
  return props.errors.password.filter((message) => message.startsWith(marker));
}

function userHasError(index) {
  return getUserMessages(index).length > 0 || getPasswordMessages(index).length > 0;
}

</script>

<style scoped>
.dialog-content {
  min-width: 0;
}

.security-users-title {
  color: #b71c1c;
}

.security-users-warning {
  color: #b71c1c;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 8px;
}

.security-user-title--error {
  color: #b71c1c;
}
</style>
