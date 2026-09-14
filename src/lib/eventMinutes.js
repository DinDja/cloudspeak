import { EDUCATION_EVENT, getEventData } from './eventData'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 20
const PDF_RENDER_YIELD_EVERY = 25

const yieldToBrowser = () =>
  new Promise((resolve) => {
    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => resolve())
      return
    }
    globalThis.setTimeout(resolve, 0)
  })

const loadPdfTools = async () => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  return { jsPDF, autoTable }
}

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

const joinNatural = (values) => {
  const items = values.map((value) => text(value)).filter(Boolean)
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} e ${items[1]}`
  return `${items.slice(0, -1).join('; ')} e ${items.at(-1)}`
}

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

const isEducationEventTitle = (value) => {
  const normalized = text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
  return normalized.includes('educacao integral') && normalized.includes('bahia')
}

export const getEventForSession = (session) => {
  const event = getEventData(session?.eventKey)
  if (event) return event
  const hasEducationQuestion = (session?.slides ?? []).some((slide) =>
    EDUCATION_EVENT.guidedQuestions.includes(text(slide?.question)),
  )
  if (isEducationEventTitle(session?.title) || hasEducationQuestion) return EDUCATION_EVENT
  return genericEvent(session)
}

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

const drawHeader = (pdf, logo, compact = false) => {
  if (logo) {
    const width = compact ? 62 : 80
    const height = compact ? 31 : 40
    pdf.addImage(logo, 'PNG', PAGE_WIDTH / 2 - width / 2, compact ? 7 : 9, width, height)
  } else {
    pdf.setTextColor(28, 34, 31)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(compact ? 8 : 9)
    pdf.text('ESTADO DA BAHIA', PAGE_WIDTH / 2, compact ? 22 : 28, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(compact ? 7 : 8)
    pdf.text('SECRETARIA DA EDUCAÇÃO DO ESTADO DA BAHIA', PAGE_WIDTH / 2, compact ? 27 : 33, { align: 'center' })
  }
  return compact ? 52 : 65
}

const addPage = (pdf, logo) => {
  pdf.addPage()
  return drawHeader(pdf, logo, true)
}

const makeWriter = (pdf, logo, autoTable) => {
  let y = drawHeader(pdf, logo)

  const ensure = (height = 10) => {
    if (y + height <= PAGE_HEIGHT - 23) return
    y = addPage(pdf, logo)
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
    const fontStyle = options.bold ? 'bold' : 'normal'
    const fontSize = options.size ?? 9.5
    const applyParagraphStyle = () => {
      pdf.setFont('helvetica', fontStyle)
      pdf.setFontSize(fontSize)
      pdf.setTextColor(55, 61, 58)
    }
    applyParagraphStyle()
    const lines = pdf.splitTextToSize(content, options.width ?? PAGE_WIDTH - MARGIN * 2)
    const lineHeight = options.lineHeight ?? 4.6
    for (const line of lines) {
      ensure(lineHeight)
      // addPage() reapplies the compact header style; restore the paragraph
      // style before writing the first line on the new page.
      applyParagraphStyle()
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

export const getAttendanceParticipants = (participants = []) =>
  (participants ?? [])
    .filter((participant) => participant?.attendance === true)
    .map((participant) => ({
      ...participant,
      participantId: text(participant.participantId || participant.id),
    }))
    .filter((participant) => participant.participantId)
    .sort((left, right) =>
      text(left.participantName || 'Anônimo').localeCompare(text(right.participantName || 'Anônimo'), 'pt-BR'),
    )

export const createAttendancePdf = async ({ session, participants = [], authorName = '' }) => {
  const { jsPDF, autoTable } = await loadPdfTools()
  const event = getEventForSession(session)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const logo = await imageToDataUrl('/logo-mapa-educacao-integral.png')
  const writer = makeWriter(pdf, logo, autoTable)
  const participantRows = getAttendanceParticipants(participants)
  const eventDate = parseEventDate(event.date) || toDate(session?.launchedAt)
  const eventDateLabel = text(event.date) || formatDate(eventDate)
  const eventTimeLabel = text(event.time) || 'horário não informado'

  writer.centeredTitle('LISTA DE PRESENÇA')
  writer.paragraph(event.title, { bold: true, size: 11, after: 1 })
  writer.paragraph(`Data do evento: ${eventDateLabel}. Horário: ${eventTimeLabel}. Local: ${event.location}.`)
  writer.paragraph(`Código da sessão: ${text(session?.code) || 'sem código'}.`)
  writer.paragraph(
    'Documento emitido a partir dos registros de presença confirmados pelo QR Code específico de presença. Cada linha corresponde a um participante registrado no Firestore.',
  )
  writer.paragraph(`Total de presenças confirmadas: ${participantRows.length}.`, { bold: true })

  if (participantRows.length) {
    writer.table(
      ['Nº', 'Nome registrado', 'Órgão, escola ou instituição', 'Entrada'],
      participantRows.map((entry, index) => [
        String(index + 1),
        text(entry.participantName) || 'Nome não informado',
        text(entry.participantInstitution) || 'Órgão ou instituição não informado',
        entry.joinedAt ? `${formatDate(entry.joinedAt)} às ${formatTime(entry.joinedAt)}` : 'Não informado',
      ]),
      { columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 48 }, 2: { cellWidth: 84 }, 3: { cellWidth: 30 } } },
    )
  } else {
    writer.paragraph('Não houve registro confirmado pelo QR Code de presença.')
  }

  writer.paragraph(
    `Lista gerada pelo CloudSpeak${text(authorName) ? ` para ${text(authorName)}` : ''}. A conferência e a assinatura do documento permanecem sob responsabilidade da organização do evento.`,
    { size: 8 },
  )

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page)
    drawFooter(pdf, page, totalPages)
  }
  return pdf
}

const responseEntries = (slide, responses, participantMap) =>
  responses
    .filter((entry) => entry.slideId === slide.id)
    .sort((left, right) => (toDate(left.createdAt)?.getTime() ?? 0) - (toDate(right.createdAt)?.getTime() ?? 0))
    .map((entry) => {
      const participant = participantMap.get(text(entry.participantId))
      return {
        participantName: text(entry.participantName) || 'Anônimo',
        participantInstitution: text(participant?.participantInstitution),
        value: text(entry.value),
      }
    })

export const createMinutesPdf = async ({ session, responses = [], participants = [], authorName = '' }) => {
  const { jsPDF, autoTable } = await loadPdfTools()
  const event = getEventForSession(session)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const logo = await imageToDataUrl('/logo-mapa-educacao-integral.png')
  const writer = makeWriter(pdf, logo, autoTable)
  const slides = Array.isArray(session?.slides) ? session.slides : []
  const participantRows = getAttendanceParticipants(participants)
  const participantMap = new Map(participantRows.map((entry) => [text(entry.participantId), entry]))
  const eventDate = parseEventDate(event.date) || toDate(session?.launchedAt)
  const openingDate = formatDate(eventDate)
  writer.centeredTitle('CARTA PARA EDUCAÇÃO INTEGRAL E INTEGRADA PARA O DESENVOLVIMENTO ECONÔMICO E SOCIAL DA BAHIA')
  writer.paragraph('À Secretaria da Educação do Estado da Bahia,')
  writer.paragraph(
    `Aos ${openingDate}, no ${event.location}, realizou-se o evento “${event.title}”, promovido pela ${event.organizer}. Este documento registra, em forma de carta e sem substituição das manifestações por sínteses automáticas, o desenvolvimento do encontro e as contribuições enviadas pela plataforma interativa.`,
  )
  if (event.objective) writer.paragraph(`O objetivo do encontro foi ${event.objective.toLocaleLowerCase('pt-BR')}`)
  writer.paragraph(`A metodologia adotada consistiu em ${event.methodology.toLocaleLowerCase('pt-BR')}`)
  if (event.expectedAudience || event.publicProfile.length) {
    writer.paragraph(
      `O público previsto era de ${event.expectedAudience || 'representantes do ecossistema educacional baiano'}. Foram consideradas as seguintes representações: ${joinNatural(event.publicProfile)}.`,
    )
  }
  if (event.program.length) {
    writer.paragraph(
      `A programação ocorreu da seguinte forma: ${event.program
        .map((item) => `às ${item.time}, ${item.theme}, com condução de ${item.speakers}`)
        .join('; ')}.`,
    )
  }
  writer.paragraph(
    `Ao longo da sessão, foram recebidas ${responses.length} contribuição${responses.length === 1 ? '' : 'ões'} distribuída${responses.length === 1 ? '' : 's'} entre ${slides.length} pergunta${slides.length === 1 ? '' : 's'}. As manifestações foram preservadas abaixo em sua forma literal para conferência e validação pela Secretaria.`,
  )

  let renderedResponses = 0
  for (const [index, slide] of slides.entries()) {
    const slideResponses = responseEntries(slide, responses, participantMap)
    writer.paragraph(
      `Na ${index + 1}ª pergunta, “${text(slide.question)}”, foram registradas ${slideResponses.length} contribuição${slideResponses.length === 1 ? '' : 'ões'}.`,
      { bold: true },
    )
    if (!slideResponses.length) {
      writer.paragraph('Não houve resposta registrada para esta etapa.')
      continue
    }
    for (const entry of slideResponses) {
      const institution = entry.participantInstitution ? `, vinculado a ${entry.participantInstitution}` : ''
      writer.paragraph(
        `${entry.participantName}${institution} registrou a seguinte contribuição: “${entry.value}”.`,
      )
      renderedResponses += 1
      if (renderedResponses % PDF_RENDER_YIELD_EVERY === 0) await yieldToBrowser()
    }
  }
  writer.paragraph(
    'As contribuições apresentadas foram organizadas nas dimensões de desafios identificados, prioridades estratégicas e proposições para o futuro, conforme o documento-base do seminário. O conteúdo registrado neste documento constitui a fonte literal para a leitura, sistematização e validação pela Secretaria.',
  )
  if (event.schools.length) {
    writer.paragraph(
      `A documentação de referência do evento também relaciona ${event.schools.length} unidades escolares e registra a coordenação de ${joinNatural(event.coordinators.map((coordinator) => coordinator.name))}. Essas referências integram o documento-base e não substituem a frequência registrada pelo QR Code específico de presença.`,
    )
  }
  writer.paragraph(
    `Nada mais havendo a registrar, esta carta é encaminhada para conferência da Secretaria da Educação do Estado da Bahia, complementação de informações e assinatura, quando cabível.`,
  )
  writer.paragraph('Atenciosamente,')
  writer.paragraph(text(authorName) || 'Responsável pela lavratura')

  writer.paragraph('Participantes com presença registrada pelo QR Code específico de presença:', { bold: true })
  writer.paragraph(
    `A lista abaixo reúne ${participantRows.length} registro${participantRows.length === 1 ? '' : 's'} confirmado${participantRows.length === 1 ? '' : 's'} no formulário de presença, que exigiu nome completo e órgão, escola ou instituição. Respostas anônimas ou participantes que entraram apenas pelo QR Code geral não compõem esta frequência.`,
  )
  if (participantRows.length) {
    writer.table(
      ['Nº', 'Nome registrado', 'Órgão, escola ou instituição'],
      participantRows.map((entry, index) => [
        String(index + 1),
        text(entry.participantName) || 'Nome não informado',
        text(entry.participantInstitution) || 'Órgão ou instituição não informado',
      ]),
      { columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 62 }, 2: { cellWidth: 98 } } },
    )
  } else {
    writer.paragraph('Não houve registro confirmado pelo QR Code de presença.')
  }

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
  pdf.save(`carta-${code.toLowerCase()}.pdf`)
  return pdf
}

export const downloadAttendancePdf = async (options) => {
  const pdf = await createAttendancePdf(options)
  const code = text(options?.session?.code) || 'evento'
  pdf.save(`lista-presenca-${code.toLowerCase()}.pdf`)
  return pdf
}
