import { Plus } from 'lucide-react'
import PresentationCard from '../components/presenter/PresentationCard'
import { TEMPLATES } from '../lib/templates'

// Mock data for demonstration
const mockPresentations = [
  { id: '1', title: 'Kick-off de Vendas Q3', slides: [{}, {}, {}], updatedAt: { seconds: 1678886400 } },
  { id: '2', title: 'Retrospectiva do Time de Produto', slides: [{}, {}, {}, {}], updatedAt: { seconds: 1678800000 } },
  { id: '3', title: 'Apresentação para Novos Investidores', slides: [{}, {}, {}, {}, {}], updatedAt: { seconds: 1678713600 } },
]

export default function PresenterDashboard({ onNew }) {
  return (
    <div className="cs-grid min-h-[100dvh] bg-[#E0F4FF] p-8 md:p-12">
      <header className="mb-16 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#09090B] md:text-5xl">
            Seu Estúdio
          </h1>
          <p className="mt-2 border-l-[4px] border-[#09090B] pl-3 text-lg font-bold uppercase tracking-widest text-[#09090B]/80">
            Crie, edite e lance suas apresentações interativas.
          </p>
        </div>
        
        <button 
          onClick={onNew}
          className="cs-btn-base h-14 gap-2 text-lg !bg-[#FFD700] !text-[#09090B]"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
          Nova Apresentação
        </button>
      </header>

      <section className="mt-12">
        <h2 className="mb-6 inline-block border-[3px] border-[#09090B] bg-[#FF6B6B] px-4 py-2 text-2xl font-black uppercase tracking-wide text-[#09090B] shadow-[4px_4px_0px_0px_#09090B]">
          Minhas Apresentações
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockPresentations.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 inline-block border-[3px] border-[#09090B] bg-[#40E0D0] px-4 py-2 text-2xl font-black uppercase tracking-wide text-[#09090B] shadow-[4px_4px_0px_0px_#09090B]">
          Começar com um Modelo
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TEMPLATES.filter((t) => t.id !== 'blank').map((template) => (
            <div 
              key={template.id} 
              className="cs-card group cursor-pointer p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                {/* Ícone Container Neobrutalista */}
                <div className={`flex h-12 w-12 items-center justify-center border-[3px] border-[#09090B] bg-gradient-to-br ${template.accent} text-white shadow-[4px_4px_0px_0px_#09090B]`}>
                  {/* Placeholder for an icon component */}
                  <div className="h-4 w-4 border-[2px] border-[#09090B] bg-white" />
                </div>
                
                {/* Badge chamativa adaptada usando cs-chip e sobreposição de cor */}
                <span className="cs-chip !bg-[#FF90E8]">
                  {template.badge}
                </span>
              </div>
              
              <h3 className="mt-4 text-xl font-black uppercase text-[#09090B] group-hover:underline group-hover:decoration-[3px] group-hover:underline-offset-4">
                {template.name}
              </h3>
              <p className="mt-2 text-sm font-bold uppercase tracking-wide leading-relaxed text-[#09090B]/80">
                {template.summary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}