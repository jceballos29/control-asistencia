import OfficeTable from "@/features/admin/offices/components/office-table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/offices/")({
  component: RouteComponent,
});

function RouteComponent() {

  return (
    <div className="w-full">
      <header className="w-full flex justify-between items-center mb-4">
        <h3 className="font-bold text-2xl">Consultorios</h3>
      </header>
      <OfficeTable />
    </div>
  );
}
