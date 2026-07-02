export default function Textarea({ label, hint, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-xs font-black uppercase tracking-widest text-[#09090B]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full resize-none border-[3px] border-[#09090B] bg-white py-3.5 px-4 text-base font-bold text-slate-900 outline-none transition-all duration-100 placeholder:text-slate-500 placeholder:font-medium shadow-[4px_4px_0px_0px_#09090B] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:bg-[#E2FF32]',
          error ? 'border-[#FF0055] focus:border-[#FF0055]' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-black uppercase tracking-wider text-[#FF0055]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
