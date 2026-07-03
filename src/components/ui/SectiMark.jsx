export default function SectiMark({ className = '', height = 'h-10' }) {
  return (
    <img
      src="/Secti_Vertical.png"
      alt="SECTI"
      className={`${height} w-auto select-none ${className}`}
      draggable="false"
    />
  )
}
