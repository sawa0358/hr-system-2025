'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkers, initializeSampleData } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeSampleData()
        const workers = await getWorkers()
        
        // Redirect to first worker's page
        if (workers.length > 0) {
          router.push(`/worker/${workers[0].id}`)
        }
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error)
      }
    }
    
    loadData()
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">読み込み中...</h1>
      </div>
    </div>
  )
}
