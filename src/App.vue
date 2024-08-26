<template>
  <div id="app">
    <template v-if="$route.path === '/'">
      <NavBar :homepage="true" />
    </template>
    <template v-else>
      <NavBar />
    </template>
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
  min-height: 100vh;
}

main {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
