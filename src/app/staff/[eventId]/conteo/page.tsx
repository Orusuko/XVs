import { redirect } from 'next/navigation';
import { readStaffSession } from '@/lib/staff-session';
import { VistaConteo } from '@/components/staff/VistaConteo';

export const dynamic = 'force-dynamic';

export default async function ConteoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  if (!(await readStaffSession(eventId))) {
    redirect(`/staff/${eventId}/login`);
  }

  return <VistaConteo eventId={eventId} />;
}
