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
    <div class="description-window" :class="{ expanded: isDescriptionExpanded }">
      <img
        v-if="!isDescriptionExpanded"
        src="../assets/info.svg"
        alt="Description Logo"
        class="description-logo"
        @click="toggleDescription"
      />
      <div class="description-content">
        <button class="close-button" @click="toggleDescription">×</button>
        <h2 class="description-title">{{ selectedOptionData.label }}</h2>
        <div class="description-text-container">
          <p>{{ selectedOptionData.text }}</p>
        </div>
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
        text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like). There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc."
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
  position: relative;
}

.dropdown {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px;
  width: 240px;
  z-index: 1000;
}

.instructions-window {
  position: absolute;
  top: 10px;
  left: 0.5vw;
  cursor: pointer;
}

.instructions-logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
}

.instructions-content {
  display: none;
  position: absolute;
  top: 5vh;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 5px;
  width: 300px;
  max-height: 60vh;
  overflow-y: auto;
}

.instructions-content.expanded {
  display: block;
}

.instructions-content #instructions {
  max-height: 39vh;
  font-size: smaller;
  overflow-y: auto;
}

.description-logo {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 50%;
  cursor: pointer;
  position: absolute;
  left: 0.5vw;
  bottom: 10px;
  z-index: 2;
}

.description-window {
  position: absolute;
  bottom: 10px;
  left: 0.5vw;
  transition: all 0.3s ease;
  width: 300px;
}

.description-window.expanded {
  width: 100%;
  height: 25vh;
  left: 0;
  bottom: 0;
}

.description-content {
  display: none;
  position: absolute;
  bottom: 0;
  left: 0.5vw;
  right: 0.5vw;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  height: 100%;
  overflow: hidden;
  border-radius: 5px;
}

.description-window.expanded .description-content {
  display: block;
  height: 25vh;
  overflow-y: auto;
}

.description-title {
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 10px;
}

.description-text-container {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding-right: 10px;
}

.description-text-container p {
  margin: 0;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
}

.close-button:hover {
  color: #000;
}
</style>
