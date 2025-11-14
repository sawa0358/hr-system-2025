'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkers, initializeSampleData } from '@/lib/workclock/storage'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    initializeSampleData()
    const workers = getWorkers()
    
    // Redirect to first worker's page
    if (workers.length > 0) {
      router.push(`/workclock/worker/${workers[0].id}`)
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#bddcd9' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold">読み込み中...</h1>
      </div>
    </div>
  )
}
