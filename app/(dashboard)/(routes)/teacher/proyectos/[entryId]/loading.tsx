/** Se ve al instante mientras llega el registro. */
export default function Loading() {
  return (
    <div className="p-6 animate-pulse" aria-busy="true" aria-label="Cargando registro">
      <div className="h-5 w-24 rounded-full bg-slate-100" />
      <div className="mt-3 h-8 w-72 max-w-full rounded bg-slate-100" />
      <div className="mt-3 h-4 w-56 max-w-full rounded bg-slate-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        {[0, 1].map((column) => (
          <div key={column} className="space-y-6">
            {[0, 1, 2].map((card) => (
              <div key={card} className="h-24 rounded-md border bg-slate-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
