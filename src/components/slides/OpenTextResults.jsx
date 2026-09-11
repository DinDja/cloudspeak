export default function OpenTextResults({ responses }) {
  if (!responses.length) return <p className="result-empty">Aguardando a primeira resposta.</p>
  return (
    <div className="response-wall">
      {responses.map((entry) => (
        <article key={entry.id}>
          <p>{entry.value}</p>
          <span>{entry.participantName || 'Anônimo'}</span>
        </article>
      ))}
    </div>
  )
}
