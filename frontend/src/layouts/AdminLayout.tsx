import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b pb-6">
        <p className="text-primary text-sm font-semibold">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Platform control
        </h1>
      </div>
      <Outlet />
    </div>
  );
}
