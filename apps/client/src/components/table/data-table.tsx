// src/components/ui/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  RowData, // Importar RowData
  TableMeta, // Importar TableMeta si la declaración global funciona
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Componentes UI
import { DataTablePagination } from "./data-table-pagination"; // Asume que está en ui
import { cn } from "@/lib/utils"; // Importa cn

// Declarar TData aquí mismo si la declaración global no funciona bien
// declare module '@tanstack/react-table' {
//   interface TableMeta<TData extends RowData> {
//     handleDeleteClick?: (rowData: TData) => void;
//     handleEditClick?: (rowData: TData) => void;
//   }
// }

// Props del componente genérico
interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  // Estado controlado desde el padre
  state: {
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    pagination: PaginationState;
    columnVisibility?: VisibilityState; // Hacer opcional si no siempre se usa
    // globalFilter no es necesario aquí si el filtrado es manual/externo
  };
  // Setters para actualizar el estado en el padre
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>;
  onColumnFiltersChange: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>;
  onColumnVisibilityChange?: React.Dispatch<React.SetStateAction<VisibilityState>>; // Opcional
  // Meta para pasar funciones/datos a las celdas/headers
  tableMeta?: TableMeta<TData>;
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  pageCount,
  state,
  onSortingChange,
  onColumnFiltersChange, // Recibido pero no usado directamente por useReactTable si manualFiltering=true
  onPaginationChange,
  onColumnVisibilityChange,
  tableMeta,
}: DataTableProps<TData, TValue>) {

  // Estado local solo para visibilidad si se prefiere gestionarlo aquí
  // const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
        // Pasa todo el estado recibido del padre
        ...state,
        // Si gestionas visibilidad localmente:
        // columnVisibility: columnVisibility ?? state.columnVisibility,
    },
    // Pasar los setters al hook
    onSortingChange: onSortingChange,
    onColumnFiltersChange: onColumnFiltersChange, // Necesario para que la tabla sepa que hay filtros
    onPaginationChange: onPaginationChange,
    onColumnVisibilityChange: onColumnVisibilityChange, // O setColumnVisibility si es local
    // Pasar el meta
    meta: tableMeta,
    // Modelos necesarios
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Útil para info de paginación
    getSortedRowModel: getSortedRowModel(),     // Útil para estado de ordenación
    getFilteredRowModel: getFilteredRowModel(), // Útil para estado de filtros
    // Indicar que las operaciones principales son manuales (hechas en el backend)
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    // Opcional: debug
    // debugTable: true,
  });

  return (
    <div className="w-full space-y-4">
      {/* La BARRA DE HERRAMIENTAS (filtros, búsqueda, etc.) se renderizará en el componente PADRE */}

      {/* --- Tabla --- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      // Aplicar ancho específico para la columna de acciones si se usa esa convención
                      className={cn(header.column.id === "actions" && "w-8")}
                      // Alternativa usando size:
                      // style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                       // Aplicar ancho específico para la columna de acciones
                       className={cn(cell.column.id === "actions" && "w-8")}
                       // Alternativa usando size:
                       // style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  // Colspan debe usar el número actual de columnas visibles
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Paginación --- */}
      {/* Renderiza el componente de paginación, pasándole la instancia de la tabla */}
       <DataTablePagination table={table} />
    </div>
  );
}