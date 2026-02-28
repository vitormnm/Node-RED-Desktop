<template>
  <v-snackbar
    v-model="notify.show"
    :color="notify.color"
    timeout="4000"
    location="top right"
  >
    {{ notify.message }}
  </v-snackbar>
</template>

<script setup>
import { notify } from "@/utils/notify.js";
</script>
