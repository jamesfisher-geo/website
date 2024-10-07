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
    <div class="description-window">
      <img
        src="../assets/info.svg"
        alt="Description Logo"
        class="description-logo"
        @click="toggleDescription"
      />
      <div class="description-content" :class="{ expanded: isDescriptionExpanded }">
        <h4>{{ selectedOptionData.label }}</h4>
        <p>{{ selectedOptionData.text }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
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
    const isDescriptionExpanded = ref(false)

    const toggleInstructions = () => {
      isInstructionsExpanded.value = !isInstructionsExpanded.value
    }

    const toggleDescription = () => {
      isDescriptionExpanded.value = !isDescriptionExpanded.value
    }

    const options = [
      {
        value: 'herodotus.splat',
        label: 'Athens - Herodotus',
        text: 'this is a test'
      },
      {
        value: 'apollo.splat',
        label: 'Athens - Apollo Patroos',
        text: 'this is a test'
      },
      {
        value: 'vizcaya.splat',
        label: 'Vizcaya Facade',
        text: 'this is a test'
      },
      {
        value: 'dragon.splat',
        label: 'Berlin - St. George & The Dragon',
        text: 'this is a test'
      },
      {
        value: 'carmo_convent_fountain.ksplat',
        label: 'Lisbon - Carmo Fountain Cat',
        text: 'this is a test'
      },
      {
        value: 'carmo_convent_tomb.ksplat',
        label: 'Lisbon - Carmo Museum',
        text: 'this is a test'
      },
      {
        value: 'parque_das_aguas_lisbon.ksplat',
        label: 'Lisbon - Parque das Aguas',
        text: 'this is a test'
      },
      {
        value: 'berlin_wall_horse_statue.ksplat',
        label: 'Berlin - The Day The Wall Came Down',
        text: 'this is a test'
      }
    ]
    const selectedOption = ref(options[0].value)

    const selectedOptionData = computed(() => {
      return options.find((option) => option.value === selectedOption.value) || {}
    })

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
        rootElement: container.value,
        sharedMemoryForWorkers: false //remove when the Isolation issue is solved
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
      selectedOptionData,
      loadSelectedModel,
      isInstructionsExpanded,
      toggleInstructions,
      isDescriptionExpanded,
      toggleDescription
    }
  }
}
</script>

<style scoped>
.viewer-content {
  width: 100vw;
  height: 75vh;
  background-color: #000000;
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
}

.description-window {
  position: absolute;
  bottom: 10px;
  left: 10px;
  cursor: pointer;
}

.instructions-logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 50%;
}

.description-logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 50%;
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
}

.description-content {
  display: none;
  position: absolute;
  bottom: 60px;
  left: 0;
  background-color: #fff;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  width: 300px;
}

.instructions-content.expanded,
.description-content.expanded {
  display: block;
}

.description-content h4 {
  margin-top: 0;
  margin-bottom: 5px;
}

.description-content p {
  margin: 0;
}
</style>
