// src/routes/admin/offices/$officeId.tsx

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Verifica la ruta
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Importar si se usa para el botón Agregar
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobPositionsManager } from "@/features/admin/job-positions/components/job-positions-manager";
import { getOfficeById } from "@/features/admin/offices/api";
import {
  DayOfWeek,
  daysOfWeekOptions, // Asegúrate que use 'label' o 'text' consistentemente
  Office,
} from "@/features/admin/offices/types";
import { getNonWorkingDayNumbers } from "@/features/admin/offices/utils"; // Verifica ruta
import {
  createTimeSlot,
  deleteTimeSlot,
  updateTimeSlot,
} from "@/features/admin/time-slots/api"; // Ajustado a timeslots
import { TimeSlotForm } from "@/features/admin/time-slots/components/time-slot-form"; // Ajustado a timeslots
import {
  CreateTimeSlotInput,
  createTimeSlotSchema,
  UpdateTimeSlotInput,
  updateTimeSlotSchema,
} from "@/features/admin/time-slots/schema"; // Ajustado a timeslots
import { TimeSlot } from "@/features/admin/time-slots/types"; // O desde timeslots/types
import { cn, formatTimeAmPm, parseTimeToMinutes } from "@/lib/utils"; // Verifica ruta
import {
  queryOptions,
  useMutation,
  useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Notebook,
  Pencil,
  PlusCircle,
  Trash2,
  UsersIcon,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

const officeDetailQueryOptions = (officeId: string) =>
  queryOptions<Office, Error>({
    queryKey: ["offices", officeId],
    queryFn: async () => await getOfficeById(officeId),
  });

export const Route = createFileRoute("/admin/offices/$officeId")({
  loader: async ({ params: { officeId }, context: { queryClient } }) => {
    const options = officeDetailQueryOptions(officeId);
    const office = await queryClient.ensureQueryData(options);
    return {
      office,
      // Devuelve el nombre para el breadcrumb si es necesario por el loader
      breadcrumbTitle: office?.name ?? "Detalle",
    };
  },
  pendingComponent: () => <div className="p-4">Cargando detalles...</div>,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-500">Error: {error.message}</div>
  ),
  component: RouteComponent,
  // Define staticData para el breadcrumb si el loader no lo hace o como fallback/icono
  staticData: {
    // crumb: 'officeDetail', // Si usas ID estático para buscar icono/título base
    breadcrumbIcon: Building, // Ejemplo de icono estático
  },
});

// Helper fuera o dentro, asegura que use 'label' o 'text' según tu array
const getDayLabel = (dayValue: DayOfWeek): string => {
  return (
    daysOfWeekOptions.find((opt) => opt.value === dayValue)?.text || dayValue
  );
};

// Helper para preparar valores default del form, manejando null -> ''
const prepareSlotFormDefaults = (
  slot: TimeSlot | null
): Partial<CreateTimeSlotInput> => {
  if (!slot) {
    return { startTime: "", endTime: "" };
  }
  return {
    startTime: slot.startTime ?? "",
    endTime: slot.endTime ?? "",
  };
};

// Helper para defaults de creación, usando el último slot o el inicio de oficina
const getDefaultStartTimeForNewSlot = (
  office: Office | null | undefined
): string => {
  if (!office?.timeSlots || office.timeSlots.length === 0) {
    return office?.workStartTime ?? "";
  }
  const sortedSlots = [...office.timeSlots].sort((a, b) =>
    (a.endTime ?? "").localeCompare(b.endTime ?? "")
  );
  const lastEndTime = sortedSlots[sortedSlots.length - 1]?.endTime;
  return lastEndTime ?? office?.workStartTime ?? "";
};

function RouteComponent() {
  const { officeId } = Route.useParams();
  const { data: office } = useSuspenseQuery(officeDetailQueryOptions(officeId));
  const queryClient = useQueryClient();

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isCreateSlotDialogOpen, setIsCreateSlotDialogOpen] =
    React.useState(false);
  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = React.useState(false);
  const [slotToEdit, setSlotToEdit] = React.useState<TimeSlot | null>(null);
  const [isDeleteSlotDialogOpen, setIsDeleteSlotDialogOpen] =
    React.useState(false);
  const [slotToDelete, setSlotToDelete] = React.useState<TimeSlot | null>(null);
  const [isJobPositionsDialogOpen, setIsJobPositionsDialogOpen] =
    React.useState(false);

  const isOfficeScheduleFull = React.useMemo(() => {
    const officeStartMinutes = parseTimeToMinutes(office.workStartTime);
    const officeEndMinutes = parseTimeToMinutes(office.workEndTime);

    // Si las horas de oficina no son válidas o no están definidas, no podemos determinarlo.
    // Habilitamos el botón por defecto en este caso.
    if (
      isNaN(officeStartMinutes) ||
      isNaN(officeEndMinutes) ||
      officeEndMinutes <= officeStartMinutes
    ) {
      return false;
    }
    // Duración total del horario laboral en minutos
    const officeDuration = officeEndMinutes - officeStartMinutes;

    // Si no hay slots, definitivamente no está lleno
    if (!office.timeSlots || office.timeSlots.length === 0) {
      return false;
    }

    // Sumar la duración de todos los slots existentes
    let totalSlotsDuration = 0;
    for (const slot of office.timeSlots) {
      const slotStartMinutes = parseTimeToMinutes(slot.startTime);
      const slotEndMinutes = parseTimeToMinutes(slot.endTime);

      // Si un slot tiene horas inválidas, lo ignoramos en la suma
      // (o podrías decidir que esto significa que no está lleno: return false)
      if (
        isNaN(slotStartMinutes) ||
        isNaN(slotEndMinutes) ||
        slotEndMinutes <= slotStartMinutes
      ) {
        console.warn(
          "Franja horaria inválida encontrada al calcular duración total:",
          slot
        );
        continue; // Ignora este slot inválido
      }
      totalSlotsDuration += slotEndMinutes - slotStartMinutes;
    }

    // Deshabilita el botón si la suma de duraciones de los slots
    // es igual o mayor que la duración total del horario de oficina
    return totalSlotsDuration >= officeDuration;

    // Recalcula solo si cambian las horas de oficina o los slots
  }, [office.workStartTime, office.workEndTime, office.timeSlots]);

  // --- Mutaciones ---
  const createSlotMutation = useMutation({
    mutationFn: (newData: CreateTimeSlotInput) =>
      createTimeSlot(officeId, newData),
    onSuccess: () => {
      setIsCreateSlotDialogOpen(false);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["offices", officeId] });
      }, 0);
      toast.success("Franja horaria agregada.");
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo agregar la franja.");
    },
  });

  const editSlotMutation = useMutation({
    mutationFn: (variables: {
      timeSlotId: string;
      data: UpdateTimeSlotInput;
    }) => updateTimeSlot(officeId, variables.timeSlotId, variables.data),
    onSuccess: () => {
      setIsEditSlotDialogOpen(false);
      setSlotToEdit(null);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["offices", officeId] });
      }, 0);
      toast.success("Franja horaria actualizada.");
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo actualizar la franja.");
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (timeSlotId: string) => deleteTimeSlot(officeId, timeSlotId),
    onSuccess: () => {
      setIsDeleteSlotDialogOpen(false);
      setSlotToDelete(null);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["offices", officeId] });
      }, 0);
      toast.success("Franja horaria eliminada.");
    },
    onError: (error) => {
      setSlotToDelete(null);
      setIsDeleteSlotDialogOpen(false);
      toast.error(error.message || "No se pudo eliminar la franja.");
    },
  });

  // --- Handlers ---
  const handleCreateSlotSubmit = (data: CreateTimeSlotInput) => {
    createSlotMutation.mutate(data);
  };

  const handleEditSlotClick = (slot: TimeSlot) => {
    setSlotToEdit(slot);
    setIsEditSlotDialogOpen(true);
  };

  const handleEditFormSubmit = (data: UpdateTimeSlotInput) => {
    if (!slotToEdit) return;
    editSlotMutation.mutate({ timeSlotId: slotToEdit.id, data });
  };

  const handleDeleteSlotClick = (slot: TimeSlot) => {
    setSlotToDelete(slot);
    setIsDeleteSlotDialogOpen(true);
  };

  const handleDeleteSlotConfirm = () => {
    if (!slotToDelete) return;
    deleteSlotMutation.mutate(slotToDelete.id);
  };

  const createSlotDefaultValues = React.useMemo(
    (): Partial<CreateTimeSlotInput> => ({
      startTime: getDefaultStartTimeForNewSlot(office),
      endTime: "",
    }),
    [office]
  );

  // --- Renderizado ---
  return (
    <div className="w-full h-full grow overflow-hidden">
      {/* Breadcrumbs se renderiza en un layout superior */}
      <div className="w-full h-full grid grid-cols-4 gap-4">
        {/* Columna Izquierda (3/4) */}
        <div className="w-full col-span-3 flex flex-col gap-4">
          {/* Header */}
          <header className="mb-2 flex justify-between items-start">
            <div>
              <h4 className="flex items-center text-sm text-muted-foreground font-medium">
                <Building className="w-4 h-4 mr-2 inline" /> Consultorio
              </h4>
              <h3 className="text-3xl font-medium text-gray-900">
                {office?.name}
              </h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/offices">
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver
              </Link>
            </Button>
          </header>

          {/* Contenido Principal */}
          <div className="space-y-6">
            {/* Sección Horario/Días */}
            <section
              id="workingDays"
              className="flex items-center text-sm gap-4 flex-wrap"
            >
              <p className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground inline" />
                <span>{`${formatTimeAmPm(
                  office.workStartTime
                )} - ${formatTimeAmPm(office.workEndTime)}`}</span>
              </p>
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground inline" />
                <div className="flex items-center flex-wrap gap-1">
                  {office.workingDays && office.workingDays.length > 0 ? (
                    office.workingDays
                      .sort(
                        (a, b) =>
                          daysOfWeekOptions.findIndex(
                            (opt) => opt.value === a
                          ) -
                          daysOfWeekOptions.findIndex((opt) => opt.value === b)
                      )
                      .map((day) => (
                        <Badge key={day} className="rounded-sm text-xs">
                          {getDayLabel(day)}
                        </Badge>
                      ))
                  ) : (
                    <span className="italic text-muted-foreground">
                      No especificados
                    </span>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Sección Franjas Horarias */}
            <section id="timeSlots">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground inline" />
                  Franjas Horarias
                </h4>
                <Dialog
                  open={isCreateSlotDialogOpen}
                  onOpenChange={setIsCreateSlotDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={isOfficeScheduleFull}
                      title={
                        isOfficeScheduleFull
                          ? "El horario laboral ya está cubierto por las franjas existentes"
                          : "Agregar nueva franja horaria"
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Franja
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Franja Horaria</DialogTitle>
                      <DialogDescription>
                        Define la hora de inicio y fin para la nueva franja.
                        Asegúrate de que esté dentro del horario laboral (
                        {formatTimeAmPm(office.workStartTime)} -{" "}
                        {formatTimeAmPm(office.workEndTime)}).
                      </DialogDescription>
                    </DialogHeader>
                    <TimeSlotForm
                      key={
                        isCreateSlotDialogOpen
                          ? "create-slot-open"
                          : "create-slot-closed"
                      }
                      schema={createTimeSlotSchema}
                      onSubmit={(data) =>
                        handleCreateSlotSubmit(data as CreateTimeSlotInput)
                      }
                      onCancel={() => setIsCreateSlotDialogOpen(false)}
                      isPending={createSlotMutation.isPending}
                      defaultValues={createSlotDefaultValues}
                      officeStartTime={office.workStartTime ?? ""}
                      officeEndTime={office.workEndTime ?? ""}
                      submitButtonText="Agregar Franja"
                    />
                  </DialogContent>
                </Dialog>
              </div>
              {/* Visualización Slots */}
              {office.timeSlots && office.timeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {office.timeSlots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <Badge
                        key={slot.id}
                        variant="outline"
                        className="text-xs flex items-center justify-center gap-1 px-3 py-4 relative group overflow-hidden cursor-default"
                      >
                        <span className="transition-opacity group-hover:opacity-30">
                          {`${formatTimeAmPm(
                            slot.startTime
                          )} - ${formatTimeAmPm(slot.endTime)}`}
                        </span>
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center gap-2 md:gap-4",
                            "bg-background/70 backdrop-blur-[2px]",
                            "invisible opacity-0 group-hover:visible group-hover:opacity-100",
                            "transition-all duration-300 ease-in-out"
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-foreground/80 hover:text-foreground",
                              "transition-all duration-300 ease-in-out",
                              "transform -translate-x-10",
                              "group-hover:translate-x-0"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSlotClick(slot);
                            }}
                            aria-label="Editar franja"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-destructive/80 hover:text-destructive",
                              "transition-all duration-300 ease-in-out",
                              "transform translate-x-10",
                              "group-hover:translate-x-0"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlotClick(slot);
                            }}
                            aria-label="Eliminar franja"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Badge>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic pt-2">
                  No hay franjas horarias definidas.
                </p>
              )}
            </section>

            <Separator />

            {/* Sección Tabs Empleados/Pacientes */}
            <section id="integrant">
              <Tabs defaultValue="employees">
                <TabsList>
                  <TabsTrigger value="employees">Empleados</TabsTrigger>
                  <TabsTrigger value="patients">Pacientes</TabsTrigger>
                </TabsList>
                <TabsContent value="employees" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Empleados Asignados</h4>
                    <Dialog
                      open={isJobPositionsDialogOpen}
                      onOpenChange={setIsJobPositionsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Gestionar Puestos
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            Gestionar Puestos de Trabajo
                          </DialogTitle>
                        </DialogHeader>
                        <JobPositionsManager officeId={officeId} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  {/* Añadido margen */}
                  {/* TODO: Tabla/Lista de empleados asignados */}
                  <p className="text-sm text-muted-foreground italic">
                    No hay empleados asignados.
                  </p>
                </TabsContent>
                <TabsContent value="patients" className="mt-4">
                  {/* Añadido margen */}
                  {/* TODO: Tabla/Lista de pacientes */}
                  <p className="text-sm text-muted-foreground italic">
                    No hay pacientes registrados para este consultorio.
                  </p>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>

        {/* Columna Derecha (1/4) */}
        <Card className="h-full shadow-none rounded-md bg-muted/20 dark:bg-card">
          {/* Ajustado BG */}
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              {/* Ajustado tamaño título */}
              <Notebook className="h-4 w-4 mr-2 text-muted-foreground inline" />
              Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-sm border bg-background" // Estilo consistente
              disabled={
                office.workingDays
                  ? { dayOfWeek: getNonWorkingDayNumbers(office.workingDays) }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* --- Diálogos Edit/Delete Slot (Fuera del grid principal) --- */}
      <Dialog
        open={isEditSlotDialogOpen}
        onOpenChange={setIsEditSlotDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Franja Horaria</DialogTitle>
            <DialogDescription>
              Modifica la hora de inicio y fin. Asegúrate de que esté dentro del
              horario laboral ({formatTimeAmPm(office.workStartTime)} -{" "}
              {formatTimeAmPm(office.workEndTime)}).
            </DialogDescription>
          </DialogHeader>
          {slotToEdit && (
            <TimeSlotForm
              key={slotToEdit.id}
              schema={updateTimeSlotSchema}
              onSubmit={handleEditFormSubmit} // <-- Pasado directamente
              onCancel={() => {
                setIsEditSlotDialogOpen(false);
                setSlotToEdit(null);
              }}
              isPending={editSlotMutation.isPending}
              defaultValues={prepareSlotFormDefaults(slotToEdit)} // Usa helper
              officeStartTime={office.workStartTime ?? ""}
              officeEndTime={office.workEndTime ?? ""}
              submitButtonText="Actualizar Franja"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteSlotDialogOpen}
        onOpenChange={setIsDeleteSlotDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Franja Horaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la franja
              <strong className="mx-1">
                {formatTimeAmPm(slotToDelete?.startTime)} -{" "}
                {formatTimeAmPm(slotToDelete?.endTime)}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSlotToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlotConfirm}
              disabled={deleteSlotMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteSlotMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --------------------------------- */}
    </div>
  );
}
