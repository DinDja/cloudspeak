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
        <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-slate-700">
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
            'w-full rounded-2xl border-0 bg-slate-50 py-4 text-base font-medium text-slate-900 outline-none ring-1 ring-inset transition-all',
            'placeholder:text-slate-400 focus:bg-white focus:ring-2',
            Icon ? 'pl-12 pr-4' : 'px-4',
            error ? 'ring-rose-300 focus:ring-rose-500' : 'ring-slate-200 focus:ring-brand-600',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
