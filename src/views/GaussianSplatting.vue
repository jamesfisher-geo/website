<template>
    <div class="wrapper">
      <!-- <TopNavbar /> -->
  
      <!-- Centered GaussianSplattingViewer with 80% width -->
      <div class="centered-window">
        <div class="window">
            <GaussianSplattingViewer class="gsViewer" />
        </div>
    </div>
  
      <!-- <Footer /> -->
    </div>
  </template>
  
  <script setup>
  import GaussianSplattingViewer from '../components/GaussianSplattingViewer.vue';
  </script>
  
  <style scoped>
  .centered-window {
  display: flex;
  justify-content: center;
  align-items: center; 
  height: 90vh;
}
  </style>