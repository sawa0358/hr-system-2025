/**
 * WorkClock API通信ユーティリティ
 * PostgreSQLへの永続保存を実現
 */

// APIベースURL
const API_BASE = '/api/workclock'

/**
 * 認証ヘッダーを取得
 * localStorageまたはsessionStorageからcurrentUserを取得
 */
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}

  // まずlocalStorageをチェック、なければsessionStorageをチェック
  let savedUser = localStorage.getItem('currentUser')
  if (!savedUser) {
    savedUser = sessionStorage.getItem('currentUser')
  }

  if (!savedUser) {
    console.warn('[WorkClock API] currentUser not found in storage')
    return { 'Content-Type': 'application/json' }
  }

  try {
    const user = JSON.parse(savedUser)
    if (!user.id) {
      console.warn('[WorkClock API] user.id not found')
      return { 'Content-Type': 'application/json' }
    }

    return {
      'Content-Type': 'application/json',
      'x-employee-id': user.id,
    }
  } catch (e) {
    console.error('[WorkClock API] Failed to parse currentUser:', e)
    return { 'Content-Type': 'application/json' }
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

    // ワーカー登録候補の従業員一覧を取得（既存ワーカーを除外）
    getCandidates: async () => {
      const response = await fetch(`${API_BASE}/workers/candidates`, {
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

  // Tax Settings
  taxSettings: {
    // 標準消費税率
    get: async () => {
      const response = await fetch(`${API_BASE}/tax-settings`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    update: async (rate: number) => {
      const response = await fetch(`${API_BASE}/tax-settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rate }),
      })
      return handleResponse(response)
    },
  },

  // Withholding Tax Settings（源泉徴収率）
  withholdingTaxSettings: {
    get: async () => {
      const response = await fetch(`${API_BASE}/withholding-tax-settings`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      return handleResponse(response)
    },

    update: async (data: { rateUnder1M: number; rateOver1M: number }) => {
      const response = await fetch(`${API_BASE}/withholding-tax-settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      return handleResponse(response)
    },
  },

  // Checklist
  checklist: {
    patterns: {
      getAll: async (includeItems = false) => {
        const response = await fetch(`${API_BASE}/checklist/patterns?items=${includeItems}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        return handleResponse(response)
      },

      getById: async (id: string) => {
        const response = await fetch(`${API_BASE}/checklist/patterns/${id}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        return handleResponse(response)
      },

      create: async (name: string) => {
        const response = await fetch(`${API_BASE}/checklist/patterns`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name }),
        })
        return handleResponse(response)
      },

      update: async (id: string, name: string) => {
        const response = await fetch(`${API_BASE}/checklist/patterns/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name }),
        })
        return handleResponse(response)
      },

      delete: async (id: string) => {
        const response = await fetch(`${API_BASE}/checklist/patterns/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        return handleResponse(response)
      },

      reorder: async (id: string, itemIds: string[]) => {
        const response = await fetch(`${API_BASE}/checklist/patterns/${id}/reorder`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ itemIds }),
        })
        return handleResponse(response)
      },
    },

    items: {
      create: async (patternId: string, data: any) => {
        const response = await fetch(`${API_BASE}/checklist/patterns/${patternId}/items`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        return handleResponse(response)
      },

      update: async (id: string, data: any) => {
        const response = await fetch(`${API_BASE}/checklist/items/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        return handleResponse(response)
      },

      delete: async (id: string) => {
        const response = await fetch(`${API_BASE}/checklist/items/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        return handleResponse(response)
      },
    },

    submissions: {
      getAll: async (params?: { workerId?: string; startDate?: string; endDate?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.workerId) searchParams.append('workerId', params.workerId)
        if (params?.startDate) searchParams.append('startDate', params.startDate)
        if (params?.endDate) searchParams.append('endDate', params.endDate)

        const url = `${API_BASE}/checklist/submissions${searchParams.toString() ? `?${searchParams}` : ''}`
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store', // 常に最新データを取得
        })
        return handleResponse(response)
      },

      create: async (data: any) => {
        const response = await fetch(`${API_BASE}/checklist/submissions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        })
        return handleResponse(response)
      },
    },
  },
}

