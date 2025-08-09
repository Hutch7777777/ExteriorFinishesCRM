import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  statusFilter?: {
    options: { value: string; label: string }[]
    onFilter: (status: string) => void
    placeholder: string
  }
  actions?: {
    create?: {
      label: string
      onClick: () => void
    }
    rowActions?: (row: T) => React.ReactNode
  }
  isLoading?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder,
  onSearch,
  statusFilter,
  actions,
  isLoading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-64 h-10 bg-muted rounded-md animate-pulse" />
          <div className="w-24 h-10 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-muted/20 border-b animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/10 border-b animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onSearch && (
            <Input
              placeholder={searchPlaceholder || "Search..."}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64"
            />
          )}
          {statusFilter && (
            <Select onValueChange={statusFilter.onFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={statusFilter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusFilter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {actions?.create && (
          <Button onClick={actions.create.onClick}>
            {actions.create.label}
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>
                  {column.header}
                </TableHead>
              ))}
              {actions?.rowActions && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions?.rowActions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : String(row[column.key as keyof T] || "")}
                    </TableCell>
                  ))}
                  {actions?.rowActions && (
                    <TableCell>{actions.rowActions(row)}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}