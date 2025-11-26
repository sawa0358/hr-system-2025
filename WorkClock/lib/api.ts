/**
 * WorkClock API通信ユーティリティ
 * PostgreSQLへの永続保存を実現
 */

// APIベースURL
const API_BASE = '/api/workclock'

/**
 * 認証ヘッダーを取得
 * セッションストレージからemployeeIdを取得
 */
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  
  const employeeId = sessionStorage.getItem('employeeId')
  if (!employeeId) {
    console.warn('[WorkClock API] employeeId not found in session')
    return {}
  }
  
  return {
    'Content-Type': 'application/json',
    'x-employee-id': employeeId,
  }
}

/**
 * API呼び出しのエラーハンドリング
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `API Error: ${response.status}`)
  }
  return response.json()
}

/**
 * APIクライアント
 */
export const api = {
  // Workers
  workers: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/workers`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (data: any) => {
      const response = await fetch(`${API_BASE}/workers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },

  // Time Entries
  timeEntries: {
    getAll: async (params?: { workerId?: string; year?: number; month?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.workerId) searchParams.append('workerId', params.workerId)
      if (params?.year) searchParams.append('year', params.year.toString())
      if (params?.month) searchParams.append('month', params.month.toString())
      
      const url = `${API_BASE}/time-entries${searchParams.toString() ? `?${searchParams}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE}/time-entries/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (data: any) => {
      const response = await fetch(`${API_BASE}/time-entries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_BASE}/time-entries/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/time-entries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },

  // Teams
  teams: {
    getAll: async () => {
      const response = await fetch(`${API_BASE}/teams`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (name: string) => {
      const response = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      })
      return handleResponse(response)
    },

    delete: async (name: string) => {
      const response = await fetch(`${API_BASE}/teams?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },

  // Rewards
  rewards: {
    getAll: async (workerId?: string) => {
      const url = workerId
        ? `${API_BASE}/rewards?workerId=${workerId}`
        : `${API_BASE}/rewards`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (data: any) => {
      const response = await fetch(`${API_BASE}/rewards`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_BASE}/rewards/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/rewards/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },

  // Reward Presets
  rewardPresets: {
    getAll: async (workerId?: string) => {
      const url = workerId
        ? `${API_BASE}/reward-presets?workerId=${workerId}`
        : `${API_BASE}/reward-presets`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    create: async (data: any) => {
      const response = await fetch(`${API_BASE}/reward-presets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_BASE}/reward-presets`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...data }),
      })
      return handleResponse(response)
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/reward-presets?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },
  },
}

