import { redirect } from 'next/navigation';
import { readStaffSession } from '@/lib/staff-session';
import { VistaEscaner } from '@/components/staff/VistaEscaner';

export const dynamic = 'force-dynamic';

export default async function EscanerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  if (!(await readStaffSession(eventId))) {
    redirect(`/staff/${eventId}/login`);
  }

  return <VistaEscaner eventId={eventId} />;
}
