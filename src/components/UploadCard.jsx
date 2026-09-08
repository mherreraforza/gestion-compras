import { useRef, useState } from 'react'

export default function UploadCard({ tipo, loading, error, onUpload }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(file.name)
    onUpload(file, tipo)
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl2 shadow-md p-8 text-center">
      <h2 className="font-semibold text-lg mb-2">
        {tipo === 'oc' ? 'Sube el PDF de la Orden de Compra' : 'Sube la foto de la SOLPED'}
      </h2>
      <p className="text-sm text-ink/60 mb-6">
        {tipo === 'oc' ? 'Acepta PDF o Word.' : 'Acepta foto o captura de pantalla.'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={tipo === 'oc' ? '.pdf,.doc,.docx' : 'image/*'}
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="bg-coral text-white px-6 py-3 rounded-full font-medium disabled:opacity-50"
      >
        {loading ? 'Leyendo documento…' : 'Elegir archivo'}
      </button>
      {preview && <p className="text-xs text-ink/50 mt-3">{preview}</p>}
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
    </div>
  )
}
