"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Folder, Plus, FileText, Download, Trash2, Edit2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIAskButton } from "@/components/ai-ask-button"

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
  const [yearFolders, setYearFolders] = useState<string[]>(["2024年", "2025年"])
  const [otherFolders, setOtherFolders] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "賞与" },
    { id: "2", name: "その他" },
  ])
  const [selectedYear, setSelectedYear] = useState("2025年")
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string[] }>({})
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState("")

  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
  const yearEndFolders = ["年末調整", "その他"]

  const addYearFolder = () => {
    const year = prompt("年を入力してください（例: 2026年）")
    if (year && !yearFolders.includes(year)) {
      setYearFolders([...yearFolders, year])
    }
  }

  const addOtherFolder = () => {
    const folderName = prompt("フォルダ名を入力してください")
    if (folderName) {
      const newFolder = { id: Date.now().toString(), name: folderName }
      setOtherFolders([...otherFolders, newFolder])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, folderKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      handleFileUpload(folderKey, file.name)
    })
  }

  const handleFileUpload = (folderKey: string, fileName?: string) => {
    const name = fileName || `給与明細_${new Date().toLocaleDateString()}.pdf`
    setUploadedFiles({
      ...uploadedFiles,
      [folderKey]: [...(uploadedFiles[folderKey] || []), name],
    })
  }

  const downloadFile = (folderKey: string, fileName: string) => {
    console.log(`Downloading ${fileName} from ${folderKey}`)
    alert(`ダウンロード: ${fileName}`)
  }

  const removeFile = (folderKey: string, fileName: string) => {
    setUploadedFiles({
      ...uploadedFiles,
      [folderKey]: uploadedFiles[folderKey].filter((f) => f !== fileName),
    })
  }

  const startEditingFolder = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId)
    setEditingFolderName(currentName)
  }

  const saveEditingFolder = (folderId: string) => {
    setOtherFolders(otherFolders.map((f) => (f.id === folderId ? { ...f, name: editingFolderName } : f)))
    setEditingFolderId(null)
    setEditingFolderName("")
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              給与明細アップロード - {employee.name} ({employee.employeeNumber})
            </DialogTitle>
            {isAllEmployeesMode && <AIAskButton context="給与管理（全員分）" />}
          </div>
        </DialogHeader>

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
              <Button onClick={addYearFolder} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                年を追加
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...months, ...yearEndFolders].map((month) => {
                const folderKey = `${selectedYear}-${month}`
                const files = uploadedFiles[folderKey] || []

                return (
                  <div key={month} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-sm">{month}</h3>
                    </div>

                    <div
                      className="border-2 border-dashed border-slate-300 rounded-lg p-2 text-center cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => handleFileUpload(folderKey)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folderKey)}
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      <p className="text-xs text-slate-600">ドロップ or クリック</p>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-1">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs bg-slate-50 p-1.5 rounded">
                            <FileText className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="flex-1 truncate text-xs">{file}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadFile(folderKey, file)
                              }}
                              title="ダウンロード"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(folderKey, file)
                              }}
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={addOtherFolder} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                フォルダを追加
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherFolders.map((folder) => {
                const folderKey = `other-${folder.id}`
                const files = uploadedFiles[folderKey] || []
                const isEditing = editingFolderId === folder.id

                return (
                  <div key={folder.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-amber-600" />
                      {isEditing ? (
                        <Input
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onBlur={() => saveEditingFolder(folder.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditingFolder(folder.id)
                          }}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="font-semibold flex-1">{folder.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => startEditingFolder(folder.id, folder.name)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div
                      className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => handleFileUpload(folderKey)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, folderKey)}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                      <p className="text-xs text-slate-600">ドラッグ&ドロップ or クリック</p>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700">アップロード済み:</p>
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="flex-1 truncate">{file}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadFile(folderKey, file)
                              }}
                              title="ダウンロード"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(folderKey, file)
                              }}
                              title="削除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">保存する</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
