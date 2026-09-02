import { NavegacionStaff } from '@/components/staff/NavegacionStaff';
import { BannerConexion } from '@/components/staff/BannerConexion';
import { RegistrarServiceWorker } from '@/components/staff/RegistrarServiceWorker';

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-tinta text-papel">
      <RegistrarServiceWorker />
      <BannerConexion />
      <div className="flex-1">{children}</div>
      <NavegacionStaff eventId={eventId} />
    </div>
  );
}
