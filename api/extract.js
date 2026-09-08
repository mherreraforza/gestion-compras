// Vercel Serverless Function
// Lee el PDF de la Orden de Compra con reglas de texto fijas (sin IA),
// porque siempre usa la misma plantilla de SAP.
// SOLPED no se procesa aqui: es una foto, se captura 100% a mano.

import pdf from 'pdf-parse'

const MESES = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12',
}

function num(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/,/g, '')) || 0
}

function grab(text, regex) {
  const m = text.match(regex)
  return m ? m[1].trim() : ''
}

function ddmmyyyyDotToIso(str) {
  if (!str) return ''
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

function ddMesyyyyToIso(str) {
  if (!str) return ''
  const m = str.match(/(\d{2})\.([A-Z]{3})\.(\d{4})/i)
  if (!m) return ''
  const mes = MESES[m[2].toUpperCase()] || '01'
  return `${m[3]}-${mes}-${m[1]}`
}

function parseOC(rawText) {
  const t = rawText.replace(/\r/g, '')

  const numero_documento =
    grab(t, /N[uú]mero de Documento:?\s*[\s\S]{0,80}?\n\s*(\d{6,12})/i) ||
    grab(t, /ORDEN DE COMPRA\s*\n\s*(\d{6,12})/i)

  const fecha_documento_raw =
    grab(t, /(\d{2}\.[A-Z]{3}\.\d{4})\s+\d\s*\/\s*\d/i) ||
    grab(t, /Fecha de Documento:?\s*[\s\S]{0,60}?(\d{2}\.[A-Z]{3}\.\d{4})/i)

  const numero_proveedor = grab(t, /(\d{7,10})\s+[A-Z]{2,4}\d{6,9}[A-Z0-9]{0,3}\s*\n/)
  const rfc = grab(t, /\d{7,10}\s+([A-Z]{2,4}\d{6,9}[A-Z0-9]{0,3})\s*\n/)

  const proveedorMatch = t.match(/RFC\s*\n\s*\d{7,10}\s+[A-Z0-9]{9,13}\s*\n\s*([A-ZÁÉÍÓÚÑ0-9 .,]+)\n/)
  const proveedor_nombre = proveedorMatch ? proveedorMatch[1].trim() : ''

  const solicitante = grab(t, /Solicitante:\s*([^\n]+)/i)
  const creado_por = grab(t, /Creado por:\s*([^\n]+)/i)
  const estatus = grab(t, /Estatus\s+([A-ZÁÉÍÓÚÑ]+)/i)
  const fecha_entrega_raw = grab(t, /Fecha de entrega:\s*(\d{2}\.[A-Z]{3}\.\d{4})/i)
  const tipo = grab(t, /Tipo:\s*([^\n]*)/i)

  const condicion_pago_codigo = grab(t, /Condici[oó]n de pago:?\s*([A-Z]\d{3})/i)
  const condicion_pago_desc = grab(t, /Condici[oó]n de pago:?\s*[A-Z]\d{3}\s+([^\n]+)/i)

  const moneda = grab(t, /Moneda:?\s*\n?\s*([A-Z]{3})/i) || 'MXN'
  const subtotal = num(grab(t, /Subtotal:?\s*\n?\s*([\d,]+\.\d{2})/i))
  const descuento = num(grab(t, /Descuento:?\s*\n?\s*([\d,]+\.\d{2})/i))
  const gastos_adicionales = num(grab(t, /Gastos Adicionales:?\s*\n?\s*([\d,]+\.\d{2})/i))
  const impuesto_pct = num(grab(t, /Impuesto\s*%[\s\S]{0,10}\n?\s*[A-Z0-9]*\s*(\d{1,2}\.\d{2})/i))
  const impuesto_base = num(grab(t, /Impuesto base[\s\S]{0,80}?([\d,]+\.\d{2})/i))
  const impuesto = num(grab(t, /\bImpuesto:?\s*\n?\s*([\d,]+\.\d{2})/i))
  const total = num(grab(t, /\bTotal:?\s*\n?\s*([\d,]+\.\d{2})/i))

  const partidas = []
  const partidaRegex = /(\d{5})\s+([\s\S]*?)(?=\n\d{5}\s+|\nDetalles de Impuestos|\nSubtotal|$)/g
  let m
  while ((m = partidaRegex.exec(t)) !== null) {
    const numero_partida = m[1]
    const block = m[2]
    const valuesMatch = block.match(/([A-Z0-9]{4,10})\s+([\d.,]+)\s+(SER|PZA|UN|KG|LT|HRA?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/)
    const descripcion = block.split('\n')[0].trim()
    const periodoMatch = block.match(/Per[ií]odo\s+(\d+)\s+En\s+(\d{2}\.\d{2}\.\d{4})\s+Hasta\s+(\d{2}\.\d{2}\.\d{4})/i)
    const cuentaMatch = block.match(/\b(\d{10})\b/)
    const centroMatch = block.match(/\b((?:SPL|PGF)-[A-Z0-9-]+)\b/i)

    partidas.push({
      numero_partida,
      descripcion,
      cuenta_contable: cuentaMatch ? cuentaMatch[1] : '',
      centro_costo: centroMatch ? centroMatch[1].toUpperCase() : '',
      cod_articulo: valuesMatch ? valuesMatch[1] : '',
      cantidad: valuesMatch ? num(valuesMatch[2]) : 1,
      um: valuesMatch ? valuesMatch[3] : '',
      precio: valuesMatch ? num(valuesMatch[4]) : 0,
      total: valuesMatch ? num(valuesMatch[5]) : 0,
      es_periodo: !!periodoMatch,
      periodo_numero: periodoMatch ? parseInt(periodoMatch[1], 10) : null,
      periodo_total: null,
      periodo_inicio: periodoMatch ? ddmmyyyyDotToIso(periodoMatch[2]) : null,
      periodo_fin: periodoMatch ? ddmmyyyyDotToIso(periodoMatch[3]) : null,
    })
  }

  const totalPeriodos = partidas.filter((p) => p.es_periodo).length
  partidas.forEach((p) => { if (p.es_periodo) p.periodo_total = totalPeriodos })

  return {
    numero_documento,
    fecha_documento: ddMesyyyyToIso(fecha_documento_raw),
    proveedor: { numero_proveedor, nombre: proveedor_nombre, rfc },
    solicitante,
    creado_por,
    estatus,
    fecha_entrega: ddMesyyyyToIso(fecha_entrega_raw),
    tipo,
    condicion_pago_codigo,
    condicion_pago_desc,
    moneda,
    subtotal,
    descuento,
    gastos_adicionales,
    impuesto_pct,
    impuesto_base,
    impuesto,
    total,
    partidas,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const { tipo, base64 } = req.body || {}

  if (tipo !== 'oc') {
    // SOLPED es foto: no se procesa aqui, se captura a mano en el formulario.
    res.status(200).json({ data: null })
    return
  }

  if (!base64) {
    res.status(400).json({ error: 'missing_fields' })
    return
  }

  try {
    const buffer = Buffer.from(base64, 'base64')
    const parsed = await pdf(buffer)
    const data = parseOC(parsed.text)
    res.status(200).json({ data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'extraction_failed' })
  }
}
