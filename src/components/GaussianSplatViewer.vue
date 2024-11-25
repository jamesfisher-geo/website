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
        value: 'parque_das_aguas_lisbon.ksplat',
        label: 'Lisbon - Parque das Aguas',
        camera_position: [-2.6369, -0.24802, 0.44527],
        camera_look_at: [-1.8299, -0.18557, 0.01454],
        camera_up: [-0.01529, -0.9998, 0.013],
        text: 'this is a test'
      },
      {
        value: 'carmo_convent_tomb.ksplat',
        label: 'Lisbon - Carmo Museum',
        camera_position: [-0.38064, -0.18216, 1.9139],
        camera_look_at: [-0.12069, -0.21909, 1.02961],
        camera_up: [-0.03172, -0.99894, -0.03324],
        text: 'this is a test'
      },
      {
        value: 'berlin_wall_horse_statue.ksplat',
        label: 'Berlin - The Day The Wall Came Down',
        camera_position: [-2.01948, -0.16754, 0.46328],
        camera_look_at: [-1.29397, -0.2221, 0.06908],
        camera_up: [-0.01529, -0.9998, 0.013],
        text: 'this is a test'
      },
      {
        value: 'dragon.splat',
        label: 'Berlin - St. George & The Dragon',
        camera_position: [3.29772, 0.72899, -3.31063],
        camera_look_at: [1.73379, 0.24299, -1.45236],
        camera_up: [0, -1, -0.17],
        text: 'this is a test'
      },
      {
        value: 'herodotus.splat',
        label: 'Athens - Herodotus',
        camera_position: [-0.75001, 0.00283, -4.71739],
        camera_look_at: [-0.03144, 0.04972, 0.05796],
        camera_up: [0, -1, -0.17],
        text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like). There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc."
      },
      {
        value: 'apollo.splat',
        label: 'Athens - Apollo Patroos',
        camera_position: [6.7567, 0.98099, 2.69319],
        camera_look_at: [3.27841, -0.55021, 7.76069],
        camera_up: [0, -1, -0.17],
        text: 'this is a test'
      },
      // {
      //   value: 'vizcaya.splat',
      //   label: 'Vizcaya Facade',
      //   text: 'this is a test'
      // },
      {
        value: 'carmo_convent_fountain.ksplat',
        label: 'Lisbon - Carmo Fountain Cat',
        camera_position: [-1.51938, -0.90622, 0.84376],
        camera_look_at: [-0.46384, -0.39367, 0.23109],
        camera_up: [0.10604, -0.99427, -0.01348],
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
      console.log(selectedOptionData.value.camera)
      viewer = new GaussianSplats3D.Viewer({
        cameraUp: selectedOptionData.value.camera_up,
        initialCameraPosition: selectedOptionData.value.camera_position,
        initialCameraLookAt: selectedOptionData.value.camera_look_at,
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
