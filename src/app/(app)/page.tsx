// Inicio: placeholder hasta F03 (alta de auto) y F06 (dashboard).
export default function HomePage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Inicio</h1>
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <p className="font-semibold">Todavía no cargaste ningún auto</p>
        <p className="mt-1 text-sm text-text-2">
          Cuando lo cargues, acá vas a ver los km estimados y los próximos vencimientos.
        </p>
      </div>
    </>
  );
}
