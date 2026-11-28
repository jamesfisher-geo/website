import { useState } from 'react'
import { ContourTexture } from '@/components/sketch/ContourTexture'
import type { SplatTileset } from '@/components/viewer/SplatTileset'
import { SplatViewer } from '@/components/viewer/SplatViewer'
import { JOURNAL_TILESETS } from './journalTilesets'
import styles from './JournalPage.module.css'

export function JournalPage() {
  const [selected, setSelected] = useState<SplatTileset | null>(null)

  return (
    <>
      <div className={styles.backdrop}>
        <ContourTexture />
      </div>
      <section className={styles.page}>
        <header className={styles.header}>
          <p className="eyebrow">01 / 3-D Journal</p>
          <h1 className={styles.title}>3-D Journal</h1>
        </header>
        <SplatViewer tilesets={JOURNAL_TILESETS} selected={selected} onSelect={setSelected} />
        <div className={styles.description}>
          {selected ? selected.description : <p>Each pin marks a scan. Select one to open it.</p>}
        </div>
      </section>
    </>
  )
}
