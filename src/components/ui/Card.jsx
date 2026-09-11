export default function Card({ as, className = '', children, hover = false, ...props }) {
  const Component = as || 'div'

  return (
    <Component
      className={['cs-card', hover ? 'cursor-pointer' : '', className].join(' ')}
      {...props}
    >
      {children}
    </Component>
  )
}
