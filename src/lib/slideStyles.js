import { MAX_WATERMARK_DATA_URL_LENGTH } from './constants'

export const DEFAULT_SLIDE_STYLE = Object.freeze({
  theme: 'claro',
  layout: 'editorial',
  font: 'dm-sans',
  titleSize: 'large',
  titleWidth: 'wide',
  titleAlign: 'center',
  titleCase: 'uppercase',
})

export const DEFAULT_SLIDE_WATERMARK = Object.freeze({
  image: '',
  position: 'background',
  opacity: 0.14,
  hasBackground: false,
})

export const SLIDE_WATERMARK_POSITION_OPTIONS = [
  { id: 'background', label: 'Fundo', description: 'Marca d’água central' },
  { id: 'top-left', label: 'Superior esquerdo', description: 'Canto superior esquerdo' },
  { id: 'top-right', label: 'Superior direito', description: 'Canto superior direito' },
]

export const SLIDE_STYLE_OPTIONS = [
  {
    id: 'claro',
    label: 'Claro',
    description: 'Leve e institucional',
    background: '#f6f4ef',
    surface: '#ffffff',
    text: '#20211e',
    muted: '#6b6c66',
    accent: '#6843a1',
    accentSoft: '#eee8f6',
    rule: '#d6d5cf',
  },
  {
    id: 'avanca',
    label: 'Avança + Bahia',
    description: 'Marfim, azul e terracota',
    background: '#f5f3ea',
    surface: '#fffdf6',
    text: '#102a4a',
    muted: '#5e6a75',
    accent: '#b16e58',
    accentSoft: '#e8e3d8',
    rule: '#b9a59d',
  },
  {
    id: 'cobalto',
    label: 'Cobalto',
    description: 'Impacto para telão',
    background: '#173b8f',
    surface: '#214ba6',
    text: '#ffffff',
    muted: '#d4e0ff',
    accent: '#f8d66d',
    accentSoft: '#315cba',
    rule: '#4f73c6',
  },
  {
    id: 'noturno',
    label: 'Noturno',
    description: 'Contraste e foco',
    background: '#111827',
    surface: '#1f2937',
    text: '#f8fafc',
    muted: '#cbd5e1',
    accent: '#a78bfa',
    accentSoft: '#352c5d',
    rule: '#475569',
  },
  {
    id: 'menta',
    label: 'Menta',
    description: 'Fresco e acolhedor',
    background: '#dff4eb',
    surface: '#f7fffb',
    text: '#163b35',
    muted: '#52736d',
    accent: '#0f766e',
    accentSoft: '#b9e8d7',
    rule: '#a4d5c5',
  },
  {
    id: 'coral',
    label: 'Coral',
    description: 'Quente e participativo',
    background: '#fff0ea',
    surface: '#fffaf8',
    text: '#47221d',
    muted: '#87645d',
    accent: '#d94f3d',
    accentSoft: '#ffd9ce',
    rule: '#f1b9aa',
  },
  {
    id: 'violeta',
    label: 'Violeta',
    description: 'Criativo e expressivo',
    background: '#f0edff',
    surface: '#fbfaff',
    text: '#2e1b4f',
    muted: '#75698d',
    accent: '#7c3aed',
    accentSoft: '#ded3ff',
    rule: '#c9baf5',
  },
]

export const SLIDE_LAYOUT_OPTIONS = [
  { id: 'editorial', label: 'Editorial', description: 'Pergunta alinhada à esquerda' },
  { id: 'centered', label: 'Central', description: 'Pergunta em destaque no centro' },
]

export const SLIDE_FONT_OPTIONS = [
  {
    id: 'dm-sans',
    label: 'DM Sans',
    description: 'Neutra e versátil',
    family: "'DM Sans', sans-serif",
    weight: 600,
    letterSpacing: '-0.025em',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    description: 'Digital e contemporânea',
    family: "'Space Grotesk', sans-serif",
    weight: 600,
    letterSpacing: '-0.035em',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    description: 'Suave e geométrica',
    family: "'Manrope', sans-serif",
    weight: 700,
    letterSpacing: '-0.04em',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    description: 'Clara e institucional',
    family: "'IBM Plex Sans', sans-serif",
    weight: 600,
    letterSpacing: '-0.02em',
  },
  {
    id: 'barlow-condensed',
    label: 'Barlow Condensed',
    description: 'Expressiva para impacto',
    family: "'Barlow Condensed', sans-serif",
    weight: 600,
    letterSpacing: '-0.01em',
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    description: 'Editorial e sofisticada',
    family: "'Playfair Display', Georgia, serif",
    weight: 600,
    letterSpacing: '-0.035em',
  },
]

export const SLIDE_TITLE_SIZE_OPTIONS = [
  { id: 'compact', label: 'Compacto', scale: 0.86 },
  { id: 'large', label: 'Grande', scale: 1 },
  { id: 'display', label: 'Destaque', scale: 1.18 },
]

export const SLIDE_TITLE_WIDTH_OPTIONS = [
  { id: 'narrow', label: 'Estreita', width: '62%' },
  { id: 'wide', label: 'Ampla', width: '78%' },
  { id: 'wider', label: 'Extra ampla', width: '92%' },
  { id: 'full', label: 'Tela inteira', width: '100%' },
]

export const SLIDE_TITLE_ALIGN_OPTIONS = [
  { id: 'left', label: 'Esquerda' },
  { id: 'center', label: 'Centro' },
  { id: 'right', label: 'Direita' },
]

export const SLIDE_TITLE_CASE_OPTIONS = [
  { id: 'sentence', label: 'Frase' },
  { id: 'uppercase', label: 'Maiúsculas' },
]

const themesById = new Map(SLIDE_STYLE_OPTIONS.map((theme) => [theme.id, theme]))
const layoutsById = new Map(SLIDE_LAYOUT_OPTIONS.map((layout) => [layout.id, layout]))
const fontsById = new Map(SLIDE_FONT_OPTIONS.map((font) => [font.id, font]))
const titleSizesById = new Map(SLIDE_TITLE_SIZE_OPTIONS.map((size) => [size.id, size]))
const titleWidthsById = new Map(SLIDE_TITLE_WIDTH_OPTIONS.map((width) => [width.id, width]))
const titleAlignsById = new Map(SLIDE_TITLE_ALIGN_OPTIONS.map((align) => [align.id, align]))
const titleCasesById = new Map(SLIDE_TITLE_CASE_OPTIONS.map((titleCase) => [titleCase.id, titleCase]))
const watermarkPositionsById = new Map(SLIDE_WATERMARK_POSITION_OPTIONS.map((position) => [position.id, position]))

export const normalizeSlideStyle = (style) => ({
  theme: themesById.has(style?.theme) ? style.theme : DEFAULT_SLIDE_STYLE.theme,
  layout: layoutsById.has(style?.layout) ? style.layout : DEFAULT_SLIDE_STYLE.layout,
  font: fontsById.has(style?.font) ? style.font : DEFAULT_SLIDE_STYLE.font,
  titleSize: titleSizesById.has(style?.titleSize) ? style.titleSize : DEFAULT_SLIDE_STYLE.titleSize,
  titleWidth: titleWidthsById.has(style?.titleWidth) ? style.titleWidth : DEFAULT_SLIDE_STYLE.titleWidth,
  titleAlign: titleAlignsById.has(style?.titleAlign) ? style.titleAlign : DEFAULT_SLIDE_STYLE.titleAlign,
  titleCase: titleCasesById.has(style?.titleCase) ? style.titleCase : DEFAULT_SLIDE_STYLE.titleCase,
})

const WATERMARK_DATA_URL_PATTERN = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export const isValidSlideWatermarkImage = (value) =>
  typeof value === 'string'
  && value.length <= MAX_WATERMARK_DATA_URL_LENGTH
  && WATERMARK_DATA_URL_PATTERN.test(value)

export const normalizeSlideWatermark = (watermark) => {
  const image = isValidSlideWatermarkImage(watermark?.image) ? watermark.image : ''
  const numericOpacity = Number(watermark?.opacity)

  return {
    image,
    position: watermarkPositionsById.has(watermark?.position)
      ? watermark.position
      : DEFAULT_SLIDE_WATERMARK.position,
    opacity: Number.isFinite(numericOpacity)
      ? Math.min(1, Math.max(0, numericOpacity))
      : DEFAULT_SLIDE_WATERMARK.opacity,
    hasBackground: watermark?.hasBackground === true,
  }
}

export const getSlideTheme = (slide) =>
  themesById.get(normalizeSlideStyle(slide?.style).theme) ?? themesById.get(DEFAULT_SLIDE_STYLE.theme)

export const getSlideFont = (slide) =>
  fontsById.get(normalizeSlideStyle(slide?.style).font) ?? fontsById.get(DEFAULT_SLIDE_STYLE.font)

export const getSlideTitleSize = (slide) =>
  titleSizesById.get(normalizeSlideStyle(slide?.style).titleSize) ?? titleSizesById.get(DEFAULT_SLIDE_STYLE.titleSize)

export const getSlideTitleWidth = (slide) =>
  titleWidthsById.get(normalizeSlideStyle(slide?.style).titleWidth) ?? titleWidthsById.get(DEFAULT_SLIDE_STYLE.titleWidth)

export const getSlideStyleClass = (slide) => {
  const style = normalizeSlideStyle(slide?.style)
  return `slide-theme--${style.theme} slide-layout--${style.layout}`
}

export const getSlideThemeVars = (slide) => {
  const theme = getSlideTheme(slide)
  return {
    '--slide-bg': theme.background,
    '--slide-surface': theme.surface,
    '--slide-text': theme.text,
    '--slide-muted': theme.muted,
    '--slide-accent': theme.accent,
    '--slide-accent-soft': theme.accentSoft,
    '--slide-rule': theme.rule,
    '--slide-font-family': getSlideFont(slide).family,
    '--slide-title-weight': getSlideFont(slide).weight,
    '--slide-title-letter-spacing': getSlideFont(slide).letterSpacing,
    '--slide-title-scale': getSlideTitleSize(slide).scale,
    '--slide-title-width': getSlideTitleWidth(slide).width,
    '--slide-title-align': normalizeSlideStyle(slide?.style).titleAlign,
    '--slide-title-transform': normalizeSlideStyle(slide?.style).titleCase === 'uppercase' ? 'uppercase' : 'none',
  }
}
