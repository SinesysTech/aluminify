"use client"

import * as React from "react"
import Image from "next/image"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, MoreHorizontalIcon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/overlay/dropdown-menu"
import { Input } from "@/components/forms/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/dataviz/table"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/feedback/progress"

export interface CourseListItem {
  id: string
  name: string
  category: string
  imageUrl?: string
  score: number
  progress: number
  started: boolean
}

export interface CoursesListTableProps {
  courses: CourseListItem[]
  title?: string
  onContinueCourse?: (courseId: string) => void
  onStartCourse?: (courseId: string) => void
  onViewDetails?: (courseId: string) => void
}

function createColumns(props: {
  onContinueCourse?: (id: string) => void
  onStartCourse?: (id: string) => void
  onViewDetails?: (id: string) => void
}): ColumnDef<CourseListItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Curso",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          {row.original.imageUrl && (
            <Image
              width={30}
              height={30}
              className="size-8 rounded"
              src={row.original.imageUrl}
              unoptimized
              alt={row.original.name}
            />
          )}
          <div className="capitalize">{row.getValue("name")}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Disciplina",
      cell: ({ row }) => row.getValue("category"),
    },
    {
      accessorKey: "score",
      header: "Aproveitamento",
      cell: ({ row }) => (
        <div className="flex items-center">
          <StarIcon className="mr-1 size-4 fill-yellow-500 text-yellow-500" />
          {(row.getValue("score") as number).toFixed(1)}
        </div>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progresso",
      cell: ({ row }) => <Progress className="h-2 w-20" value={row.getValue("progress")} />,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="text-end">
            {course.started ? (
              <Button
                size="sm"
                onClick={() => props.onContinueCourse?.(course.id)}
              >
                Continuar <ChevronRight />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => props.onStartCourse?.(course.id)}>
                    Iniciar Curso
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => props.onViewDetails?.(course.id)}>
                    Ver Detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      },
    },
  ]
}

export function CoursesListTable({
  courses,
  title = "Meus Cursos",
  onContinueCourse,
  onStartCourse,
  onViewDetails,
}: CoursesListTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo(
    () => createColumns({ onContinueCourse, onStartCourse, onViewDetails }),
    [onContinueCourse, onStartCourse, onViewDetails]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: courses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="col-start-auto row-start-auto mt-2 justify-self-start lg:col-start-2 lg:row-start-1 lg:mt-0 lg:justify-self-end">
          <Input
            placeholder="Buscar cursos"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="w-full sm:w-52"
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum curso encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} curso(s).
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
