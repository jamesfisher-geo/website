import { useState } from 'react'
import { SplatViewer } from '@/components/viewer/SplatViewer'
import { JOURNAL_TILESETS } from './journalTilesets'
import styles from './JournalPage.module.css'

export function JournalPage() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const tileset = JOURNAL_TILESETS[selectedIndex] ?? JOURNAL_TILESETS[0]

  return (
    <section>
      <header className={styles.header}>
        <p className="eyebrow">01 / 3-D Journal</p>
        <h1 className={styles.title}>3-D Journal</h1>
      </header>
      <div className={styles.stage}>
        {/* The key gives each scene a fresh viewer, so no status carries over between scenes. */}
        <SplatViewer
          key={selectedIndex}
          tileset={tileset}
          caption={`FIG. 01 — ${tileset.title} · ${tileset.location} ·  ${tileset.date}`}
        />
        {/* Outside the keyed viewer, so it keeps focus when the scene changes. */}
        <select
          className={styles.select}
          aria-label="Scene"
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        >
          {JOURNAL_TILESETS.map(({ title }, index) => (
            <option key={index} value={index}>
              {title}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.description}>{tileset.description}</div>
    </section>
  )
}
