import { redirect } from 'next/navigation';
import { readStaffSession } from '@/lib/staff-session';
import { VistaHistorial } from '@/components/staff/VistaHistorial';

export const dynamic = 'force-dynamic';

export default async function HistorialPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  if (!(await readStaffSession(eventId))) {
    redirect(`/staff/${eventId}/login`);
  }

  return <VistaHistorial eventId={eventId} />;
}
