import type { ButtonHTMLAttributes } from 'react';

type Variante = 'principal' | 'contorno' | 'texto';

const ESTILOS: Record<Variante, string> = {
  principal: 'bg-vino text-papel-alto hover:bg-vino-hondo border border-vino-hondo',
  contorno: 'bg-transparent text-vino border border-borde hover:border-vino hover:bg-papel-alto',
  texto: 'bg-transparent text-tinta-suave border border-transparent hover:text-vino',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
};

export function Boton({ variante = 'principal', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[2px] px-5 text-sm font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
    />
  );
}
