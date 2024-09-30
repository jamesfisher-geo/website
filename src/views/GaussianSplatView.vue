<template>
  <div class="viewer-container">
    <div class="centered-window">
      <GaussianSplatViewer
        :mode="0"
        :camera-up="[0, -1, -0.17]"
        :initial-camera-position="[-5, -1, -1]"
        :initial-camera-look-at="[-1.72477, 0.05395, -0.00147]"
        :spherical-harmonics-degree="2"
        asset-path=""
      />
    </div>
  </div>
</template>

<script>
import GaussianSplatViewer from '../components/GaussianSplatViewer.vue'

export default {
  components: {
    GaussianSplatViewer
  }
}
</script>

<style scoped>
.viewer-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  padding-top: 5vh;
  background-color: #f0f0f000;
}

.centered-window {
  display: flex;
  width: 75vw;
  height: 80vh;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
</style>
