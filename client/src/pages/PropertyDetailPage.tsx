import { useParams } from 'react-router-dom'

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Property Detail</h1>
      <p className="mt-1 text-text-secondary">Viewing property #{id}</p>
    </div>
  )
}
