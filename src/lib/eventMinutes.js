import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import { EDUCATION_EVENT, getEventData } from './eventData'
import { normalizeText } from './validators'
import { getAttendanceRecords } from './attendanceReports'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_TOP = 30
const HEADER_CLEARANCE = 8
const MARGIN_LEFT = 30
const MARGIN_RIGHT = 20
const MARGIN_BOTTOM = 20
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM - 7
const FIRST_LINE_INDENT = 12.5
const BODY_FONT_SIZE = 12
const BODY_LINE_HEIGHT = 6.35
const PDF_RENDER_YIELD_EVERY = 25
// Keep each literal contribution readable without allowing one oversized value
// (including legacy or externally-created responses) to dominate the PDF.
const PDF_RESPONSE_MAX_CHARS = 600

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

// Todas as entradas passam por texto puro: colagens não podem transportar
// quebras, espaçamento ou qualquer outra formatação para a carta.
const text = (value) => normalizeText(value).replace(/[→➜⇒⟶↦]/gu, '->')

const limitPdfResponse = (value) => {
  const content = text(value)
  if (content.length <= PDF_RESPONSE_MAX_CHARS) return content
  return `${content.slice(0, PDF_RESPONSE_MAX_CHARS).trimEnd()}… [resposta limitada no PDF]`
}

const joinNatural = (values) => {
  const items = values.map((value) => text(value)).filter(Boolean)
  if (items.length <= 1) return items[0] || ''
  if (items.length === 2) return `${items[0]} e ${items[1]}`
  return `${items.slice(0, -1).join('; ')} e ${items.at(-1)}`
}

const contributionLabel = (count) => (count === 1 ? 'contribuição' : 'contribuições')

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
  institutions: [],
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

const qrCodeToDataUrl = async (value) => {
  if (!value || typeof document === 'undefined') return null

  try {
    const svg = renderToStaticMarkup(createElement(QRCodeSVG, {
      value,
      size: 180,
      level: 'M',
      includeMargin: true,
      bgColor: '#ffffff',
      fgColor: '#111827',
    }))
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    const dataUrl = await new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 180
        canvas.height = 180
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(null)
          return
        }
        context.drawImage(image, 0, 0, 180, 180)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => resolve(null)
      image.src = objectUrl
    })
    URL.revokeObjectURL(objectUrl)
    return dataUrl
  } catch {
    return null
  }
}

const drawFooter = (pdf, pageNumber) => {
  pdf.setDrawColor(215, 218, 215)
  pdf.line(MARGIN_LEFT, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 15)
  pdf.setCharSpace(0)
  pdf.setFont('times', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(105, 110, 108)
  pdf.text('Registro eletrônico do evento · Fala SEC / Secretaria da Educação', MARGIN_LEFT, PAGE_HEIGHT - 9)
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(10)
  pdf.text(String(pageNumber), PAGE_WIDTH - MARGIN_RIGHT, 20, { align: 'right' })
}

const drawHeader = (pdf, logo, compact = false) => {
  pdf.setCharSpace(0)
  if (logo) {
    const width = compact ? 50 : 60
    const height = compact ? 25 : 30
    pdf.addImage(logo, 'PNG', PAGE_WIDTH / 2 - width / 2, 1, width, height)
  } else {
    pdf.setTextColor(28, 34, 31)
    pdf.setFont('times', 'bold')
    pdf.setFontSize(compact ? 9 : 10)
    pdf.text('ESTADO DA BAHIA', PAGE_WIDTH / 2, 11, { align: 'center' })
    pdf.setFont('times', 'normal')
    pdf.setFontSize(compact ? 8 : 9)
    pdf.text('SECRETARIA DA EDUCAÇÃO DO ESTADO DA BAHIA', PAGE_WIDTH / 2, 17, { align: 'center' })
  }
  return MARGIN_TOP + HEADER_CLEARANCE
}

const addPage = (pdf, logo) => {
  pdf.addPage()
  return drawHeader(pdf, logo, true)
}

const makeWriter = (pdf, logo, autoTable) => {
  let y = drawHeader(pdf, logo)

  const ensure = (height = 10) => {
    if (y + height <= CONTENT_BOTTOM) return
    y = addPage(pdf, logo)
  }

  const heading = (value, level = 1) => {
    ensure(level === 1 ? 13 : 10)
    pdf.setCharSpace(0)
    pdf.setTextColor(28, 34, 31)
    pdf.setFont('times', 'bold')
    pdf.setFontSize(level === 1 ? BODY_FONT_SIZE : 11)
    const lines = pdf.splitTextToSize(text(value), CONTENT_WIDTH)
    pdf.text(lines, MARGIN_LEFT, y)
    y += lines.length * (level === 1 ? BODY_LINE_HEIGHT : 5.5) + BODY_LINE_HEIGHT
  }

  const paragraph = (value, options = {}) => {
    const content = text(value)
    if (!content) return
    const fontStyle = options.bold ? 'bold' : 'normal'
    const fontSize = options.size ?? BODY_FONT_SIZE
    const applyParagraphStyle = () => {
      // AutoTable/jsPDF can leave character spacing enabled between draws.
      // Reset it so literal responses use the same typography as the letter.
      pdf.setCharSpace(0)
      pdf.setFont('times', fontStyle)
      pdf.setFontSize(fontSize)
      pdf.setTextColor(0, 0, 0)
    }
    applyParagraphStyle()
    const width = options.width ?? CONTENT_WIDTH
    const indent = options.indent ?? FIRST_LINE_INDENT
    const shouldJustify = options.justify ?? true
    const lines = pdf.splitTextToSize(content, Math.max(width - indent, 40))
    const lineHeight = options.lineHeight ?? BODY_LINE_HEIGHT
    const lineHeightFactor = lineHeight / (fontSize / pdf.internal.scaleFactor)
    let lineIndex = 0
    while (lineIndex < lines.length) {
      ensure(lineHeight)
      const availableLines = Math.max(1, Math.floor((CONTENT_BOTTOM - y) / lineHeight))
      const pageLines = lines.slice(lineIndex, lineIndex + availableLines)
      const continuesOnNextPage = lineIndex + pageLines.length < lines.length
      const textOptions = (align, maxWidth) => ({
        align,
        maxWidth,
        lineHeightFactor,
        charSpace: 0,
      })

      if (lineIndex === 0) {
        const firstLineIsJustified = shouldJustify && lines.length > 1
        applyParagraphStyle()
        pdf.text(
          firstLineIsJustified ? [pageLines[0], ''] : pageLines[0],
          MARGIN_LEFT + indent,
          y,
          textOptions(firstLineIsJustified ? 'justify' : 'left', width - indent),
        )
        pdf.setCharSpace(0)

        if (pageLines.length > 1) {
          const continuationLines = shouldJustify && continuesOnNextPage
            ? [...pageLines.slice(1), '']
            : pageLines.slice(1)
          applyParagraphStyle()
          pdf.text(
            continuationLines,
            MARGIN_LEFT,
            y + lineHeight,
            textOptions(shouldJustify ? 'justify' : 'left', width),
          )
          pdf.setCharSpace(0)
        }
      } else {
        const continuationLines = shouldJustify && continuesOnNextPage ? [...pageLines, ''] : pageLines
        applyParagraphStyle()
        pdf.text(
          continuationLines,
          MARGIN_LEFT,
          y,
          textOptions(shouldJustify ? 'justify' : 'left', width),
        )
        pdf.setCharSpace(0)
      }

      y += pageLines.length * lineHeight
      lineIndex += pageLines.length
      if (lineIndex < lines.length) y = addPage(pdf, logo)
    }
    y += options.after ?? 0
  }

  const centeredTitle = (value) => {
    ensure(20)
    pdf.setCharSpace(0)
    pdf.setFont('times', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    const lines = pdf.splitTextToSize(text(value).toUpperCase(), CONTENT_WIDTH)
    pdf.text(lines, PAGE_WIDTH / 2, y + 8, { align: 'center' })
    y += lines.length * 7 + BODY_LINE_HEIGHT + 6
  }

  const table = (head, body, options = {}) => {
    ensure(options.minimumHeight ?? 20)
    autoTable(pdf, {
      startY: y,
      head: [head],
      body,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM },
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: options.fontSize ?? 10,
        cellPadding: 1.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        overflow: 'linebreak',
        valign: 'top',
      },
      rowPageBreak: 'avoid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
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
  getAttendanceRecords(participants)
    .sort((left, right) =>
      text(left.participantName || 'Anônimo').localeCompare(text(right.participantName || 'Anônimo'), 'pt-BR'),
    )

export const createAttendancePdf = async ({ session, participants = [], authorName = '', report = null }) => {
  const { jsPDF, autoTable } = await loadPdfTools()
  const event = getEventForSession(session)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const logo = await imageToDataUrl('/logo-mapa-educacao-integral.png')
  const writer = makeWriter(pdf, logo, autoTable)
  const participantRows = getAttendanceParticipants(participants)
  const verificationUrl = text(report?.verificationUrl)
  const verificationQr = await qrCodeToDataUrl(verificationUrl)
  const eventDate = parseEventDate(event.date) || toDate(session?.launchedAt)
  const eventDateLabel = text(event.date) || formatDate(eventDate)
  const eventTimeLabel = text(event.time) || 'horário não informado'

  writer.centeredTitle('LISTA DE PRESENÇA')
  writer.paragraph(event.title, { bold: true, size: 11, after: 1 })
  writer.paragraph(`Data do evento: ${eventDateLabel}. Horário: ${eventTimeLabel}. Local: ${event.location}.`)
  writer.paragraph(`Código da sessão: ${text(session?.code) || 'sem código'}.`)
  writer.paragraph(
    'Para fins de comprovação, este documento reúne os registros de presença confirmados pelo QR Code específico de presença. Cada linha corresponde a um participante registrado no Firestore.',
  )
  writer.paragraph(`Total de presenças confirmadas: ${participantRows.length}.`, { bold: true })

  if (report?.reportId && report?.listHash) {
    writer.ensure(34)
    const verificationY = writer.y
    writer.paragraph(`Certificado de origem: ${report.reportId}.`, {
      width: 118,
      indent: 0,
      justify: false,
      size: 9,
      lineHeight: 4.5,
    })
    writer.paragraph(`Valide em: ${verificationUrl || 'pagina de validacao do Fala SEC'}.`, {
      width: 118,
      indent: 0,
      justify: false,
      size: 8,
      lineHeight: 4.2,
    })
    writer.paragraph(`Hash da lista: ${report.listHash}.`, {
      width: 118,
      indent: 0,
      justify: false,
      size: 7,
      lineHeight: 3.8,
    })
    if (verificationQr) {
      pdf.addImage(verificationQr, 'PNG', PAGE_WIDTH - MARGIN_RIGHT - 30, verificationY - 2, 30, 30)
      writer.y = Math.max(writer.y, verificationY + 32)
    }
  }

  if (participantRows.length) {
    writer.table(
      ['Nome completo', 'Lotação', 'E-mail/Telefone', 'CPF'],
      participantRows.map((entry) => [
        text(entry.participantName) || 'Nome não informado',
        text(entry.participantInstitution) || 'Lotação não informada',
        [entry.participantContact, entry.participantEmail ?? entry.email, entry.participantPhone ?? entry.phone]
          .map((value) => text(value))
          .filter(Boolean)
          .join(' / '),
        text(entry.participantCpf ?? entry.cpf),
      ]),
      {
        minimumHeight: 25,
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
        },
      },
    )
  } else {
    writer.paragraph('Não houve registro confirmado pelo QR Code de presença.')
  }

  writer.paragraph(
    `Lista gerada pelo Fala SEC${text(authorName) ? ` para ${text(authorName)}` : ''}. A conferência e a assinatura do documento permanecem sob responsabilidade da organização do evento.`,
    { size: 8 },
  )

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page)
    drawFooter(pdf, page)
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
        value: limitPdfResponse(entry.value),
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
  writer.paragraph(
    `Aos ${openingDate}, no ${event.location}, realizou-se o evento “${event.title}”, promovido pela ${event.organizer}. Este documento registra, em forma de carta e sem substituição das manifestações por sínteses automáticas, o desenvolvimento do encontro e as contribuições enviadas pela plataforma interativa.`,
  )
  if (event.objective) writer.paragraph(`O objetivo do encontro foi ${event.objective.toLocaleLowerCase('pt-BR')}`)
  writer.paragraph(`A metodologia adotada consistiu em ${event.methodology.toLocaleLowerCase('pt-BR')}`)
  if (event.expectedAudience || event.publicProfile.length) {
    writer.paragraph(
      `O público previsto era de ${event.expectedAudience || 'representantes do ecossistema educacional baiano'}. A apresentação ocorreu com a participação de representantes das instituições: ${joinNatural(event.institutions ?? event.publicProfile)}.`,
    )
  }
  if (event.program.length) {
    writer.paragraph(
      `A programação ocorreu da seguinte forma: ${event.program
        .map((item) => `às ${item.time}, ${item.theme}, com participação de representantes de ${item.institutions}`)
        .join('; ')}.`,
    )
  }
  writer.paragraph(
    `Ao longo da sessão, foram recebidas ${responses.length} ${contributionLabel(responses.length)} distribuída${responses.length === 1 ? '' : 's'} entre ${slides.length} pergunta${slides.length === 1 ? '' : 's'}. As manifestações foram preservadas abaixo em sua forma literal para conferência e validação pela Secretaria.`,
  )

  let renderedResponses = 0
  for (const [index, slide] of slides.entries()) {
    const slideResponses = responseEntries(slide, responses, participantMap)
    const questionText = `Na ${index + 1}ª pergunta, “${text(slide.question)}”, foram registradas ${slideResponses.length} ${contributionLabel(slideResponses.length)}.`
    const contributionText = slideResponses.length
      ? slideResponses
          .map((entry) => {
            const institution = entry.participantInstitution ? `, vinculado a ${entry.participantInstitution}` : ''
            return `${entry.participantName}${institution} registrou a seguinte contribuição: “${entry.value}”.`
          })
          .join(' ')
      : 'Não houve resposta registrada para esta etapa.'
    writer.paragraph(
      `${questionText} ${contributionText}`,
      {
        bold: false,
        justify: true,
        size: BODY_FONT_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
        indent: FIRST_LINE_INDENT,
      },
    )
    renderedResponses += slideResponses.length
    if (renderedResponses && renderedResponses % PDF_RENDER_YIELD_EVERY === 0) await yieldToBrowser()
    /*
     * As perguntas e respostas permanecem no mesmo parágrafo para que a
     * carta seja lida como narrativa contínua, sem herança de estilo entre
     * blocos independentes.
     */
  }
  writer.paragraph(
    'As contribuições apresentadas foram organizadas nas dimensões de desafios identificados, prioridades estratégicas e proposições para o futuro, conforme o documento-base do seminário. O conteúdo registrado neste documento constitui a fonte literal para a leitura, sistematização e validação pela Secretaria.',
  )
  if (event.schools.length) {
    writer.paragraph(
      `A documentação de referência do evento também relaciona ${event.schools.length} unidades escolares e registra a participação de representantes das instituições envolvidas. Essas referências integram o documento-base e não substituem a frequência registrada pelo QR Code específico de presença.`,
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
    drawFooter(pdf, page)
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
