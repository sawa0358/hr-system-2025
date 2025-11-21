'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getWorkers } from '@/lib/workclock/api-storage'

export default function HomePage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    // リダイレクト中の場合は何もしない
    if (isRedirecting) {
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
        
        // WorkClock上でリーダー（role === 'admin'）かどうかをチェック
        const ownWorker = workers.find(w => w.employeeId === currentUser.id)
        const isWorkClockLeader = ownWorker?.role === 'admin'
        
        if (isWorker && !isAdmin) {
          // ワーカー権限のユーザーは自分のWorkClockWorkerレコードを探す
          if (ownWorker) {
            if (isWorkClockLeader) {
              // リーダーの場合は管理者ダッシュボードにリダイレクト
              setIsRedirecting(true)
              router.push('/workclock/admin')
              return
            } else {
              // 通常のワーカーの場合は自分のページにリダイレクト
              setIsRedirecting(true)
              router.push(`/workclock/worker/${ownWorker.id}`)
              return
            }
          } else {
            // 自分のWorkClockWorkerレコードが見つからない場合、設定画面にリダイレクトして登録を促す
            setIsRedirecting(true)
            router.replace('/workclock/settings?employeeId=' + currentUser.id)
            return
          }
        } else if (isWorkClockLeader) {
          // WorkClock上のリーダーは管理者ダッシュボードにリダイレクト
          setIsRedirecting(true)
          router.push('/workclock/admin')
          return
        } else if (workers.length > 0) {
          // 管理者権限のユーザーは最初のワーカーのページにリダイレクト
          setIsRedirecting(true)
          router.push(`/workclock/worker/${workers[0].id}`)
          return
        } else {
          // 許可ロールのユーザーは設定画面へ誘導（登録・編集が可能）
          if (isAdmin) {
            setIsRedirecting(true)
            router.replace('/workclock/settings?empty=1')
            return
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
  }, [router, currentUser, isRedirecting])

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
