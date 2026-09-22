import { createSlideDraft } from './validators'

export const AVANCA_EVENT_KEY = 'avanca-mais-bahia'
export const EDUCATION_EVENT_KEY = 'educacao-integral-integrada-bahia'

const guidedQuestions = [
  'Que educação a Bahia precisa construir hoje para responder aos desafios e às oportunidades?',
  'Como assegurar que território, origem social, raça, gênero ou condição econômica não determinem as oportunidades educacionais dos estudantes baianos?',
  'Como incorporar ciência, tecnologia e inteligência artificial à educação pública sem ampliar desigualdades e preservando sua dimensão humana, crítica e democrática?',
  'Como a educação pode contribuir para gerar oportunidades, reduzir desigualdades territoriais e fortalecer um modelo sustentável de desenvolvimento para a Bahia?',
  'Como construir uma relação permanente entre educação básica, universidades e instituições científicas para ampliar oportunidades e produzir conhecimento voltado aos desafios da Bahia?',
]

export const EDUCATION_EVENT = {
  key: EDUCATION_EVENT_KEY,
  letterTitle: 'CARTA PARA EDUCAÇÃO INTEGRAL E INTEGRADA PARA O DESENVOLVIMENTO ECONÔMICO E SOCIAL DA BAHIA',
  title: 'Educação Integral e integrada para o desenvolvimento econômico e social da Bahia',
  date: '15/09/2026',
  time: '13 às 17 horas',
  location: 'Auditório da Secretaria da Educação do Estado da Bahia (SEC)',
  organizer: 'Secretaria da Educação do Estado da Bahia',
  expectedAudience: '100 lideranças e representantes do ecossistema educacional baiano',
  methodology:
    'Mesa-redonda interinstitucional com escuta qualificada, diálogo entre os participantes e sistematização contínua das contribuições do público.',
  objective:
    'Elaborar coletivamente diretrizes estratégicas para o fortalecimento da educação pública na Bahia na perspectiva do desenvolvimento social e econômico a partir dos territórios da Bahia.',
  publicProfile: [
    'Fórum Estadual de Educação da Bahia (FEEBA), União dos Dirigentes Municipais de Educação (UNDIME), União dos Conselhos Municipais de Educação (UNCME) e Conselho Estadual de Educação da Bahia (CEE)',
    'Universidades estaduais da Bahia, Universidades federais da Bahia, Instituto Federal da Bahia (IFBA) e Instituto Federal Baiano (IF Baiano)',
    'Gestores escolares e Coordenação pedagógica',
    'Casa Civil, Conselho Estadual da Juventude (COJUVE), Secretaria de Desenvolvimento Econômico (SDE), Secretaria de Promoção da Igualdade Racial (SEPROMI), Secretaria de Políticas para as Mulheres (SPM), Secretaria de Justiça e Direitos Humanos (SJDH), Fundação de Amparo à Pesquisa (FAPESB), Secretaria do Trabalho, Emprego, Renda e Esporte (SETRE), Secretaria de Cultura (SECULT), Superintendência de Estudos Econômicos e Sociais da Bahia (SEI), Secretaria de Planejamento (SEPLAN) e Secretaria de Turismo (SETUR)',
  ],
  institutions: [
    'Fórum Estadual de Educação da Bahia (FEEBA)',
    'União dos Dirigentes Municipais de Educação (UNDIME)',
    'União dos Conselhos Municipais de Educação (UNCME)',
    'Conselho Estadual de Educação da Bahia (CEE)',
    'Universidades estaduais da Bahia',
    'Universidades federais da Bahia',
    'Instituto Federal da Bahia (IFBA)',
    'Instituto Federal Baiano (IF Baiano)',
    'Gestores escolares',
    'Coordenação pedagógica',
    'Casa Civil',
    'Conselho Estadual da Juventude (COJUVE)',
    'Secretaria de Desenvolvimento Econômico (SDE)',
    'Secretaria de Promoção da Igualdade Racial (SEPROMI)',
    'Secretaria de Políticas para as Mulheres (SPM)',
    'Secretaria de Justiça e Direitos Humanos (SJDH)',
    'Fundação de Amparo à Pesquisa (FAPESB)',
    'Secretaria do Trabalho, Emprego, Renda e Esporte (SETRE)',
    'Secretaria de Cultura (SECULT)',
    'Superintendência de Estudos Econômicos e Sociais da Bahia (SEI)',
    'Secretaria de Planejamento (SEPLAN)',
    'Secretaria de Turismo (SETUR)',
  ],
  guidedQuestions,
  program: [
    { time: '13h', theme: 'Abertura', institutions: 'Secretaria da Educação do Estado da Bahia (SEC)' },
    {
      time: '13h10',
      theme: 'Educação integral e integrada para o desenvolvimento econômico e social da Bahia',
      institutions: 'Secretaria da Educação do Estado da Bahia (SEC)',
    },
    {
      time: '13h30',
      theme: 'O lugar da educação no desenvolvimento social, econômico, científico e territorial da Bahia',
      institutions: 'Secretaria de Planejamento (SEPLAN) e Universidade do Estado da Bahia (UNEB)',
    },
    { time: '13h50', theme: 'Interação', institutions: 'instituições participantes' },
    {
      time: '14h',
      theme: 'Educação Básica, Ensino Superior e Produção do conhecimento',
      institutions: 'Universidade Federal da Bahia (UFBA) e União dos Dirigentes Municipais de Educação (UNDIME)',
    },
    { time: '14h20', theme: 'Interação', institutions: 'instituições participantes' },
    {
      time: '14h30',
      theme: 'Garantia das aprendizagens e enfrentamento das desigualdades educacionais',
      institutions: 'Secretaria de Promoção da Igualdade Racial (SEPROMI), Secretaria de Justiça e Direitos Humanos (SJDH) e Secretaria de Políticas para as Mulheres (SPM)',
    },
    { time: '14h50', theme: 'Interação', institutions: 'instituições participantes' },
    {
      time: '15h',
      theme: 'Produção do conhecimento e soberania',
      institutions: 'Fundação de Amparo à Pesquisa (FAPESB), Casa Civil e Academia de Ciências da Bahia (ACB)',
    },
    { time: '15h20', theme: 'Interação', institutions: 'instituições participantes' },
    {
      time: '15h30',
      theme: 'Formação, mundo do trabalho e desenvolvimento territorial sustentável',
      institutions: 'Secretaria do Trabalho, Emprego, Renda e Esporte (SETRE), Instituto Federal da Bahia (IFBA) e Serviço Social da Indústria (SESI)',
    },
    { time: '15h50', theme: 'Interação', institutions: 'instituições participantes' },
    { time: '16h', theme: 'Leitura da carta', institutions: 'Secretaria da Educação do Estado da Bahia (SEC)' },
    { time: '16h10', theme: 'Encerramento', institutions: 'Secretaria da Educação do Estado da Bahia (SEC)' },
  ],
  schools: [
    'CENTRO EDUCACIONAL CARNEIRO RIBEIRO - CLASSE I',
    'CENTRO EDUCACIONAL CARNEIRO RIBEIRO - ESCOLA PARQUE',
    'CENTRO EDUCACIONAL EDGAR SANTOS',
    'CENTRO ESTADUAL DE EDUCACAO PROFISSIONAL EM SAUDE E TECNOLOGIA DA INFORMACAO CARLOS CORREA DE MENEZES SANTANA',
    'CENTRO ESTADUAL DE EDUCACAO PROFISSIONAL EM GESTAO NEGOCIOS E TURISMO LUIZ NAVARRO DE BRITO',
    'CENTRO ESTADUAL DE EDUCACAO PROFISSIONAL EM LOGISTICA E TRANSPORTE LUIZ PINTO DE CARVALHO',
    'COLEGIO ESTADUAL BARTOLOMEU DE GUSMAO',
    'COLEGIO ESTADUAL ALBERTO VALENCA - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL ANFRISIA SANTIAGO - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL BARROS BARRETO',
    'COLEGIO ESTADUAL CLARICE SANTIAGO',
    'COLEGIO ESTADUAL CLERISTON ANDRADE',
    'COLEGIO ESTADUAL DA BAHIA CENTRAL',
    'COLEGIO ESTADUAL DAVID MENDES PEREIRA',
    'COLEGIO ESTADUAL DE NOVA ESPERANCA',
    'COLEGIO ESTADUAL DE TEMPO INTEGRAL MINISTRO ALIOMAR BALEEIRO',
    'COLEGIO ESTADUAL DE TEMPO INTEGRAL VILA CANÁRIA',
    'COLEGIO ESTADUAL DE TEMPO INTEGRAL YPIRANGA',
    'COLEGIO ESTADUAL DE TEMPO INTEGRAL ZUMBI DOS PALMARES',
    'COLEGIO ESTADUAL DEMOCRATICO BERTHOLDO CIRILO DOS REIS',
    'COLEGIO ESTADUAL DO STIEP CARLOS MARIGHELLA',
    'COLEGIO ESTADUAL DOIS DE JULHO',
    'COLEGIO ESTADUAL DUQUE DE CAXIAS',
    'COLEGIO ESTADUAL EVARISTO DA VEIGA - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL GOES CALMON',
    'COLEGIO ESTADUAL GOVERNADOR LOMANTO JUNIOR',
    'COLEGIO ESTADUAL GOVERNADOR ROBERTO SANTOS',
    'COLEGIO ESTADUAL HELENA CELESTINO MAGALHAES',
    'COLEGIO ESTADUAL JOSE AUGUSTO TOURINHO DANTAS',
    'COLEGIO ESTADUAL LUIS VIANA',
    'COLEGIO ESTADUAL MANOEL DEVOTO',
    'COLEGIO ESTADUAL MARCILIO DIAS - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL MARILENE DA SILVA',
    'COLEGIO ESTADUAL MARIO AUGUSTO TEIXEIRA DE FREITAS',
    'COLEGIO ESTADUAL MARIO COSTA NETO',
    'COLEGIO ESTADUAL MESTRE PAULO DOS ANJOS',
    'COLEGIO ESTADUAL MINISTRO ALIOMAR BALEEIRO',
    'COLEGIO ESTADUAL NELSON MANDELA',
    'COLEGIO ESTADUAL NORMA RIBEIRO - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL PEDRO PAULO MARQUES E MARQUES',
    'COLEGIO ESTADUAL PRESIDENTE COSTA E SILVA',
    'COLEGIO ESTADUAL PROFESSOR CARLOS SANT ANNA - TEMPO INTEGRAL',
    'COLEGIO ESTADUAL PROFESSOR EDSON CARNEIRO',
    'COLEGIO ESTADUAL PROFESSOR ROMULO ALMEIDA',
    'COLEGIO ESTADUAL PROFESSORA MARIA BERNADETE BRANDAO',
    'COLEGIO ESTADUAL PROFESSORA NOEMIA REGO',
    'COLEGIO ESTADUAL RAYMUNDO DA MATA',
    'COLEGIO ESTADUAL RENAN BALEEIRO',
    'COLEGIO ESTADUAL ROTARY',
    'COLEGIO ESTADUAL SAO DANIEL COMBONI',
    'COLEGIO ESTADUAL SENHOR DO BONFIM',
    'COLEGIO ESTADUAL THALES DE AZEVEDO',
    'COLEGIO ESTADUAL VALE DOS LAGOS',
    'ESCOLA ESTADUAL DEPUTADO NAOMAR ALCANTARA - TEMPO INTEGRAL',
    'ESCOLA ESTADUAL NAOMAR ALCANTARA',
    'ESCOLA ESTADUAL PIERRE VERGER',
    'ESCOLA ESTADUAL PROFESSORA ARMANDINA MARQUES',
    'ESCOLA PRESCILIANO SILVA',
    'INSTITUTO CENTRAL DE EDUCACAO ISAIAS ALVES ICEIA',
  ],
  coordinators: [
    { name: 'Arielma Galvão', municipality: 'Salvador' },
    { name: 'Luciana Pita', municipality: 'Salvador' },
    { name: 'Bruna Gouveia', municipality: 'Salvador' },
    { name: 'Larissa Leslie', municipality: 'Salvador' },
    { name: 'Juliana Campos', municipality: 'Salvador' },
    { name: 'Simone Alves', municipality: 'Salvador' },
    { name: 'Ana Flávia', municipality: 'Salvador' },
    { name: 'Valuza Saraiva', municipality: 'Salvador' },
  ],
  coordinatorSourceNote:
    'A planilha informa “9 coordenadoras” no cabeçalho, mas contém 8 nomes preenchidos; o documento lista somente os nomes efetivamente fornecidos.',
}

const openQuestion = (question) => ({ ...createSlideDraft('open_text'), question })
const wordQuestion = (question) => ({ ...createSlideDraft('word_cloud'), question })

export const OTHER_ATTENDANCE_INSTITUTION = 'Outros'

export const ATTENDANCE_INSTITUTIONS = Array.from(new Set([
  ...EDUCATION_EVENT.schools,
  'FEEBA',
  'UNDIME',
  'UNCME',
  'CEE-BA',
  'UNEB',
  'UFBA',
  'Universidades estaduais da Bahia',
  'Universidades federais da Bahia',
  'IFBA',
  'IF Baiano',
  'Núcleos Territoriais de Educação (NTEs)',
  'Gestão escolar',
  'Coordenação pedagógica',
  'CASA CIVIL',
  'COJUVE',
  'SDE',
  'SEPROMI',
  'SPM',
  'SJDH',
  'FAPESB',
  'SETRE',
  'SECULT',
  'SEI',
  'SEPLAN',
  'SETUR',
  'SEC',
  'SESI',
  'ACB',
  OTHER_ATTENDANCE_INSTITUTION,
])).sort((left, right) => left.localeCompare(right, 'pt-BR'))

export const isAttendanceInstitution = (value) => ATTENDANCE_INSTITUTIONS.includes(String(value ?? '').trim())

export const buildEducationEventSlides = () => [
  ...guidedQuestions.map(openQuestion),
  wordQuestion('Em uma palavra, qual legado este seminário deve deixar para a Educação da Bahia?'),
  openQuestion('Quais são os principais desafios que a Educação da Bahia precisa enfrentar?'),
  openQuestion('Quais prioridades estratégicas devem orientar a agenda da Educação da Bahia?'),
  openQuestion('Que proposições, compromissos ou próximos passos devem ser registrados para o futuro?'),
]

const AVANCA_SLIDE_STYLE = Object.freeze({
  theme: 'avanca',
  layout: 'editorial',
  font: 'ibm-plex-sans',
  titleSize: 'large',
  titleWidth: 'wide',
  titleAlign: 'left',
  titleCase: 'sentence',
})

const withAvancaStyle = (slide, style = {}) => ({
  ...slide,
  style: { ...AVANCA_SLIDE_STYLE, ...style },
})

const avancaOpenQuestion = (question, style = {}) =>
  withAvancaStyle({ ...createSlideDraft('open_text'), question }, style)

export const AVANCA_EVENT = {
  key: AVANCA_EVENT_KEY,
  letterTitle: 'CARTA PARA O PROGRAMA AVANÇA + BAHIA',
  shortTitle: 'Avança + Bahia · Q&A',
  title: 'Programa Avança + Bahia — escuta e próximos passos',
  date: '',
  time: '',
  location: 'Evento especial sobre o Programa Avança + Bahia',
  organizer: 'Secretaria da Educação do Estado da Bahia',
  expectedAudience: 'Gestores, professores, estudantes e comunidade escolar',
  methodology:
    'Apresentação Q&A com perguntas abertas, enquetes rápidas e nuvem de palavras para transformar informação em escuta qualificada.',
  objective:
    'Compreender os desafios de implementação do Programa Avança + Bahia e registrar compromissos concretos para a recomposição das aprendizagens.',
  publicProfile: [],
  institutions: [],
  program: [],
  guidedQuestions: [],
  schools: [],
  coordinators: [],
}

export const buildAvancaEventSlides = () => [
  avancaOpenQuestion('Quais as maiores dificuldades para transformar a leitura de dados em plano de recomposição?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Você acredita que a disponibilização de material estruturado por componente curricular e série/ano, construída a partir das habilidades essenciais e descritores seria uma possibilidade para melhoria da aprendizagem?', {
    titleSize: 'compact',
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Se você pudesse, o que mudaria na gestão da aprendizagem?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Gostaria que a SEC fizesse pautas de AC para o ano letivo?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Com as mudanças do ENEM, como podemos melhor articular o exame ao ensino médio?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Quais temas você gostaria de ter nas formações continuadas, inclusive na AC Territorial Coordenação e professores?', {
    titleSize: 'compact',
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Acredita ser necessária a implementação de protocolos na rede (ex. Busca ativa, fluxo...)?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Que tipo de apoio você considera necessário para reduzir as desigualdades raciais na escola?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Há dificuldades de realizar do AC entre os professores da FGB e Formação Técnica?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Cite alguns possíveis temas de prioridade pedagógica:', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Como fortalecer as ofertas e modalidades da rede estadual de educação?', {
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Acha pertinente a construção de um sistema de apreciação dos planos de aula de cursos de programas da rede?', {
    titleSize: 'compact',
    titleWidth: 'wider',
  }),
  avancaOpenQuestion('Como articular os projetos estruturantes e de diversificação com a permanência e aprendizagens?', {
    titleSize: 'display',
    titleWidth: 'wider',
  }),
]

export const getEventData = (eventKey) => {
  if (eventKey === EDUCATION_EVENT_KEY) return EDUCATION_EVENT
  if (eventKey === AVANCA_EVENT_KEY) return AVANCA_EVENT
  return null
}
