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
        const ownWorker = workers.find(w => w.employeeId === currentUser.id)

        const employeeType = currentUser?.employeeType || ''
        const isWorkerType = employeeType.includes('業務委託') || employeeType.includes('外注先')
        const role = currentUser?.role
        const allowed = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
        const isHRAdmin = role && allowed.includes(role)

        // 1. すでにWorkClockWorkerとして登録されている場合を最優先
        if (ownWorker) {
          setIsRedirecting(true)
          if (ownWorker.role === 'admin') {
            // リーダーの場合は管理者ダッシュボードへ
            router.push('/workclock/admin')
          } else {
            // 通常のワーカーの場合は自分のページへ
            router.push(`/workclock/worker/${ownWorker.id}`)
          }
          return
        }

        // 2. 登録されていないが、HRロールまたは雇用形態が「業務委託・外注先」の場合
        if (isHRAdmin || isWorkerType) {
          setIsRedirecting(true)
          if (isHRAdmin && workers.length > 0) {
            // 管理者ですでにワーカーがいる場合は最初のワーカーへ（従来仕様）
            router.push(`/workclock/worker/${workers[0].id}`)
          } else {
            // それ以外（初めての登録が必要な管理者、または未登録のワーカー型社員）は設定画面へ
            router.replace('/workclock/settings?employeeId=' + currentUser.id)
          }
          return
        }

        // 3. それ以外（一般社員でワーカー未登録）
        setIsLoading(false)
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
