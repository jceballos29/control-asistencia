import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="w-full h-full">
      <h1 className="font-bold text-xl">Control de Asistencia</h1>
      <Link to="/admin">Administración</Link>
    </div>
  );
}
