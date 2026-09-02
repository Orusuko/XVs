import { FormularioPin } from '@/components/staff/FormularioPin';

export const dynamic = 'force-dynamic';

export default async function StaffLoginPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-tinta px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro-claro">
          Control de acceso
        </p>
        <h1 className="mt-3 font-display text-3xl text-papel">Entra con tu PIN</h1>
        <p className="mt-2 text-sm text-papel/70">
          Usa el PIN que te dio el organizador. Tu sesión dura toda la noche.
        </p>

        <div className="mt-8">
          <FormularioPin eventId={eventId} />
        </div>
      </div>
    </main>
  );
}
