/**
 * v2 以降は WorkClockWorker テーブルに
 *  - monthlyFixedAmount
 *  - monthlyFixedEnabled
 * を直接保存しているため、
 * このモジュールは「旧実装との互換レイヤー」としてのみ残し、localStorage は一切使わない。
 *
 * 既存コードからの呼び出しはそのままにしつつ、
 * ここでは値を保持しないよう no-op 実装にしている。
 */

export interface WorkerBillingMeta {
  monthlyFixedAmount?: number
  monthlyFixedOn?: boolean
}

export function getWorkerBillingMeta(_employeeId: string | null | undefined): WorkerBillingMeta {
  // 旧実装では localStorage から補助情報を返していたが、
  // 現在は DB 側に完全移行しているため、空オブジェクトを返す。
  return {}
}

export function saveWorkerBillingMeta(
  _employeeId: string | null | undefined,
  _meta: WorkerBillingMeta
): void {
  // no-op: 月額固定などの情報は WorkClockWorker テーブルに保存される
}

