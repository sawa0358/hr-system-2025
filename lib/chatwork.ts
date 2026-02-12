/**
 * Chatwork API: ルームへファイル＋メッセージを送信
 * @see https://developer.chatwork.com/reference/post-rooms-room_id-files
 * Reno CRM と同じ方式: グローバル FormData + Blob で送信（Content-Type は fetch に任せる）
 */

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2'

export interface SendFileToRoomResult {
  success: boolean
  fileId?: number
  error?: string
}

/**
 * 指定ルームにファイルとメッセージを送信する
 * @param roomId ChatworkルームID
 * @param fileBuffer ファイルのバイナリ
 * @param fileName ファイル名（例: example.pdf）
 * @param message 一緒に投稿するメッセージ（任意・最大1000文字）
 */
export async function sendFileToRoom(
  roomId: string,
  fileBuffer: Buffer,
  fileName: string,
  message?: string
): Promise<SendFileToRoomResult> {
  const token = process.env.CHATWORK_API_TOKEN
  if (!token || !token.trim()) {
    console.error('[Chatwork] CHATWORK_API_TOKEN が未設定です（本番ではHerokuのConfig Varsに追加してください）')
    return { success: false, error: 'CHATWORK_API_TOKEN が設定されていません' }
  }

  const trimmedRoomId = String(roomId).trim()
  if (!trimmedRoomId) {
    return { success: false, error: 'ルームIDを指定してください' }
  }

  try {
    // Reno CRM 契約書送信と同じ方式: Blob + グローバル FormData（Content-Type は付けない）
    const blob = new Blob([fileBuffer])
    const form = new FormData()
    form.append('file', blob, fileName)
    if (message != null && String(message).trim()) {
      form.append('message', String(message).trim().slice(0, 1000))
    }

    const res = await fetch(`${CHATWORK_API_BASE}/rooms/${trimmedRoomId}/files`, {
      method: 'POST',
      headers: {
        'X-ChatWorkToken': token.trim(),
      },
      body: form,
    })

    if (!res.ok) {
      const text = await res.text()
      let errMsg = `Chatwork API エラー: ${res.status}`
      try {
        const json = JSON.parse(text)
        if (json.errors) errMsg = json.errors.join(', ')
        else if (json.message) errMsg = json.message
      } catch {
        if (text) errMsg = text.slice(0, 200)
      }
      return { success: false, error: errMsg }
    }

    const data = await res.json().catch(() => ({}))
    const fileId = data.file_id != null ? Number(data.file_id) : undefined
    return { success: true, fileId }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[Chatwork] sendFileToRoom error:', err)
    return { success: false, error: err }
  }
}
