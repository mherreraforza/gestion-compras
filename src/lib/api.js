export async function extractDocument(file, tipo) {
  const base64 = await fileToBase64(file)
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, filename: file.name, mediaType: file.type, base64 }),
  })
  if (!res.ok) throw new Error('extract failed')
  const json = await res.json()
  return json.data
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
