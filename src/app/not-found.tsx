import Link from 'next/link';
import { EstadoHoja } from '@/components/ui/EstadoHoja';

export default function NotFound() {
  return (
    <main className="textura-papel flex min-h-screen items-center justify-center">
      <EstadoHoja
        etiqueta="Página no encontrada"
        titulo="Este enlace ya no existe"
        detalle="Puede que la invitación se haya reemplazado. Pide el enlace nuevo a quien te invitó."
        accion={
          <Link
            href="/"
            className="min-h-11 cursor-pointer text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
          >
            Ir al inicio
          </Link>
        }
      />
    </main>
  );
}
