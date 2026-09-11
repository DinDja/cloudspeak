import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { EDUCATION_EVENT, getEventData } from './eventData'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 20

const toDate = (value) => {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.toMillis === 'function') return new Date(value.toMillis())
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  if (value instanceof Date) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = toDate(value)
  return date
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date)
    : 'data não informada'
}

const formatTime = (value) => {
  const date = toDate(value)
  return date
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)
    : 'horário não informado'
}

const parseEventDate = (value) => {
  const match = String(value ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null
}

const text = (value) => String(value ?? '').trim()

const genericEvent = (session) => ({
  ...EDUCATION_EVENT,
  key: null,
  title: text(session?.title) || 'Evento interativo',
  shortTitle: text(session?.title) || 'Evento interativo',
  date: toDate(session?.launchedAt) ? new Intl.DateTimeFormat('pt-BR').format(toDate(session.launchedAt)) : '',
  time: toDate(session?.launchedAt) ? formatTime(session.launchedAt) : '',
  location: 'Local não informado',
  methodology: 'Registro das contribuições coletadas por meio da apresentação interativa.',
  objective: '',
  publicProfile: [],
  program: [],
  guidedQuestions: [],
  schools: [],
  coordinators: [],
})

export const getEventForSession = (session) => getEventData(session?.eventKey) || genericEvent(session)

const imageToDataUrl = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const drawFooter = (pdf, pageNumber, totalPages) => {
  pdf.setDrawColor(215, 218, 215)
  pdf.line(MARGIN, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(105, 110, 108)
  pdf.text('Registro eletrônico do evento · CloudSpeak / Secretaria da Educação', MARGIN, PAGE_HEIGHT - 9)
  pdf.text(`Página ${pageNumber} de ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 9, { align: 'right' })
}

const drawHeader = (pdf, crest, compact = false) => {
  if (crest) pdf.addImage(crest, 'PNG', PAGE_WIDTH / 2 - 9, compact ? 9 : 12, 18, 18)
  pdf.setTextColor(28, 34, 31)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(compact ? 8 : 9)
  pdf.text('ESTADO DA BAHIA', PAGE_WIDTH / 2, compact ? 32 : 37, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(compact ? 7 : 8)
  pdf.text('SECRETARIA DA EDUCAÇÃO DO ESTADO DA BAHIA', PAGE_WIDTH / 2, compact ? 37 : 42, { align: 'center' })
  return compact ? 47 : 54
}

const addPage = (pdf, crest) => {
  pdf.addPage()
  return drawHeader(pdf, crest, true)
}

const makeWriter = (pdf, crest) => {
  let y = drawHeader(pdf, crest)

  const ensure = (height = 10) => {
    if (y + height <= PAGE_HEIGHT - 23) return
    y = addPage(pdf, crest)
  }

  const heading = (value, level = 1) => {
    ensure(level === 1 ? 13 : 10)
    pdf.setTextColor(28, 34, 31)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(level === 1 ? 11 : 9)
    const lines = pdf.splitTextToSize(text(value), PAGE_WIDTH - MARGIN * 2)
    pdf.text(lines, MARGIN, y)
    y += lines.length * (level === 1 ? 5.2 : 4.5) + 3
  }

  const paragraph = (value, options = {}) => {
    const content = text(value)
    if (!content) return
    pdf.setFont(options.bold ? 'helvetica' : 'helvetica', options.bold ? 'bold' : 'normal')
    pdf.setFontSize(options.size ?? 9.5)
    pdf.setTextColor(55, 61, 58)
    const lines = pdf.splitTextToSize(content, options.width ?? PAGE_WIDTH - MARGIN * 2)
    const lineHeight = options.lineHeight ?? 4.6
    for (const line of lines) {
      ensure(lineHeight)
      pdf.text(line, MARGIN, y)
      y += lineHeight
    }
    y += options.after ?? 2
  }

  const centeredTitle = (value) => {
    ensure(20)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(28, 34, 31)
    const lines = pdf.splitTextToSize(text(value).toUpperCase(), PAGE_WIDTH - 45)
    pdf.text(lines, PAGE_WIDTH / 2, y + 2, { align: 'center' })
    y += lines.length * 7 + 4
  }

  const table = (head, body, options = {}) => {
    ensure(options.minimumHeight ?? 20)
    autoTable(pdf, {
      startY: y,
      head: [head],
      body,
      margin: { left: MARGIN, right: MARGIN, bottom: 22 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: options.fontSize ?? 8,
        cellPadding: 2.2,
        textColor: [45, 50, 48],
        lineColor: [210, 214, 211],
        lineWidth: 0.2,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: [31, 80, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [247, 248, 246] },
      columnStyles: options.columnStyles,
      didDrawPage: options.didDrawPage,
    })
    y = (pdf.lastAutoTable?.finalY ?? y) + 6
  }

  return {
    get y() {
      return y
    },
    set y(value) {
      y = value
    },
    ensure,
    heading,
    paragraph,
    centeredTitle,
    table,
  }
}

const presenceRows = (participants, responses) => {
  const map = new Map()
  for (const participant of participants ?? []) {
    const id = text(participant.participantId || participant.id)
    if (!id) continue
    map.set(id, { ...participant, participantId: id })
  }
  for (const response of responses ?? []) {
    const id = text(response.participantId)
    if (!id || map.has(id)) continue
    map.set(id, {
      participantId: id,
      participantName: response.participantName,
      participantInstitution: '',
      joinedAt: null,
      inferredFromResponse: true,
    })
  }
  return [...map.values()].sort((left, right) =>
    text(left.participantName || 'Anônimo').localeCompare(text(right.participantName || 'Anônimo'), 'pt-BR'),
  )
}

const responseRows = (slide, responses, participantMap) =>
  responses
    .filter((entry) => entry.slideId === slide.id)
    .sort((left, right) => (toDate(left.createdAt)?.getTime() ?? 0) - (toDate(right.createdAt)?.getTime() ?? 0))
    .map((entry, index) => {
      const participant = participantMap.get(text(entry.participantId))
      return [
        String(index + 1),
        text(entry.participantName) || 'Anônimo',
        text(participant?.participantInstitution) || 'Não informado',
        text(entry.value),
      ]
    })

const countAnswers = (slide, responses) => {
  const values = responses.filter((entry) => entry.slideId === slide.id).map((entry) => text(entry.value)).filter(Boolean)
  if (!values.length) return 'Nenhuma resposta registrada.'
  const counts = new Map()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `${value}: ${count}`)
    .join(' · ')
}

export const createMinutesPdf = async ({ session, responses = [], participants = [], authorName = '' }) => {
  const event = getEventForSession(session)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const crest = await imageToDataUrl('/brasao-bahia.png')
  const writer = makeWriter(pdf, crest)
  const slides = Array.isArray(session?.slides) ? session.slides : []
  const participantRows = presenceRows(participants, responses)
  const participantMap = new Map(participantRows.map((entry) => [text(entry.participantId), entry]))
  const eventDate = event.key ? parseEventDate(event.date) : toDate(session?.launchedAt)
  const openingDate = formatDate(eventDate)
  const launchedAt = session?.launchedAt ? ` às ${formatTime(session.launchedAt)}` : ''
  const endedAt = session?.endedAt ? ` às ${formatTime(session.endedAt)}` : ''

  writer.centeredTitle('ATA DO EVENTO')
  writer.paragraph(event.title, { bold: true, size: 11, after: 1 })
  writer.paragraph(`Data: ${event.date || openingDate} · Horário previsto: ${event.time || 'não informado'} · Local: ${event.location}`)
  writer.paragraph(`Código da sessão: ${text(session?.code) || 'não informado'} · Gerada em: ${formatDate(new Date())}`)
  writer.paragraph(`Público previsto no documento-base: ${event.expectedAudience || 'não informado'}`)

  writer.heading('1. IDENTIFICAÇÃO E ABERTURA')
  writer.paragraph(
    `Aos ${openingDate}, no ${event.location}, realizou-se o evento “${event.title}”, promovido pela ${event.organizer}. A programação tinha início previsto para ${event.time || 'horário não informado'}${launchedAt ? ` e foi aberta digitalmente${launchedAt}` : ''}. A presente ata foi gerada a partir dos registros de presença e das contribuições enviadas na sessão interativa, mantendo as respostas em sua forma literal.`,
  )
  if (event.objective) writer.paragraph(`Objetivo: ${event.objective}`)
  writer.paragraph(`Metodologia: ${event.methodology}`)

  writer.heading('2. PÚBLICO PARTICIPANTE E FREQUÊNCIA')
  writer.paragraph(
    `A lista de frequência digital reúne ${participantRows.length} registro${participantRows.length === 1 ? '' : 's'} de participante${participantRows.length === 1 ? '' : 's'}. Registros marcados como “inferidos” correspondem a respostas que não tinham um documento de presença associado no momento da geração e devem ser conferidos pela equipe responsável.`,
  )
  writer.table(
    ['Nº', 'Nome registrado', 'Órgão, escola ou instituição', 'Registro'],
    participantRows.map((entry, index) => [
      String(index + 1),
      text(entry.participantName) || 'Anônimo',
      text(entry.participantInstitution) || 'Não informado',
      entry.inferredFromResponse ? 'Inferido de resposta' : 'Presença registrada',
    ]),
    { columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 48 }, 2: { cellWidth: 82 }, 3: { cellWidth: 30 } } },
  )

  writer.heading('3. PAUTA E PROGRAMAÇÃO')
  if (event.publicProfile.length) {
    writer.paragraph('O público previsto no documento-base compreendia:')
    event.publicProfile.forEach((item) => writer.paragraph(`• ${item}`, { after: 0 }))
    writer.y += 2
  }
  if (event.program.length) {
    writer.table(
      ['Horário', 'Tema', 'Painelistas / condução'],
      event.program.map((item) => [item.time, item.theme, item.speakers]),
      { columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 94 }, 2: { cellWidth: 56 } } },
    )
  }

  writer.heading('4. DESENVOLVIMENTO E CONTRIBUIÇÕES')
  writer.paragraph(
    'Os participantes foram convidados a contribuir com análises, desafios, prioridades, proposições e compromissos relacionados à educação pública baiana. O quadro abaixo registra a apuração por etapa; as tabelas seguintes transcrevem todas as manifestações recebidas.',
  )
  writer.table(
    ['Etapa', 'Pergunta / proposição', 'Respostas'],
    slides.map((slide, index) => [String(index + 1), text(slide.question), countAnswers(slide, responses)]),
    { fontSize: 7.5, columnStyles: { 0: { cellWidth: 13 }, 1: { cellWidth: 89 }, 2: { cellWidth: 68 } } },
  )

  slides.forEach((slide, index) => {
    writer.heading(`4.${index + 1} ${text(slide.question)}`, 2)
    const slideResponses = responseRows(slide, responses, participantMap)
    if (!slideResponses.length) {
      writer.paragraph('Não houve resposta registrada para esta etapa.')
      return
    }
    writer.table(
      ['Nº', 'Participante', 'Instituição', 'Resposta literal'],
      slideResponses,
      { fontSize: 7.5, columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 37 }, 2: { cellWidth: 48 }, 3: { cellWidth: 75 } } },
    )
  })

  writer.heading('5. SISTEMATIZAÇÃO E PRODUTO FINAL')
  writer.paragraph(
    'As contribuições foram organizadas nas dimensões de desafios identificados, prioridades estratégicas e proposições para o futuro, conforme o documento-base do seminário. Para preservar a precisão documental, esta ata não substitui as manifestações por uma interpretação automática: as respostas acima são a fonte literal para a leitura e validação pela Secretaria.',
  )
  writer.paragraph(
    `Foram contabilizadas ${responses.length} resposta${responses.length === 1 ? '' : 's'} em ${slides.length} etapa${slides.length === 1 ? '' : 's'} interativa${slides.length === 1 ? '' : 's'}.`,
    { bold: true },
  )

  writer.heading('6. REFERÊNCIAS DA AGENDA')
  if (event.schools.length) {
    writer.paragraph(
      'A relação abaixo foi transcrita da planilha “AGENDA REITORES - Lista de escolas”. Ela representa a referência de escolas participantes/convidadas e não substitui a lista de frequência digital registrada na seção 2.',
    )
    writer.table(
      ['Nº', 'Escola prevista na agenda'],
      event.schools.map((school, index) => [String(index + 1), school]),
      { columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 154 } } },
    )
  }
  if (event.coordinators.length) {
    writer.heading('6.1 Coordenação registrada na planilha', 2)
    if (event.coordinatorSourceNote) writer.paragraph(event.coordinatorSourceNote, { size: 8, after: 2 })
    writer.table(
      ['Nº', 'Nome', 'Município'],
      event.coordinators.map((coordinator, index) => [String(index + 1), coordinator.name, coordinator.municipality]),
      { columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 100 }, 2: { cellWidth: 54 } } },
    )
  }

  writer.heading('7. ENCERRAMENTO')
  writer.paragraph(
    `A sessão foi finalizada digitalmente${endedAt || ' sem horário de encerramento informado no registro'}. Nada mais havendo a registrar nesta versão eletrônica, a ata é encaminhada para conferência do secretário responsável, complementação de nomes e assinaturas, quando cabível.`,
  )
  writer.y += 10
  writer.ensure(30)
  writer.table(
    ['Responsável pela lavratura', 'Conferência / assinatura'],
    [[text(authorName) || '________________________________', '________________________________']],
    { fontSize: 8, columnStyles: { 0: { cellWidth: 82 }, 1: { cellWidth: 82 } } },
  )
  writer.paragraph(`Nome informado para a lavratura: ${text(authorName) || 'não informado'}`, { size: 8, after: 0 })
  writer.paragraph(`Documento gerado para a sessão ${text(session?.code) || 'sem código'}, com brasão do Estado da Bahia e registros coletados pelo CloudSpeak.`, { size: 7.5 })

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page)
    drawFooter(pdf, page, totalPages)
  }
  return pdf
}

export const downloadMinutesPdf = async (options) => {
  const pdf = await createMinutesPdf(options)
  const code = text(options?.session?.code) || 'evento'
  pdf.save(`ata-${code.toLowerCase()}.pdf`)
  return pdf
}
