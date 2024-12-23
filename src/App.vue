<template>
  <div id="app">
    <NavBar :homepage="$route.path === '/'" />
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<!-- test -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inconsolata&display=swap');

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inconsolata', monospace;
  display: flex;
  flex-direction: column;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
</style>
