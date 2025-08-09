import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, ArrowUpDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  createAction?: {
    label: string
    onClick: () => void
  }
  emptyState?: {
    title: string
    description: string
    icon?: React.ReactNode
  }
  isLoading?: boolean
}

/**
 * Professional DataTable component with search, sorting, and empty states.
 * Built with TanStack Table for full-featured data management.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search...",
  createAction,
  emptyState,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const searchValue = (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Table skeleton */}
        <div className="rounded-xl border bg-white dark:bg-slate-900">
          <div className="p-4 border-b">
            <div className="flex space-x-4">
              {columns.map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex space-x-4">
                {columns.map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9 w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
        {createAction && (
          <Button onClick={createAction.onClick} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            {createAction.label}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className="text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'
                  }`}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-slate-900 dark:text-slate-50">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState ? (
                    <EmptyState
                      icon={emptyState.icon}
                      title={emptyState.title}
                      description={emptyState.description}
                      action={createAction}
                    />
                  ) : (
                    <div className="text-slate-500">No results found.</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}