<template>
  <div ref="container" class="viewer-content">
    <select v-model="selectedOption" class="dropdown" @change="loadSelectedModel">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <div class="instructions-window">
      <img
        src="../assets/help.svg"
        alt="Instructions Logo"
        class="instructions-logo"
        @click="toggleInstructions"
      />
      <div class="instructions-content" :class="{ expanded: isInstructionsExpanded }">
        <div id="instructions">
          <h2><b>Controls</b></h2>
          <h3>Mouse:</h3>
          <ul>
            <li><em>Left click</em> to set the focal point</li>
            <li><em>Left click and drag</em> to orbit around the focal point</li>
            <li><em>Right click and drag</em> to pan the camera and focal point</li>
            <li><em>Scroll Wheel</em> to zoom in/out</li>
          </ul>
          <h3>Keyboard:</h3>
          <ul>
            <li><em>Left arrow:</em> Rotate the camera's up vector counter-clockwise</li>
            <li><em>Right arrow:</em> Rotate the camera's up vector clockwise</li>
            <li>
              <em>P:</em> Toggle point-cloud mode, where each splat is rendered as a filled circle
            </li>
            <li><em>O:</em> Toggle orthographic mode</li>
            <li><em>I:</em> Toggle info panel</li>
            <li><em>U:</em> Open camera debugging pane</li>
            <li>
              <em>C:</em> Toggles the mesh cursor, showing the intersection point of a
              mouse-projected ray and the splat mesh
            </li>
            <li><em>=:</em> Increase splat scale</li>
            <li><em>-:</em> Decrease splat scale</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="attribution">
    The Gaussian Splat viewer was created with the
    <a href="https://github.com/mkkellogg/GaussianSplats3D" target="_blank">GaussianSplats3D</a> by
    Mark Kellogg
  </div> -->
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'

export default {
  name: 'GaussianSplatViewer',
  props: {
    mode: {
      type: Number,
      default: 0
    },
    cameraUp: {
      type: Array,
      default: () => [0, -1, -0.17]
    },
    initialCameraPosition: {
      type: Array,
      default: () => [-5, -1, -1]
    },
    initialCameraLookAt: {
      type: Array,
      default: () => [-1.72477, 0.05395, -0.00147]
    },
    sphericalHarmonicsDegree: {
      type: Number,
      default: 2
    },
    assetPath: {
      type: String,
      default: 'assets/data/truck/truck'
    }
  },
  setup(props) {
    const container = ref(null)
    let viewer = null
    const isInstructionsExpanded = ref(false)

    const toggleInstructions = () => {
      isInstructionsExpanded.value = !isInstructionsExpanded.value
    }

    const options = [
      { value: 'herodotus.splat', label: 'Herodotus' },
      { value: 'apollo.splat', label: 'Apollo' },
      { value: 'vizcaya.splat', label: 'Vizcaya' },
      { value: 'dragon.splat', label: 'Dragon' }
    ]
    const selectedOption = ref(options[0].value)

    const loadSelectedModel = () => {
      if (viewer) {
        viewer.dispose()
      }

      const path = `https://gaussiansplats.s3.amazonaws.com/${selectedOption.value}`

      viewer = new GaussianSplats3D.Viewer({
        cameraUp: props.cameraUp,
        initialCameraPosition: props.initialCameraPosition,
        initialCameraLookAt: props.initialCameraLookAt,
        sphericalHarmonicsDegree: props.sphericalHarmonicsDegree,
        rootElement: container.value
      })

      viewer
        .addSplatScene(path, {
          progressiveLoad: true
        })
        .then(() => {
          viewer.start()
        })
    }

    onMounted(() => {
      loadSelectedModel()
      window.addEventListener('resize', handleResize)
      handleResize()
    })

    onBeforeUnmount(() => {
      if (viewer) {
        viewer.dispose()
      }
      window.removeEventListener('resize', handleResize)
    })

    const handleResize = () => {
      if (viewer && container.value) {
        const rect = container.value.getBoundingClientRect()
      }
    }

    return {
      container,
      options,
      selectedOption,
      loadSelectedModel,
      isInstructionsExpanded,
      toggleInstructions
    }
  }
}
</script>

<style scoped>
.viewer-content {
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  position: relative;
  overflow: hidden;
}

.dropdown {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px;
  width: 120px;
  z-index: 1000;
}

#instructions {
  background: rgba(255, 255, 255, 0.6);
  white-space: pre-wrap;
  padding: 10px;
  border-radius: 10px;
  max-height: 40vh;
  font-size: smaller;
  overflow-y: auto;
}

.instructions-window {
  position: absolute;
  top: 10px;
  left: 10px;
  cursor: pointer;
  z-index: 1000;
}

.instructions-logo {
  width: 50px;
  height: auto;
  filter: brightness(0) invert(1);
}

.instructions-content {
  display: none;
  position: absolute;
  top: 60px;
  left: 0;
  background-color: #fff;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  width: 300px;
  z-index: 1001;
}

.instructions-content.expanded {
  display: block;
}
</style>
