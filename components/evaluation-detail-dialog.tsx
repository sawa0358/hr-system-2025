"use client"

import type React from "react"

import { useState } from "react"
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
  const [folders, setFolders] = useState<FolderTab[]>([
    {
      id: "folder-1",
      name: "2024年度",
      files: [
        {
          id: "file-1",
          name: "Q1目標設定.xlsx",
          type: "excel",
          uploadDate: "2024-04-01",
          size: "45KB",
        },
        {
          id: "file-2",
          name: "Q2評価シート.xlsx",
          type: "excel",
          uploadDate: "2024-07-01",
          size: "52KB",
        },
      ],
    },
    {
      id: "folder-2",
      name: "2025年度",
      files: [
        {
          id: "file-3",
          name: "年間目標.xlsx",
          type: "excel",
          uploadDate: "2025-01-05",
          size: "48KB",
        },
      ],
    },
  ])
  const [activeFolder, setActiveFolder] = useState(folders[0].id)
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [viewingFile, setViewingFile] = useState<EvaluationFile | null>(null)

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderTab = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        files: [],
      }
      setFolders([...folders, newFolder])
      setActiveFolder(newFolder.id)
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

  const handleFileUpload = (files: File[]) => {
    const currentFolder = folders.find((f) => f.id === activeFolder)
    if (!currentFolder) return

    const newFiles: EvaluationFile[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ? "excel" : "other",
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${Math.round(file.size / 1024)}KB`,
    }))

    setFolders(
      folders.map((folder) =>
        folder.id === activeFolder ? { ...folder, files: [...folder.files, ...newFiles] } : folder,
      ),
    )
  }

  const handleDeleteFile = (fileId: string) => {
    setFolders(
      folders.map((folder) =>
        folder.id === activeFolder ? { ...folder, files: folder.files.filter((f) => f.id !== fileId) } : folder,
      ),
    )
  }

  const currentFolder = folders.find((f) => f.id === activeFolder)

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
            <Tabs value={activeFolder} onValueChange={setActiveFolder}>
              <div className="flex items-center gap-2 mb-4">
                <TabsList className="flex-1 justify-start overflow-x-auto">
                  {folders.map((folder) => (
                    <TabsTrigger key={folder.id} value={folder.id}>
                      {folder.name}
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
                <TabsContent key={folder.id} value={folder.id} className="space-y-4">
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
                  {folder.files.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-900 mb-3">アップロード済みファイル</h3>
                      {folder.files.map((file) => (
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
                                <Button variant="ghost" size="sm" onClick={() => setViewingFile(file)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.id)}>
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
