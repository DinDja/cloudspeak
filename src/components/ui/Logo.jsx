export default function Logo({ size = 'md', withWordmark = true, className = '', onDark = false }) {
  return (
    <span
      className={`fala-logo fala-logo--${size} ${onDark ? 'fala-logo--light' : ''} ${className}`}
      aria-label="Fala SEC"
    >
      <span className="fala-logo__word" aria-hidden="true">
        {withWordmark ? 'fala' : 'f'}
        <span>.</span>
      </span>
      {withWordmark && (
        <span className="fala-logo__caption">
          SEC
          <br />
          BAHIA
        </span>
      )}
    </span>
  )
}
