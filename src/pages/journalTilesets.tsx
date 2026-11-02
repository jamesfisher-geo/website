import { SplatTileset } from '@/components/viewer/SplatTileset'

/** Scenes in the journal's dropdown. The first one loads by default. */
export const JOURNAL_TILESETS: readonly [SplatTileset, ...SplatTileset[]] = [
  new SplatTileset({
    url: 'https://gaussian-splat-journal.s3.us-east-1.amazonaws.com/models/carmo_convent_tomb/tiles/tileset.json',
    title: 'King Ferdinand The First',
    description: (
      <>
        <p>
          In the apse of the Museu Arqueológico do Carmo (Carmo Archaeological Museum) lies the Tomb
          of King Ferdinand the First, King of Portugal from 1367 until his death in 1383. Ferdinand
          had only one child - his daughter, Beatrice, who married João the First of Castile. The
          union of Beatrice and João was widely unpopular because there had been several wars
          between the Portuguese and Castilians, and the prospect of Castilian leadership threatened
          Portuguese independence. This situation lead to a two-year-long civil war after
          Ferdinand's death, which was won by the merchant-backed independence movement that
          recognized João of Avis as king. This is regarded as the first instance of Portuguese
          national resistance, a practice that would come to define Portuguese national identity in
          the April 25th, 1974, revolution.
        </p>
        <p>
          The Carmo Archaeological Museum was originally founded in 1389 as the Convent of Santa
          Maria of Carmo and was in operation until the devastating earthquake of 1755, which
          decimated the city and caused the collapse of most of the convent roof. Today the ruined
          convent acts as an open-air museum. This is one of the three rooms with an intact ceiling,
          which house artifacts from all periods of Portuguese history.
        </p>
        <p>Sources:</p>
        <p>
          <a href="https://en.wikipedia.org/wiki/Ferdinand_I_of_Portugal">
            Ferdinand I of Portugal
          </a>
        </p>
        <p>
          <a href="https://en.wikipedia.org/wiki/1383%E2%80%931385_Portuguese_interregnum">
            1383–1385 Portuguese interregnum
          </a>
        </p>
        <p>
          <a href="https://www.museuarqueologicodocarmo.pt/mac/folhetoMAC_EN.pdf">
            The Carmo Ruins and Archaeological Museum
          </a>
        </p>
        <p>
          <a href="https://en.wikipedia.org/wiki/Carnation_Revolution">
            The April 25th Carnation Revolution
          </a>
        </p>
      </>
    ),
    date: 'May, 2024',
    location: 'Lisbon, Portugal',
    camera: {
      position: [1.83, -0.03, 0.55],
      lookAt: [0.52, -0.17, 0.04]
    }
  })
]
