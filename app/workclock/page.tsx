'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getWorkers } from '@/lib/workclock/api-storage'

export default function HomePage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const loadWorkers = async () => {
      try {
        if (!currentUser?.id) {
          console.error('WorkClock: currentUser.idが取得できません')
          setIsLoading(false)
          return
        }
        
        const workers = await getWorkers(currentUser.id)
        
        // Redirect to first worker's page
        if (workers.length > 0) {
          router.push(`/workclock/worker/${workers[0].id}`)
        } else {
          // 許可ロールのユーザーは設定画面へ誘導（登録・編集が可能）
          const role = currentUser?.role
          const allowed = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
          if (role && allowed.includes(role)) {
            router.replace('/workclock/settings?empty=1')
          } else {
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error('Workers取得エラー:', error)
        setIsLoading(false)
      }
    }
    
    loadWorkers()
  }, [router, currentUser])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#bddcd9' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold">読み込み中...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#bddcd9' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold">ワーカーが見つかりません</h1>
        <p className="text-muted-foreground mt-2">ワーカーを登録してください</p>
      </div>
    </div>
  )
}
