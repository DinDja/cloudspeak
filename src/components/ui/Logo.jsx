import { COLORS } from '../../lib/colors'

export default function Logo({ size = 'md', withWordmark = true, className = '', onDark = false }) {
  const mark = size === 'lg' ? 'w-28' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  return (
    <span className={['inline-flex items-center gap-3', className].join(' ')}>
      {/* <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bras%C3%A3o_do_estado_da_Bahia.svg/500px-Bras%C3%A3o_do_estado_da_Bahia.svg.png" alt="" style={{maxWidth: "110px"}}/> */}
    </span>
  )
}
