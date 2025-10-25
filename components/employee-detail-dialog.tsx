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
  birthday: string
  phone?: string
  address?: string
  myNumber?: string
  description?: string
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

  // 家族構成データをデータベースから取得（一時的に無効化）
  const fetchFamilyMembers = async (employeeId: string) => {
    // 一時的に無効化：fetchLatestEmployeeで取得したデータを使用
    console.log('fetchFamilyMembers: 無効化されました。fetchLatestEmployeeのデータを使用します。')
    // try {
    //   const response = await fetch(`/api/employees/${employeeId}/family-members`)
    //   if (response.ok) {
    //     const data = await response.json()
    //     setFamilyMembers(data)
    //   }
    // } catch (error) {
    //   console.error('家族構成データ取得エラー:', error)
    // }
  }

  // ユーザー設定をデータベースから取得
  const fetchUserSettings = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/settings`)
      if (response.ok) {
        const settings = await response.json()
        if (settings['password-visible']) {
          setShowPassword(settings['password-visible'])
        }
        if (settings['avatar-text']) {
          setAvatarText(settings['avatar-text'])
          // ローカルストレージにも同期
          localStorage.setItem(`employee-avatar-text-${employeeId}`, settings['avatar-text'])
          console.log('S3からアバターテキストを取得し、ローカルストレージに同期しました:', settings['avatar-text'])
        } else {
          // S3にデータがない場合は、ローカルストレージから取得を試行
          const localAvatarText = localStorage.getItem(`employee-avatar-text-${employeeId}`)
          if (localAvatarText) {
            setAvatarText(localAvatarText)
            console.log('ローカルストレージからアバターテキストを取得しました:', localAvatarText)
          }
        }
      } else {
        // APIエラーの場合は、ローカルストレージから取得を試行
        const localAvatarText = localStorage.getItem(`employee-avatar-text-${employeeId}`)
        if (localAvatarText) {
          setAvatarText(localAvatarText)
          console.log('APIエラーのため、ローカルストレージからアバターテキストを取得しました:', localAvatarText)
        }
      }
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error)
      // エラーの場合は、ローカルストレージから取得を試行
      const localAvatarText = localStorage.getItem(`employee-avatar-text-${employeeId}`)
      if (localAvatarText) {
        setAvatarText(localAvatarText)
        console.log('エラーのため、ローカルストレージからアバターテキストを取得しました:', localAvatarText)
      }
    }
  }

  // カスタムフォルダをデータベースから取得
  const fetchCustomFolders = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/folders?category=employee`)
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setFolders(data)
          setCurrentFolder(data[0])
        }
      }
    } catch (error) {
      console.error('カスタムフォルダ取得エラー:', error)
    }
  }

  // カスタムフォルダをデータベースに保存
  const saveCustomFolders = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/folders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folders: folders,
          category: 'employee'
        })
      })
      if (!response.ok) {
        console.error('カスタムフォルダ保存エラー:', response.statusText)
      }
    } catch (error) {
      console.error('カスタムフォルダ保存エラー:', error)
    }
  }

  // ユーザー設定をデータベースに保存
  const saveUserSettings = async (employeeId: string) => {
    try {
      // パスワード表示設定を保存
      await fetch(`/api/employees/${employeeId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'password-visible',
          value: showPassword
        })
      })

      // アバターテキストを保存
      await fetch(`/api/employees/${employeeId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'avatar-text',
          value: avatarText
        })
      })
    } catch (error) {
      console.error('ユーザー設定保存エラー:', error)
    }
  }
  
  const canViewProfile = isOwnProfile || permissions.permissions.viewSubordinateProfiles || permissions.permissions.viewAllProfiles || isAdminOrHR
  const canEditProfile = isAdminOrHR && !isCopyEmployee // 通常の編集権限
  const canEditCopyEmployee = currentUser?.role === 'admin' && isCopyEmployee // コピー社員の編集権限（管理者のみ）
  const canViewMyNumber = isAdminOrHR // 管理者・総務権限のみ閲覧可能
  const canViewUserInfo = permissions.permissions.viewAllProfiles || permissions.permissions.editAllProfiles || isAdminOrHR
  const canEditUserInfo = isCopyEmployee ? canEditCopyEmployee : (permissions.permissions.editAllProfiles || isAdminOrHR) // コピー社員は管理者のみ編集可能
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
      employeeType: employee?.employeeType || '正社員',
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
      description: employee?.description || null,
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
        isSuspended: latestEmployee.isSuspended ?? false,
        employeeType: latestEmployee.employeeType || '正社員'
      }))
      console.log('formData更新 - isSuspended:', latestEmployee.isSuspended)
      console.log('formData更新 - employeeType:', latestEmployee.employeeType)
    }
  }, [latestEmployee, isNewEmployee])

  // latestEmployeeが更新された時に組織・部署・役職の状態も更新
  useEffect(() => {
    if (latestEmployee && !isNewEmployee) {
      // 組織、部署、役職の配列を設定（latestEmployeeから取得）
      setOrganizations(latestEmployee.organizations && latestEmployee.organizations.length > 0 ? latestEmployee.organizations : 
                      latestEmployee.organization ? [latestEmployee.organization] : [""])
      setDepartments(latestEmployee.departments && latestEmployee.departments.length > 0 ? latestEmployee.departments : 
                    latestEmployee.department ? [latestEmployee.department] : [""])
      setPositions(latestEmployee.positions && latestEmployee.positions.length > 0 ? latestEmployee.positions : 
                  latestEmployee.position ? [latestEmployee.position] : [""])
      
      // ユーザー設定も再取得（avatarTextなど）
      fetchUserSettings(latestEmployee.id)
      
      // アップロード済みファイルも再取得
      fetchUploadedFiles(latestEmployee.id)
      
      // カスタムフォルダも再取得
      fetchCustomFolders(latestEmployee.id)
      
      console.log('組織・部署・役職の状態を更新しました')
      console.log('organizations:', latestEmployee.organizations || latestEmployee.organization)
      console.log('departments:', latestEmployee.departments || latestEmployee.department)
      console.log('positions:', latestEmployee.positions || latestEmployee.position)
    }
  }, [latestEmployee, isNewEmployee])

  // 社員データが変更された時にフォームデータを更新
  React.useEffect(() => {
    if (employee && open) { // employeeが変更され、ダイアログが開いている時に更新
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
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
        status: employee.status || 'active',
        password: employee.password || '',
        role: employee.role || 'general',
        myNumber: employee.myNumber || '',
        employeeType: employee.employeeType || '正社員',
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
        description: employee.description || null,
        parentEmployeeId: employee.parentEmployeeId || null,
      })
      
      // 家族構成の初期化
      console.log('=== 家族構成データ初期化開始 ===');
      console.log('現在時刻:', new Date().toISOString());
      console.log('employeeオブジェクト全体:', employee);
      console.log('latestEmployeeオブジェクト全体:', latestEmployee);
      console.log('employee.familyMembers:', employee?.familyMembers);
      console.log('latestEmployee.familyMembers:', latestEmployee?.familyMembers);
      console.log('employee.familyMembersの型:', typeof employee?.familyMembers);
      console.log('latestEmployee.familyMembersの型:', typeof latestEmployee?.familyMembers);
      console.log('employee.familyMembersは配列か:', Array.isArray(employee?.familyMembers));
      console.log('latestEmployee.familyMembersは配列か:', Array.isArray(latestEmployee?.familyMembers));
      
      // latestEmployeeのfamilyMembersを優先的に使用（nullチェック付き）
      let familyMembersData = (latestEmployee?.familyMembers) || (employee?.familyMembers);
      console.log('使用するfamilyMembers:', familyMembersData);
      console.log('familyMembersDataの型:', typeof familyMembersData);
      console.log('familyMembersDataは配列か:', Array.isArray(familyMembersData));
      console.log('familyMembersDataの長さ:', familyMembersData?.length);
      
      // リロード時の詳細チェック
      if (!familyMembersData || familyMembersData.length === 0) {
        console.log('=== リロード時の問題診断 ===');
        console.log('employee.id:', employee?.id);
        console.log('latestEmployee.id:', latestEmployee?.id);
        console.log('employee === latestEmployee:', employee === latestEmployee);
        console.log('employee.familyMembers === latestEmployee.familyMembers:', employee?.familyMembers === latestEmployee?.familyMembers);
        
        // latestEmployeeがundefinedの場合、employeeから直接家族構成を取得
        if (!latestEmployee && employee?.id) {
          console.log('latestEmployeeがundefinedのため、employeeから家族構成を取得します');
          
          // 非同期関数を定義して実行
          const fetchFamilyData = async () => {
            try {
              const response = await fetch(`/api/employees/${employee.id}/family-members`);
              if (response.ok) {
                const familyData = await response.json();
                console.log('APIから取得した家族構成データ:', familyData);
                
                // 取得したデータで家族構成を再設定
                if (familyData && Array.isArray(familyData)) {
                  const mappedFamilyMembers = familyData.map((member: any) => {
                    let birthday = '';
                    if (member.birthDate) {
                      try {
                        const date = new Date(member.birthDate);
                        if (!isNaN(date.getTime())) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          birthday = `${year}/${month}/${day}`;
                        }
                      } catch (error) {
                        console.error('誕生日の変換エラー:', error, member.birthDate);
                      }
                    }
                    
                    return {
                      id: member.id || `temp-${Date.now()}-${Math.random()}`,
                      name: member.name || '',
                      relationship: member.relationship || '',
                      birthday: birthday,
                    };
                  });
                  
                  console.log('API取得後の変換された家族構成データ:', mappedFamilyMembers);
                  setFamilyMembers(mappedFamilyMembers);
                }
              }
            } catch (error) {
              console.error('家族構成データの取得に失敗:', error);
            }
          };
          
          fetchFamilyData();
          return; // 早期リターンで後続の処理をスキップ
        }
      }
      
      if (familyMembersData && Array.isArray(familyMembersData)) {
        console.log('フロントエンドで受け取った家族構成データ:', familyMembersData);
        console.log('家族構成データの長さ:', familyMembersData.length);
        
        const mappedFamilyMembers = familyMembersData.map((member: any) => {
          let birthday = '';
          console.log('個別メンバーの変換処理:', {
            memberId: member.id,
            memberName: member.name,
            birthDate: member.birthDate,
            birthDateType: typeof member.birthDate
          });
          
          if (member.birthDate) {
            try {
              // ISO文字列をyyyy/MM/dd形式に変換
              const date = new Date(member.birthDate);
              console.log('Date変換結果:', {
                original: member.birthDate,
                date: date,
                isValid: !isNaN(date.getTime())
              });
              
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                birthday = `${year}/${month}/${day}`;
                console.log('変換成功:', {
                  original: member.birthDate,
                  converted: birthday
                });
              } else {
                console.error('無効な日付:', member.birthDate);
              }
            } catch (error) {
              console.error('誕生日の変換エラー:', error, member.birthDate);
            }
          } else {
            console.log('birthDateが存在しません:', member);
          }
          
          const result = {
            id: member.id || `temp-${Date.now()}-${Math.random()}`,
            name: member.name || '',
            relationship: member.relationship || '',
            birthday: birthday,
            phone: member.phone || '',
            address: member.address || '',
            myNumber: member.myNumber || '',
            description: member.description || '',
          };
          
          console.log('変換結果:', result);
          return result;
        });
        console.log('変換後の家族構成データ:', mappedFamilyMembers);
        console.log('setFamilyMembersを実行します');
        setFamilyMembers(mappedFamilyMembers);
        console.log('setFamilyMembers完了');
        
        // 状態設定後の確認
        setTimeout(() => {
          console.log('=== setFamilyMembers後の状態確認 ===');
          console.log('familyMembers状態:', familyMembers);
          console.log('familyMembersの長さ:', familyMembers.length);
        }, 100);
      } else {
        console.log('familyMembersDataが配列ではないか、存在しません');
        console.log('familyMembersData:', familyMembersData);
        console.log('Array.isArray(familyMembersData):', Array.isArray(familyMembersData));
        setFamilyMembers([])
        
        // 家族構成データが存在しない場合は、直接APIから取得を試行
        if (employee?.id) {
          console.log('家族構成データが存在しないため、直接APIから取得を試行します')
          fetch(`/api/employees/${employee.id}/family-members`)
            .then(response => {
              if (response.ok) {
                return response.json()
              }
              throw new Error('API response not ok')
            })
            .then(directFamilyData => {
              console.log('直接APIから取得した家族構成データ:', directFamilyData)
              if (directFamilyData && Array.isArray(directFamilyData)) {
                const mappedDirectFamily = directFamilyData.map((member: any) => ({
                  id: member.id || `temp-${Date.now()}-${Math.random()}`,
                  name: member.name || '',
                  relationship: member.relationship || '',
                  birthday: member.birthDate ? new Date(member.birthDate).toLocaleDateString('ja-JP').replace(/\//g, '/') : '',
                  phone: member.phone || '',
                  address: member.address || '',
                  myNumber: member.myNumber || '',
                  description: member.description || '',
                }))
                setFamilyMembers(mappedDirectFamily)
                console.log('直接APIから取得した家族構成データを設定しました:', mappedDirectFamily)
              }
            })
            .catch(error => {
              console.error('直接APIからの家族構成データ取得エラー:', error)
            })
        }
      }
      
      // 組織、部署、役職の配列を設定（APIから取得した配列を使用）
      setOrganizations(employee.organizations && employee.organizations.length > 0 ? employee.organizations : 
                      employee.organization ? [employee.organization] : [""])
      setDepartments(employee.departments && employee.departments.length > 0 ? employee.departments : 
                    employee.department ? [employee.department] : [""])
      setPositions(employee.positions && employee.positions.length > 0 ? employee.positions : 
                  employee.position ? [employee.position] : [""])
      
      // ユーザー設定をデータベースから取得
      fetchUserSettings(employee.id)
      
      // 家族データの更新は別のuseEffectで処理（競合を避けるため削除）
      
      // 家族構成データをデータベースから取得（一時的に無効化）
      // fetchFamilyMembers(employee.id)
      console.log('fetchFamilyMembers呼び出しを無効化しました。fetchLatestEmployeeのデータを使用します。')
      
      
      // カスタムフォルダをデータベースから取得
      fetchCustomFolders(employee.id)
      
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
        parentEmployeeId: null,
      })
      setOrganizations([""])
      setDepartments([""])
      setPositions([""])
      setFamilyMembers([]) // 新規登録時は家族構成を空にする
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
      setFolders(["契約書類", "履歴書等", "事前資料"])
      setCurrentFolder("契約書類")
    }
  }, [employee, open])

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [folders, setFolders] = useState<string[]>(() => {
    return ["契約書類", "履歴書等", "事前資料"]
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
      console.log('送信するorganizations:', organizations)
      console.log('送信するdepartments:', departments)
      console.log('送信するpositions:', positions)
      
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
        // 備考欄を送信（空文字列の場合はnullに変換）
        description: formData.description && formData.description.trim() !== '' ? formData.description : null,
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

        // カスタムフォルダとユーザー設定を保存
        if (result.employee && result.employee.id) {
          await saveCustomFolders(result.employee.id)
          await saveUserSettings(result.employee.id)
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
          // 新規登録後にファイルアップロードを再試行
          if (files.length > 0) {
            console.log('新規登録完了、ファイルアップロードを再試行します')
            // 少し遅延してからファイルアップロードを再試行
            setTimeout(() => {
              handleFileUploadRetry(result.employee.id)
            }, 1000)
          }
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
        headers: {
          'Content-Type': 'application/json',
          'x-employee-id': currentUser?.id || '',
        },
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
    if (!employee || currentUser?.role !== 'admin') return
    
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


  const handleRemoveFamilyMember = async (id: string) => {
    const newFamilyMembers = familyMembers.filter(member => member.id !== id)
    setFamilyMembers(newFamilyMembers)
    
    // データベースに保存
    if (employee?.id) {
      try {
        await fetch(`/api/employees/${employee.id}/family-members`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyMembers: newFamilyMembers })
        })
      } catch (error) {
        console.error('家族構成データ保存エラー:', error)
      }
    }
  }

  // 家族構成データを更新してデータベースに保存する共通関数
  const updateFamilyMembersAndSave = async (updatedMembers: FamilyMember[]) => {
    setFamilyMembers(updatedMembers)
    
    // データベースに保存
    if (employee?.id) {
      try {
        const response = await fetch(`/api/employees/${employee.id}/family-members`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyMembers: updatedMembers })
        })
        
        if (response.ok) {
          console.log('家族構成データの保存に成功しました')
        } else {
          console.error('家族構成データの保存に失敗しました:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('家族構成データ保存エラー:', error)
      }
    }
  }



  // アップロード済みファイルを取得
  const fetchUploadedFiles = async (employeeId: string) => {
    if (!employeeId) return
    
    setLoadingFiles(true)
    try {
      const response = await fetch(`/api/files/employee/${employeeId}`)
      if (response.ok) {
        const files = await response.json()
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

  // 新規登録後のファイルアップロード再試行
  const handleFileUploadRetry = async (employeeId: string) => {
    console.log('ファイルアップロード再試行開始:', employeeId)
    const filesToUpload = [...files]
    
    if (filesToUpload.length === 0) {
      console.log('アップロードするファイルがありません')
      return
    }
    
    // ファイルリストをクリア
    setFiles([])
    
    // 各ファイルをアップロード
    for (const file of filesToUpload) {
      try {
        console.log('ファイルアップロード開始:', file.name)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'employee')
        formData.append('folder', currentFolder)
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'x-employee-id': employeeId
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('ファイルアップロード成功:', result)
          
          // アップロード済みファイルリストを再取得
          setTimeout(() => {
            fetchUploadedFiles(employeeId)
          }, 500)
        } else {
          const errorText = await response.text()
          console.error('ファイルアップロード失敗:', response.status, errorText)
        }
      } catch (error) {
        console.error('ファイルアップロードエラー:', error)
      }
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
          
          // 新規登録の場合はアップロードをスキップ（保存後に再試行）
          if (!employee?.id) {
            console.log('新規登録のため、ファイルアップロードをスキップ（保存後に再試行）')
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
      { value: "正社員", label: "正社員" },
      { value: "契約社員", label: "契約社員" },
      { value: "パートタイム", label: "パートタイム" },
      { value: "派遣社員", label: "派遣社員" },
      { value: "業務委託", label: "業務委託" },
      { value: "外注先", label: "外注先" }
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
      "執行部",
      "広店",
      "焼山店",
      "不動産部",
      "工務部",
      "チカラもち",
      "福祉部"
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
      "執行役員",
      "統括店長",
      "店長",
      "工務長",
      "福祉長",
      "アドバイザー",
      "内勤",
      "広報",
      "総務",
      "経理",
      "工務",
      "プランナー",
      "チームリーダー",
      "サービス管理責任者",
      "管理者"
    ]
  })

  // マスターデータをAPIから取得（S3優先・なければデフォルト）
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const res = await fetch('/api/master-data')
        if (!res.ok) return
        const json = await res.json()
        if (!json?.success) return
        const data = json.data || {}

        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setAvailableDepartments(data.departments)
          if (typeof window !== 'undefined') {
            localStorage.setItem('available-departments', JSON.stringify(data.departments))
          }
        }
        if (Array.isArray(data.positions) && data.positions.length > 0) {
          setAvailablePositions(data.positions)
          if (typeof window !== 'undefined') {
            localStorage.setItem('available-positions', JSON.stringify(data.positions))
          }
        }
        if (Array.isArray(data.employmentTypes) && data.employmentTypes.length > 0) {
          const types = data.employmentTypes.map((v: string) => ({ value: v, label: v }))
          setEmploymentTypes(types)
          if (typeof window !== 'undefined') {
            localStorage.setItem('employment-types', JSON.stringify(types))
          }
        }
      } catch (e) {
        console.warn('マスターデータ取得に失敗しました')
      }
    }
    fetchMasterData()
  }, [])

  const addFamilyMember = async () => {
    const newMember: FamilyMember = {
      id: `family-${Date.now()}`,
      name: "",
      relationship: "",
      birthday: "",
      phone: "",
      address: "",
      myNumber: "",
      description: "",
    }
    const newFamilyMembers = [...familyMembers, newMember]
    setFamilyMembers(newFamilyMembers)
    
    // データベースに保存
    if (employee?.id) {
      try {
        await fetch(`/api/employees/${employee.id}/family-members`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyMembers: newFamilyMembers })
        })
      } catch (error) {
        console.error('家族構成データ保存エラー:', error)
      }
    }
  }

  const addFolder = async () => {
    const folderName = prompt("フォルダ名を入力してください")
    if (folderName) {
      const newFolders = [...folders, folderName]
      setFolders(newFolders)
      
      // データベースに保存
      if (employee?.id) {
        try {
          const response = await fetch(`/api/employees/${employee.id}/folders`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folders: newFolders, category: 'employee' })
          })
          if (response.ok) {
            console.log('フォルダ追加成功')
          } else {
            console.error('フォルダ追加失敗:', response.statusText)
          }
        } catch (error) {
          console.error('フォルダデータ保存エラー:', error)
        }
      }
    }
  }

  const removeFolder = async (folderName: string) => {
    if (folders.length <= 1) {
      alert("最低1つのフォルダが必要です")
      return
    }
    
    if (confirm(`フォルダ「${folderName}」を削除しますか？`)) {
      const newFolders = folders.filter(f => f !== folderName)
      setFolders(newFolders)
      
      // データベースに保存
      if (employee?.id) {
        try {
          const response = await fetch(`/api/employees/${employee.id}/folders`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folders: newFolders, category: 'employee' })
          })
          if (response.ok) {
            console.log('フォルダ削除成功')
          } else {
            console.error('フォルダ削除失敗:', response.statusText)
          }
        } catch (error) {
          console.error('フォルダデータ保存エラー:', error)
        }
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
  const handleTogglePassword = async () => {
    if (!isAdminOrHR) return
    
    const newShowPassword = !showPassword
    setShowPassword(newShowPassword)
    
    // データベースに保存
    if (employee?.id) {
      try {
        await fetch(`/api/employees/${employee.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'password-visible', value: newShowPassword })
        })
      } catch (error) {
        console.error('ユーザー設定保存エラー:', error)
      }
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
                      disabled={!canEditUserInfo && !isNewEmployee && !canEditCopyEmployee}
                      className={(!canEditUserInfo && !isNewEmployee && !canEditCopyEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>フリガナ</Label>
                    <Input 
                      value={formData.furigana}
                      onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
                      disabled={!canEditUserInfo && !isNewEmployee && !canEditCopyEmployee}
                      placeholder="ヤマダタロウ"
                      className={(!canEditUserInfo && !isNewEmployee && !canEditCopyEmployee) ? "text-[#374151] bg-[#edeaed]" : ""}
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
                            {/* 管理者権限は管理者のみ選択可能 */}
                            {currentUser?.role === 'admin' && (
                              <SelectItem value="admin">管理者権限</SelectItem>
                            )}
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
                        {employmentTypes
                          .filter((type: any) => type.value && type.value.trim() !== '')
                          .map((type: any) => (
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
                        {avatarText ? (
                          <span className={`font-medium text-slate-700 whitespace-nowrap overflow-hidden ${
                            /^[a-zA-Z\s]+$/.test(avatarText.slice(0, 3)) ? 'text-lg' : 'text-sm'
                          }`}>{avatarText.slice(0, 3)}</span>
                        ) : employee?.avatar ? (
                          <img 
                            src={employee.avatar} 
                            alt={employee?.name || "プロフィール画像"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`whitespace-nowrap overflow-hidden ${
                            /^[a-zA-Z\s]+$/.test(employee?.name?.slice(0, 3) || "?") ? 'text-2xl' : 'text-lg'
                          }`}>{employee?.name?.slice(0, 3) || "?"}</span>
                        )}
                      </div>
                      {canEditProfile && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="何文字でも登録可能"
                              value={avatarText}
                              onChange={async (e) => {
                                const text = e.target.value
                                setAvatarText(text)
                                
                                // ローカルストレージに保存
                                if (employee?.id) {
                                  localStorage.setItem(`employee-avatar-text-${employee.id}`, text)
                                }
                                
                                // S3に永続保存
                                if (employee?.id) {
                                  try {
                                    const response = await fetch(`/api/employees/${employee.id}/settings`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ key: 'avatar-text', value: text })
                                    })
                                    
                                    if (response.ok) {
                                      console.log('アバターテキストをS3に保存しました:', text)
                                    } else {
                                      console.error('アバターテキストのS3保存に失敗:', response.statusText)
                                    }
                                  } catch (error) {
                                    console.error('アバターテキスト保存エラー:', error)
                                  }
                                }
                              }}
                              className="w-32 h-8 text-sm"
                            />
                            <span className="text-xs text-slate-500">（表示は1-3文字）</span>
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
                          {availableDepartments
                            .filter((availDept) => availDept && availDept.trim() !== '')
                            .map((availDept) => (
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
                            {availablePositions
                              .filter((availablePos) => availablePos && availablePos.trim() !== '')
                              .map((availablePos) => (
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

                {/* 備考欄は管理者・総務・HR権限のユーザーが表示可能 */}
                {(isAdminOrHR || currentUser?.department?.includes('総務')) && (
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

                {/* 携帯電話番号は総務・管理者または本人のみ閲覧可能 */}
                {(isOwnProfile || isAdminOrHR) && (
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
                )}
              </div>
            </div>

            {(() => {
              console.log('家族構成表示条件チェック:', {
                canViewFamily,
                isOwnProfile,
                isAdminOrHR,
                shouldShow: canViewFamily && (isOwnProfile || isAdminOrHR),
                familyMembersLength: familyMembers.length
              });
              return canViewFamily && (isOwnProfile || isAdminOrHR);
            })() && (
              <div className="space-y-4">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">家族構成</h3>
                        {isOwnProfile && <span className="text-xs text-blue-600">あなただけに表示されています</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">※ マイナンバーは一切公開されません</p>
                    </div>
                    {canEditProfile && isAdminOrHR && familyMembers.length > 0 && (
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
                            <Label>誕生日</Label>
                            <Input 
                              type="date" 
                              value={member.birthday ? (member.birthday.includes('/') ? member.birthday.replace(/\//g, '-') : member.birthday) : ''}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { 
                                    ...m, 
                                    birthday: e.target.value ? e.target.value.replace(/-/g, '/') : '',
                                    birthDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                  } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              disabled={!canEditProfile} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>電話番号</Label>
                            <Input 
                              value={member.phone || ''}
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
                            <Label>住所</Label>
                            <Input 
                              value={member.address || ''}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, address: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              placeholder="住所" 
                              disabled={!canEditProfile} 
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>マイナンバー</Label>
                              <Lock className="w-4 h-4 text-amber-600" />
                              <span className="text-xs text-amber-600">管理者・総務権限のみ閲覧可</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type={showEmployeeMyNumber ? "text" : "password"}
                                value={canViewMyNumber && showEmployeeMyNumber ? (member.myNumber || '') : '●●●●●●●●●●●●'}
                                onChange={(e) => {
                                  if (canViewMyNumber && showEmployeeMyNumber) {
                                    const updatedMembers = familyMembers.map(m => 
                                      m.id === member.id ? { ...m, myNumber: e.target.value } : m
                                    )
                                    updateFamilyMembersAndSave(updatedMembers)
                                  }
                                }}
                                placeholder="マイナンバー（12桁）"
                                className={`font-mono ${(!showEmployeeMyNumber || !canEditProfile) ? "text-[#374151] bg-[#edeaed]" : ""}`}
                                disabled={!showEmployeeMyNumber || !canEditProfile}
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
                          <div className="space-y-2 col-span-2">
                            <Label>備考欄</Label>
                            <Textarea 
                              value={member.description || ''}
                              onChange={(e) => {
                                const updatedMembers = familyMembers.map(m => 
                                  m.id === member.id ? { ...m, description: e.target.value } : m
                                )
                                updateFamilyMembersAndSave(updatedMembers)
                              }}
                              placeholder="備考" 
                              disabled={!canEditProfile}
                              rows={2}
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
              {((!isCopyEmployee && (canEditUserInfo || isNewEmployee || isAdminOrHR)) || canEditCopyEmployee) && canEditInvisibleTop && (
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
            // カスタムイベントを発火して他のコンポーネントに通知
            window.dispatchEvent(new CustomEvent('departmentsChanged'))
          }
          // APIへも保存
          try {
            fetch('/api/master-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                departments: newDepts,
                positions: availablePositions,
                employmentTypes: employmentTypes.map((t: any) => t.value)
              })
            })
          } catch {}
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
            // カスタムイベントを発火して他のコンポーネントに通知
            window.dispatchEvent(new CustomEvent('positionsChanged'))
          }
          // APIへも保存
          try {
            fetch('/api/master-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                departments: availableDepartments,
                positions: newPos,
                employmentTypes: employmentTypes.map((t: any) => t.value)
              })
            })
          } catch {}
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
            // カスタムイベントを発火して他のコンポーネントに通知
            window.dispatchEvent(new CustomEvent('employmentTypesChanged'))
          }
          // APIへも保存
          try {
            fetch('/api/master-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                departments: availableDepartments,
                positions: availablePositions,
                employmentTypes: newTypes.map((t: any) => t.value)
              })
            })
          } catch {}
        }}
      />

    </>
  )
}
