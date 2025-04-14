// src/features/offices/components/DataTableViewOptions.tsx
"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  ColumnDef,
  RowData,
  VisibilityState
} from "@tanstack/react-table";
import { Settings2 } from "lucide-react"; // O usa lucide-react icon

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData extends RowData, TValue>{
  // Pasa solo las columnas que se pueden ocultar
  columns: ColumnDef<TData, TValue>[];

  columnVisibility: VisibilityState;
  onColumnVisibilityChange: React.Dispatch<
    React.SetStateAction<VisibilityState>
  >;
}

export function DataTableViewOptions<TData extends RowData, TValue>({
  columns, // Usa las columnas pasadas
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableViewOptionsProps<TData, TValue>) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-9 lg:flex"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns // Filtra desde las definiciones
              .filter(
                (column) =>
                  typeof column.enableHiding !== "undefined" &&
                  column.enableHiding
              )
              .map((column) => {
                const columnId = column.id as string;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={columnVisibility[columnId] ?? true}
                    onCheckedChange={(value) => {
                      onColumnVisibilityChange((old) => ({
                         ...old,
                         [columnId]: !!value,
                      }));
                  }}
                  >
                    {typeof column.header === "string"
                      ? column.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
        {/* {columns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              // Usa el estado de visibilidad directamente
              checked={columnVisibility[column.id] ?? true} // Asume visible por defecto
              // Llama al setter con el estado actualizado
              onCheckedChange={(value) => {
                onColumnVisibilityChange((old) => ({
                  ...old,
                  [column.id]: !!value,
                }));
              }}
            >
              {getHeaderName(column)}
            </DropdownMenuCheckboxItem>
          );
        })} */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
