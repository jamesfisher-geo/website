<template>
  <div class="default-layout">
    <header>
      <NavBar />
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from '../components/NavBar.vue'
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  /* min-height: 100vh; */
}

header {
  display: flex;
  justify-content: center;
  padding: 200px 0;
}

main {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>
