"use client"

import { useState } from "react"
import { X, Plus, Upload, Folder, Eye, EyeOff, Lock, Settings } from "lucide-react"
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
}

export function EmployeeDetailDialog({ open, onOpenChange, employee }: EmployeeDetailDialogProps) {
  const { currentUser } = useAuth()
  const permissions = usePermissions()

  const isOwnProfile = currentUser?.id === employee?.id
  const isNewEmployee = !employee

  // 管理者・総務権限の場合は全項目を表示
  const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
  
  // デバッグ用：現在のユーザー情報をコンソールに出力
  console.log('Current User:', currentUser)
  console.log('Is Admin or HR:', isAdminOrHR)
  console.log('Is New Employee:', isNewEmployee)
  
  const canViewProfile = isOwnProfile || permissions.viewSubordinateProfiles || permissions.viewAllProfiles || isAdminOrHR
  const canEditProfile = isOwnProfile
    ? permissions.editOwnProfile
    : permissions.editSubordinateProfiles || permissions.editAllProfiles || isAdminOrHR
  const canViewMyNumber = permissions.viewMyNumber || isAdminOrHR
  const canViewUserInfo = permissions.viewAllProfiles || permissions.editAllProfiles || isAdminOrHR
  const canEditUserInfo = permissions.editAllProfiles || isAdminOrHR
  const canViewFamily = isOwnProfile || permissions.viewAllProfiles || isAdminOrHR
  const canViewFiles = permissions.viewAllProfiles || isAdminOrHR
  
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
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    department: employee?.department || '',
    position: employee?.position || '',
    organization: employee?.organization || '株式会社テックイノベーション',
    team: employee?.team || '',
    joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '',
    status: employee?.status || 'active',
    password: employee?.password || '',
    role: employee?.role || 'general',
    myNumber: employee?.myNumber || '',
    employeeType: employee?.employeeType || 'employee',
  })

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [folders, setFolders] = useState<string[]>(["基本情報", "契約書類", "評価資料"])
  const [changePassword, setChangePassword] = useState(false)
  const [showEmployeeMyNumber, setShowEmployeeMyNumber] = useState(false)
  const [showFamilyMyNumber, setShowFamilyMyNumber] = useState<{ [key: string]: boolean }>({})
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [pendingMyNumberAction, setPendingMyNumberAction] = useState<{
    type: "employee" | "family"
    id?: string
  } | null>(null)
  const [saving, setSaving] = useState(false)

  // 保存処理
  const handleSave = async () => {
    if (!canEditUserInfo && !isNewEmployee) return
    
    setSaving(true)
    try {
      const url = isNewEmployee ? '/api/employees' : `/api/employees/${employee.id}`
      const method = isNewEmployee ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('保存成功:', result)
        onOpenChange(false)
        // ページをリロードして最新データを表示
        window.location.reload()
      } else {
        const error = await response.json()
        console.error('保存エラー:', error)
        alert(`保存に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const [privacySettings, setPrivacySettings] = useState({
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
  })

  const [organizations, setOrganizations] = useState<string[]>([employee?.organization || ""])
  const [departments, setDepartments] = useState<string[]>([employee?.department || ""])
  const [positions, setPositions] = useState<string[]>([employee?.position || ""])
  const [systemUsageEnabled, setSystemUsageEnabled] = useState(false)
  const [userPermission, setUserPermission] = useState<string>("general")

  const [isDepartmentManagerOpen, setIsDepartmentManagerOpen] = useState(false)
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([
    "エンジニアリング",
    "営業",
    "マーケティング",
    "人事",
    "経理",
    "総務",
    "CS",
    "品質保証",
  ])

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        id: Date.now().toString(),
        name: "",
        relationship: "",
        phone: "",
        birthday: "",
        livingSeparately: false,
        myNumber: "",
      },
    ])
  }

  const addFolder = () => {
    const folderName = prompt("フォルダ名を入力してください")
    if (folderName) {
      setFolders([...folders, folderName])
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">ユーザー詳細</DialogTitle>
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
                    <Label>名前(登録名)</Label>
                    <Input defaultValue={employee?.name} disabled={!canEditUserInfo} />
                  </div>
                  <div className="space-y-2">
                    <Label>メールアドレス</Label>
                    <Input type="email" defaultValue={employee?.email} disabled={!canEditUserInfo} />
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
                          defaultValue="123456789012"
                          className="font-mono"
                          disabled={!showEmployeeMyNumber}
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
                  {(canEditUserInfo || isAdminOrHR) && (
                    <>
                      <div className="col-span-2 space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base">システム使用ON/OFF</Label>
                            <p className="text-xs text-slate-500">ONにすると利用者として登録されます</p>
                          </div>
                          <Switch
                            checked={systemUsageEnabled}
                            onCheckedChange={setSystemUsageEnabled}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                        {systemUsageEnabled && (
                          <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                            <Label>権限設定</Label>
                            <Select value={userPermission} onValueChange={setUserPermission}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">閲覧のみ</SelectItem>
                                <SelectItem value="general">一般ユーザー</SelectItem>
                                <SelectItem value="sub-manager">サブマネージャー</SelectItem>
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
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={changePassword} onCheckedChange={setChangePassword} />
                          <Label>パスワードを変更する</Label>
                        </div>
                        {changePassword && (
                          <Input type="password" placeholder="半角の英字と数字を含む、4文字以上の文字列" />
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
                      disabled={!canEditUserInfo} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>社員番号</Label>
                    <Input defaultValue={employee?.employeeNumber} disabled={!canEditUserInfo} />
                  </div>
                  <div className="space-y-2">
                    <Label>雇用形態</Label>
                    <Select 
                      value={formData.employeeType} 
                      onValueChange={(value) => setFormData({...formData, employeeType: value})}
                      disabled={!canEditUserInfo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">社員</SelectItem>
                        <SelectItem value="contractor">外注</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>チーム</Label>
                    <Input 
                      value={formData.team}
                      onChange={(e) => setFormData({...formData, team: e.target.value})}
                      placeholder="チーム名を入力" 
                      disabled={!canEditUserInfo} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">プロフィール情報</h3>
                <p className="text-sm text-slate-600">
                  プロフィール情報はシステム上で利用され、設定に応じて公開されます。
                </p>
                {!canEditProfile && <p className="text-sm text-amber-600 mt-1">※ 閲覧のみ可能です</p>}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>表示名</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={!canEditProfile} 
                    />
                  </div>
                  {canEditProfile && (
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
                    <Input placeholder="半角の英数字とのみ使用できます" disabled={!canEditProfile} />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>画像</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-2xl">{employee?.name?.[0] || "?"}</span>
                      </div>
                      {canEditProfile && (
                        <Button variant="outline" size="sm">
                          画像を選択
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {canEditProfile && (
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Switch id={`contact-${employee?.id}`} disabled={!canEditProfile} />
                      <Label htmlFor={`contact-${employee?.id}`}>コンタクト検索の対象にする</Label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>組織名</Label>
                    {canEditProfile && (
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
                        {canEditProfile && (
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
                      {canEditProfile && (
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
                  <p className="text-xs text-slate-500">
                    ※ 所属を選択すると、組織図の該当部署の最下層に自動的に追加されます
                  </p>
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
                        <SelectTrigger>
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
                        {canEditProfile && (
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
                    {canEditProfile && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPositions([...positions, ""])}>
                        <Plus className="w-4 h-4 mr-1" />
                        追加
                      </Button>
                    )}
                  </div>
                  {positions.map((pos, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <Input
                        placeholder="役職"
                        value={pos}
                        onChange={(e) => {
                          const newPos = [...positions]
                          newPos[index] = e.target.value
                          setPositions(newPos)
                        }}
                        disabled={!canEditProfile}
                      />
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
                        {canEditProfile && (
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
                    <Input type="url" disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.url}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, url: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>住所</Label>
                    <Input disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.address}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, address: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>自己紹介</Label>
                    <Textarea rows={3} disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={privacySettings.bio}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, bio: checked })}
                      />
                      <span className="text-sm text-slate-600">公開</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="space-y-2">
                    <Label>メールアドレス</Label>
                    <Input type="email" defaultValue={employee?.email} disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
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
                    <Label>電話番号(勤務先)</Label>
                    <Input type="tel" disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
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
                    <Label>電話番号(内線)</Label>
                    <Input type="tel" disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
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
                    <Label>電話番号(携帯)</Label>
                    <Input type="tel" disabled={!canEditProfile} />
                  </div>
                  {canEditProfile && (
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

            {canViewFamily && (
              <div className="space-y-4">
                <div className="border-b pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">家族構成</h3>
                    <p className="text-xs text-slate-500 mt-1">※ マイナンバーは一切公開されません</p>
                  </div>
                  {canEditProfile && (
                    <Button onClick={addFamilyMember} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      家族を追加
                    </Button>
                  )}
                </div>

                {familyMembers.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">家族情報が登録されていません</div>
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
                              onClick={() => setFamilyMembers(familyMembers.filter((m) => m.id !== member.id))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>氏名</Label>
                            <Input placeholder="氏名" disabled={!canEditProfile} />
                          </div>
                          <div className="space-y-2">
                            <Label>続柄</Label>
                            <Select disabled={!canEditProfile}>
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
                            <Input type="tel" placeholder="電話番号" disabled={!canEditProfile} />
                          </div>
                          <div className="space-y-2">
                            <Label>誕生日</Label>
                            <Input type="date" disabled={!canEditProfile} />
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
                              <Switch id={`separate-${member.id}`} disabled={!canEditProfile} />
                              <Label htmlFor={`separate-${member.id}`}>別居</Label>
                            </div>
                            <Input placeholder="別居の場合は住所を入力" disabled={!canEditProfile} />
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
                  {canEditProfile && (
                    <Button onClick={addFolder} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      フォルダ追加
                    </Button>
                  )}
                </div>

                <Tabs defaultValue={folders[0]} className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    {folders.map((folder) => (
                      <TabsTrigger key={folder} value={folder}>
                        <Folder className="w-4 h-4 mr-2" />
                        {folder}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {folders.map((folder) => (
                    <TabsContent key={folder} value={folder} className="space-y-4">
                      {canEditProfile && (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                          <p className="text-sm text-slate-600 mb-2">ファイルをドラッグ&ドロップ</p>
                          <p className="text-xs text-slate-500 mb-4">PDF、画像、テキスト、Word、Excel、CSVに対応</p>
                          <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            ファイルを選択
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium">アップロード済みファイル</p>
                        <div className="text-sm text-slate-500">ファイルがありません</div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            {permissions.suspendUsers && (
              <Button variant="destructive" onClick={() => onOpenChange(false)}>
                ユーザーを停止する
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                戻る
              </Button>
              {canEditProfile && <Button className="bg-blue-600 hover:bg-blue-700">保存する</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordVerificationDialog
        open={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
        onVerified={handleVerificationSuccess}
      />

      <DepartmentManagerDialog
        open={isDepartmentManagerOpen}
        onOpenChange={setIsDepartmentManagerOpen}
        departments={availableDepartments}
        onDepartmentsChange={(newDepts) => {
          setAvailableDepartments(newDepts)
        }}
      />

      {/* 保存ボタン */}
      {(canEditUserInfo || isNewEmployee) && (
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? '保存中...' : (isNewEmployee ? '新規登録' : '保存')}
          </Button>
        </div>
      )}
    </>
  )
}
