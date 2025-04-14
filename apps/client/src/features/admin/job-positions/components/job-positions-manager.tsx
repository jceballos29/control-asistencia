import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJobPositionsForOffice,
  createJobPosition,
  deleteJobPosition,
} from "../api";
import { JobPositionCreateForm } from "./job-position-create-form";
import type { CreateJobPositionInput } from "../schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { JobPosition } from "../types";
import React from "react";
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

interface JobPositionsManagerProps {
  officeId: string;
}

export function JobPositionsManager({ officeId }: JobPositionsManagerProps) {
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [jobPositionToDelete, setJobPositionToDelete] =
    React.useState<JobPosition | null>(null);

  const {
    data: jobPositions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["jobPositions", officeId],
    queryFn: () => getJobPositionsForOffice(officeId),
  });

  const createMutation = useMutation({
    mutationFn: (newData: CreateJobPositionInput) =>
      createJobPosition(officeId, newData),
    onSuccess: (newPosition) => {
      toast.success(`Puesto "${newPosition.name}" creado.`);
      queryClient.invalidateQueries({ queryKey: ["jobPositions", officeId] });
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo crear el puesto.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (jobPositionId: string) =>
      deleteJobPosition(officeId, jobPositionId),
    onSuccess: () => {
      toast.success("Puesto de trabajo eliminado.");
      queryClient.invalidateQueries({ queryKey: ["jobPositions", officeId] }); // Refresca lista
      setIsDeleteDialogOpen(false); // Cierra diálogo confirmación
      setJobPositionToDelete(null); // Limpia estado
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo eliminar el puesto.");
      setIsDeleteDialogOpen(false); // Cierra diálogo confirmación
      setJobPositionToDelete(null);
    },
  });

  const handleCreateSubmit = (data: CreateJobPositionInput) => {
    createMutation.mutate(data);
  };

  const handleDeleteClick = (jp: JobPosition) => {
    setJobPositionToDelete(jp); // Guarda el puesto a eliminar
    setIsDeleteDialogOpen(true); // Abre el diálogo de confirmación
  };

  const handleDeleteConfirm = () => {
    if (!jobPositionToDelete) return;
    deleteMutation.mutate(jobPositionToDelete.id); // Llama a la mutación
  };

  return (
    <>
      <div className="space-y-4 max-h-[60vh] flex flex-col">
        <div className="px-6 pt-4">
          <JobPositionCreateForm
            onSubmit={handleCreateSubmit}
            isPending={createMutation.isPending}
          />
        </div>
        <Separator />
        <div className="flex-grow overflow-y-auto px-6 pb-4">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Puestos Existentes
          </h4>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          )}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {jobPositions && jobPositions.length > 0 && (
            <ul className="space-y-2">
              {jobPositions.map((jp) => (
                <li
                  key={jp.id}
                  className="flex items-center justify-between border rounded-md p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-4 w-4 rounded-full border"
                      style={{ backgroundColor: jp.color }}
                      title={`Color: ${jp.color}`}
                    ></span>
                    <span>{jp.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive/80 hover:text-destructive"
                      onClick={() => handleDeleteClick(jp)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {jobPositions && jobPositions.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              No hay puestos de trabajo definidos.
            </p>
          )}
        </div>
      </div>
      {/* --- AlertDialog para Confirmar Eliminación --- */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el puesto de
              trabajo
              <strong className="mx-1">{jobPositionToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobPositionToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending} // Deshabilita durante la eliminación
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar Puesto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --------------------------------------------- */}
    </>
  );
}
