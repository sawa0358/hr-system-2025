"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Upload, Folder, Eye, EyeOff, Lock, Settings, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { PasswordVerificationDialog } from "@/components/password-verification-dialog"
import { DepartmentManagerDialog } from "@/components/department-manager-dialog"
import { PositionManagerDialog } from "@/components/position-manager-dialog"
import { EmploymentTypeManagerDialog } from "@/components/employment-type-manager-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/lib/auth-context"

interface FamilyMember {
  id: string
  name: string
  relationship: string
  phone: string
  birthday: string
  livingSeparately: boolean
  address?: string
  myNumber?: string
}

interface EmployeeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: any
  onRefresh?: () => void
  onOrgChartUpdate?: () => void
}

export function EmployeeDetailDialog({ open, onOpenChange, employee, onRefresh, onOrgChartUpdate }: EmployeeDetailDialogProps) {
  const { currentUser } = useAuth()
  const permissions = usePermissions()
  const [latestEmployee, setLatestEmployee] = useState(employee)

  const isOwnProfile = currentUser?.id === employee?.id
  const isNewEmployee = !employee

  // 管理者・総務権限の場合は全項目を表示
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  
  // 見えないTOPの社員かどうかの判定
  const isInvisibleTopEmployee = employee?.isInvisibleTop || employee?.employeeNumber === '000'
  
  // 見えないTOPの社員の編集・削除は管理者のみ可能
  const canEditInvisibleTop = isInvisibleTopEmployee ? currentUser?.role === 'admin' : true
  
  // コピー社員かどうかの判定
  const isCopyEmployee = employee?.status === 'copy'
  
  // ダイアログが開かれた時に最新の社員データを取得
  useEffect(() => {
    if (open && employee?.id) {
      const fetchLatestEmployee = async () => {
        try {
          const response = await fetch(`/api/employees/${employee.id}`)
          if (response.ok) {
            const data = await response.json()
            setLatestEmployee(data)
            console.log('最新の社員データを取得:', data)
          }
        } catch (error) {
          console.error('最新の社員データ取得エラー:', error)
        }
      }
      fetchLatestEmployee()
    }
  }, [open, employee?.id])
  
  // デバッグ用：現在のユーザー情報をコンソールに出力
  console.log('Current User:', currentUser)
  console.log('Is Admin or HR:', isAdminOrHR)
  console.log('Is New Employee:', isNewEmployee)
  console.log('Employee Detail Dialog - employee:', employee)
  console.log('Employee Detail Dialog - latestEmployee:', latestEmployee)
  console.log('Employee Detail Dialog - employee.id:', employee?.id)
  console.log('Employee Detail Dialog - employee.name:', employee?.name)
  
  const canViewProfile = isOwnProfile || permissions.permissions.viewSubordinateProfiles || permissions.permissions.viewAllProfiles || isAdminOrHR
  const canEditProfile = isAdminOrHR && !isCopyEmployee
  const canViewMyNumber = isAdminOrHR // 管理者・総務権限のみ閲覧可能
  const canViewUserInfo = permissions.permissions.viewAllProfiles || permissions.permissions.editAllProfiles || isAdminOrHR
  const canEditUserInfo = (permissions.permissions.editAllProfiles || isAdminOrHR) && !isCopyEmployee
  const canViewFamily = isOwnProfile || permissions.permissions.viewAllProfiles || isAdminOrHR
  const canViewFiles = (currentUser?.department?.includes('総務') || currentUser?.role === 'admin')
  
  // デバッグ用：権限チェック結果をコンソールに出力
  console.log('Permission Check Results:', {
    canViewProfile,
    canEditProfile,
    canViewMyNumber,
    canViewUserInfo,
    canEditUserInfo,
    canViewFamily,
    canViewFiles
  })

  // フォーム状態管理
  const [formData, setFormData] = useState(() => {
    const initialData = {
    name: employee?.name || '',
    furigana: employee?.furigana || '',
    email: employee?.email || '',
      phone: employee?.phone || '',
      phoneInternal: employee?.phoneInternal || '',
      phoneMobile: employee?.phoneMobile || '',
      department: employee?.department || '',
      position: employee?.position || '',
      organization: employee?.organization || '株式会社テックイノベーション',
      joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
      status: employee?.status || 'active',
      password: employee?.password || '',
      role: employee?.role || 'general',
      myNumber: employee?.myNumber || '',
      employeeType: employee?.employeeType || 'employee',
      employeeNumber: employee?.employeeNumber || '',
      employeeId: employee?.employeeId || '',
      isSuspended: employee?.isSuspended ?? false,
      retirementDate: employee?.retirementDate ? new Date(employee.retirementDate).toISOString().split('T')[0] : '',
      userId: employee?.userId || '',
      url: employee?.url || '',
      address: employee?.address || '',
      selfIntroduction: employee?.selfIntroduction || '',
      birthDate: employee?.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
      showInOrgChart: employee?.showInOrgChart ?? true,
      description: employee?.description || '',
      parentEmployeeId: employee?.parentEmployeeId || null,
    }
    console.log('formData初期化:', initialData)
    console.log('employee.isSuspended:', employee?.isSuspended)
    console.log('employee.parentEmployeeId:', employee?.parentEmployeeId)
    return initialData
  })

  // latestEmployeeが更新された時にformDataを更新
  useEffect(() => {
    if (latestEmployee && !isNewEmployee) {
      setFormData(prev => ({
        ...prev,
        isSuspended: latestEmployee.isSuspended ?? false
      }))
      console.log('formData更新 - isSuspended:', latestEmployee.isSuspended)
    }
  }, [latestEmployee, isNewEmployee])

  // 社員データが変更された時にフォームデータを更新
  React.useEffect(() => {
    if (employee) { // employeeが変更されたら常に更新
      setFormData({
        name: employee.name || '',
        furigana: employee.furigana || '',
        email: employee.email || '',
        phone: employee.phone || '',
        phoneInternal: employee.phoneInternal || '',
        phoneMobile: employee.phoneMobile || '',
        department: employee.department || '',
        position: employee.position || '',
        organization: employee.organization || '株式会社テックイノベーション',
        team: employee.team || '',
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
        status: employee.status || 'active',
        password: employee.password || '',
        role: employee.role || 'general',
        myNumber: employee.myNumber || '',
        employeeType: employee.employeeType || 'employee',
        employeeNumber: employee.employeeNumber || '',
        employeeId: employee.employeeId || '',
        userId: employee.userId || '',
        url: employee.url || '',
        address: employee.address || '',
        selfIntroduction: employee.selfIntroduction || '',
        birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
        showInOrgChart: employee.showInOrgChart ?? true,
        isSuspended: employee.isSuspended ?? false,
        retirementDate: employee.retirementDate ? new Date(employee.retirementDate).toISOString().split('T')[0] : '',
        description: employee.description || '',
        parentEmployeeId: employee.parentEmployeeId || null,
      })
      
      // 組織、部署、役職の配列を設定（APIから取得した配列を使用）
      setOrganizations(employee.organizations && employee.organizations.length > 0 ? employee.organizations : 
                      employee.organization ? [employee.organization] : [""])
      setDepartments(employee.departments && employee.departments.length > 0 ? employee.departments : 
                    employee.department ? [employee.department] : [""])
      setPositions(employee.positions && employee.positions.length > 0 ? employee.positions : 
                  employee.position ? [employee.position] : [""])
      
      // パスワード表示状態をローカルストレージから復元（管理者・総務のみ）
      if (isAdminOrHR && typeof window !== 'undefined') {
        const savedShowPassword = localStorage.getItem(`employee-password-visible-${employee.id}`)
        if (savedShowPassword === 'true') {
          setShowPassword(true)
        }
      }
      
      // アバター関連の初期化（employeeデータから復元）
      setAvatarText('')
      setSelectedAvatarFile(null)
      
      // 画像データをローカルストレージから復元
      if (typeof window !== 'undefined') {
        const savedAvatarText = localStorage.getItem(`employee-avatar-text-${employee.id}`)
        if (savedAvatarText) {
          setAvatarText(savedAvatarText)
        }
        // ファイルは復元できないので、nullのまま
        setSelectedAvatarFile(null)
      }
      
      // 家族データも更新（初回のみ）
      if (employee.familyMembers && employee.familyMembers.length > 0) {
        setFamilyMembers(employee.familyMembers)
      } else {
        setFamilyMembers([])
      }
      
      // 家族構成データをローカルストレージから復元
      if (typeof window !== 'undefined') {
        const savedFamilyMembers = localStorage.getItem(`employee-family-members-${employee.id}`)
        if (savedFamilyMembers) {
          try {
            const parsedFamilyMembers = JSON.parse(savedFamilyMembers)
            if (Array.isArray(parsedFamilyMembers)) {
              setFamilyMembers(parsedFamilyMembers)
            }
          } catch (error) {
            console.error('家族構成データの復元エラー:', error)
          }
        }
      }
      
      
      // 組織、部署、役職の配列を設定（APIから取得した配列を使用）
      setOrganizations(employee.organizations && employee.organizations.length > 0 ? employee.organizations : 
                      employee.organization ? [employee.organization] : [""])
      setDepartments(employee.departments && employee.departments.length > 0 ? employee.departments : 
                    employee.department ? [employee.department] : [""])
      setPositions(employee.positions && employee.positions.length > 0 ? employee.positions : 
                  employee.position ? [employee.position] : [""])
      
      // フォルダ情報も初期化
      if (typeof window !== 'undefined') {
        // 古いデータをクリア（データベース再作成時のID変更対応）
        const oldKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('employee-folders-') && !key.includes(employee.id)
        )
        oldKeys.forEach(key => {
          console.log('古いローカルストレージキーを削除:', key)
          localStorage.removeItem(key)
        })
        
        const savedFolders = localStorage.getItem(`employee-folders-${employee.id}`)
        if (savedFolders) {
          const parsedFolders = JSON.parse(savedFolders)
          setFolders(parsedFolders)
          setCurrentFolder(parsedFolders[0] || "基本情報")
        } else {
          setFolders(["基本情報", "契約書類", "評価資料"])
          setCurrentFolder("基本情報")
        }
      }
      
      // アップロード済みファイルを取得
      fetchUploadedFiles(employee.id)
    } else if (!employee) {
      // 新規登録の場合はフォームをリセット
      setFormData({
        name: '',
        furigana: '',
        email: '',
        phone: '',
        phoneInternal: '',
        phoneMobile: '',
        department: '',
        position: '',
        organization: '株式会社テックイノベーション',
        team: '',
        joinDate: '',
        status: 'active',
        password: '',
        role: 'general',
        myNumber: '',
        employeeType: 'employee',
        employeeNumber: '',
        employeeId: '',
        userId: '',
        url: '',
        address: '',
        selfIntroduction: '',
        birthDate: '',
        showInOrgChart: true,
        isSuspended: false,
        retirementDate: '',
        description: '',
      })
      setOrganizations([""])
      setDepartments([""])
      setPositions([""])
      if (typeof window !== 'undefined') {
        // 新規登録時は古いフォルダデータをクリア
        const oldKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('employee-folders-')
        )
        oldKeys.forEach(key => {
          console.log('新規登録時：古いローカルストレージキーを削除:', key)
          localStorage.removeItem(key)
        })
      }
      setFolders(["基本情報", "契約書類", "評価資料"])
      setCurrentFolder("基本情報")
    }
  }, [employee])

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [folders, setFolders] = useState<string[]>(() => {
    // ローカルストレージからフォルダ情報を取得
    if (typeof window !== 'undefined') {
      const savedFolders = localStorage.getItem(`employee-folders-${employee?.id || 'new'}`)
      if (savedFolders) {
        return JSON.parse(savedFolders)
      }
    }
    return ["基本情報", "契約書類", "評価資料"]
  })
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showEmployeeMyNumber, setShowEmployeeMyNumber] = useState(false)
  const [showFamilyMyNumber, setShowFamilyMyNumber] = useState<{ [key: string]: boolean }>({})
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [pendingMyNumberAction, setPendingMyNumberAction] = useState<{
    type: "employee" | "family"
    id?: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarText, setAvatarText] = useState('')
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [currentFolder, setCurrentFolder] = useState('')

  // 保存処理
  const handleSave = async () => {
    console.log('保存ボタンがクリックされました')
    console.log('canEditUserInfo:', canEditUserInfo)
    console.log('isNewEmployee:', isNewEmployee)
    console.log('isAdminOrHR:', isAdminOrHR)
    console.log('formData:', formData)
    console.log('employee:', employee)
    
    if (!canEditUserInfo && !isNewEmployee && !isAdminOrHR) {
      console.log('権限が不足しています')
      return
    }

    // 古いIDを検出して警告
    if (employee?.id && employee.id.includes('cmganegqz')) {
      console.error('古いIDが検出されました:', employee.id)
      alert('ページを再読み込みしてください。古いデータが検出されました。')
      window.location.reload()
      return
    }
    
    setSaving(true)
    try {
      const url = isNewEmployee ? '/api/employees' : `/api/employees/${employee.id}`
      const method = isNewEmployee ? 'POST' : 'PUT'
      
      console.log('API呼び出し:', { url, method, formData })
      console.log('送信するbirthDate:', formData.birthDate)
      console.log('送信するisSuspended:', formData.isSuspended)
      console.log('送信するfurigana:', formData.furigana)
      console.log('送信するparentEmployeeId:', formData.parentEmployeeId)
      console.log('employee.parentEmployeeId:', employee?.parentEmployeeId)
      console.log('送信する公開設定:', privacySettings)
      
      const requestBody = {
        ...formData,
        familyMembers: familyMembers,
        // furiganaフィールドを明示的に追加
        furigana: formData.furigana || '',
        // 配列フィールドも送信
        organizations: organizations.filter(org => org.trim() !== ''),
        departments: departments.filter(dept => dept.trim() !== ''),
        positions: positions.filter(pos => pos.trim() !== ''),
        // isInvisibleTopフラグを保持（見えないTOPまたは社員番号000の場合）
        isInvisibleTop: employee?.isInvisibleTop || employee?.employeeNumber === '000' || false,
        // 組織図の親子関係を保持（既存社員の場合のみ）
        parentEmployeeId: !isNewEmployee ? (formData.parentEmployeeId || employee?.parentEmployeeId || null) : null,
        // 公開設定を送信
        privacyDisplayName: privacySettings.displayName,
        privacyOrganization: privacySettings.organization,
        privacyDepartment: privacySettings.department,
        privacyPosition: privacySettings.position,
        privacyUrl: privacySettings.url,
        privacyAddress: privacySettings.address,
        privacyBio: privacySettings.bio,
        privacyEmail: privacySettings.email,
        privacyWorkPhone: privacySettings.workPhone,
        privacyExtension: privacySettings.extension,
        privacyMobilePhone: privacySettings.mobilePhone,
        privacyBirthDate: privacySettings.birthDate,
      }
      
      console.log('送信するJSONデータ:', JSON.stringify(requestBody, null, 2))
      console.log('furiganaフィールドの送信値:', {
        formData: formData.furigana,
        requestBody: requestBody.furigana,
        type: typeof requestBody.furigana
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('APIレスポンス:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('保存成功:', result)
        
        // 家族データを更新
        if (result.employee && result.employee.familyMembers) {
          setFamilyMembers(result.employee.familyMembers)
        }
        
        // formDataを更新（特にisSuspendedの状態を反映）
        if (result.employee) {
          setFormData(prev => ({
            ...prev,
            isSuspended: result.employee.isSuspended || false
          }))
        }
        
        onOpenChange(false)
        // リフレッシュを呼び出してテーブルを更新
        if (onRefresh) {
          onRefresh()
        }
        // 組織図を更新
        if (onOrgChartUpdate) {
          console.log('社員詳細: 組織図更新コールバックを呼び出します')
          onOrgChartUpdate()
        }
        // 新規登録の場合はダイアログを閉じて、テーブルをリフレッシュ
        if (isNewEmployee) {
          onOpenChange(false)
          if (onRefresh) {
            onRefresh()
          }
        }
      } else {
        let errorMessage = '不明なエラーが発生しました'
        try {
          const error = await response.json()
          console.error('保存エラー:', error)
          console.error('レスポンス詳細:', response.status, response.statusText)
          errorMessage = error.error || errorMessage
        } catch (parseError) {
          console.error('エラーレスポンスの解析に失敗:', parseError)
          errorMessage = `サーバーエラー: ${response.status} ${response.statusText}`
        }
        alert(`保存に失敗しました: ${errorMessage}`)
      }
    } catch (error) {
      console.error('保存エラー:', error)
      if (error instanceof Error && error.message) {
        alert(`保存に失敗しました: ${error.message}`)
      } else {
        alert('保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // 削除処理
  const handleDelete = async () => {
    if (!employee || !isAdminOrHR) return
    
    if (!confirm(`「${employee.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('削除成功')
        onOpenChange(false)
        // リフレッシュを呼び出してテーブルを更新
        if (onRefresh) {
          onRefresh()
        }
        // 組織図も更新
        if (onOrgChartUpdate) {
          console.log('社員詳細: 組織図更新コールバックを呼び出します（削除時）')
          onOrgChartUpdate()
        }
      } else {
        const error = await response.json()
        console.error('削除エラー:', error)
        alert(`削除に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  // コピー処理
  const [copying, setCopying] = useState(false)
  const handleCopy = async () => {
    if (!employee || (!isAdminOrHR && currentUser?.role !== 'manager')) return
    
    if (!confirm(`「${employee.name}」の情報をコピーしますか？コピー社員は編集できません。`)) {
      return
    }
    
    setCopying(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}/copy`, {
        method: 'POST',
      })

      if (response.ok) {
        console.log('コピー成功')
        alert('社員情報をコピーしました')
        onOpenChange(false)
        // リフレッシュを呼び出してテーブルを更新
        if (onRefresh) {
          onRefresh()
        }
        // 組織図も更新
        if (onOrgChartUpdate) {
          console.log('社員詳細: 組織図更新コールバックを呼び出します（コピー時）')
          onOrgChartUpdate()
        }
      } else {
        const error = await response.json()
        console.error('コピーエラー:', error)
        alert(`コピーに失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('コピーエラー:', error)
      alert('コピーに失敗しました')
    } finally {
      setCopying(false)
    }
  }


  const handleRemoveFamilyMember = (id: string) => {
    const newFamilyMembers = familyMembers.filter(member => member.id !== id)
    setFamilyMembers(newFamilyMembers)
    
    // ローカルストレージに保存
    if (employee?.id && typeof window !== 'undefined') {
      localStorage.setItem(`employee-family-members-${employee.id}`, JSON.stringify(newFamilyMembers))
    }
  }

  // 家族構成データを更新してローカルストレージに保存する共通関数
  const updateFamilyMembersAndSave = (updatedMembers: FamilyMember[]) => {
    setFamilyMembers(updatedMembers)
    
    // ローカルストレージに保存
    if (employee?.id && typeof window !== 'undefined') {
      localStorage.setItem(`employee-family-members-${employee.id}`, JSON.stringify(updatedMembers))
    }
  }

  // アップロード済みファイルを取得
  const fetchUploadedFiles = async (employeeId: string) => {
    if (!employeeId) return
    
    console.log('アップロード済みファイルを取得中:', employeeId)
    setLoadingFiles(true)
    try {
      const response = await fetch(`/api/files/employee/${employeeId}`)
      console.log('ファイル取得レスポンス:', response.status)
      if (response.ok) {
        const files = await response.json()
        console.log('取得したファイル一覧:', files)
        setUploadedFiles(files)
      } else {
        console.error('ファイル取得失敗:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('ファイル取得エラー:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  // ファイル管理
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      console.log('選択されたファイル:', newFiles.map(f => f.name))
      
      // 一時的にローカルファイルリストに追加（アップロード中表示用）
      setFiles([...files, ...newFiles])
      
      // 各ファイルをアップロード
      for (const file of newFiles) {
        try {
          console.log('ファイルアップロード開始:', file.name)
          
          // 新規登録の場合はアップロードをスキップ
          if (!employee?.id) {
            console.log('新規登録のため、ファイルアップロードをスキップ')
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
            continue
          }
          
          const formData = new FormData()
          formData.append('file', file)
          formData.append('category', 'employee')
          formData.append('folder', currentFolder)
          
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              'x-employee-id': employee.id
            },
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('ファイルアップロード成功:', result)
            
            // アップロード成功したファイルをローカルリストから削除
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
            
            // アップロード済みファイルリストを再取得
            if (employee?.id) {
              console.log('アップロード済みファイルリストを再取得中...')
              // 少し遅延してからファイルリストを再取得（アップロード完了を確実にするため）
              setTimeout(() => {
                fetchUploadedFiles(employee.id)
              }, 500)
            }
          } else {
            const errorText = await response.text()
            console.error('ファイルアップロード失敗:', response.status, errorText)
            // エラーの場合もローカルリストから削除
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
          }
        } catch (error) {
          console.error('ファイルアップロードエラー:', error)
          // エラーの場合もローカルリストから削除
          setFiles(prevFiles => prevFiles.filter(f => f !== file))
        }
      }
    }
    
    // ファイル入力欄をリセット
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles) {
      const newFiles = Array.from(droppedFiles)
      
      // 一時的にローカルファイルリストに追加（アップロード中表示用）
      setFiles([...files, ...newFiles])
      
      // 各ファイルをアップロード
      for (const file of newFiles) {
        try {
          // 新規登録の場合はアップロードをスキップ
          if (!employee?.id) {
            console.log('新規登録のため、ファイルアップロードをスキップ')
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
            continue
          }
          
          const formData = new FormData()
          formData.append('file', file)
          formData.append('category', 'employee')
          formData.append('folder', currentFolder)
          
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
              'x-employee-id': employee.id
            },
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('ファイルアップロード成功:', result)
            
            // アップロード成功したファイルをローカルリストから削除
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
            
            // アップロード済みファイルリストを再取得
            if (employee?.id) {
              // 少し遅延してからファイルリストを再取得（アップロード完了を確実にするため）
              setTimeout(() => {
                fetchUploadedFiles(employee.id)
              }, 500)
            }
          } else {
            console.error('ファイルアップロード失敗:', await response.text())
            // エラーの場合もローカルリストから削除
            setFiles(prevFiles => prevFiles.filter(f => f !== file))
          }
        } catch (error) {
          console.error('ファイルアップロードエラー:', error)
          // エラーの場合もローカルリストから削除
          setFiles(prevFiles => prevFiles.filter(f => f !== file))
        }
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [privacySettings, setPrivacySettings] = useState(() => {
    if (employee) {
      return {
        displayName: employee.privacyDisplayName ?? true,
        organization: employee.privacyOrganization ?? true,
        department: employee.privacyDepartment ?? true,
        position: employee.privacyPosition ?? true,
        url: employee.privacyUrl ?? true,
        address: employee.privacyAddress ?? true,
        bio: employee.privacyBio ?? true,
        email: employee.privacyEmail ?? true,
        workPhone: employee.privacyWorkPhone ?? true,
        extension: employee.privacyExtension ?? true,
        mobilePhone: employee.privacyMobilePhone ?? true,
        birthDate: employee.privacyBirthDate ?? false, // 生年月日はデフォルトで非公開
      }
    }
    return {
      displayName: true,
      organization: true,
      department: true,
      position: true,
      url: true,
      address: true,
      bio: true,
      email: true,
      workPhone: true,
      extension: true,
      mobilePhone: true,
      birthDate: false, // 生年月日はデフォルトで非公開
    }
  })

  // 公開設定に基づいて表示する値を取得する関数
  const getDisplayValue = (value: string, privacyKey: keyof typeof privacySettings, fallback: string = '') => {
    if (privacySettings[privacyKey]) {
      return value || fallback
    }
    return '' // 公開OFFの場合は空文字を返す
  }

  const [organizations, setOrganizations] = useState<string[]>(() => {
    return employee?.organizations && employee.organizations.length > 0 ? employee.organizations :
           employee?.organization ? [employee.organization] : [""]
  })
  const [departments, setDepartments] = useState<string[]>(() => {
    return employee?.departments && employee.departments.length > 0 ? employee.departments :
           employee?.department ? [employee.department] : [""]
  })
  const [positions, setPositions] = useState<string[]>(() => {
    return employee?.positions && employee.positions.length > 0 ? employee.positions :
           employee?.position ? [employee.position] : [""]
  })
  const [employmentTypes, setEmploymentTypes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employment-types')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return [
      { value: "employee", label: "正社員" },
      { value: "contractor", label: "契約社員" }
    ]
  })
  const [userPermission, setUserPermission] = useState<string>("general")

  const [isDepartmentManagerOpen, setIsDepartmentManagerOpen] = useState(false)
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false)
  const [isEmploymentTypeManagerOpen, setIsEmploymentTypeManagerOpen] = useState(false)
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('available-departments')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return [
      "エンジニアリング",
      "営業",
      "マーケティング",
      "人事",
      "経理",
      "総務",
      "CS",
      "品質保証",
    ]
  })
  const [availablePositions, setAvailablePositions] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('available-positions')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return [
      "代表取締役",
      "取締役",
      "部長",
      "次長",
      "課長",
      "係長",
      "主任",
      "一般社員"
    ]
  })

  const addFamilyMember = () => {
    const newMember: FamilyMember = {
      id: `family-${Date.now()}`,
      name: "",
      relationship: "",
      phone: "",
      birthday: "",
      livingSeparately: false,
      address: "",
      myNumber: "",
    }
    const newFamilyMembers = [...familyMembers, newMember]
    setFamilyMembers(newFamilyMembers)
    
    // ローカルストレージに保存
    if (employee?.id && typeof window !== 'undefined') {
      localStorage.setItem(`employee-family-members-${employee.id}`, JSON.stringify(newFamilyMembers))
    }
  }

  const addFolder = () => {
    const folderName = prompt("フォルダ名を入力してください")
    if (folderName) {
      const newFolders = [...folders, folderName]
      setFolders(newFolders)
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(`employee-folders-${employee?.id || 'new'}`, JSON.stringify(newFolders))
      }
    }
  }

  const removeFolder = (folderName: string) => {
    if (folders.length <= 1) {
      alert("最低1つのフォルダが必要です")
      return
    }
    
    if (confirm(`フォルダ「${folderName}」を削除しますか？`)) {
      const newFolders = folders.filter(f => f !== folderName)
      setFolders(newFolders)
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(`employee-folders-${employee?.id || 'new'}`, JSON.stringify(newFolders))
      }
    }
  }

  const handleToggleMyNumber = (type: "employee" | "family", id?: string) => {
    if (type === "employee" && !showEmployeeMyNumber) {
      setPendingMyNumberAction({ type: "employee" })
      setIsVerificationDialogOpen(true)
    } else if (type === "employee") {
      setShowEmployeeMyNumber(false)
    } else if (type === "family" && id && !showFamilyMyNumber[id]) {
      setPendingMyNumberAction({ type: "family", id })
      setIsVerificationDialogOpen(true)
    } else if (type === "family" && id) {
      setShowFamilyMyNumber({ ...showFamilyMyNumber, [id]: false })
    }
  }

  const handleVerificationSuccess = () => {
    if (pendingMyNumberAction?.type === "employee") {
      setShowEmployeeMyNumber(true)
    } else if (pendingMyNumberAction?.type === "family" && pendingMyNumberAction.id) {
      setShowFamilyMyNumber({ ...showFamilyMyNumber, [pendingMyNumberAction.id]: true })
    }
    setPendingMyNumberAction(null)
  }

  // パスワード表示のトグル機能（管理者・総務のみ）
  const handleTogglePassword = () => {
    if (!isAdminOrHR) return
    
    const newShowPassword = !showPassword
    setShowPassword(newShowPassword)
    
    // ローカルストレージに保存
    if (employee?.id && typeof window !== 'undefined') {
      localStorage.setItem(`employee-password-visible-${employee.id}`, newShowPassword.toString())
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-5xl max-h-[90vh] overflow-y-auto ${isCopyEmployee ? 'bg-slate-50' : ''}`}>
          
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              ユーザー詳細
              {isCopyEmployee && (
                <span className="text-sm font-normal bg-slate-200 text-slate-700 px-3 py-1 rounded-full border border-slate-300 flex items-center gap-1">
                  <Copy className="w-4 h-4" />
                  コピー社員（編集不可）
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {canViewUserInfo && (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">ユーザー情報</h3>
                  <p className="text-sm text-slate-600">ユーザー情報はシステムの登録に利用します。</p>
                  <p className="text-sm text-slate-600">登録名は管理者および本人以外には公開されません。</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>名前(登録名) <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!canEditUserInfo && !isNewEmployee}
                      className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>フリガナ</Label>
                    <Input 
                      value={formData.furigana}
                      onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
                      disabled={!canEditUserInfo && !isNewEmployee}
                      placeholder="ヤマダタロウ"
                      className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  {canViewMyNumber && (
                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>マイナンバー（本人）</Label>
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-600">管理者・総務権限のみ閲覧可</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showEmployeeMyNumber ? "text" : "password"}
                          value={formData.myNumber}
                          onChange={(e) => setFormData({...formData, myNumber: e.target.value})}
                          placeholder="マイナンバー（12桁）"
                          className={`font-mono ${(!showEmployeeMyNumber || !canEditUserInfo) ? "text-[#374151] bg-[#edeaed]" : ""}`}
                          disabled={!showEmployeeMyNumber || !canEditUserInfo}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleMyNumber("employee")}
                          className="flex-shrink-0"
                        >
                          {showEmployeeMyNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">※ 表示するにはログインパスワードの入力が必要です</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="space-y-2">
                        <Label>生年月日</Label>
                        <Input 
                          type="date" 
                          value={privacySettings.birthDate ? formData.birthDate : ''}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          disabled={!canEditUserInfo && !isNewEmployee || !privacySettings.birthDate}
                          className={(!canEditUserInfo && !isNewEmployee || !privacySettings.birthDate) ? "text-[#374151] bg-[#edeaed]" : ""}
                        />
                        {!privacySettings.birthDate && (
                          <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                        )}
                      </div>
                      {canEditUserInfo && isAdminOrHR && (
                        <div className="flex items-center gap-2 pt-6">
                          <Switch
                            checked={privacySettings.birthDate}
                            onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, birthDate: checked })}
                          />
                          <span className="text-sm text-slate-600">公開</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(canEditUserInfo || isAdminOrHR) && (
                    <>
                      <div className="col-span-2 space-y-2">
                        <Label>権限設定</Label>
                        <Select 
                          value={formData.role} 
                          onValueChange={(value) => setFormData({...formData, role: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="権限を選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">閲覧のみ</SelectItem>
                            <SelectItem value="general">一般ユーザー</SelectItem>
                            <SelectItem value="sub_manager">サブマネージャー</SelectItem>
                            <SelectItem value="store_manager">店長</SelectItem>
                            <SelectItem value="manager">マネージャー</SelectItem>
                            <SelectItem value="hr">総務権限</SelectItem>
                            <SelectItem value="admin">管理者権限</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          ※ 管理者権限：全機能へのアクセス可能
                          <br />※ 総務権限：給与管理・社員情報の閲覧・編集可能
                          <br />※ 一般ユーザー：自分の情報とタスクのみ閲覧・編集可能
                        </p>
                        
                        {/* 組織図表示設定 */}
                        {isAdminOrHR && (
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base">組織図に表示する</Label>
                              <p className="text-xs text-slate-500">ONにすると組織図に表示されます</p>
                            </div>
                            <Switch
                              checked={formData.showInOrgChart}
                              onCheckedChange={(checked) => setFormData({...formData, showInOrgChart: checked})}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        {!isNewEmployee && (
                          <div className="flex items-center gap-2">
                            <Switch checked={changePassword} onCheckedChange={setChangePassword} />
                            <Label>パスワードを変更する</Label>
                          </div>
                        )}
                        {(changePassword || isNewEmployee) && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>パスワード <span className="text-red-500">*</span></Label>
                              {isAdminOrHR && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTogglePassword}
                                    className="flex items-center gap-1"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {showPassword ? '非表示' : '表示'}
                                  </Button>
                                  <span className="text-xs text-slate-500">管理者・総務のみ</span>
                                </div>
                              )}
                            </div>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              placeholder="半角の英字と数字を含む、4文字以上の文字列" 
                            />
                          </div>
                        )}
                        <p className="text-xs text-slate-500">※ パスワードは4文字以上で設定してください</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>入社日</Label>
                    <Input 
                      type="date" 
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      disabled={!canEditUserInfo && !isNewEmployee}
                      className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>社員番号</Label>
                    <Input 
                      value={formData.employeeNumber || ''}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                      placeholder="社員番号を入力"
                      disabled={!canEditUserInfo && !isNewEmployee}
                      className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>雇用形態</Label>
                      {(canEditUserInfo || isNewEmployee) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEmploymentTypeManagerOpen(true)}
                        >
                          管理
                        </Button>
                      )}
                    </div>
                    <Select 
                      value={formData.employeeType} 
                      onValueChange={(value) => setFormData({...formData, employeeType: value})}
                      disabled={!canEditUserInfo && !isNewEmployee}
                    >
                      <SelectTrigger className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ステータス</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({...formData, status: value})}
                      disabled={!canEditUserInfo && !isNewEmployee}
                    >
                      <SelectTrigger className={(!canEditUserInfo && !isNewEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">在籍中</SelectItem>
                        <SelectItem value="leave">休職中</SelectItem>
                        <SelectItem value="retired">退職</SelectItem>
                        <SelectItem value="suspended">外注停止</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.status === 'retired' && (
                      <div className="mt-2">
                        <Label>退職日</Label>
                        <Input
                          type="date"
                          value={formData.retirementDate || ''}
                          onChange={(e) => setFormData({...formData, retirementDate: e.target.value})}
                          disabled={!canEditUserInfo && !isNewEmployee}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">プロフィール情報</h3>
                <p className="text-sm text-black">
                  プロフィール情報はシステム上で利用され、設定に応じて公開されます。
                </p>
                {!canEditProfile && <p className="text-sm text-amber-600 mt-1">※ 閲覧のみ可能です</p>}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>表示名</Label>
                    <Input 
                      value={privacySettings.displayName ? formData.name : '非公開'} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!canEditProfile || !privacySettings.displayName}
                      className={(!canEditProfile || !privacySettings.displayName) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                    {!privacySettings.displayName && (
                      <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                    )}
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.displayName}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, displayName: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>ユーザーID</Label>
                    <Input 
                      placeholder="半角の英数字とのみ使用できます" 
                      value={formData.userId}
                      onChange={(e) => setFormData({...formData, userId: e.target.value})}
                      disabled={!canEditProfile}
                      className={!canEditProfile ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>画像</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {selectedAvatarFile ? (
                          <img 
                            src={URL.createObjectURL(selectedAvatarFile)} 
                            alt="プロフィール画像" 
                            className="w-full h-full object-cover"
                          />
                        ) : avatarText ? (
                          <span className="text-lg font-medium text-slate-700">{avatarText.slice(0, 2)}</span>
                        ) : employee?.avatar ? (
                          <img 
                            src={employee.avatar} 
                            alt={employee?.name || "プロフィール画像"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{employee?.name?.[0] || "?"}</span>
                        )}
                      </div>
                      {canEditProfile && (
                        <div className="space-y-2">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setSelectedAvatarFile(file)
                                  setAvatarText('') // 画像選択時は文字をクリア
                                  // ローカルストレージからもテキストをクリア
                                  if (employee?.id && typeof window !== 'undefined') {
                                    localStorage.removeItem(`employee-avatar-text-${employee.id}`)
                                  }
                                }
                              }}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                            >
                              画像を選択
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="何文字でもOK"
                              value={avatarText}
                              onChange={(e) => {
                                const text = e.target.value
                                setAvatarText(text)
                                if (text) {
                                  setSelectedAvatarFile(null) // 文字入力時は画像をクリア
                                }
                                // ローカルストレージに保存
                                if (employee?.id && typeof window !== 'undefined') {
                                  localStorage.setItem(`employee-avatar-text-${employee.id}`, text)
                                }
                              }}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-xs text-slate-500">または文字（表示は2文字）</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>組織名</Label>
                    {canEditProfile && isAdminOrHR && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setOrganizations([...organizations, ""])}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        追加
                      </Button>
                    )}
                  </div>
                  {organizations.map((org, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <Input
                        placeholder="株式会社〇〇"
                        value={org}
                        onChange={(e) => {
                          const newOrgs = [...organizations]
                          newOrgs[index] = e.target.value
                          setOrganizations(newOrgs)
                          setFormData({...formData, organization: e.target.value})
                        }}
                        disabled={!canEditProfile}
                        className={!canEditProfile ? "text-[#374151] bg-[#edeaed]" : ""}
                      />
                      <div className="flex items-center gap-2">
                        {canEditProfile && organizations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setOrganizations(organizations.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {canEditProfile && isAdminOrHR && (
                          <>
                            <Switch
                              checked={privacySettings.organization}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, organization: checked })
                              }
                            />
                            <span className="text-sm text-slate-600">公開</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>所属</Label>
                    <div className="flex gap-2">
                      {canEditProfile && (currentUser?.department === "総務" || currentUser?.role === "admin") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDepartmentManagerOpen(true)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          部署管理
                        </Button>
                      )}
                      {canEditProfile && isAdminOrHR && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDepartments([...departments, ""])}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          追加
                        </Button>
                      )}
                    </div>
                  </div>
                  {isAdminOrHR && (
                    <p className="text-xs text-slate-500">
                      ※ 所属を選択すると、組織図の該当部署の最下層に自動的に追加されます
                    </p>
                  )}
                  {departments.map((dept, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <Select
                        value={dept}
                        onValueChange={(value) => {
                          const newDepts = [...departments]
                          newDepts[index] = value
                          setDepartments(newDepts)
                          setFormData({...formData, department: value})
                        }}
                        disabled={!canEditProfile}
                      >
                        <SelectTrigger className={!canEditProfile ? "text-[#374151] bg-[#edeaed]" : ""}>
                          <SelectValue placeholder="部署を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDepartments.map((availDept) => (
                            <SelectItem key={availDept} value={availDept}>
                              {availDept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        {canEditProfile && departments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDepartments(departments.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {canEditProfile && isAdminOrHR && (
                          <>
                            <Switch
                              checked={privacySettings.department}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, department: checked })
                              }
                            />
                            <span className="text-sm text-slate-600">公開</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>役職</Label>
                    <div className="flex gap-2">
                      {canEditProfile && isAdminOrHR && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPositionManagerOpen(true)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          役職管理
                        </Button>
                      )}
                      {canEditProfile && isAdminOrHR && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setPositions([...positions, ""])}>
                          <Plus className="w-4 h-4 mr-1" />
                          追加
                        </Button>
                      )}
                    </div>
                  </div>
                  {positions.map((pos, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="flex gap-2">
                        <Select
                          value={availablePositions.includes(pos) ? pos : ""}
                          onValueChange={(value) => {
                            const newPos = [...positions]
                            newPos[index] = value
                            setPositions(newPos)
                            setFormData({...formData, position: value})
                          }}
                          disabled={!canEditProfile}
                        >
                          <SelectTrigger className={`flex-1 ${!canEditProfile ? "text-[#374151] bg-[#edeaed]" : ""}`}>
                            <SelectValue placeholder="役職を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePositions.map((availablePos) => (
                              <SelectItem key={availablePos} value={availablePos}>
                                {availablePos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="自由記載"
                          value={availablePositions.includes(pos) ? "" : pos}
                          onChange={(e) => {
                            const newPos = [...positions]
                            newPos[index] = e.target.value
                            setPositions(newPos)
                            setFormData({...formData, position: e.target.value})
                          }}
                          disabled={!canEditProfile}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {canEditProfile && positions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPositions(positions.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {canEditProfile && isAdminOrHR && (
                          <>
                            <Switch
                              checked={privacySettings.position}
                              onCheckedChange={(checked) =>
                                setPrivacySettings({ ...privacySettings, position: checked })
                              }
                            />
                            <span className="text-sm text-slate-600">公開</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input 
                      type="url" 
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      disabled={!canEditProfile}
                      className={!canEditProfile ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.url}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, url: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                {/* 備考欄は総務・管理者のみ表示 */}
                {(currentUser?.department?.includes('総務') || currentUser?.role === 'admin') && (
                  <div className="space-y-2">
                    <Label>備考欄</Label>
                    <Textarea 
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      disabled={!canEditProfile}
                      placeholder="自由項目として備考を入力"
                      rows={3}
                    />
                  </div>
                )}

                {(isOwnProfile || isAdminOrHR) && (
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>住所</Label>
                        {isOwnProfile && <span className="text-xs text-blue-600">あなただけに表示されています</span>}
                      </div>
                      <Input 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        disabled={!canEditProfile}
                        placeholder="住所を入力"
                      />
                    </div>
                  </div>
                )}


                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>メールアドレス</Label>
                    <Input 
                      type="email" 
                      value={privacySettings.email ? formData.email : '非公開'}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!canEditProfile || !privacySettings.email}
                      className={(!canEditProfile || !privacySettings.email) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                    {!privacySettings.email && (
                      <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                    )}
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.email}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, email: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>電話番号（勤務先or勤務携帯・公開）</Label>
                    <Input 
                      type="tel" 
                      value={privacySettings.workPhone ? formData.phone : '非公開'}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!canEditProfile || !privacySettings.workPhone}
                      className={(!canEditProfile || !privacySettings.workPhone) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                    {!privacySettings.workPhone && (
                      <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                    )}
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.workPhone}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, workPhone: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>電話番号（勤務先・内線）</Label>
                    <Input 
                      type="tel" 
                      value={privacySettings.extension ? formData.phoneInternal : '非公開'}
                      onChange={(e) => setFormData({...formData, phoneInternal: e.target.value})}
                      disabled={!canEditProfile || !privacySettings.extension}
                      className={(!canEditProfile || !privacySettings.extension) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                    {!privacySettings.extension && (
                      <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                    )}
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.extension}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, extension: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>電話番号（携帯・非公開です）</Label>
                    <Input 
                      type="tel" 
                      value={privacySettings.mobilePhone ? formData.phoneMobile : '非公開'}
                      onChange={(e) => setFormData({...formData, phoneMobile: e.target.value})}
                      disabled={!canEditProfile || !privacySettings.mobilePhone}
                      className={(!canEditProfile || !privacySettings.mobilePhone) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                    {!privacySettings.mobilePhone && (
                      <p className="text-xs text-slate-500">この項目は非公開に設定されています</p>
                    )}
                  </div>
                  {canEditProfile && isAdminOrHR && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.mobilePhone}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, mobilePhone: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {canViewFamily && (isOwnProfile || isAdminOrHR) && (
              <div className="space-y-4">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">家族構成</h3>
                        {isOwnProfile && <span className="text-xs text-blue-600">あなただけに表示されています</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">※ マイナンバーは一切公開されません</p>
                    </div>
                    {canEditProfile && isAdminOrHR && (
                      <Button 
                        onClick={addFamilyMember}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        家族を追加
                      </Button>
                    )}
                  </div>


                {familyMembers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>家族情報が登録されていません</p>
                    {canEditProfile && isAdminOrHR && (
                      <Button 
                        onClick={addFamilyMember}
                        size="sm"
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        家族を追加
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {familyMembers.map((member, index) => (
                      <div key={member.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">家族 {index + 1}</h4>
                          {canEditProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFamilyMember(member.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>氏名</Label>
                            <Input 
                              value={member.name}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, name: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              placeholder="氏名" 
                              disabled={!canEditProfile} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>続柄</Label>
                            <Select 
                              value={member.relationship}
                              onValueChange={(value) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, relationship: value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              disabled={!canEditProfile}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="配偶者">配偶者</SelectItem>
                                <SelectItem value="子">子</SelectItem>
                                <SelectItem value="父">父</SelectItem>
                                <SelectItem value="母">母</SelectItem>
                                <SelectItem value="その他">その他</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>電話番号</Label>
                            <Input 
                              type="tel" 
                              value={member.phone}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, phone: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              placeholder="電話番号" 
                              disabled={!canEditProfile} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>誕生日</Label>
                            <Input 
                              type="date" 
                              value={member.birthday}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, birthday: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              disabled={!canEditProfile} 
                            />
                          </div>
                          {canViewMyNumber && (
                            <div className="col-span-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <Label>マイナンバー</Label>
                                <Lock className="w-3 h-3 text-amber-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type={showFamilyMyNumber[member.id] ? "text" : "password"}
                                  value={member.myNumber || ''}
                                  onChange={(e) => {
                                    const updatedMembers = familyMembers.map(m => 
                                      m.id === member.id ? { ...m, myNumber: e.target.value } : m
                                    )
                                    updateFamilyMembersAndSave(updatedMembers)
                                  }}
                                  placeholder="マイナンバー（12桁）"
                                  className="font-mono"
                                  disabled={!showFamilyMyNumber[member.id] || !canEditProfile}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleToggleMyNumber("family", member.id)}
                                  className="flex-shrink-0"
                                >
                                  {showFamilyMyNumber[member.id] ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="col-span-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Switch 
                                id={`separate-${member.id}`} 
                                checked={member.livingSeparately}
                                onCheckedChange={(checked) => {
                                  const updatedMembers = familyMembers.map(m => 
                                    m.id === member.id ? { ...m, livingSeparately: checked } : m
                                  )
                                  updateFamilyMembersAndSave(updatedMembers)
                                }}
                                disabled={!canEditProfile} 
                              />
                              <Label htmlFor={`separate-${member.id}`}>別居</Label>
                            </div>
                            <Input 
                              value={member.address || ''}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, address: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              placeholder="別居の場合は住所を入力" 
                              disabled={!canEditProfile}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {canViewFiles && (
              <div className="space-y-4">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">ファイル管理</h3>
                  {canEditProfile && isAdminOrHR && (
                    <Button onClick={addFolder} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      フォルダ追加
                    </Button>
                  )}
                </div>

                <Tabs defaultValue={folders[0]} className="w-full" onValueChange={setCurrentFolder}>
                  <TabsList className="w-full justify-start overflow-x-auto">
                    {folders.map((folder) => (
                      <div key={folder} className="flex items-center">
                        <TabsTrigger value={folder} className="flex items-center">
                          <Folder className="w-4 h-4 mr-2" />
                          {folder}
                          {uploadedFiles.filter(file => file.folderName === folder).length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {uploadedFiles.filter(file => file.folderName === folder).length}
                            </span>
                          )}
                        </TabsTrigger>
                        {canEditProfile && folders.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFolder(folder)
                            }}
                            className="ml-1 h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </TabsList>

                  {folders.map((folder) => (
                    <TabsContent key={folder} value={folder} className="space-y-4">
                      {canEditProfile && (
                        <div 
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                          <p className="text-sm text-slate-600 mb-2">ファイルをドラッグ&ドロップ</p>
                          <p className="text-xs text-slate-500 mb-4">PDF、画像、テキスト、Word、Excel、CSVに対応</p>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button 
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            ファイルを選択
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium">アップロード済みファイル</p>
                        {loadingFiles ? (
                          <div className="text-sm text-slate-500">ファイルを読み込み中...</div>
                        ) : files.length === 0 && uploadedFiles.filter(file => file.folderName === currentFolder).length === 0 ? (
                          <div className="text-sm text-slate-500">ファイルがありません</div>
                        ) : (
                          <div className="space-y-2">
                            {/* ローカルファイル（アップロード中） */}
                            {files.map((file, index) => (
                              <div key={`local-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center gap-2 flex-1">
                                  <Folder className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-blue-600">
                                    ({(file.size / 1024).toFixed(1)} KB) - アップロード中...
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {canEditProfile && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(index)}
                                      title="キャンセル"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* アップロード済みファイル（現在のフォルダのみ） */}
                            {uploadedFiles
                              .filter(file => file.folderName === currentFolder)
                              .map((file, index) => (
                              <div key={`uploaded-${file.id}`} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                <div 
                                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded p-1 flex-1"
                                  onClick={async () => {
                                    // アップロード済みファイルのダウンロード処理
                                    try {
                                      const response = await fetch(`/api/files/${file.id}/download`, {
                                        headers: {
                                          'x-employee-id': employee.id,
                                        },
                                      })
                                      if (response.ok) {
                                        const blob = await response.blob()
                                        const url = window.URL.createObjectURL(blob)
                                        window.open(url, '_blank')
                                      } else {
                                        console.error('ファイルダウンロードエラー:', await response.text())
                                      }
                                    } catch (error) {
                                      console.error('ファイルダウンロードエラー:', error)
                                    }
                                  }}
                                >
                                  <Folder className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm">{file.originalName || file.filename || 'Unknown File'}</span>
                                  <span className="text-xs text-slate-500">
                                    ({file.fileSize && typeof file.fileSize === 'number' ? (file.fileSize / 1024).toFixed(1) : '0'} KB)
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/files/${file.id}/download`, {
                                          headers: {
                                            'x-employee-id': employee.id,
                                          },
                                        })
                                        if (response.ok) {
                                          const blob = await response.blob()
                                          const url = window.URL.createObjectURL(blob)
                                          const a = document.createElement('a')
                                          a.href = url
                                          a.download = file.originalName || file.filename || 'download'
                                          document.body.appendChild(a)
                                          a.click()
                                          window.URL.revokeObjectURL(url)
                                          document.body.removeChild(a)
                                        } else {
                                          console.error('ファイルダウンロードエラー:', await response.text())
                                        }
                                      } catch (error) {
                                        console.error('ファイルダウンロードエラー:', error)
                                      }
                                    }}
                                    title="ダウンロード"
                                  >
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                  {canEditProfile && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        // アップロード済みファイルの削除処理
                                        try {
                                          const response = await fetch(`/api/files/${file.id}/delete`, {
                                            method: 'DELETE',
                                            headers: {
                                              'x-employee-id': employee.id,
                                            },
                                          })
                                          if (response.ok) {
                                            // ファイルリストを再取得
                                            if (employee?.id) {
                                              fetchUploadedFiles(employee.id)
                                            }
                                          } else {
                                            console.error('ファイル削除エラー:', await response.text())
                                          }
                                        } catch (error) {
                                          console.error('ファイル削除エラー:', error)
                                        }
                                      }}
                                      title="削除"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            {!isNewEmployee && (currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin') && canEditInvisibleTop && (
              <Button 
                variant={formData.isSuspended ? "default" : "destructive"}
                onClick={() => {
                  console.log('現在のisSuspended:', formData.isSuspended)
                  console.log('employee.isSuspended:', employee?.isSuspended)
                  const newSuspendedState = !formData.isSuspended
                  console.log('新しいisSuspended:', newSuspendedState)
                  setFormData({...formData, isSuspended: newSuspendedState})
                }}
                className={formData.isSuspended ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {formData.isSuspended ? '稼働させる' : '停止させる'}
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              {employee && (isAdminOrHR || currentUser?.role === 'manager') && canEditInvisibleTop && !isCopyEmployee && (
                <Button 
                  variant="outline"
                  onClick={handleCopy}
                  disabled={copying}
                  className="border-slate-300"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copying ? 'コピー中...' : 'コピー'}
                </Button>
              )}
              {employee && isAdminOrHR && canEditInvisibleTop && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '削除中...' : '削除'}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                戻る
              </Button>
              {!isCopyEmployee && (canEditUserInfo || isNewEmployee || isAdminOrHR) && canEditInvisibleTop && (
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? '保存中...' : (isNewEmployee ? '新規登録' : '保存')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordVerificationDialog
        open={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
        onVerified={handleVerificationSuccess}
        currentUser={currentUser}
      />

      <DepartmentManagerDialog
        open={isDepartmentManagerOpen}
        onOpenChange={setIsDepartmentManagerOpen}
        departments={availableDepartments}
        onDepartmentsChange={(newDepts) => {
          setAvailableDepartments(newDepts)
          if (typeof window !== 'undefined') {
            localStorage.setItem('available-departments', JSON.stringify(newDepts))
          }
        }}
      />

      <PositionManagerDialog
        open={isPositionManagerOpen}
        onOpenChange={setIsPositionManagerOpen}
        positions={availablePositions}
        onPositionsChange={(newPos) => {
          setAvailablePositions(newPos)
          if (typeof window !== 'undefined') {
            localStorage.setItem('available-positions', JSON.stringify(newPos))
          }
        }}
      />

      <EmploymentTypeManagerDialog
        open={isEmploymentTypeManagerOpen}
        onOpenChange={setIsEmploymentTypeManagerOpen}
        employmentTypes={employmentTypes}
        onEmploymentTypesChange={(newTypes) => {
          setEmploymentTypes(newTypes)
          if (typeof window !== 'undefined') {
            localStorage.setItem('employment-types', JSON.stringify(newTypes))
          }
        }}
      />

    </>
  )
}
