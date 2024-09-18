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

<style>
@import url('https://fonts.googleapis.com/css2?family=Inconsolata&display=swap');

body {
  margin: 0;
  padding: 0;
  font-family: 'Inconsolata', monospace;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
