export default function Card({ as, className = '', children, hover = false, ...props }) {
  const Component = as || 'div'
  
  return (
    <Component
      className={[
        // Mantemos a classe original caso tenha paddings, mas sobrescrevemos o visual
        'cs-card',
        // Estilo Base Neobrutalista
        'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
        // Efeito de Interação Tátil
        hover 
          ? 'transition-all duration-150 cursor-pointer hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none' 
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Component>
  )
}