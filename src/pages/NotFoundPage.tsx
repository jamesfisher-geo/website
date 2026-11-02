import { Link } from 'react-router-dom'
import { PlaceholderPage } from './PlaceholderPage'

export function NotFoundPage() {
  return (
    <PlaceholderPage eyebrow="404 / Off the map" title="This page isn’t on the map">
      <p>
        The address may have changed. <Link to="/">Return to the start</Link>.
      </p>
    </PlaceholderPage>
  )
}
