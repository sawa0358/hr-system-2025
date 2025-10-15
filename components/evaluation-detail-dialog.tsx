"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileSpreadsheet, Download, Trash2, Eye } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermissions } from "@/hooks/use-permissions"

interface Employee {
  id: string
  name: string
  department?: string | string[]
  departments?: string[]
  position?: string | string[]
  positions?: string[]
  employeeId: string
}

interface EvaluationFile {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
  folderName?: string
}

interface FolderTab {
  id: string
  name: string
  files: EvaluationFile[]
}

interface EvaluationDetailDialogProps {
  employee: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvaluationDetailDialog({ employee, open, onOpenChange }: EvaluationDetailDialogProps) {
  const permissions = usePermissions()
  
  // 2020年度から2070年度までの年度を生成
  const generateAcademicYears = () => {
    const academicYears: string[] = []
    for (let year = 2020; year <= 2070; year++) {
      academicYears.push(`${year}年度`)
    }
    return academicYears
  }
  
  const defaultFolders = generateAcademicYears()
  
  // localStorageからフォルダ情報を読み込む
  const getStoredFolders = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`evaluation-folders-${employee.id}`)
      if (stored) {
        const parsedFolders = JSON.parse(stored)
        console.log('localStorageから読み込んだフォルダ:', parsedFolders)
        
        // フォルダ形式を統一（「年」を「年度」に変換）
        const normalizedFolders = parsedFolders.map((folder: string) => {
          if (folder.endsWith('年') && !folder.endsWith('年度')) {
            return folder.replace('年', '年度')
          }
          return folder
        })
        
        // 形式が変更された場合はlocalStorageを更新
        if (JSON.stringify(normalizedFolders) !== JSON.stringify(parsedFolders)) {
          console.log('フォルダ形式を正規化:', normalizedFolders)
          localStorage.setItem(`evaluation-folders-${employee.id}`, JSON.stringify(normalizedFolders))
        }
        
        return normalizedFolders
      } else {
        // 新規社員の場合、デフォルトフォルダをlocalStorageに保存
        console.log('新規社員のデフォルトフォルダを保存:', defaultFolders)
        localStorage.setItem(`evaluation-folders-${employee.id}`, JSON.stringify(defaultFolders))
        return defaultFolders
      }
    }
    return defaultFolders
  }
  
  // 本年度（4月〜3月）を取得
  const getCurrentAcademicYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 0-11から1-12に変換
    
    // 4月以降はその年、3月以前は前年
    if (currentMonth >= 4) {
      return `${currentYear}年度`
    } else {
      return `${currentYear - 1}年度`
    }
  }
  
  const [folders, setFolders] = useState<string[]>(() => {
    const storedFolders = getStoredFolders()
    console.log('初期フォルダ設定:', storedFolders)
    // フォルダが空または不正な形式の場合はデフォルトフォルダを使用
    if (!storedFolders || storedFolders.length === 0 || storedFolders.some(folder => !folder.includes('年度'))) {
      console.log('デフォルトフォルダを設定')
      return defaultFolders
    }
    return storedFolders
  })
  
  const [currentFolder, setCurrentFolder] = useState(() => {
    const currentAcademicYear = getCurrentAcademicYear()
    const initialFolders = folders.length > 0 ? folders : defaultFolders
    console.log('初期年度設定:', currentAcademicYear, 'フォルダ:', initialFolders)
    // フォルダリストに現在の年度が存在するかチェック
    return initialFolders.includes(currentAcademicYear) ? currentAcademicYear : (initialFolders[0] || currentAcademicYear)
  })
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [viewingFile, setViewingFile] = useState<EvaluationFile | null>(null)
  
  // フォルダ管理権限チェック（一般社員もフォルダ追加可能）
  const canManageFolders = true
  
  // フォルダが変更されたらlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`evaluation-folders-${employee.id}`, JSON.stringify(folders))
    }
  }, [folders, employee.id])

  // ダイアログが開かれるたびに最新の年度を設定
  useEffect(() => {
    if (open) {
      const currentAcademicYear = getCurrentAcademicYear()
      console.log('年度計算結果:', currentAcademicYear)
      console.log('利用可能なフォルダ:', folders)
      console.log('フォルダの長さ:', folders.length)
      console.log('フォルダの最初の3つ:', folders.slice(0, 3))
      
      // フォルダリストに現在の年度が存在することを確認
      if (folders.includes(currentAcademicYear)) {
        console.log('現在の年度を設定:', currentAcademicYear)
        setCurrentFolder(currentAcademicYear)
      } else {
        // フォルダリストに現在の年度がない場合は、最初のフォルダを設定
        const fallbackFolder = folders[0] || currentAcademicYear
        console.log('フォールバック年度を設定:', fallbackFolder)
        setCurrentFolder(fallbackFolder)
      }
    }
  }, [open, folders])

  // ファイルデータを取得
  useEffect(() => {
    if (open && employee.id) {
      fetchEvaluationFiles()
    }
  }, [open, employee.id])

  const [files, setFiles] = useState<EvaluationFile[]>([])
  const [filesByFolder, setFilesByFolder] = useState<Record<string, EvaluationFile[]>>({})

  const fetchEvaluationFiles = async () => {
    setLoading(true)
    try {
      console.log('ファイル取得開始:', { employeeId: employee.id })
      const response = await fetch(`/api/files/employee/${employee.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('取得したファイルデータ:', data)
        
        const fileList: EvaluationFile[] = data.map((file: any) => ({
          id: file.id,
          name: file.originalName,
          type: file.type || 'excel',
          uploadDate: new Date(file.createdAt).toISOString().split('T')[0],
          size: formatFileSize(file.size),
          folderName: file.folderName || '2025'
        }))
        
        console.log('処理後のファイルリスト:', fileList)
        setFiles(fileList)
        
        // フォルダ別にファイルを分類
        const filesByFolderMap: Record<string, EvaluationFile[]> = {}
        folders.forEach(folder => {
          filesByFolderMap[folder] = fileList.filter(file => file.folderName === folder)
        })
        
        console.log('フォルダ別ファイル分類:', filesByFolderMap)
        setFilesByFolder(filesByFolderMap)
      } else {
        console.error('ファイル取得エラー:', response.status, await response.text())
      }
    } catch (error) {
      console.error('ファイル取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }



  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent, folderName: string) => {
    e.preventDefault()
    setIsDragging(false)
    // Simulate file upload
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files, folderName)
  }

  const handleFileUpload = async (files: File[], folderName?: string) => {
    setLoading(true)
    let uploadSuccess = false
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('employeeId', employee.id)
        formData.append('folder', 'evaluation') // 考課表用のフォルダ
        formData.append('folderName', folderName || currentFolder) // 現在のフォルダ名を指定

        console.log('ファイルアップロード開始:', {
          fileName: file.name,
          employeeId: employee.id,
          folderName: folderName || currentFolder
        })

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-employee-id': employee.id,
          },
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          console.log('ファイルアップロード成功:', result)
          uploadSuccess = true
        } else {
          const errorText = await response.text()
          console.error('ファイルアップロードエラー:', response.status, errorText)
        }
      }
      
      // アップロードが成功した場合のみファイル一覧を再取得
      if (uploadSuccess) {
        console.log('ファイル一覧を再取得中...')
        await fetchEvaluationFiles()
      }
    } catch (error) {
      console.error('ファイルアップロードエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      console.log('削除開始:', { fileId, employeeId: employee.id })
      const response = await fetch(`/api/files/${fileId}/delete`, {
        method: 'DELETE',
        headers: {
          'x-employee-id': employee.id,
        },
      })

      if (response.ok) {
        console.log('ファイル削除成功')
        // 削除後にファイル一覧を再取得
        await fetchEvaluationFiles()
      } else {
        const errorText = await response.text()
        console.error('ファイル削除エラー:', response.status, errorText)
      }
    } catch (error) {
      console.error('ファイル削除エラー:', error)
    }
  }

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      console.log('ダウンロード開始:', { fileId, fileName, employeeId: employee.id })
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'x-employee-id': employee.id,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('ダウンロード成功')
      } else {
        const errorText = await response.text()
        console.error('ファイルダウンロードエラー:', response.status, errorText)
      }
    } catch (error) {
      console.error('ファイルダウンロードエラー:', error)
    }
  }

  const handlePreviewFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'x-employee-id': employee.id,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        // プレビュー後はURLを解放しない（新しいタブで開くため）
      } else {
        console.error('ファイルプレビューエラー:', await response.text())
      }
    } catch (error) {
      console.error('ファイルプレビューエラー:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[98vw] h-[95vh] max-w-none max-h-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {employee.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-bold">{employee.name} - 人事考課表</div>
                <div className="text-sm font-normal text-slate-600">
                  {(() => {
                    // 部署情報の処理
                    let deptStr = ""
                    if (Array.isArray(employee.departments)) {
                      deptStr = employee.departments.filter(Boolean).slice(0, 2).join(", ")
                    } else if (employee.department) {
                      deptStr = Array.isArray(employee.department) 
                        ? employee.department.filter(Boolean).slice(0, 2).join(", ")
                        : employee.department
                    }
                    
                    // 役職情報の処理
                    let posStr = ""
                    if (Array.isArray(employee.positions)) {
                      posStr = employee.positions.filter(Boolean).slice(0, 2).join(", ")
                    } else if (employee.position) {
                      posStr = Array.isArray(employee.position)
                        ? employee.position.filter(Boolean).slice(0, 2).join(", ")
                        : employee.position
                    }
                    
                    return `${deptStr} / ${posStr}`
                  })()}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">年度を選択:</span>
                <Select value={currentFolder} onValueChange={setCurrentFolder}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {/* 説明テキスト */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-sm font-medium">
                  📋 自分の書いた目標（考課表）はPDFでアップロードしてください
                </p>
              </div>

              {/* Drag & Drop Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors h-32 flex flex-col justify-center ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, currentFolder)}
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
                    input.accept = ".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.csv"
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || [])
                      handleFileUpload(files, currentFolder)
                    }
                    input.click()
                  }}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  ファイルを選択
                </Button>
                <p className="text-xs text-slate-500 mt-1">対応形式: Excel, PDF, 画像, テキスト, Word, CSV</p>
              </div>

              {/* File List */}
              {filesByFolder[currentFolder] && filesByFolder[currentFolder].length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                  {filesByFolder[currentFolder].map((file) => (
                    <Card key={file.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                            <div>
                              <p className="font-medium text-slate-900">{file.name}</p>
                              <p className="text-sm text-slate-500">
                                {file.uploadDate} • {file.size}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePreviewFile(file.id)}
                              title="プレビュー"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadFile(file.id, file.name)}
                              title="ダウンロード"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteFile(file.id)}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spreadsheet Viewer Dialog */}
      {viewingFile && (
        <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
          <DialogContent className="max-w-[98vw] max-h-[95vh]">
            <DialogHeader>
              <DialogTitle>{viewingFile.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {/* Simulated spreadsheet view */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    保存
                  </Button>
                  <Button variant="ghost" size="sm">
                    編集
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    ダウンロード
                  </Button>
                </div>
                <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-300 p-2 text-sm font-semibold w-12 bg-slate-100"></th>
                        <th className="border border-slate-300 p-2 text-sm font-semibold bg-slate-100">A</th>
                        <th className="border border-slate-300 p-2 text-sm font-semibold bg-slate-100">B</th>
                        <th className="border border-slate-300 p-2 text-sm font-semibold bg-slate-100">C</th>
                        <th className="border border-slate-300 p-2 text-sm font-semibold bg-slate-100">D</th>
                        <th className="border border-slate-300 p-2 text-sm font-semibold bg-slate-100">E</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                          1
                        </td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold" colSpan={5}>
                          {employee.name} - 目標設定シート
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                          2
                        </td>
                        <td className="border border-slate-300 p-2 text-sm"></td>
                        <td className="border border-slate-300 p-2 text-sm"></td>
                        <td className="border border-slate-300 p-2 text-sm"></td>
                        <td className="border border-slate-300 p-2 text-sm"></td>
                        <td className="border border-slate-300 p-2 text-sm"></td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                          3
                        </td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold bg-blue-50">目標項目</td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold bg-blue-50">具体的内容</td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold bg-blue-50">達成基準</td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold bg-blue-50">期限</td>
                        <td className="border border-slate-300 p-2 text-sm font-semibold bg-blue-50">進捗</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                          4
                        </td>
                        <td className="border border-slate-300 p-2 text-sm">技術力向上</td>
                        <td className="border border-slate-300 p-2 text-sm">新技術の習得と実践</td>
                        <td className="border border-slate-300 p-2 text-sm">プロジェクトへの適用</td>
                        <td className="border border-slate-300 p-2 text-sm">2025-06-30</td>
                        <td className="border border-slate-300 p-2 text-sm">30%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                          5
                        </td>
                        <td className="border border-slate-300 p-2 text-sm">チーム貢献</td>
                        <td className="border border-slate-300 p-2 text-sm">メンバーサポート</td>
                        <td className="border border-slate-300 p-2 text-sm">月2回以上の勉強会開催</td>
                        <td className="border border-slate-300 p-2 text-sm">2025-12-31</td>
                        <td className="border border-slate-300 p-2 text-sm">50%</td>
                      </tr>
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((row) => (
                        <tr key={row}>
                          <td className="border border-slate-300 p-2 text-sm text-center bg-slate-100 font-semibold">
                            {row}
                          </td>
                          <td className="border border-slate-300 p-2 text-sm"></td>
                          <td className="border border-slate-300 p-2 text-sm"></td>
                          <td className="border border-slate-300 p-2 text-sm"></td>
                          <td className="border border-slate-300 p-2 text-sm"></td>
                          <td className="border border-slate-300 p-2 text-sm"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
