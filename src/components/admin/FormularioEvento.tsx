'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';
import { SelectorMensaje } from '@/components/admin/SelectorMensaje';
import { MENSAJES_INVITACION, esMensajeCatalogo } from '@/lib/mensajes-invitacion';
import { CLAVE_FOTO_CONFIG, CLAVE_VESTIMENTA_CONFIG } from '@/lib/templates/catalogo';
import type { EventRow, Lugar, Padrino } from '@/lib/types';

const LUGAR_VACIO: Lugar = { nombre: '', direccion: '', maps_url: '', fecha_hora: '' };

type Props = {
  evento?: Pick<
    EventRow,
    | 'id'
    | 'quinceanera_nombre'
    | 'padre'
    | 'madre'
    | 'padrinos'
    | 'mensaje'
    | 'misa'
    | 'recepcion'
    | 'capacidad_total'
    | 'template_config'
  >;
};

function paraInputLocal(iso: string): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

export function FormularioEvento({ evento }: Props) {
  const router = useRouter();

  const [quinceanera, setQuinceanera] = useState(evento?.quinceanera_nombre ?? '');
  const [padre, setPadre] = useState(evento?.padre ?? '');
  const [madre, setMadre] = useState(evento?.madre ?? '');
  const [padrinos, setPadrinos] = useState<Padrino[]>(evento?.padrinos ?? []);
  const [mensaje, setMensaje] = useState(evento?.mensaje ?? MENSAJES_INVITACION[0]!);
  const [mensajePropio, setMensajePropio] = useState(
    Boolean(evento?.mensaje && !esMensajeCatalogo(evento.mensaje)),
  );
  const [misa, setMisa] = useState<Lugar>(evento?.misa ?? LUGAR_VACIO);
  const [recepcion, setRecepcion] = useState<Lugar>(evento?.recepcion ?? LUGAR_VACIO);
  const [capacidad, setCapacidad] = useState(evento?.capacidad_total?.toString() ?? '');
  const [fotoUrl, setFotoUrl] = useState(evento?.template_config?.[CLAVE_FOTO_CONFIG] ?? '');
  const [vestimenta, setVestimenta] = useState(
    evento?.template_config?.[CLAVE_VESTIMENTA_CONFIG] ?? '',
  );
  const [fotoPreviewRota, setFotoPreviewRota] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mostrarPreviewFoto = /^https:\/\//.test(fotoUrl.trim()) && !fotoPreviewRota;

  async function guardar(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setGuardando(true);
    setError(null);

    const cuerpo = {
      id: evento?.id,
      quinceanera_nombre: quinceanera.trim(),
      padre: padre.trim() || null,
      madre: madre.trim() || null,
      padrinos: padrinos.filter((p) => p.nombre.trim() !== ''),
      mensaje: mensaje.trim() || null,
      misa: misa.nombre.trim() ? { ...misa, fecha_hora: aIso(misa.fecha_hora) } : null,
      recepcion: recepcion.nombre.trim()
        ? { ...recepcion, fecha_hora: aIso(recepcion.fecha_hora) }
        : null,
      capacidad_total: capacidad ? Number(capacidad) : null,
      template_config: {
        ...(evento?.template_config ?? {}),
        [CLAVE_FOTO_CONFIG]: fotoUrl.trim(),
        [CLAVE_VESTIMENTA_CONFIG]: vestimenta.trim(),
      },
    };

    const respuesta = await fetch('/api/events', {
      method: evento ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    const datos = await respuesta.json();
    setGuardando(false);

    if (!respuesta.ok) {
      setError(datos.error ?? 'No pudimos guardar los datos.');
      return;
    }

    router.push(`/admin/evento/${evento?.id ?? datos.id}/invitados`);
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="space-y-10">
      <Seccion titulo="La quinceañera">
        <Campo etiqueta="Nombre" valor={quinceanera} onCambio={setQuinceanera} requerido />
        <div>
          <Campo
            etiqueta="Foto de la quinceañera"
            valor={fotoUrl}
            onCambio={(valor) => {
              setFotoUrl(valor);
              setFotoPreviewRota(false);
            }}
            ayuda="Sube la foto a Drive o Imgur, abre la imagen a pantalla completa y pega el enlace que termina en .jpg o .png."
          />
          {mostrarPreviewFoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl.trim()}
              alt=""
              className="mt-3 aspect-[4/5] max-h-48 w-auto object-cover"
              onError={() => setFotoPreviewRota(true)}
            />
          )}
          {fotoPreviewRota && /^https:\/\//.test(fotoUrl.trim()) && (
            <p className="mt-2 text-sm text-alerta">
              Este enlace no muestra una imagen. Prueba otro.
            </p>
          )}
        </div>
        <Campo
          etiqueta="Código de vestimenta"
          valor={vestimenta}
          onCambio={setVestimenta}
          placeholder="Formal, no blanco"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Padre" valor={padre} onCambio={setPadre} />
          <Campo etiqueta="Madre" valor={madre} onCambio={setMadre} />
        </div>
      </Seccion>

      <Seccion titulo="Padrinos">
        {padrinos.map((padrino, indice) => (
          <div key={indice} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Campo
              idPrefijo={`padrino-${indice}`}
              etiqueta="Nombre"
              valor={padrino.nombre}
              onCambio={(valor) => actualizarPadrino(indice, { ...padrino, nombre: valor })}
            />
            <Campo
              idPrefijo={`padrino-${indice}`}
              etiqueta="Rol"
              valor={padrino.rol}
              onCambio={(valor) => actualizarPadrino(indice, { ...padrino, rol: valor })}
              ayuda="Padrino de vals, de ramo…"
            />
            <Boton
              type="button"
              variante="texto"
              className="self-end"
              onClick={() => setPadrinos(padrinos.filter((_, i) => i !== indice))}
            >
              Quitar
            </Boton>
          </div>
        ))}

        <Boton
          type="button"
          variante="contorno"
          onClick={() => setPadrinos([...padrinos, { nombre: '', rol: '' }])}
        >
          Agregar padrino
        </Boton>
      </Seccion>

      <Seccion titulo="Mensaje">
        <SelectorMensaje
          valor={mensaje}
          propio={mensajePropio}
          onElegirCatalogo={(texto) => {
            setMensajePropio(false);
            setMensaje(texto);
          }}
          onEscribirPropio={() => {
            setMensajePropio(true);
            setMensaje('');
          }}
          onCambiarPropio={setMensaje}
        />
      </Seccion>

      <Seccion titulo="Misa">
        <CamposLugar lugar={misa} onCambio={setMisa} etiquetaNombre="Templo" />
      </Seccion>

      <Seccion titulo="Recepción">
        <CamposLugar lugar={recepcion} onCambio={setRecepcion} etiquetaNombre="Salón" />
        <Campo
          etiqueta="Aforo del salón"
          valor={capacidad}
          onCambio={setCapacidad}
          tipo="number"
          ayuda="Sirve para avisar en la entrada cuando el salón se llena."
        />
      </Seccion>

      {error && <p className="text-sm text-alerta">{error}</p>}

      <Boton type="submit" disabled={guardando} className="w-full sm:w-auto">
        {guardando ? 'Guardando…' : 'Guardar y continuar'}
      </Boton>
    </form>
  );

  function actualizarPadrino(indice: number, padrino: Padrino) {
    setPadrinos(padrinos.map((actual, i) => (i === indice ? padrino : actual)));
  }
}

function aIso(valorLocal: string): string {
  if (!valorLocal) return '';
  const fecha = new Date(valorLocal);
  return Number.isNaN(fecha.getTime()) ? '' : fecha.toISOString();
}

function CamposLugar({
  lugar,
  onCambio,
  etiquetaNombre,
}: {
  lugar: Lugar;
  onCambio: (lugar: Lugar) => void;
  etiquetaNombre: string;
}) {
  return (
    <>
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta={etiquetaNombre}
        valor={lugar.nombre}
        onCambio={(valor) => onCambio({ ...lugar, nombre: valor })}
      />
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta="Dirección"
        valor={lugar.direccion}
        onCambio={(valor) => onCambio({ ...lugar, direccion: valor })}
      />
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta="Enlace de Google Maps"
        valor={lugar.maps_url}
        onCambio={(valor) => onCambio({ ...lugar, maps_url: valor })}
        ayuda="En la invitación solo se ve un ícono de ubicación."
      />
      <Campo
        idPrefijo={etiquetaNombre}
        etiqueta="Fecha y hora"
        tipo="datetime-local"
        valor={paraInputLocal(lugar.fecha_hora)}
        onCambio={(valor) => onCambio({ ...lugar, fecha_hora: valor })}
      />
    </>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-borde pt-6">
      <legend className="font-ticket text-[11px] uppercase tracking-[0.28em] text-oro">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambio,
  tipo = 'text',
  requerido = false,
  ayuda,
  placeholder,
  idPrefijo = 'campo',
}: {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  tipo?: string;
  requerido?: boolean;
  ayuda?: string;
  placeholder?: string;
  idPrefijo?: string;
}) {
  const id = `${idPrefijo}-${etiqueta}`.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-tinta">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        required={requerido}
        placeholder={placeholder}
        value={valor}
        onChange={(campo) => onCambio(campo.target.value)}
        className="mt-1 min-h-11 w-full rounded-[2px] border border-borde bg-papel-alto px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
      />
      {ayuda && <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>}
    </div>
  );
}
