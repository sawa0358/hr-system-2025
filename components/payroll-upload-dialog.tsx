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

interface PayrollUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: any
  isAllEmployeesMode?: boolean
}

export function PayrollUploadDialog({
  open,
  onOpenChange,
  employee,
  isAllEmployeesMode = false,
}: PayrollUploadDialogProps) {
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
  // 「全員分」自動PDF用
  const [allPayrollFiles, setAllPayrollFiles] = useState<any[]>([])
  const [isAllFilesLoading, setIsAllFilesLoading] = useState(false)
  const [allFilesError, setAllFilesError] = useState<string | null>(null)

  // 個人別ファイル管理のためのキー生成
  const getStorageKey = (folderKey: string) => {
    if (isAllEmployeesMode) {
      return `payroll-files-all-${folderKey}`
    }
    return `payroll-files-${employee?.id}-${folderKey}`
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

  // 現在の年を取得する関数
  const getCurrentYear = () => {
    return new Date().getFullYear()
  }

  // 現在の月を取得する関数
  const getCurrentMonth = () => {
    const currentMonth = new Date().getMonth() + 1 // getMonth()は0-11なので+1
    return `${currentMonth}月`
  }

  // ダイアログが開かれるたびに最新の年と月を設定
  useEffect(() => {
    if (open) {
      const currentYear = getCurrentYear()
      const currentYearStr = `${currentYear}年`
      const currentMonthStr = getCurrentMonth()
      console.log('給与管理: 現在の年を設定:', currentYearStr)
      console.log('給与管理: 現在の月を設定:', currentMonthStr)
      setSelectedYear(currentYearStr)
      setSelectedMonth(currentMonthStr)
    }
  }, [open])

  // コンポーネント初期化時にファイルデータを読み込み
  useEffect(() => {
    if (employee || isAllEmployeesMode) {
      const allFolders = [
        ...yearFolders.flatMap(year => [...months, ...yearEndFolders].map(month => `${year}-${month}`)),
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
  const yearEndFolders = ["年末調整", "その他"]

  // 「全員分」自動PDF一覧の取得
  useEffect(() => {
    // ダイアログが閉じている、または全員分モードでない場合は何もしない
    if (!open || !isAllEmployeesMode) {
      // クリーンアップ: ダイアログを閉じたら状態をリセット
      if (!open) {
        setAllPayrollFiles([])
        setAllFilesError(null)
        setIsAllFilesLoading(false)
      }
      return
    }

    // 数値月でない（年末調整・その他など）の場合は、自動PDFは存在しない前提でリセット
    if (!selectedYear || !selectedMonth.endsWith("月")) {
      setAllPayrollFiles([])
      setAllFilesError(null)
      return
    }

    const yearNumber = parseInt(selectedYear.replace("年", ""), 10)
    const monthNumber = parseInt(selectedMonth.replace("月", ""), 10)

    if (!yearNumber || !monthNumber) {
      setAllPayrollFiles([])
      setAllFilesError("対象月の解析に失敗しました")
      return
    }

    let isCancelled = false

    const fetchFiles = async () => {
      try {
        setIsAllFilesLoading(true)
        setAllFilesError(null)

        const res = await fetch(`/api/payroll/all-pdfs?year=${yearNumber}&month=${monthNumber}`)
        
        // コンポーネントがアンマウントされた場合は処理を中断
        if (isCancelled) return

        if (!res.ok) {
          let errorMessage = "全員分PDF一覧の取得に失敗しました"
          try {
            const data = await res.json()
            if (data?.error) {
              errorMessage = data.error
              // 環境変数未設定エラーの場合は、分かりやすいメッセージに変換
              if (data.error.includes('PAYROLL_ALL_EMPLOYEE_ID')) {
                errorMessage = "全員分PDF機能の設定が未完了です。管理者に環境変数 PAYROLL_ALL_EMPLOYEE_ID の設定を依頼してください。"
              }
            }
          } catch {
            // ignore
          }
          if (!isCancelled) {
            setAllFilesError(errorMessage)
            setAllPayrollFiles([])
          }
          return
        }

        const data = await res.json()
        if (!isCancelled) {
          setAllPayrollFiles(Array.isArray(data.files) ? data.files : [])
        }
      } catch (error) {
        console.error("全員分PDF一覧取得エラー:", error)
        if (!isCancelled) {
          setAllFilesError("全員分PDF一覧の取得に失敗しました")
          setAllPayrollFiles([])
        }
      } finally {
        if (!isCancelled) {
          setIsAllFilesLoading(false)
        }
      }
    }

    fetchFiles()

    // クリーンアップ関数: コンポーネントがアンマウントされたらフラグを立てる
    return () => {
      isCancelled = true
    }
  }, [open, isAllEmployeesMode, selectedYear, selectedMonth])


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
            const response = await fetch('/api/payroll/all-employee-id')
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
        formData.append('category', 'payroll')
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
          
          // アップロード成功したファイルをリストに追加
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
        const name = fileName || `給与明細_${new Date().toLocaleDateString()}.pdf`
        const newFiles = [...(uploadedFiles[folderKey] || []), name]
        setUploadedFiles({
          ...uploadedFiles,
          [folderKey]: newFiles,
        })
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
      // 全員分モードの場合、PAYROLL_ALL_EMPLOYEE_IDを取得
      let employeeIdToUse = employee?.id || ''
      
      if (isAllEmployeesMode && !employeeIdToUse) {
        try {
          const response = await fetch('/api/payroll/all-employee-id')
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
      
      // 給与管理の場合は、実際のファイルシステムからファイルを取得
      // まず、ファイルIDを取得するためにファイル一覧を取得
      const response = await fetch(`/api/files/employee/${employeeIdToUse}`, {
        method: 'GET',
        headers: {
          'x-employee-id': employeeIdToUse,
        },
      })
      
      if (response.ok) {
        const files = await response.json()
        // ファイル名に一致するファイルを検索
        const matchingFile = files.find((f: any) => f.originalName === fileName && f.category === 'payroll')
        
        if (matchingFile) {
          // 実際のファイルをダウンロード
          const downloadResponse = await fetch(`/api/files/${matchingFile.id}/download`, {
            method: 'GET',
            headers: {
              'x-employee-id': employeeIdToUse,
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
      const fileContent = `給与明細: ${fileName}\n\nこのファイルは給与管理システムからダウンロードされました。\n実際のファイル内容は管理者にお問い合わせください。`
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

  const removeFile = (folderKey: string, fileName: string) => {
    const newFiles = uploadedFiles[folderKey].filter((f) => f !== fileName)
    setUploadedFiles({
      ...uploadedFiles,
      [folderKey]: newFiles,
    })
    // localStorageに保存
    saveFilesToStorage(folderKey, newFiles)
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

  const handleDownloadAllPayrollFile = async (fileId: string, originalName: string) => {
    try {
      const response = await fetch(`/api/payroll/all-pdfs/${fileId}/download`)
      if (!response.ok) {
        console.error("全員分PDFダウンロードエラー:", response.status, response.statusText)
        alert("全員分PDFのダウンロードに失敗しました")
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = originalName
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link)
        }
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("全員分PDFダウンロードエラー:", error)
      alert("全員分PDFのダウンロードに失敗しました")
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              給与or請求明細 - {employee.name}
            </DialogTitle>
            {isAllEmployeesMode && <AIAskButton context="給与or請求管理（全員分）" />}
          </div>
        </DialogHeader>

        {/* 上部: 手動アップロード用（個別／全員分共通） */}
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
              {/* 月タブを6列で2行表示 + 年末調整・その他 */}
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-6 gap-2">
                  {months.map((month) => {
                    const folderKey = `${selectedYear}-${month}`
                    const files = uploadedFiles[folderKey] || []
                    return (
                      <Button
                        key={month}
                        variant={selectedMonth === month ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMonth(month)}
                        className="relative"
                      >
                        {month}
                        {files.length > 0 && (
                          <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                            {files.length}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {yearEndFolders.map((folder) => {
                    const folderKey = `${selectedYear}-${folder}`
                    const files = uploadedFiles[folderKey] || []
                    return (
                      <Button
                        key={folder}
                        variant={selectedMonth === folder ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMonth(folder)}
                        className="relative"
                      >
                        {folder}
                        {files.length > 0 && (
                          <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                            {files.length}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* 各月・フォルダのコンテンツ */}
              {[...months, ...yearEndFolders].map((month) => {
                const folderKey = `${selectedYear}-${month}`
                const files = uploadedFiles[folderKey] || []

                return (
                  <TabsContent key={month} value={month} className="space-y-4 m-0">
                    {/* ドロップエリア */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
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
                          input.accept = ".pdf,.xlsx,.xls,.csv"
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
                      <p className="text-xs text-slate-500 mt-2">対応形式: PDF, Excel, CSV</p>
                    </div>

                    {/* アップロード済みファイル一覧 */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                        {files.map((file, index) => (
                          <Card key={index} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-8 h-8 text-emerald-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">{file}</p>
                                    <p className="text-sm text-slate-500">
                                      {new Date().toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(folderKey, file)}
                                    title="ダウンロード"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(folderKey, file)}
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
                    const files = uploadedFiles[folderKey] || []
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
                            {files.length > 0 && (
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {files.length}
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
                const files = uploadedFiles[folderKey] || []

                return (
                  <TabsContent key={folder} value={folder} className="space-y-4 m-0">
                    {/* ドロップエリア */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
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
                          input.accept = ".pdf,.xlsx,.xls,.csv"
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
                      <p className="text-xs text-slate-500 mt-2">対応形式: PDF, Excel, CSV</p>
                    </div>

                    {/* アップロード済みファイル一覧 */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                        {files.map((file, index) => (
                          <Card key={index} className="border-slate-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-8 h-8 text-emerald-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">{file}</p>
                                    <p className="text-sm text-slate-500">
                                      {new Date().toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(folderKey, file)}
                                    title="ダウンロード"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(folderKey, file)}
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

        {/* 下部: 時間管理システム全員分（自動出力PDF） */}
        {isAllEmployeesMode && (
          <div className="mt-8 border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-blue-900">時間管理システム全員分（自動出力PDF）</p>
                <p className="text-xs text-blue-700">
                  毎月3日に前月分として時間管理システムから自動保存された全員分勤務報告書PDFを一覧・ダウンロードできます
                </p>
              </div>
            </div>
            <div className="mb-3 text-sm text-blue-900">
              <span className="font-semibold">対象月:</span>{" "}
              {selectedYear && selectedMonth ? `${selectedYear}${selectedMonth}` : "未選択"}
            </div>
            {isAllFilesLoading ? (
              <p className="text-sm text-blue-700">読み込み中...</p>
            ) : allFilesError ? (
              <p className="text-sm text-red-600">{allFilesError}</p>
            ) : allPayrollFiles.length === 0 ? (
              <p className="text-sm text-blue-700">この月の全員分PDFはまだ生成されていません。</p>
            ) : (
              <div className="space-y-2">
                {allPayrollFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-blue-900 font-medium">
                        {file.originalName || file.filename}
                      </span>
                      {file.folderName && (
                        <span className="text-xs text-blue-700">{file.folderName}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 bg-transparent text-blue-700 hover:bg-blue-100"
                      onClick={() =>
                        handleDownloadAllPayrollFile(file.id, file.originalName || file.filename)
                      }
                    >
                      <Download className="w-3 h-3 mr-1" />
                      DL
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          {!isAllEmployeesMode && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
