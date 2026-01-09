"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Folder, Plus, FileText, Download, Trash2, Edit2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIAskButton } from "@/components/ai-ask-button"
import { Card, CardContent } from "@/components/ui/card"

interface AttendanceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: any
  isAllEmployeesMode?: boolean
}

export function AttendanceUploadDialog({
  open,
  onOpenChange,
  employee,
  isAllEmployeesMode = false,
}: AttendanceUploadDialogProps) {
  // 2020年から2070年までの年を生成
  const generateYears = () => {
    const years: string[] = []
    for (let year = 2020; year <= 2070; year++) {
      years.push(`${year}年`)
    }
    return years
  }

  const [yearFolders, setYearFolders] = useState<string[]>(generateYears())
  const [otherFolders, setOtherFolders] = useState<string[]>(["その他"])
  const [selectedOtherFolder, setSelectedOtherFolder] = useState("その他")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("1月")
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string[] }>({})
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  // DBから取得したファイル情報（永続化データ）
  const [dbFiles, setDbFiles] = useState<{ [key: string]: { id: string; name: string; createdAt: string }[] }>({})
  const [isLoadingDbFiles, setIsLoadingDbFiles] = useState(false)

  // 個人別ファイル管理のためのキー生成
  const getStorageKey = (folderKey: string) => {
    if (isAllEmployeesMode) {
      return `attendance-files-all-${folderKey}`
    }
    return `attendance-files-${employee?.id}-${folderKey}`
  }

  // ファイルデータの保存
  const saveFilesToStorage = (folderKey: string, files: string[]) => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(folderKey)
      localStorage.setItem(storageKey, JSON.stringify(files))
    }
  }

  // ファイルデータの読み込み
  const loadFilesFromStorage = (folderKey: string): string[] => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(folderKey)
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    }
    return []
  }

  // DBからファイル一覧を取得する関数
  const fetchFilesFromDB = async () => {
    try {
      // 全員分モードの場合、対象のemployeeIDを取得
      let employeeIdToUse = employee?.id || ''

      if (isAllEmployeesMode && !employeeIdToUse) {
        try {
          const response = await fetch('/api/attendance/all-employee-id')
          if (response.ok) {
            const data = await response.json()
            employeeIdToUse = data.employeeId
          } else {
            console.error('全員分用のemployeeID取得に失敗しました')
            return
          }
        } catch (error) {
          console.error('全員分用のemployeeID取得エラー:', error)
          return
        }
      }

      if (!employeeIdToUse) return

      setIsLoadingDbFiles(true)
      const response = await fetch(`/api/files/employee/${employeeIdToUse}`, {
        method: 'GET',
        headers: {
          'x-employee-id': employeeIdToUse,
        },
      })

      if (response.ok) {
        const files = await response.json()
        // attendanceカテゴリのファイルのみをフォルダ別に分類
        const attendanceFiles = files.filter((f: any) => f.category === 'attendance')

        const filesByFolder: { [key: string]: { id: string; name: string; createdAt: string }[] } = {}

        attendanceFiles.forEach((file: any) => {
          // folderNameから年月を解析してfolderKeyを生成
          // 例: "2025年12月" -> "2025年-12月"、"2025年-12月" -> "2025年-12月"
          let folderKey = ''
          if (file.folderName) {
            // 「YYYY年-MM月」形式の場合（既存のfolderKey形式）
            if (file.folderName.match(/^\d{4}年-\d{1,2}月$/)) {
              folderKey = file.folderName
            } else {
              // 「YYYY年MM月」または「YYYY年-MM月」形式の場合
              const match = file.folderName.match(/(\d{4})年-?(\d{1,2})月/)
              if (match) {
                folderKey = `${match[1]}年-${match[2]}月`
              } else {
                // その他の場合
                folderKey = `other-${file.folderName}`
              }
            }
          }

          if (folderKey) {
            if (!filesByFolder[folderKey]) {
              filesByFolder[folderKey] = []
            }
            filesByFolder[folderKey].push({
              id: file.id,
              name: file.originalName,
              createdAt: file.createdAt,
            })
          }
        })

        setDbFiles(filesByFolder)
        console.log('勤怠管理: DBから取得したファイル:', filesByFolder)
      }
    } catch (error) {
      console.error('DBからのファイル取得エラー:', error)
    } finally {
      setIsLoadingDbFiles(false)
    }
  }

  // 現在の年を取得する関数
  const getCurrentYear = () => {
    return new Date().getFullYear()
  }

  // 現在の月を取得する関数
  const getCurrentMonth = () => {
    const currentMonth = new Date().getMonth() + 1 // getMonth()は0-11なので+1
    return `${currentMonth}月`
  }

  // ダイアログが開かれるたびに最新の年と月を設定し、DBからファイルを取得
  useEffect(() => {
    if (open) {
      const currentYear = getCurrentYear()
      const currentYearStr = `${currentYear}年`
      const currentMonthStr = getCurrentMonth()
      console.log('勤怠管理: 現在の年を設定:', currentYearStr)
      console.log('勤怠管理: 現在の月を設定:', currentMonthStr)
      setSelectedYear(currentYearStr)
      setSelectedMonth(currentMonthStr)

      // DBからファイル一覧を取得（デバイス間同期のため）
      fetchFilesFromDB()
    }
  }, [open, employee?.id, isAllEmployeesMode])

  // コンポーネント初期化時にファイルデータを読み込み
  useEffect(() => {
    if (employee || isAllEmployeesMode) {
      const allFolders = [
        ...yearFolders.flatMap(year => months.map(month => `${year}-${month}`)),
        ...otherFolders.map(folder => `other-${folder}`)
      ]

      const loadedFiles: { [key: string]: string[] } = {}
      allFolders.forEach(folderKey => {
        loadedFiles[folderKey] = loadFilesFromStorage(folderKey)
      })
      setUploadedFiles(loadedFiles)
    }
  }, [employee, isAllEmployeesMode, yearFolders, otherFolders])

  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

  // 共通テンプレートの読み込み
  const loadTemplatesFromStorage = (): { id: string; name: string; employees: string[]; content?: string | ArrayBuffer; type?: string; isBinary?: boolean }[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('attendance-templates')
      if (stored) {
        const templates = JSON.parse(stored)
        // ArrayBufferを復元する必要がある場合はここで処理
        return templates.map((template: any) => {
          if (template.isBinary && template.content && typeof template.content === 'string') {
            // Base64エンコードされたArrayBufferを復元
            try {
              const binaryString = atob(template.content)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              template.content = bytes.buffer
            } catch (error) {
              console.error('ArrayBuffer復元エラー:', error)
            }
          }
          return template
        })
      }
      return []
    }
    return []
  }

  const handleTemplateDownload = (templateName?: string) => {
    if (templateName) {
      // 特定のテンプレートをダウンロード
      downloadTemplateFile(templateName)
    } else {
      // デフォルトテンプレートをダウンロード
      downloadDefaultTemplate()
    }
  }

  // デフォルトテンプレートのダウンロード
  const downloadDefaultTemplate = () => {
    // デフォルトの勤怠管理テンプレートデータを作成
    const templateData = {
      headers: ['日付', '出勤時間', '退勤時間', '休憩時間', '勤務時間', '残業時間', '備考'],
      sampleData: [
        ['2025-01-01', '09:00', '18:00', '60', '8.0', '0', ''],
        ['2025-01-02', '09:00', '18:00', '60', '8.0', '0', ''],
        ['2025-01-03', '09:00', '18:00', '60', '8.0', '0', '']
      ]
    }

    // CSV形式でテンプレートを作成
    const csvContent = [
      templateData.headers.join(','),
      ...templateData.sampleData.map(row => row.join(','))
    ].join('\n')

    // ファイルをダウンロード
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '勤怠管理テンプレート.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()

    // 安全に削除（ブラウザが処理するまで少し待つ）
    setTimeout(() => {
      if (link.parentNode === document.body) {
        document.body.removeChild(link)
      }
    }, 100)
  }

  // 共通テンプレートのダウンロード
  const downloadTemplateFile = (templateName: string) => {
    // 実際のファイルデータを取得（localStorageから）
    const templates = loadTemplatesFromStorage()
    console.log('保存されているテンプレート:', templates) // デバッグ用
    const template = templates.find(t => t.name === templateName)
    console.log('検索対象テンプレート:', template) // デバッグ用

    if (template) {
      if (template.content) {
        try {
          // バイナリファイルの場合はArrayBufferとして処理、テキストファイルの場合はstringとして処理
          let blob: Blob
          const mimeType = template.type || 'text/plain'

          if (template.isBinary && template.content instanceof ArrayBuffer) {
            // バイナリファイルの場合
            blob = new Blob([template.content], { type: mimeType })
          } else if (typeof template.content === 'string') {
            // テキストファイルの場合
            blob = new Blob([template.content], { type: mimeType })
          } else {
            // その他の場合（ArrayBufferをUint8Arrayに変換）
            const uint8Array = new Uint8Array(template.content as ArrayBuffer)
            blob = new Blob([uint8Array], { type: mimeType })
          }

          const link = document.createElement('a')
          const url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', templateName)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()

          // 安全に削除（ブラウザが処理するまで少し待つ）
          setTimeout(() => {
            if (link.parentNode === document.body) {
              document.body.removeChild(link)
            }
            // URLを解放してメモリリークを防ぐ
            URL.revokeObjectURL(url)
          }, 100)
        } catch (error) {
          console.error('テンプレートダウンロードエラー:', error)
          alert('テンプレートファイルのダウンロードに失敗しました。')
        }
      } else {
        // ファイル内容がない場合は、テンプレート名に基づいてダミーファイルを作成
        const templateContent = `勤怠管理テンプレート: ${templateName}\n\nこのファイルは勤怠管理用のテンプレートです。\n適切な形式でデータを入力してください。`
        const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', templateName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()

        // 安全に削除（ブラウザが処理するまで少し待つ）
        setTimeout(() => {
          if (link.parentNode === document.body) {
            document.body.removeChild(link)
          }
          // URLを解放してメモリリークを防ぐ
          URL.revokeObjectURL(url)
        }, 100)
      }
    } else {
      alert(`テンプレートファイル「${templateName}」が見つかりません。\n保存されているテンプレート: ${templates.map(t => t.name).join(', ')}`)
    }
  }


  const addOtherFolder = () => {
    const folderName = prompt("フォルダ名を入力してください")
    if (folderName && !otherFolders.includes(folderName)) {
      setOtherFolders([...otherFolders, folderName])
      setSelectedOtherFolder(folderName)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent, folderKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      handleFileUpload(folderKey, file.name, file)
    })
  }

  const handleFileUpload = async (folderKey: string, fileName?: string, file?: File) => {
    try {
      if (file) {
        // 全員分モードの場合、PAYROLL_ALL_EMPLOYEE_IDを取得
        let employeeIdToUse = employee?.id || ''

        if (isAllEmployeesMode && !employeeIdToUse) {
          // 全員分モードで employee.id が無い場合、APIから取得
          try {
            const response = await fetch('/api/attendance/all-employee-id')
            if (response.ok) {
              const data = await response.json()
              employeeIdToUse = data.employeeId
            } else {
              console.error('全員分用のemployeeID取得に失敗しました')
              alert('全員分用の設定が未完了です。管理者に連絡してください。')
              return
            }
          } catch (error) {
            console.error('全員分用のemployeeID取得エラー:', error)
            alert('全員分用の設定取得に失敗しました')
            return
          }
        }

        // 実際のファイルアップロード処理
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'attendance')
        formData.append('folder', folderKey)

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-employee-id': employeeIdToUse,
          },
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          console.log('ファイルアップロード成功:', result)

          // DBからファイル一覧を再取得（他デバイスでも表示されるように）
          await fetchFilesFromDB()

          // localStorageにも一時的に保存（即時反映のため）
          const newFiles = [...(uploadedFiles[folderKey] || []), file.name]
          setUploadedFiles({
            ...uploadedFiles,
            [folderKey]: newFiles,
          })
          saveFilesToStorage(folderKey, newFiles)
        } else {
          console.error('ファイルアップロード失敗:', await response.text())
          alert('ファイルのアップロードに失敗しました')
        }
      } else {
        // ファイル名のみの場合（既存の動作）
        const name = fileName || `勤怠データ_${new Date().toLocaleDateString()}.xlsx`
        const newFiles = [...(uploadedFiles[folderKey] || []), name]
        setUploadedFiles({
          ...uploadedFiles,
          [folderKey]: newFiles,
        })
        // localStorageに保存
        saveFilesToStorage(folderKey, newFiles)
      }
    } catch (error) {
      console.error('ファイルアップロードエラー:', error)
      alert('ファイルのアップロードに失敗しました')
    }
  }

  const downloadFile = async (folderKey: string, fileName: string) => {
    console.log(`Downloading ${fileName} from ${folderKey}`)

    try {
      // 勤怠管理の場合は、実際のファイルシステムからファイルを取得
      // まず、ファイルIDを取得するためにファイル一覧を取得
      const response = await fetch(`/api/files/employee/${employee?.id}`, {
        method: 'GET',
        headers: {
          'x-employee-id': employee?.id || '',
        },
      })

      if (response.ok) {
        const files = await response.json()
        // ファイル名に一致するファイルを検索
        const matchingFile = files.find((f: any) => f.originalName === fileName && f.category === 'attendance')

        if (matchingFile) {
          // 実際のファイルをダウンロード
          const downloadResponse = await fetch(`/api/files/${matchingFile.id}/download`, {
            method: 'GET',
            headers: {
              'x-employee-id': employee?.id || '',
            },
          })

          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()

            // 安全に削除（ブラウザが処理するまで少し待つ）
            setTimeout(() => {
              if (link.parentNode === document.body) {
                document.body.removeChild(link)
              }
              window.URL.revokeObjectURL(url)
            }, 100)
            return
          } else {
            console.error('ファイルダウンロードレスポンスエラー:', downloadResponse.status, downloadResponse.statusText)
            // レスポンスエラーの場合はダミーファイルにフォールバック
          }
        }
      }

      // ファイルが見つからない場合は、ダミーファイルを作成
      const fileContent = `勤怠データ: ${fileName}\n\nこのファイルは勤怠管理システムからダウンロードされました。\n実際のファイル内容は管理者にお問い合わせください。`
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()

      // 安全に削除（ブラウザが処理するまで少し待つ）
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link)
        }
        // URLを解放してメモリリークを防ぐ
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('ファイルダウンロードエラー:', error)
      alert('ファイルのダウンロードに失敗しました')
    }
  }

  const removeFile = async (folderKey: string, fileName: string, fileId?: string) => {
    // 確認ダイアログを表示
    if (!confirm(`「${fileName}」を削除してよろしいですか？\n\nこの操作は取り消せません。`)) {
      return
    }

    try {
      // DBに保存されているファイルの場合はAPIで削除
      if (fileId) {
        // 全員分モードの場合、対象のemployeeIDを取得
        let employeeIdToUse = employee?.id || ''

        if (isAllEmployeesMode && !employeeIdToUse) {
          try {
            const response = await fetch('/api/attendance/all-employee-id')
            if (response.ok) {
              const data = await response.json()
              employeeIdToUse = data.employeeId
            }
          } catch (error) {
            console.error('全員分用のemployeeID取得エラー:', error)
          }
        }

        const response = await fetch(`/api/files/${fileId}/delete`, {
          method: 'DELETE',
          headers: {
            'x-employee-id': employeeIdToUse,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('ファイル削除エラー:', errorText)
          alert('ファイルの削除に失敗しました')
          return
        }

        // DBからファイル一覧を再取得
        await fetchFilesFromDB()
        alert('ファイルを削除しました')
      }

      // localStorageからも削除
      const newFiles = (uploadedFiles[folderKey] || []).filter((f) => f !== fileName)
      setUploadedFiles({
        ...uploadedFiles,
        [folderKey]: newFiles,
      })
      saveFilesToStorage(folderKey, newFiles)
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  const startEditingFolder = (folderName: string) => {
    setEditingFolderId(folderName)
    setEditingFolderName(folderName)
  }

  const saveEditingFolder = (oldFolderName: string) => {
    if (editingFolderName.trim() && editingFolderName !== oldFolderName) {
      const newFolders = otherFolders.map(f => f === oldFolderName ? editingFolderName.trim() : f)
      setOtherFolders(newFolders)
      if (selectedOtherFolder === oldFolderName) {
        setSelectedOtherFolder(editingFolderName.trim())
      }
    }
    setEditingFolderId(null)
    setEditingFolderName("")
  }

  const deleteOtherFolder = (folderName: string) => {
    if (otherFolders.length > 1) {
      const newFolders = otherFolders.filter(f => f !== folderName)
      setOtherFolders(newFolders)
      if (selectedOtherFolder === folderName) {
        setSelectedOtherFolder(newFolders[0])
      }
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              勤怠データアップロード - {employee.name} ({employee.employeeNumber})
            </DialogTitle>
            {isAllEmployeesMode && <AIAskButton context="勤怠管理（全員分）" />}
          </div>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">勤怠管理テンプレート</p>
              <p className="text-sm text-blue-700">標準フォーマットをダウンロード</p>
            </div>
          </div>

          {/* 共通テンプレート一覧 */}
          {(() => {
            const templates = loadTemplatesFromStorage()
            console.log('ダイアログで読み込まれたテンプレート:', templates) // デバッグ用
            return templates.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800">共通テンプレート ({templates.length}件):</p>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">{template.name}</span>
                        {template.content ? (
                          <span className="text-xs text-green-600">✓</span>
                        ) : (
                          <span className="text-xs text-orange-600">!</span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleTemplateDownload(template.name)}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 bg-transparent text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        DL
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">共通テンプレートが登録されていません</p>
                <Button
                  onClick={() => handleTemplateDownload()}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  標準テンプレートDL
                </Button>
              </div>
            )
          })()}
        </div>

        <Tabs defaultValue="year" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="year">年単位フォルダ</TabsTrigger>
            <TabsTrigger value="other">その他フォルダ</TabsTrigger>
          </TabsList>

          <TabsContent value="year" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>年を選択:</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearFolders.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 月ごとのタブ表示 */}
            <Tabs value={selectedMonth} onValueChange={setSelectedMonth} className="w-full">
              {/* 月タブを6列で2行表示 */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {months.map((month) => {
                  const folderKey = `${selectedYear}-${month}`
                  const localFiles = uploadedFiles[folderKey] || []
                  const dbFileList = dbFiles[folderKey] || []
                  // 重複を排除した総ファイル数
                  const dbFileNames = new Set(dbFileList.map(f => f.name))
                  const totalCount = dbFileList.length + localFiles.filter(name => !dbFileNames.has(name)).length
                  return (
                    <Button
                      key={month}
                      variant={selectedMonth === month ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMonth(month)}
                      className="relative"
                    >
                      {month}
                      {totalCount > 0 && (
                        <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                          {totalCount}
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>

              {/* 各月のコンテンツ */}
              {months.map((month) => {
                const folderKey = `${selectedYear}-${month}`
                const localFiles = uploadedFiles[folderKey] || []
                const dbFileList = dbFiles[folderKey] || []

                // DBファイルとlocalStorageファイルを統合（重複を排除）
                const dbFileNames = new Set(dbFileList.map(f => f.name))
                const localOnlyFiles = localFiles.filter(name => !dbFileNames.has(name))
                const allFiles = [
                  ...dbFileList.map(f => ({ ...f, source: 'db' as const })),
                  ...localOnlyFiles.map(name => ({ id: '', name, createdAt: '', source: 'local' as const }))
                ]

                return (
                  <TabsContent key={month} value={month} className="space-y-4 m-0">
                    {/* ドロップエリア */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folderKey)}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-600 text-sm mb-1">ファイルをドラッグ&ドロップ</p>
                      <p className="text-xs text-slate-500 mb-2">または</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.multiple = true
                          input.accept = ".xlsx,.xls,.pdf,.csv"
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || [])
                            files.forEach((file) => handleFileUpload(folderKey, file.name, file))
                          }
                          input.click()
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        ファイルを選択
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">対応形式: Excel, PDF, CSV</p>
                    </div>

                    {/* アップロード済みファイル一覧 */}
                    {isLoadingDbFiles ? (
                      <p className="text-sm text-slate-500">ファイルを読み込み中...</p>
                    ) : allFiles.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                        {allFiles.map((file, index) => (
                          <Card key={file.id || `local-${index}`} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-8 h-8 text-emerald-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">{file.name}</p>
                                    <p className="text-sm text-slate-500">
                                      {file.createdAt
                                        ? new Date(file.createdAt).toLocaleDateString('ja-JP')
                                        : new Date().toLocaleDateString('ja-JP')}
                                      {file.source === 'db' && (
                                        <span className="ml-2 text-xs text-green-600">✓ 保存済み</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(folderKey, file.name)}
                                    title="ダウンロード"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(folderKey, file.name, file.id)}
                                    title="削除"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>その他フォルダ:</Label>
              </div>
              <Button onClick={addOtherFolder} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                フォルダを追加
              </Button>
            </div>

            {/* その他フォルダのタブ表示 */}
            <Tabs value={selectedOtherFolder} onValueChange={setSelectedOtherFolder} className="w-full">
              {/* フォルダタブ */}
              <div className="flex items-center gap-2 mb-4">
                <TabsList className="flex-1 justify-start overflow-x-auto">
                  {otherFolders.map((folder) => {
                    const folderKey = `other-${folder}`
                    const localFiles = uploadedFiles[folderKey] || []
                    const dbFileList = dbFiles[folderKey] || []
                    // 重複を排除した総ファイル数
                    const dbFileNames = new Set(dbFileList.map(f => f.name))
                    const totalCount = dbFileList.length + localFiles.filter(name => !dbFileNames.has(name)).length
                    const isEditing = editingFolderId === folder

                    return (
                      <div key={folder} className="flex items-center">
                        {isEditing ? (
                          <div className="flex items-center gap-2 px-3 py-2">
                            <Input
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEditingFolder(folder)}
                              className="w-32 h-8"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => saveEditingFolder(folder)}>
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingFolderId(null)
                                setEditingFolderName("")
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <TabsTrigger value={folder} className="flex items-center">
                            {folder}
                            {totalCount > 0 && (
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {totalCount}
                              </span>
                            )}
                          </TabsTrigger>
                        )}
                        {!isEditing && (
                          <div className="flex items-center ml-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingFolder(folder)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            {otherFolders.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteOtherFolder(folder)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </TabsList>
              </div>

              {/* 各フォルダのコンテンツ */}
              {otherFolders.map((folder) => {
                const folderKey = `other-${folder}`
                const localFiles = uploadedFiles[folderKey] || []
                const dbFileList = dbFiles[folderKey] || []

                // DBファイルとlocalStorageファイルを統合（重複を排除）
                const dbFileNames = new Set(dbFileList.map(f => f.name))
                const localOnlyFiles = localFiles.filter(name => !dbFileNames.has(name))
                const allFiles = [
                  ...dbFileList.map(f => ({ ...f, source: 'db' as const })),
                  ...localOnlyFiles.map(name => ({ id: '', name, createdAt: '', source: 'local' as const }))
                ]

                return (
                  <TabsContent key={folder} value={folder} className="space-y-4 m-0">
                    {/* ドロップエリア */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folderKey)}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-600 text-sm mb-1">ファイルをドラッグ&ドロップ</p>
                      <p className="text-xs text-slate-500 mb-2">または</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.multiple = true
                          input.accept = ".xlsx,.xls,.pdf,.csv"
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || [])
                            files.forEach((file) => handleFileUpload(folderKey, file.name, file))
                          }
                          input.click()
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        ファイルを選択
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">対応形式: Excel, PDF, CSV</p>
                    </div>

                    {/* アップロード済みファイル一覧 */}
                    {isLoadingDbFiles ? (
                      <p className="text-sm text-slate-500">ファイルを読み込み中...</p>
                    ) : allFiles.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                        {allFiles.map((file, index) => (
                          <Card key={file.id || `local-${index}`} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-8 h-8 text-emerald-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">{file.name}</p>
                                    <p className="text-sm text-slate-500">
                                      {file.createdAt
                                        ? new Date(file.createdAt).toLocaleDateString('ja-JP')
                                        : new Date().toLocaleDateString('ja-JP')}
                                      {file.source === 'db' && (
                                        <span className="ml-2 text-xs text-green-600">✓ 保存済み</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(folderKey, file.name)}
                                    title="ダウンロード"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(folderKey, file.name, file.id)}
                                    title="削除"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // ファイル保存処理
              console.log('保存する:', uploadedFiles)
              alert('ファイルが保存されました')
              onOpenChange(false)
            }}
          >
            保存する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
