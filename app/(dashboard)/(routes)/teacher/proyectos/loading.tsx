/** Se ve al instante mientras llega la tabla de registros. */
export default function Loading() {
    return (
        <div className="p-6 animate-pulse" aria-busy="true" aria-label="Cargando registros">
            <div className="h-10 border-b" />
            <div className="flex items-center justify-between py-4">
                <div className="h-10 w-full max-w-sm rounded-md bg-slate-100" />
                <div className="h-10 w-40 rounded-md bg-slate-100" />
            </div>
            <div className="rounded-md border">
                {Array.from({ length: 6 }, (_, row) => (
                    <div key={row} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
                        <div className="h-4 flex-1 rounded bg-slate-100" />
                        <div className="h-4 w-24 rounded bg-slate-100" />
                        <div className="h-4 w-20 rounded bg-slate-100" />
                    </div>
                ))}
            </div>
        </div>
    );
}
