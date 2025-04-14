import { DataTable } from "@/components/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState
} from "@tanstack/react-table";
import { Check, Filter, LoaderCircle, Search, XIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { DataTableViewOptions } from "../../../../components/table/data-table-view-options";
import {
  createOffice,
  deleteOffice,
  getOffices,
  GetOfficesParams,
  updateOffice,
} from "../api";
import { CreateOfficeInput, createOfficeSchema, UpdateOfficeInput, updateOfficeSchema } from "../schema";
import { DayOfWeek, daysOfWeekOptions, Office } from "../types";
import { columns } from "./columns";
import OfficeUpsertForm from "./office-form";

const initialPagination: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};

const prepareFormDefaults = (
  office: Office | null
): Partial<UpdateOfficeInput | CreateOfficeInput> => {
  if (!office)
    return {
      name: "",
      workStartTime: "",
      workEndTime: "",
      workingDays: [],
    };

  return {
    name: office.name,
    workStartTime: office.workStartTime ?? "",
    workEndTime: office.workEndTime ?? "",
    workingDays: office.workingDays ?? [],
  };
};

function OfficeTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [pagination, setPagination] =
    React.useState<PaginationState>(initialPagination);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [workHoursFilter, setWorkHoursFilter] = React.useState({
    from: "",
    to: "",
  });
  const [workingDaysFilter, setWorkingDaysFilter] = React.useState<DayOfWeek[]>(
    []
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [officeToDelete, setOfficeToDelete] = React.useState<Office | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [officeToEdit, setOfficeToEdit] = React.useState<Office | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const queryClient = useQueryClient();
  const debouncedGlobalFilter = useDebounce(globalFilter, 300);

  React.useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === "workHours");
      const newValue = {
        from: workHoursFilter.from || undefined,
        to: workHoursFilter.to || undefined,
      };
      if (JSON.stringify(existing?.value) === JSON.stringify(newValue))
        return prev;

      const otherFilters = prev.filter((f) => f.id !== "workHours");
      if (newValue.from || newValue.to) {
        return [...otherFilters, { id: "workHours", value: newValue }];
      }
      return otherFilters;
    });
  }, [workHoursFilter, setColumnFilters]);

  React.useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === "workingDays");
      if (JSON.stringify(existing?.value) === JSON.stringify(workingDaysFilter))
        return prev;

      const otherFilters = prev.filter((f) => f.id !== "workingDays");
      if (workingDaysFilter.length > 0) {
        return [
          ...otherFilters,
          { id: "workingDays", value: workingDaysFilter },
        ];
      }
      return otherFilters;
    });
  }, [workingDaysFilter, setColumnFilters]);

  const apiParams = React.useMemo((): GetOfficesParams => {
    const params: GetOfficesParams = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    };
    if (debouncedGlobalFilter) {
      params.search = debouncedGlobalFilter;
    }
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id;
      params.sortOrder = sorting[0].desc ? "DESC" : "ASC";
    }
    const workStartTimeFilter = columnFilters.find((f) => f.id === "workHours"); // Asumiendo que filtramos por la columna 'workHours'
    if (
      workStartTimeFilter &&
      typeof workStartTimeFilter.value === "object" &&
      workStartTimeFilter.value !== null
    ) {
      const { from, to } = workStartTimeFilter.value as {
        from?: string;
        to?: string;
      };
      if (from) params.workStartTimeFrom = from;
      if (to) params.workStartTimeTo = to;
    }
    const workingDaysFilter = columnFilters.find((f) => f.id === "workingDays");
    if (
      workingDaysFilter &&
      Array.isArray(workingDaysFilter.value) &&
      workingDaysFilter.value.length > 0
    ) {
      params.filterWorkingDays = workingDaysFilter.value.join(",");
    }

    return params;
  }, [pagination, sorting, debouncedGlobalFilter, columnFilters]);

  const query = useQuery({
    queryKey: ["offices", apiParams],
    queryFn: () => getOffices(apiParams),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOffice,
    mutationKey: ["offices", "delete"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      setIsDeleteDialogOpen(false);
      setOfficeToDelete(null);
      toast.success("Consultorio eliminado correctamente");
    },
    onError: (error) => {
      console.error("Error al eliminar el consultorio:", error);
      setIsDeleteDialogOpen(false);
      setOfficeToDelete(null);
      toast.error(error.message || "No fue posible eliminar el consultorio");
    },
  });

  const editMutation = useMutation({
    mutationFn: (values: { id: string; data: UpdateOfficeInput }) =>
      updateOffice(values.id, values.data),
    mutationKey: ["offices", "edit"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices", apiParams] });
      setIsEditDialogOpen(false);
      setOfficeToEdit(null);
      toast.success("Consultorio actualizado correctamente");
    },
    onError: (error) => {
      console.error("Error al actualizar consultorio:", error);
      setIsEditDialogOpen(false);
      setOfficeToEdit(null);
      toast.error(error.message || "No fue posible actualizar el consultorio");
    },
  });

  const createMutation = useMutation({
    mutationFn: createOffice,
    mutationKey: ["offices", "create"],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices", apiParams] });
      setIsCreateDialogOpen(false);
      toast.success("Consultorio creado correctamente");
    },
    onError: (error) => {
      console.error("Error al crear el consultorio:", error);
      setIsCreateDialogOpen(false);
      toast.error(error.message || "No fue posible crear el consultorio");
    },
  });

  const handleDeleteClick = React.useCallback((office: Office) => {
    setOfficeToDelete(office);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!officeToDelete) return;
    await deleteMutation.mutateAsync(officeToDelete.id);
  };

  const handleEditClick = React.useCallback((office: Office) => {
    setOfficeToEdit(office); // Guarda la oficina a editar
    setIsEditDialogOpen(true); // Abre el diálogo de edición
  }, []);

  const handleEditFormSubmit = async (data: UpdateOfficeInput) => {
    if (!officeToEdit) return;
    await editMutation.mutateAsync({ id: officeToEdit.id, data });
  };

  const handleCreateFormSubmit = async (data: CreateOfficeInput) => {
    await createMutation.mutateAsync(data);
  };

  const officeData = query.data?.data ?? [];
  const paginationMeta = query.data?.meta;
  const pageCount = paginationMeta?.totalPages ?? -1;
  const isBackgroundLoading = query.isFetching && query.isPlaceholderData;
  const isInitialLoading = query.isLoading;

  const tableMeta = React.useMemo(
    () => ({
      handleDeleteClick,
      handleEditClick,
    }),
    [handleDeleteClick, handleEditClick]
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative w-xs w-max-xs">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={globalFilter ?? ""} // Usar el estado globalFilter de props
              onChange={(event) => setGlobalFilter(event.target.value)} // Llamar a la función de props
              className="w-full h-9 pl-8 pr-8"
              aria-label="Buscar" // Para accesibilidad
            />
            {!!globalFilter && (
              <Button
                type="button" // Importante para no enviar formularios si existe alguno
                variant="ghost" // Sin fondo, sutil
                size="icon" // Tamaño pequeño para icono
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-foreground" // Posición y estilo
                onClick={() => setGlobalFilter("")} // Llama al actualizador del padre con string vacío
                aria-label="Limpiar búsqueda" // Para accesibilidad
              >
                <XIcon className="h-4 w-4" /> {/* Icono X */}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 relative">
                <Filter className="h-4 w-4" />
                {/* Opcional: Mostrar un indicador si hay filtros activos */}
                {(workHoursFilter.from ||
                  workHoursFilter.to ||
                  workingDaysFilter.length > 0) && (
                  <span className="absolute right-0 top-0 flex h-3 w-3 -translate-y-1 translate-x-1 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              {/* Usamos Command como contenedor principal para estructura y padding */}
              <Command>
                <p className="text-sm font-medium px-4 pt-3 pb-2">
                  Filtrar Por:
                </p>
                <Separator />

                {/* --- Filtro Horas --- */}
                <div className="p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hora Inicio Laboral
                  </p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
                    <Label htmlFor="time-from" className="text-xs">
                      Desde:
                    </Label>
                    <Input
                      id="time-from"
                      type="time"
                      className="h-8 text-xs"
                      value={workHoursFilter.from}
                      onChange={(e) =>
                        setWorkHoursFilter((prev) => ({
                          ...prev,
                          from: e.target.value,
                        }))
                      }
                    />
                    <Label htmlFor="time-to" className="text-xs">
                      Hasta:
                    </Label>
                    <Input
                      id="time-to"
                      type="time"
                      className="h-8 text-xs"
                      value={workHoursFilter.to}
                      onChange={(e) =>
                        setWorkHoursFilter((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {/* Botón Limpiar Horas (opcional aquí o abajo) */}
                  {/* <Button variant="ghost" size="sm" className="w-full text-xs" onClick={()=>setWorkHoursFilter({from:'', to:''})}>Limpiar Horas</Button> */}
                </div>
                {/* ------------------- */}

                <Separator />

                {/* --- Filtro Días --- */}
                {/* Usamos CommandList/Group para consistencia visual */}
                <CommandList>
                  <CommandGroup heading="Días Laborales" className="p-2">
                    {daysOfWeekOptions.map((option) => {
                      const isSelected = workingDaysFilter.includes(
                        option.value
                      );
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            setTimeout(() => {
                              // <--- Verifica que este setTimeout esté aquí
                              if (isSelected) {
                                setWorkingDaysFilter((prev) =>
                                  prev.filter((v) => v !== option.value)
                                );
                              } else {
                                setWorkingDaysFilter((prev) => [
                                  ...prev,
                                  option.value,
                                ]);
                              }
                            }, 0); // Retraso 0
                          }}
                          className="text-xs"
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className={cn("h-4 w-4")} />
                          </div>
                          <span>{option.text}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
                {/* ------------------- */}

                {/* --- Botón Limpiar Todos --- */}
                {(workHoursFilter.from ||
                  workHoursFilter.to ||
                  workingDaysFilter.length > 0) && (
                  <>
                    <Separator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs justify-center"
                        onClick={() => {
                          setWorkHoursFilter({ from: "", to: "" });
                          setWorkingDaysFilter([]);
                        }}
                      >
                        Limpiar Todos los Filtros
                      </Button>
                    </div>
                  </>
                )}
                {/* -------------------------- */}
              </Command>
            </PopoverContent>
          </Popover>
          <DataTableViewOptions
            columns={columns} // Pasa la definición de columnas
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Agregar consultorio
          </Button>
        </div>
      </div>

      {isInitialLoading && <div>Cargando tabla...</div>}

      {query.isError && !isInitialLoading && (
        <div>Error al cargar datos: {(query.error as Error).message}</div>
      )}
      {(query.isSuccess || query.isPlaceholderData) && (
        <DataTable
          columns={columns}
          data={officeData}
          pageCount={pageCount}
          state={{
            // Pasa el estado controlado
            sorting,
            columnFilters,
            pagination,
            columnVisibility, // Pasa el estado de visibilidad
            // globalFilter no se pasa a state aquí, se maneja externamente
          }}
          // Pasa los setters
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          onPaginationChange={setPagination}
          onColumnVisibilityChange={setColumnVisibility} // Pasa el setter de visibilidad
          tableMeta={tableMeta} // Pasa el meta />
        />
      )}
      {/* <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(header.column.id === "actions" && "w-8")}
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
                    <TableCell key={cell.id}>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div> */}
      <div className="flex items-center justify-between">
        {isBackgroundLoading ? (
          <div className="flex items-center">
            <LoaderCircle className="h-4 w-4 text-muted-foreground animate-spin" />
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              Procesando...
            </span>
          </div>
        ) : (
          <div />
        )}
      </div>


      <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                el consultorio
                <strong className="mx-1">{officeToDelete?.name ?? ""}</strong> y
                todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOfficeToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-destructive hover:bg-destructive-hover text-white"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="text-left">
              <DialogTitle>Editar Consultorio</DialogTitle>
              <DialogDescription>
                Modifica los campos que desees actualizar para el consultorio
                <strong className="mx-1">{officeToEdit?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            {officeToEdit && (
              <OfficeUpsertForm
                key={officeToEdit.id}
                onSubmit={handleEditFormSubmit}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setOfficeToEdit(null);
                }}
                isPending={editMutation.isPending}
                defaultValues={prepareFormDefaults(officeToEdit)}
                schema={updateOfficeSchema}
                submitLabel="Actualizar Consultorio"
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="text-left">
              <DialogTitle>Agregar Consultorio</DialogTitle>
              <DialogDescription>
                Complete los campos para agregar un nuevo consultorio.
              </DialogDescription>
            </DialogHeader>
            {/* Renderiza OfficeForm configurado para CREAR */}
            <OfficeUpsertForm
              // key puede ser útil si quieres que se resetee al reabrir
              key={
                isCreateDialogOpen ? "create-form-open" : "create-form-closed"
              }
              schema={createOfficeSchema} // <--- Pasa el schema de CREAR
              onSubmit={(data) =>
                handleCreateFormSubmit(data as CreateOfficeInput)
              } // <--- Pasa el handler de CREAR
              onCancel={() => setIsCreateDialogOpen(false)}
              isPending={createMutation.isPending} // Estado pendiente de la mutación de CREAR
              defaultValues={prepareFormDefaults(null)} // <-- Pasa valores vacíos
              submitLabel="Agregar Consultorio" // Texto específico
            />
          </DialogContent>
        </Dialog>

    </div>
  );
}

export default OfficeTable;
