<script setup lang="ts">
import appHeader from './header.vue';
import appFooter from './footer.vue';
</script>

<template>
  <div>
    <app-header />
    <main>
      <slot />
    </main>
    <app-footer />
  </div>
</template>

<style scoped>

</style>