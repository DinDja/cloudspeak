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
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          className={[
            'cs-input-base',
            Icon ? 'pl-10 pr-4' : '',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-red-700">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
