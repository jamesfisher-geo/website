<template>
  <div ref="container" class="viewer-content">
    <select v-model="selectedOption" class="dropdown" @change="loadSelectedModel">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <img
      class="screenshot-button"
      src="../assets/screenshot.svg"
      @click="takeScreenshot"
      title="Screenshot"
    />
    <div class="instructions-window">
      <img
        src="../assets/help.svg"
        alt="Instructions Logo"
        class="instructions-logo"
        title="Help"
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
        title="Description"
        @click="toggleDescription"
      />
      <div class="description-content">
        <button class="close-button" @click="toggleDescription">×</button>
        <h2 class="description-title">
          {{ selectedOptionData.label }} - {{ selectedOptionData.date }}
        </h2>
        <div class="description-text-container">
          <vue-markdown-render :source="selectedOptionData.text" class="markdown-content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import VueMarkdownRender from 'vue-markdown-render'

export default {
  name: 'GaussianSplatViewer',
  components: {
    VueMarkdownRender // Add this to your components
  },
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
        label: 'Porto - Parque das Aguas',
        date: 'May 2024',
        camera_position: [-2.6369, -0.24802, 0.44527],
        camera_look_at: [-1.8299, -0.18557, 0.01454],
        camera_up: [-0.01529, -0.9998, 0.013],
        text: `With a few hours to kill before catching our train we decided to explore the nearby Parque Das Águas. Not knowing anything about the park, we were pleasantly surprised to find a serene rose garden near the entrance. We decided to set up camp on a bench here and took turns exploring the rest of the park while the other watched the bags.
        
When it was my turn I followed a trail through the forest, stopping at several historic drinking fountains. I later learned the fountains had been moved there by Águas do Porto, the municipal water utility that owns and maintains the park, in an effort to preserve Porto’s long connection with water as a human resource. On my way back to the rose garden I came across this statue situated on a scenic overlook above the Douro river. 

The statue is called “Self-portrait as a Fountain” by Julião Sarmento. It is inspired by a photograph of, and by, artist Bruce Naumann. The photograph of Nauman spitting watch like the girl above is housed at the Whitney Museum here in New York. I will have to see it for myself soon. The lighting, colors, and reflections off the water make this one of my favorite models.

[Self Portrait as a Fountain - Bruce Nauman](https://whitney.org/collection/works/5714)

Sources: 

[Self-portrait as a fountain (Fat chance Bruce Nauman), Gardens of Nova Sintra, Porto](https://asfontesdaminhavida.blogs.sapo.pt/self-portrait-as-a-fountain-fat-chance-167000)

[Julião Sarmento's female alter ego took to the streets](https://www.publico.pt/2017/07/10/culturaipsilon/noticia/o-alterego-de-juliao-sarmento-no-feminino-1778586)`
      },
      {
        value: 'carmo_convent_tomb.ksplat',
        label: 'Lisbon - Carmo Museum',
        date: 'May 2024',
        camera_position: [-0.38064, -0.18216, 1.9139],
        camera_look_at: [-0.12069, -0.21909, 1.02961],
        camera_up: [-0.03172, -0.99894, -0.03324],
        text: `This is the apse of The Museu Arqueológico do Carmo (Carmo Archaeological Museum) that houses the Tomb of King Fernando I, which is the focus of this model. 

The Carmo Archaeological Museum was originally founded in 1389 as the Convent of Santa Maria of Carmo. The convent operated until the 1755 Lisbon earthquake, which destroyed the city center and caused the collapse of most of the convent roof. Today the museum  houses artifacts from all periods of Portuguese history. 

This is one of the best models so far. It includes fine details of the tomb, but also captures the surrounding environment.

Sources:

[The Carmo Ruins and Archaeological museum](https://www.museuarqueologicodocarmo.pt/mac/folhetoMAC_EN.pdf)`
      },
      {
        value: 'berlin_wall_horse_statue.ksplat',
        label: 'Berlin - The Day The Wall Came Down',
        date: 'June 2024',
        camera_position: [-2.01948, -0.16754, 0.46328],
        camera_look_at: [-1.29397, -0.2221, 0.06908],
        camera_up: [-0.01529, -0.9998, 0.013],
        text: `Biding my time while Meret completed her interview at the U.S. embassy, I took a walk and found this sculpture outside the Allied Museum in the old American sector of Berlin. 

This sculpture is called “**The Day the Wall Came Down”** by Veryl Goodnight. The graffitied  concrete pieces you see here are actual pieces of the Berlin wall. The piece was a gift to Germany from the US president George W. Bush Sr. and is one of two sister sculptures. The other resides in the George H. W. Bush Presidential Library at Texas A&M University.

Sources:

[A Monument to Freedom](https://verylgoodnight.com/the-day-the-wall-came-down/)

[The Day the Wall Came Down](https://en.wikipedia.org/wiki/The_Day_the_Wall_Came_Down)
`
      },
      {
        value: 'dragon.splat',
        label: 'Berlin - St. George The Dragon Slayer',
        date: 'December 2023',
        camera_position: [3.29772, 0.72899, -3.31063],
        camera_look_at: [1.73379, 0.24299, -1.45236],
        camera_up: [0, -1, -0.17],
        text: `A memory from exploring the historic district in on my first trip to Berlin. 

This statue was created by August Kiss  (1802 –1865) and  illustrates a biblical myth of Saint George slaying a dragon to rescue a Libyan princess. The details in the dragon and the horse here are quite striking.

Sources:

[Saint George](https://equestrianstatue.org/george-saint-8/)

[Monuments and sculptures of Nicholas Quarter](https://berlin-nikolaiviertel.com/monuments-and-sculptures/?lang=en)
`
      },
      {
        value: 'herodotus.ksplat',
        label: 'Athens - Herodotus',
        date: 'November 2023',
        camera_position: [2.77463, -1.37617, -4.58333],
        camera_look_at: [-0.74575, -1.73235, -0.2007],
        camera_up: [0.0, -0.98586, -0.1676],
        text: `
Herodotus was a Greek author widely known as “The Father of History” for his narrative record of the Greek and Persian wars. The bust here is a Roman copy of the Greek original dating back to the second century AD. It is on display in the Stoà of Attalus at the Ancient Agora of Athens Museum. 

My first visit to Athens and it did not disappoint.

Sources:

[Herodotus](https://www.britannica.com/biography/Herodotus-Greek-historian)

[Category:Bust of Herodotus in the Ancient Agora Museum]([https://commons.wikimedia.org/wiki/Category:Bust_of_Herodotus_in_the_Ancient_Agora_Museum_(Ag._S_270)](https://commons.wikimedia.org/wiki/Category:Bust_of_Herodotus_in_the_Ancient_Agora_Museum_(Ag._S_270)))
`
      },
      {
        value: 'apollo.splat',
        label: 'Athens - Apollo Patroos',
        date: 'November 2023',
        camera_position: [6.7567, 0.98099, 2.69319],
        camera_look_at: [3.27841, -0.55021, 7.76069],
        camera_up: [0, -1, -0.17],
        text: ''
      },
      // {
      //   value: 'vizcaya.splat',
      //   label: 'Vizcaya Facade',
      //   text: 'Placeholder'
      // },
      {
        value: 'carmo_convent_fountain.ksplat',
        label: 'Lisbon - Carmo Fountain Cat',
        date: 'May 2024',
        camera_position: [-1.51938, -0.90622, 0.84376],
        camera_look_at: [-0.46384, -0.39367, 0.23109],
        camera_up: [0.10604, -0.99427, -0.01348],
        text: `
The nave of the Museu Arqueológico do Carmo (Carmo Archaeological Museum) includes many arcitectural pieces including pediments, coats of arms, and columns. Although, my favorite part of the exhibit would have to be the cute cat curled up on this fountain :) 

The Carmo Archaeological Museum was originally founded in 1389 as the Convent of Santa Maria of Carmo. The convent operated until the 1755 Lisbon earthquake, which destroyed the city center and caused the collapse of most of the convent roof. Today the museum  houses artifacts from all periods of Portuguese history. 

Sources:

[The Carmo Ruins and Archaeological museum](https://www.museuarqueologicodocarmo.pt/mac/folhetoMAC_EN.pdf)
        `
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

    const takeScreenshot = () => {
      if (!viewer) return

      // Attempt to get the renderer
      const renderer = viewer.renderer

      // Check if renderer exists
      if (!renderer) {
        console.error('Renderer not found')
        return
      }

      // Explicitly render the scene before capturing
      viewer.render()

      // Get the WebGL canvas
      const canvas = renderer.domElement

      // Create a temporary canvas to handle full resolution
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height

      const tempContext = tempCanvas.getContext('2d')

      try {
        // Attempt to draw the canvas
        tempContext.drawImage(canvas, 0, 0)

        // Convert to data URL and trigger download
        const dataURL = tempCanvas.toDataURL('image/png')

        // Verify data URL
        if (dataURL.length < 1000) {
          console.error('Empty or very small data URL')
        }

        const link = document.createElement('a')
        link.download = `gaussian_splat_${selectedOptionData.value.label.replace(/\s+/g, '_')}_screenshot.png`
        link.href = dataURL
        link.click()
      } catch (error) {
        console.error('Error capturing screenshot:', error)
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
      toggleDescription,
      takeScreenshot
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
  border-radius: 50%;
  cursor: pointer;
  position: absolute;
  left: 0.1vw;
  bottom: 0.1vh;
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
  z-index: 1000;
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

.markdown-content {
  margin: 0;
}

.markdown-content p {
  margin: 1em 0;
}

.markdown-content p:first-child {
  margin-top: 0;
}

.markdown-content p:last-child {
  margin-bottom: 0;
}

.screenshot-button {
  width: 40px;
  height: 40px;
  filter: brightness(0) invert(1);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  cursor: pointer;
  position: absolute;
  right: 0.6vw;
  bottom: 1.25vh;
}

.screenshot-button:hover {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>
