// Vercel Serverless Function
// Lee el documento (PDF de OC o foto de SOLPED) con Claude y regresa JSON estructurado.
// ANTHROPIC_API_KEY vive solo aqui (server-side), nunca se expone al navegador.

const SCHEMA_OC = `{
  "numero_documento": string, "fecha_documento": "YYYY-MM-DD",
  "proveedor": { "numero_proveedor": string, "nombre": string, "rfc": string },
  "solicitante": string, "creado_por": string, "estatus": string,
  "fecha_entrega": "YYYY-MM-DD", "tipo": string,
  "condicion_pago_codigo": string, "condicion_pago_desc": string,
  "moneda": string, "subtotal": number, "descuento": number,
  "gastos_adicionales": number, "impuesto_pct": number, "impuesto_base": number,
  "impuesto": number, "total": number,
  "partidas": [{ "numero_partida": string, "descripcion": string, "cuenta_contable": string,
    "cod_articulo": string, "cantidad": number, "um": string, "precio": number, "total": number,
    "es_periodo": boolean, "periodo_numero": number, "periodo_total": number,
    "periodo_inicio": "YYYY-MM-DD", "periodo_fin": "YYYY-MM-DD" }]
}`

const SCHEMA_SOLPED = `{
  "numero_solped": string, "tipo": string, "estatus": string,
  "partidas": [{ "numero_partida": string, "material": string, "cantidad": number, "um": string,
    "texto_breve": string, "grupo_articulos": string, "centro": string, "precio_valor": number,
    "gcp": string, "solicitante": string, "prov_deseado": string, "org_compras": string,
    "cta_mayor": string, "sociedad_co": string, "centro_costo": string, "centro_gestor": string,
    "pos_presupuestal": string }]
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const { tipo, mediaType, base64 } = req.body || {}
  if (!tipo || !mediaType || !base64) {
    res.status(400).json({ error: 'missing_fields' })
    return
  }

  const isImage = mediaType.startsWith('image/')
  const docBlock = isImage
    ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }

  const prompt = tipo === 'oc'
    ? `Extrae los datos de esta Orden de Compra de Forza Steel. Detecta si alguna partida tiene un patron de periodos tipo "Periodo N En [fecha] Hasta [fecha]" y marca es_periodo=true con periodo_numero, periodo_total y las fechas. Responde SOLO con JSON valido, sin texto adicional ni backticks, con este formato exacto: ${SCHEMA_OC}`
    : `Extrae los datos de esta Solicitud de Pedido (SOLPED) de SAP. Es una captura de pantalla, puede tener errores de lectura por ser una tabla comprimida - haz tu mejor esfuerzo. Responde SOLO con JSON valido, sin texto adicional ni backticks, con este formato exacto: ${SCHEMA_SOLPED}`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',',
        max_tokens: 4000,
        messages: [{ role: 'user', content: [docBlock, { type: 'text', text: prompt }] }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic error:', errText)
      res.status(502).json({ error: 'anthropic_error' })
      return
    }

    const data = await anthropicRes.json()
    const textBlock = (data.content || []).find((c) => c.type === 'text')
    const clean = (textBlock?.text || '{}').replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json({ data: parsed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'extraction_failed' })
  }
}
