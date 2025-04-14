import { type ColumnDef } from "@tanstack/react-table";
import type { Office, DayOfWeek } from "../types";
import { daysOfWeekOptions } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimeAmPm } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

const getDayLabel = (dayValue: DayOfWeek): string => {
  const option = daysOfWeekOptions.find((opt) => opt.value === dayValue);
  return option?.text || dayValue;
};

export const columns: ColumnDef<Office>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Seleccionar ${row.getValue("name")}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          style={{ paddingInline: 0 }}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    id: "workStartTime",
    accessorKey: "workStartTime",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          style={{ paddingInline: 0 }}
        >
          Hora Inicio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const startTime = row.getValue("workStartTime") as string | null;
      return formatTimeAmPm(startTime);
    },
  },
  {
    id: "workEndTime",
    accessorKey: "workEndTime",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          style={{ paddingInline: 0 }}
        >
          Hora Fin
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const startTime = row.getValue("workEndTime") as string | null;
      return formatTimeAmPm(startTime);
    },
  },
  {
    id: "workingDays",
    accessorKey: "workingDays",
    header: "Días Laborales",
    cell: ({ row }) => {
      const days = row.getValue("workingDays") as DayOfWeek[] | null;
      if (!days || days.length === 0) {
        return (
          <span className="text-muted-foreground italic">No especificados</span>
        );
      }
      return (
        <div className="flex flex-wrap gap-1">
          {days
            .sort(
              (a, b) =>
                daysOfWeekOptions.findIndex((opt) => opt.value === a) -
                daysOfWeekOptions.findIndex((opt) => opt.value === b)
            )
            .map((day) => (
              <Badge key={day} variant="secondary">
                {getDayLabel(day)}
              </Badge>
            ))}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "timeSlotsCount",
    accessorKey: "timeSlotsCount",
    header: "Franjas",
    cell: ({ row }) => {
      const count = row.getValue("timeSlotsCount") as number;
      return <div className="text-left">{count ?? 0}</div>;
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    enableColumnFilter: false,
    size: 80,
    cell: ({ row, table }) => {
      const office = row.original as Office;
      const handleDelete = () => {
        table.options.meta?.handleDeleteClick?.(office);
      };
      const handleEdit = () => {
        table.options.meta?.handleEditClick?.(office);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              className="text-muted-foreground focus:text-muted-foreground"
              asChild
            >
              <Link
                to="/admin/offices/$officeId"
                params={{ officeId: office.id }}
              >
                <Eye className="h-4 w-4" />
                Detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-muted-foreground focus:text-muted-foreground"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h4- w-4 text-destructive" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
