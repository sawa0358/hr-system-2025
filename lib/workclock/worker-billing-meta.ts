export interface WorkerBillingMeta {
  monthlyFixedAmount?: number
  monthlyFixedOn?: boolean
}

const STORAGE_KEY = 'workclock_worker_billing_meta'

interface MetaMap {
  [employeeId: string]: WorkerBillingMeta
}

function getMetaMap(): MetaMap {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MetaMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.warn('[WorkClock] worker billing meta 読み込みエラー:', error)
    return {}
  }
}

function saveMetaMap(map: MetaMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.warn('[WorkClock] worker billing meta 保存エラー:', error)
  }
}

export function getWorkerBillingMeta(employeeId: string | null | undefined): WorkerBillingMeta {
  if (!employeeId) return {}
  const map = getMetaMap()
  return map[employeeId] || {}
}

export function saveWorkerBillingMeta(employeeId: string | null | undefined, meta: WorkerBillingMeta) {
  if (!employeeId) return
  const map = getMetaMap()
  map[employeeId] = {
    ...map[employeeId],
    ...meta,
  }
  // 月額固定が0以下または未設定なら、トグル状態だけ残し、amountは削除
  if (map[employeeId].monthlyFixedAmount !== undefined && map[employeeId].monthlyFixedAmount! <= 0) {
    delete map[employeeId].monthlyFixedAmount
  }
  saveMetaMap(map)
}


