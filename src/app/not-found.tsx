import PublicNotFound from './PublicNotFound'

// A system route keeps the correct HTTP 404 status for all unknown public URLs.
export default function NotFound() { return <PublicNotFound /> }
