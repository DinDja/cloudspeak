export default function Input({
  icon: Icon,
  label,
  hint,
  error,
  className = '',
  containerClassName = '',
  id,
  ...props
}) {
  const inputId = id || props.name
  return (
    <div className={['w-full', containerClassName].join(' ')}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-xs font-black uppercase tracking-widest text-[#09090B]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={inputId}
          className={[
            'w-full border-[3px] border-[#09090B] bg-white py-3.5 text-base font-bold text-slate-900 outline-none transition-all duration-100 placeholder:text-slate-500 placeholder:font-medium shadow-[4px_4px_0px_0px_#09090B] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:bg-[#E2FF32]',
            Icon ? 'pl-12 pr-4' : 'px-4',
            error ? 'border-[#FF0055] focus:border-[#FF0055]' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-black uppercase tracking-wider text-[#FF0055]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
