<template>
  <div class="home-layout">
    <div class="nav-container">
      <NavBar />
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue'
</script>

<style scoped>
.home-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}

.nav-container {
  width: 100%;
  /* max-width: 600px; */
  padding: 20px;
}
</style>
