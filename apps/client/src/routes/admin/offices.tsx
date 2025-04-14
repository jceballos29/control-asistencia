import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/offices")({
  component: RouteComponent,
  loader: () => {
    return {
      crumb: "Consultorios",
    };
  },
});

function RouteComponent() {
  return (
    <div className="w-full grow">
      <Outlet />
    </div>
  );
}
