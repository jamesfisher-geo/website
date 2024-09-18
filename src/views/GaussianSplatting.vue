<template>
  <div class="wrapper">
    <div class="centered-window">
      <div class="window">
        <GaussianSplattingViewer class="gsViewer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import GaussianSplattingViewer from '../components/GaussianSplattingViewer.vue'
</script>

<style scoped>
.centered-window {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
}
</style>
