export default function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm mb-3">
      <span className="text-ink/60">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
      />
    </label>
  )
}
