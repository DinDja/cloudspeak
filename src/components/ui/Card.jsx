export default function Card({ as, className = '', children, hover = false, ...props }) {
  const Component = as || 'div'
  return (
    <Component
      className={[
        'rounded-4xl bg-white ring-1 ring-slate-200/70 shadow-card',
        hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-float hover:ring-brand-200' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Component>
  )
}
