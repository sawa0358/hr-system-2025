"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

export function EmployeeSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [employmentType, setEmploymentType] = useState("all")
  const [department, setDepartment] = useState("all")
  const [position, setPosition] = useState("all")
  const [displayStatus, setDisplayStatus] = useState("on")
  const [employmentStatus, setEmploymentStatus] = useState("active")
  const [resultCount, setResultCount] = useState(0)

  const handleClear = () => {
    setSearchQuery("")
    setEmploymentType("all")
    setDepartment("all")
    setPosition("all")
    setDisplayStatus("on")
    setEmploymentStatus("active")
    setResultCount(0)
  }

  const hasActiveFilters = searchQuery || employmentType !== "all" || department !== "all" || position !== "all"

  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex flex-col gap-4">
        {/* Search Bar and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="社員名、社員番号、部署、役職で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-950"
            />
          </div>

          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger className="w-[120px] bg-white dark:bg-gray-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全雇用形態</SelectItem>
              <SelectItem value="regular">正社員</SelectItem>
              <SelectItem value="contract">契約社員</SelectItem>
              <SelectItem value="parttime">パート</SelectItem>
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[120px] bg-white dark:bg-gray-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部署</SelectItem>
              <SelectItem value="sales">営業部</SelectItem>
              <SelectItem value="engineering">開発部</SelectItem>
              <SelectItem value="hr">人事部</SelectItem>
              <SelectItem value="accounting">経理部</SelectItem>
            </SelectContent>
          </Select>

          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-[120px] bg-white dark:bg-gray-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全役職</SelectItem>
              <SelectItem value="manager">部長</SelectItem>
              <SelectItem value="leader">課長</SelectItem>
              <SelectItem value="staff">一般</SelectItem>
            </SelectContent>
          </Select>

          <Select value={displayStatus} onValueChange={setDisplayStatus}>
            <SelectTrigger className="w-[110px] bg-white dark:bg-gray-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">表示ON</SelectItem>
              <SelectItem value="off">表示OFF</SelectItem>
            </SelectContent>
          </Select>

          <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
            <SelectTrigger className="w-[110px] bg-white dark:bg-gray-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">在籍中</SelectItem>
              <SelectItem value="retired">退職済</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">検索結果{resultCount}名</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 gap-1 text-blue-900 dark:text-blue-100 hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
          >
            <X className="h-3 w-3" />
            クリア
          </Button>
        </div>
      </div>
    </div>
  )
}
