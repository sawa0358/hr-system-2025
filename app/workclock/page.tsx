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
        
        // ワーカー権限のユーザー（業務委託・外注先）の場合
        const employeeType = currentUser?.employeeType || ''
        const isWorker = employeeType.includes('業務委託') || employeeType.includes('外注先')
        const role = currentUser?.role
        const allowed = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
        const isAdmin = role && allowed.includes(role)
        
        if (isWorker && !isAdmin) {
          // ワーカー権限のユーザーは自分のWorkClockWorkerレコードを探す
          const ownWorker = workers.find(w => w.employeeId === currentUser.id)
          if (ownWorker) {
            // 自分のWorkClockWorkerレコードが見つかった場合、そのページにリダイレクト
            router.push(`/workclock/worker/${ownWorker.id}`)
          } else {
            // 自分のWorkClockWorkerレコードが見つからない場合、employeeIdで直接アクセスを試みる
            // または、設定画面にリダイレクトして登録を促す
            router.replace('/workclock/settings?employeeId=' + currentUser.id)
          }
        } else if (workers.length > 0) {
          // 管理者権限のユーザーは最初のワーカーのページにリダイレクト
          router.push(`/workclock/worker/${workers[0].id}`)
        } else {
          // 許可ロールのユーザーは設定画面へ誘導（登録・編集が可能）
          if (isAdmin) {
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
