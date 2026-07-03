import { Plus, Trash2, GripVertical } from 'lucide-react'
import Textarea from '../ui/Textarea'
import SlideTypePicker from './SlideTypePicker'
import { MAX_TEAM_CAPACITY, TEAM_SELECTION_TYPE } from '../../lib/constants'
import { createTeamDraft } from '../../lib/validators'

export default function SlideEditor({ slide, index, total, onChange, onRemove, onReorder, canRemove }) {
  const update = (patch) => onChange({ ...slide, ...patch })
  const updateDeep = (updater) => onChange(updater(slide))

  const changeType = (nextType) => {
    update({
      type: nextType,
      options: nextType === 'multiple_choice' ? slide.options?.length ? slide.options : ['', ''] : [],
      teams: nextType === TEAM_SELECTION_TYPE ? slide.teams?.length ? slide.teams : [createTeamDraft('Clube X', 8), createTeamDraft('Clube Y', 7)] : [],
    })
  }

  const addOption = () => updateDeep((s) => ({ ...s, options: [...(s.options ?? []), ''] }))
  const removeOption = (optionIndex) =>
    updateDeep((s) => {
      const next = (s.options ?? []).filter((_, i) => i !== optionIndex)
      return { ...s, options: next.length > 0 ? next : ['', ''] }
    })
  const setOption = (optionIndex, value) =>
    updateDeep((s) => ({
      ...s,
      options: (s.options ?? []).map((item, i) => (i === optionIndex ? value : item)),
    }))

  const addTeam = () =>
    updateDeep((s) => ({ ...s, teams: [...(s.teams ?? []), createTeamDraft(`Clube ${(s.teams?.length ?? 0) + 1}`, 8)] }))
  const removeTeam = (teamIndex) =>
    updateDeep((s) => ((s.teams ?? []).length <= 2 ? s : { ...s, teams: (s.teams ?? []).filter((_, i) => i !== teamIndex) }))
  const setTeam = (teamIndex, patch) =>
    updateDeep((s) => ({
      ...s,
      teams: (s.teams ?? []).map((item, i) => (i === teamIndex ? { ...item, ...patch } : item)),
    }))

  return (
    <article className="border-[3px] border-[#09090B] bg-white p-5 shadow-[6px_6px_0px_0px_#09090B] sm:p-7">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onReorder && (
            <button
              type="button"
              onClick={onReorder}
              className="cursor-grab border-2 border-[#09090B] p-1.5 text-slate-400 hover:bg-[#E2FF32] hover:text-[#09090B] hover:shadow-[2px_2px_0px_0px_#09090B] active:cursor-grabbing"
              title="Arrastar"
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}
          <span className="flex h-10 w-10 items-center justify-center border-2 border-[#09090B] bg-[#09090B] text-sm font-black text-white shadow-[2px_2px_0px_0px_#09090B]">
            {index + 1}
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">
            Slide {index + 1} de {total}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="border-2 border-[#09090B] p-2 text-slate-500 transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B] disabled:pointer-events-none disabled:opacity-30"
          title="Remover slide"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="mb-6">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#09090B]">Tipo de slide</p>
        <SlideTypePicker value={slide.type} onChange={changeType} compact />
      </div>

      <Textarea
        label="Pergunta"
        value={slide.question}
        onChange={(event) => update({ question: event.target.value })}
        placeholder="Qual é a sua pergunta?"
        rows={3}
        className="min-h-[88px] text-base font-bold"
      />

      {slide.type === 'multiple_choice' && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#09090B]">Opções</p>
          <div className="space-y-2.5 border-l-[3px] border-[#09090B] pl-4">
            {(slide.options ?? []).map((option, optionIndex) => (
              <div key={`${slide.id}-opt-${optionIndex}`} className="flex items-center gap-2">
                <input
                  value={option}
                  onChange={(event) => setOption(optionIndex, event.target.value)}
                  placeholder={`Opção ${optionIndex + 1}`}
                  className="w-full border-[3px] border-[#09090B] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none shadow-[4px_4px_0px_0px_#09090B] placeholder:text-slate-500 placeholder:font-medium focus:bg-[#E2FF32] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px]"
                />
                <button
                  type="button"
                  onClick={() => removeOption(optionIndex)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#09090B] text-slate-500 transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B]"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-1 flex items-center gap-2 border-2 border-[#09090B] px-3 py-2 text-xs font-black uppercase tracking-widest text-[#09090B] transition-all duration-100 hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="h-4 w-4" /> Adicionar opção
            </button>
          </div>
        </div>
      )}

      {slide.type === TEAM_SELECTION_TYPE && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#09090B]">Clubes e vagas</p>
          <div className="space-y-2.5 border-l-[3px] border-[#09090B] pl-4">
            {(slide.teams ?? []).map((team, teamIndex) => (
              <div key={team.id ?? `${slide.id}-team-${teamIndex}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                <input
                  value={team.name}
                  onChange={(event) => setTeam(teamIndex, { name: event.target.value })}
                  placeholder={`Clube ${teamIndex + 1}`}
                  className="w-full border-[3px] border-[#09090B] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none shadow-[4px_4px_0px_0px_#09090B] placeholder:text-slate-500 placeholder:font-medium focus:bg-[#E2FF32] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px]"
                />
                <input
                  type="number"
                  min="1"
                  max={MAX_TEAM_CAPACITY}
                  inputMode="numeric"
                  value={team.capacity}
                  onChange={(event) => setTeam(teamIndex, { capacity: event.target.value })}
                  placeholder="Vagas"
                  className="w-full border-[3px] border-[#09090B] bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none shadow-[4px_4px_0px_0px_#09090B] placeholder:text-slate-500 placeholder:font-medium focus:bg-[#E2FF32] focus:shadow-[6px_6px_0px_0px_#09090B] focus:translate-x-[-2px] focus:translate-y-[-2px]"
                />
                <button
                  type="button"
                  onClick={() => removeTeam(teamIndex)}
                  disabled={(slide.teams ?? []).length <= 2}
                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#09090B] text-slate-500 transition-all duration-100 hover:bg-[#FF0055] hover:text-white hover:shadow-[2px_2px_0px_0px_#09090B] disabled:pointer-events-none disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTeam}
              className="mt-1 flex items-center gap-2 border-2 border-[#09090B] px-3 py-2 text-xs font-black uppercase tracking-widest text-[#09090B] transition-all duration-100 hover:bg-[#E2FF32] hover:shadow-[2px_2px_0px_0px_#09090B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="h-4 w-4" /> Adicionar clube
            </button>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-600">Defina o nome de cada clube e o número de vagas (1 a {MAX_TEAM_CAPACITY}).</p>
        </div>
      )}
    </article>
  )
}
