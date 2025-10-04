"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Upload, FileSpreadsheet, Download, Trash2, Eye, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Employee {
  id: string
  name: string
  department: string
  position: string
  employeeId: string
}

interface EvaluationFile {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
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
  const [folders, setFolders] = useState<string[]>(["基本情報", "契約書類", "評価資料"])
  const [currentFolder, setCurrentFolder] = useState("基本情報")
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [viewingFile, setViewingFile] = useState<EvaluationFile | null>(null)

  // ファイルデータを取得
  useEffect(() => {
    if (open && employee.id) {
      fetchEvaluationFiles()
    }
  }, [open, employee.id])

  const [files, setFiles] = useState<EvaluationFile[]>([])

  const fetchEvaluationFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/files/employee/${employee.id}`)
      if (response.ok) {
        const data = await response.json()
        const fileList: EvaluationFile[] = data.map((file: any) => ({
          id: file.id,
          name: file.originalName,
          type: file.type || 'excel',
          uploadDate: new Date(file.createdAt).toISOString().split('T')[0],
          size: formatFileSize(file.size)
        }))
        setFiles(fileList)
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

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      setFolders([...folders, newFolderName])
      setCurrentFolder(newFolderName)
      setNewFolderName("")
      setIsAddingFolder(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Simulate file upload
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileUpload = async (files: File[]) => {
    setLoading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('employeeId', employee.id)
        formData.append('folder', 'evaluation') // 考課表用のフォルダ

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
        } else {
          console.error('ファイルアップロードエラー:', await response.text())
        }
      }
      
      // アップロード後にファイル一覧を再取得
      await fetchEvaluationFiles()
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
        <DialogContent className="max-w-[98vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {employee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-bold">{employee.name} - 人事考課表</div>
                <div className="text-sm font-normal text-slate-600">
                  {employee.department} / {employee.position}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6">
            <Tabs value={currentFolder} onValueChange={setCurrentFolder}>
              <div className="flex items-center gap-2 mb-4">
                <TabsList className="flex-1 justify-start overflow-x-auto">
                  {folders.map((folder) => (
                    <TabsTrigger key={folder} value={folder}>
                      {folder}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {!isAddingFolder ? (
                  <Button variant="outline" size="sm" onClick={() => setIsAddingFolder(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    フォルダ追加
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="フォルダ名"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                      className="w-40"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddFolder}>
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingFolder(false)
                        setNewFolderName("")
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {folders.map((folder) => (
                <TabsContent key={folder} value={folder} className="space-y-4">
                  {/* Drag & Drop Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 mb-2">ファイルをドラッグ&ドロップ</p>
                    <p className="text-sm text-slate-500 mb-4">または</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.accept = ".xlsx,.xls,.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.csv"
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || [])
                          handleFileUpload(files)
                        }
                        input.click()
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      ファイルを選択
                    </Button>
                    <p className="text-xs text-slate-500 mt-4">対応形式: Excel, PDF, 画像, テキスト, Word, CSV</p>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                      {files.map((file) => (
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
                </TabsContent>
              ))}
            </Tabs>
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
