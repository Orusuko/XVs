'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { ModalConfirmacion } from '@/components/ui/ModalConfirmacion';
import { Toast } from '@/components/ui/Toast';
import { MAX_NOMBRE } from '@/lib/validacion-formularios';
import { summarizeTickets } from '@/lib/tickets';
import type { FamilyRow } from '@/lib/types';

type Familia = Pick<
  FamilyRow,
  | 'id'
  | 'nombre_familia'
  | 'boletos_total'
  | 'boletos_usados'
  | 'token'
  | 'estado_confirmacion'
  | 'checked_in'
>;

type Borrador = { nombre_familia: string; boletos_total: string };

type Props = {
  eventId: string;
  familiasIniciales: Familia[];
  siteUrl: string;
  estadoInicial: string;
  capacidadTotal: number | null;
  /** Lista de familias no cargó (p. ej. migración pendiente). */
  listaBloqueada?: boolean;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'No asistirá',
};

export function TablaFamilias({
  eventId,
  familiasIniciales,
  siteUrl,
  estadoInicial,
  capacidadTotal,
  listaBloqueada = false,
}: Props) {
  const [familias, setFamilias] = useState<Familia[]>(familiasIniciales);
  const [estado, setEstado] = useState(estadoInicial);
  const [borradores, setBorradores] = useState<Borrador[]>([
    { nombre_familia: '', boletos_total: '' },
  ]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Borrador | null>(null);
  const [capturando, setCapturando] = useState(familiasIniciales.length === 0);
  const [guardando, setGuardando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresFilasBorrador, setErroresFilasBorrador] = useState<Record<number, string>>({});
  const [errorBoletosEdicion, setErrorBoletosEdicion] = useState<string | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tono: 'exito' | 'alerta' } | null>(null);
  const [modalEstado, setModalEstado] = useState<'publicado' | 'borrador' | null>(null);
  const [familiaAQuitar, setFamiliaAQuitar] = useState<Familia | null>(null);
  const [quitandoFamilia, setQuitandoFamilia] = useState(false);
  const publicandoRef = useRef(false);
  const guardandoRef = useRef(false);
  const quitandoRef = useRef(false);

  const publicado = estado === 'publicado';
  const primerToken = familias[0]?.token;

  useEffect(() => {
    let vivo = true;

    async function traer() {
      try {
        const respuesta = await fetch(`/api/families?eventId=${encodeURIComponent(eventId)}`);
        if (!vivo || !respuesta.ok) return;
        const datos = (await respuesta.json()) as {
          familias?: Pick<Familia, 'id' | 'estado_confirmacion' | 'checked_in' | 'boletos_usados'>[];
        };
        const lista = datos.familias ?? [];
        setFamilias((previas) =>
          previas.map((familia) => {
            const nueva = lista.find((item) => item.id === familia.id);
            if (!nueva) return familia;
            return {
              ...familia,
              estado_confirmacion: nueva.estado_confirmacion,
              checked_in: nueva.checked_in,
              boletos_usados: nueva.boletos_usados,
            };
          }),
        );
      } catch {
        // El siguiente ciclo reintenta. No abrir families al rol anónimo.
      }
    }

    const reloj = setInterval(() => {
      void traer();
    }, 5000);

    return () => {
      vivo = false;
      clearInterval(reloj);
    };
  }, [eventId]);

  const resumen = useMemo(
    () =>
      summarizeTickets(
        familias.map((familia) => ({
          boletos_total: familia.boletos_total,
          boletos_usados: familia.boletos_usados,
          estado_confirmacion: familia.estado_confirmacion,
          checked_in: familia.checked_in,
        })),
      ),
    [familias],
  );

  const boletosEnBorrador = borradores.reduce(
    (suma, fila) => suma + (Number(fila.boletos_total) || 0),
    0,
  );

  const superaAforo =
    capacidadTotal != null && capacidadTotal > 0 && resumen.total > capacidadTotal;

  const advertenciaDuplicados = useMemo(() => {
    const vistos = new Set<string>();
    const repetidos = new Set<string>();

    for (const familia of familias) {
      const clave = familia.nombre_familia.trim().toLowerCase();
      if (!clave) continue;
      if (vistos.has(clave)) repetidos.add(familia.nombre_familia.trim());
      vistos.add(clave);
    }

    for (const fila of borradores) {
      const clave = fila.nombre_familia.trim().toLowerCase();
      if (!clave) continue;
      if (vistos.has(clave)) repetidos.add(fila.nombre_familia.trim());
      vistos.add(clave);
    }

    if (repetidos.size === 0) return null;
    return `Hay nombres de familia repetidos (${[...repetidos].join(', ')}). Puedes guardar, pero conviene revisarlos.`;
  }, [familias, borradores]);

  function solicitarCambioEstado(nuevoEstado: 'publicado' | 'borrador') {
    if (nuevoEstado === 'publicado' && familias.length === 0) {
      setError('Agrega al menos una familia con boletos antes de publicar.');
      return;
    }
    setModalEstado(nuevoEstado);
  }

  async function cambiarEstadoEvento(nuevoEstado: 'publicado' | 'borrador') {
    if (publicandoRef.current) return;
    publicandoRef.current = true;
    setPublicando(true);
    setError(null);

    try {
      const respuesta = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, estado: nuevoEstado }),
      });

      const datos = (await respuesta.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!respuesta.ok) {
        const mensaje = datos?.error ?? 'No pudimos actualizar el evento.';
        setError(mensaje);
        mostrarToast(mensaje, 'alerta');
        return;
      }

      setModalEstado(null);
      setEstado(nuevoEstado);
      mostrarToast(
        nuevoEstado === 'publicado' ? 'Evento publicado.' : 'Volviste el evento a borrador.',
      );
    } finally {
      publicandoRef.current = false;
      setPublicando(false);
    }
  }

  function mostrarToast(mensaje: string, tono: 'exito' | 'alerta' = 'exito') {
    setToast({ mensaje, tono });
    window.setTimeout(() => setToast(null), 2800);
  }

  async function quitarFamilia(familia: Familia) {
    if (quitandoRef.current) return;
    quitandoRef.current = true;
    setQuitandoFamilia(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/families?id=${familia.id}`, { method: 'DELETE' });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error ?? 'No pudimos quitar a esa familia.');
        return;
      }

      setFamiliaAQuitar(null);
      setFamilias((previas) => previas.filter((actual) => actual.id !== familia.id));
      mostrarToast(`Se quitó a la familia ${familia.nombre_familia}.`);
    } finally {
      quitandoRef.current = false;
      setQuitandoFamilia(false);
    }
  }

  function iniciarEdicion(familia: Familia) {
    setEditandoId(familia.id);
    setEdicion({
      nombre_familia: familia.nombre_familia,
      boletos_total: String(familia.boletos_total),
    });
    setError(null);
    setErrorBoletosEdicion(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEdicion(null);
  }

  async function guardarEdicion(familia: Familia) {
    if (!edicion) return;

    const boletos = Number(edicion.boletos_total);
    if (edicion.nombre_familia.trim() === '') {
      setErrorBoletosEdicion('Escribe el nombre de la familia.');
      return;
    }
    if (boletos < 1 || !Number.isInteger(boletos)) {
      setErrorBoletosEdicion('Cada familia necesita al menos un boleto.');
      return;
    }

    setError(null);
    setErrorBoletosEdicion(null);

    const respuesta = await fetch('/api/families', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: familia.id,
        nombre_familia: edicion.nombre_familia.trim(),
        boletos_total: boletos,
      }),
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      setErrorBoletosEdicion(datos?.error ?? 'No pudimos guardar los cambios.');
      return;
    }

    setFamilias((previas) =>
      previas.map((actual) =>
        actual.id === familia.id
          ? {
              ...actual,
              nombre_familia: edicion.nombre_familia.trim(),
              boletos_total: boletos,
            }
          : actual,
      ),
    );
    mostrarToast(`Cambios guardados para ${edicion.nombre_familia.trim()}.`);
    cancelarEdicion();
  }

  async function guardarBorradores() {
    const errores: Record<number, string> = {};
    const listas: { nombre_familia: string; boletos_total: number }[] = [];

    borradores.forEach((fila, indice) => {
      const nombre = fila.nombre_familia.trim();
      const boletos = Number(fila.boletos_total);
      const filaVacia = nombre === '' && fila.boletos_total.trim() === '';

      if (filaVacia) return;

      if (nombre === '') {
        errores[indice] = 'Escribe el nombre de la familia.';
        return;
      }

      if (!Number.isInteger(boletos) || boletos < 1) {
        errores[indice] = 'Cada familia necesita al menos un boleto.';
        return;
      }

      listas.push({ nombre_familia: nombre, boletos_total: boletos });
    });

    setErroresFilasBorrador(errores);

    if (Object.keys(errores).length > 0) return;

    if (listas.length === 0) {
      setError('Agrega al menos una familia con nombre y boletos.');
      return;
    }

    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    setError(null);

    try {
      const respuesta = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, familias: listas }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.error ?? 'No pudimos guardar la lista.');
        mostrarToast(datos.error ?? 'No pudimos guardar la lista.', 'alerta');
        return;
      }

      if (datos.aviso) {
        mostrarToast(datos.aviso, 'alerta');
      } else {
        mostrarToast('Lista guardada.');
      }

      setFamilias([
        ...familias,
        ...datos.familias.map((familia: { id: string; token: string; nombre_familia: string }) => ({
          ...familia,
          boletos_total:
            listas.find((lista) => lista.nombre_familia === familia.nombre_familia)?.boletos_total ??
            0,
          boletos_usados: 0,
          estado_confirmacion: 'pendiente' as const,
          checked_in: false,
        })),
      ]);
      setBorradores([{ nombre_familia: '', boletos_total: '' }]);
      setErroresFilasBorrador({});
      setCapturando(false);
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  const modalCambioEstado = (
    <ModalConfirmacion
      abierto={modalEstado !== null}
      titulo={modalEstado === 'publicado' ? 'Publicar invitaciones' : 'Volver a borrador'}
      detalle={
        modalEstado === 'publicado' ? (
          'Las familias podrán abrir su enlace y confirmar asistencia. Los enlaces que ya compartiste seguirán sirviendo.'
        ) : (
          <>
            Los enlaces que ya enviaste dejarán de abrir la invitación hasta que vuelvas a publicar
            el evento. Las familias verán que aún no está disponible.
          </>
        )
      }
      confirmarEtiqueta={
        publicando
          ? modalEstado === 'publicado'
            ? 'Publicando…'
            : 'Guardando…'
          : modalEstado === 'publicado'
            ? 'Publicar'
            : 'Volver a borrador'
      }
      procesando={publicando}
      onConfirmar={() => modalEstado && void cambiarEstadoEvento(modalEstado)}
      onCancelar={() => !publicando && setModalEstado(null)}
    />
  );

  const toastUi = (
    <Toast visible={Boolean(toast)} mensaje={toast?.mensaje ?? ''} tono={toast?.tono} />
  );

  const motivoPublicarDeshabilitado = listaBloqueada
    ? 'La base de datos aún necesita la migración de boletos parciales antes de publicar.'
    : familias.length === 0
      ? 'Agrega al menos una familia con boletos antes de publicar.'
      : null;

  const barraPublicacion = (
    <div className="mb-8 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
      {publicado ? (
        <>
          <span className="font-ticket text-[11px] uppercase tracking-[0.2em] text-exito">
            Publicado
          </span>
          {primerToken && !listaBloqueada && (
            <a
              href={`${siteUrl}/invitacion/${primerToken}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-sm text-vino underline underline-offset-4"
            >
              Ver invitación pública
            </a>
          )}
          <Boton
            type="button"
            variante="contorno"
            disabled={publicando}
            onClick={() => solicitarCambioEstado('borrador')}
          >
            Volver a borrador
          </Boton>
        </>
      ) : (
        <>
          <span className="font-ticket text-[11px] uppercase tracking-[0.2em] text-tinta-suave">
            Borrador
          </span>
          <Boton
            type="button"
            disabled={publicando || familias.length === 0 || listaBloqueada}
            onClick={() => solicitarCambioEstado('publicado')}
          >
            Publicar
          </Boton>
        </>
      )}
      </div>
      {!publicado && motivoPublicarDeshabilitado && (
        <p className="text-sm text-tinta-suave" role="note">
          {motivoPublicarDeshabilitado}
        </p>
      )}
    </div>
  );

  if (listaBloqueada) {
    return (
      <section>
        {barraPublicacion}
        {error && (
          <p className="mt-3 text-sm text-alerta" role="alert">
            {error}
          </p>
        )}
        <p className="mt-4 text-sm text-tinta-suave">
          Mientras falte la migración, la lista no se muestra aquí; puedes seguir volviendo a
          borrador o editando los datos del evento.
        </p>
        {modalCambioEstado}
        {toastUi}
      </section>
    );
  }

  if (capturando) {
    return (
      <section>
        {barraPublicacion}
        {modalCambioEstado}
        {toastUi}
        <div className="talon px-5 pb-6 pt-8">
          <div className="space-y-3">
            {borradores.map((fila, indice) => (
              <div key={indice} className="space-y-1">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <div>
                    <label htmlFor={`familia-${indice}`} className="sr-only">
                      Nombre de la familia
                    </label>
                    <input
                      id={`familia-${indice}`}
                      value={fila.nombre_familia}
                      placeholder="Familia"
                      maxLength={MAX_NOMBRE}
                      onChange={(campo) => {
                        actualizarBorrador(indice, { ...fila, nombre_familia: campo.target.value });
                        if (erroresFilasBorrador[indice]) {
                          setErroresFilasBorrador((prev) => {
                            const siguientes = { ...prev };
                            delete siguientes[indice];
                            return siguientes;
                          });
                        }
                      }}
                      className={`min-h-11 w-full rounded-[2px] border bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino ${
                        erroresFilasBorrador[indice] ? 'border-alerta' : 'border-borde'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor={`boletos-${indice}`} className="sr-only">
                      Boletos
                    </label>
                    <input
                      id={`boletos-${indice}`}
                      type="number"
                      min={1}
                      value={fila.boletos_total}
                      placeholder="Boletos"
                      onChange={(campo) => {
                        actualizarBorrador(indice, { ...fila, boletos_total: campo.target.value });
                        if (erroresFilasBorrador[indice]) {
                          setErroresFilasBorrador((prev) => {
                            const siguientes = { ...prev };
                            delete siguientes[indice];
                            return siguientes;
                          });
                        }
                      }}
                      className={`min-h-11 w-full rounded-[2px] border bg-papel px-4 font-ticket text-tinta outline-none transition-colors duration-200 focus:border-vino ${
                        erroresFilasBorrador[indice] ? 'border-alerta' : 'border-borde'
                      }`}
                    />
                  </div>

                  <Boton
                    type="button"
                    variante="texto"
                    onClick={() => setBorradores(borradores.filter((_, i) => i !== indice))}
                    disabled={borradores.length === 1}
                  >
                    Quitar
                  </Boton>
                </div>
                {erroresFilasBorrador[indice] && (
                  <p className="text-sm text-alerta" role="alert">
                    {erroresFilasBorrador[indice]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-5">
            <p className="font-ticket text-sm text-tinta-suave">
              Boletos en esta lista:{' '}
              <span className="text-lg font-bold text-vino">{boletosEnBorrador}</span>
            </p>

            <Boton
              type="button"
              variante="contorno"
              onClick={() =>
                setBorradores([...borradores, { nombre_familia: '', boletos_total: '' }])
              }
            >
              Agregar familia
            </Boton>
          </div>
        </div>

        {advertenciaDuplicados && (
          <p className="mt-3 text-sm text-tinta-suave" role="note">
            {advertenciaDuplicados}
          </p>
        )}

        {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Boton onClick={guardarBorradores} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar lista'}
          </Boton>
          {familias.length > 0 && (
            <Boton variante="contorno" onClick={() => setCapturando(false)}>
              Volver al monitoreo
            </Boton>
          )}
        </div>
        <ModalConfirmacion
          abierto={familiaAQuitar !== null}
          titulo="Quitar familia"
          detalle={
            familiaAQuitar
              ? `¿Quitar a la familia ${familiaAQuitar.nombre_familia} de la lista? Los enlaces que ya compartiste dejarán de funcionar.`
              : ''
          }
          confirmarEtiqueta={quitandoFamilia ? 'Quitando…' : 'Quitar'}
          procesando={quitandoFamilia}
          onConfirmar={() => familiaAQuitar && void quitarFamilia(familiaAQuitar)}
          onCancelar={() => !quitandoFamilia && setFamiliaAQuitar(null)}
        />
      </section>
    );
  }

  return (
    <section>
      {barraPublicacion}
      {modalCambioEstado}
      {toastUi}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato etiqueta="Boletos" valor={resumen.total} />
        <Dato etiqueta="Confirmados" valor={resumen.confirmados} acento />
        <Dato etiqueta="Pendientes" valor={resumen.pendientes} />
        <Dato etiqueta="No asistirán" valor={resumen.rechazados} />
      </dl>

      {capacidadTotal != null && capacidadTotal > 0 && (
        <p className={`mt-4 text-sm ${superaAforo ? 'text-alerta' : 'text-tinta-suave'}`}>
          Boletos en lista: {resumen.total} / aforo {capacidadTotal}
          {superaAforo && (
            <span className="mt-1 block">La lista supera el aforo del salón.</span>
          )}
        </p>
      )}

      {!publicado && (
        <p className="mt-4 text-sm text-tinta-suave">Publica el evento para enviar los enlaces.</p>
      )}

      <div className="talon mt-6 overflow-x-auto px-5 pb-6 pt-8">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
              <th className="pb-3 font-normal">Familia</th>
              <th className="pb-3 font-normal">Boletos</th>
              <th className="pb-3 font-normal">Asistencia</th>
              <th className="pb-3 font-normal">Invitación</th>
              <th className="pb-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {familias.map((familia) => {
              const enlace = `${siteUrl}/invitacion/${familia.token}`;
              const editando = editandoId === familia.id && edicion;

              return (
                <tr key={familia.id} className="border-t border-borde">
                  <td className="py-3 text-tinta">
                    {editando ? (
                      <div>
                        <input
                          value={edicion.nombre_familia}
                          maxLength={MAX_NOMBRE}
                          onChange={(campo) => {
                            setEdicion({ ...edicion, nombre_familia: campo.target.value });
                            setErrorBoletosEdicion(null);
                          }}
                          className="min-h-11 w-full min-w-[140px] rounded-[2px] border border-borde bg-papel px-4 text-tinta outline-none transition-colors duration-200 focus:border-vino"
                        />
                        {errorBoletosEdicion && (
                          <p className="mt-1 text-sm text-alerta" role="alert">
                            {errorBoletosEdicion}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="break-words">{familia.nombre_familia}</span>
                    )}
                  </td>
                  <td className="py-3 font-ticket text-tinta">
                    {editando ? (
                      <input
                        type="number"
                        min={1}
                        value={edicion.boletos_total}
                        onChange={(campo) => {
                          setEdicion({ ...edicion, boletos_total: campo.target.value });
                          setErrorBoletosEdicion(null);
                        }}
                        className={`min-h-11 w-24 rounded-[2px] border bg-papel px-4 font-ticket text-tinta outline-none transition-colors duration-200 focus:border-vino ${
                          errorBoletosEdicion ? 'border-alerta' : 'border-borde'
                        }`}
                      />
                    ) : (
                      familia.boletos_total
                    )}
                  </td>
                  <td className="py-3">
                    <EstadoAsistencia estado={familia.estado_confirmacion} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={!publicado}
                        onClick={() => publicado && navigator.clipboard.writeText(enlace)}
                        className="inline-flex h-11 cursor-pointer items-center text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                      >
                        Copiar enlace
                      </button>
                      {publicado ? (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Hola Familia ${familia.nombre_familia}, aquí está su invitación: ${enlace}`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 cursor-pointer items-center text-tinta-suave underline underline-offset-4 transition-colors duration-200 hover:text-vino"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <span className="inline-flex h-11 items-center text-tinta-suave opacity-40">
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {editando ? (
                        <>
                          <button
                            type="button"
                            onClick={() => guardarEdicion(familia)}
                            className="inline-flex h-11 cursor-pointer items-center text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicion}
                            className="inline-flex h-11 cursor-pointer items-center text-tinta-suave underline underline-offset-4 transition-colors duration-200 hover:text-vino"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(familia)}
                            className="inline-flex h-11 cursor-pointer items-center text-vino underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setFamiliaAQuitar(familia)}
                            className="inline-flex h-11 cursor-pointer items-center text-alerta underline underline-offset-4 transition-colors duration-200 hover:text-vino-hondo"
                          >
                            Quitar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Boton variante="contorno" onClick={() => setCapturando(true)}>
          Agregar más familias
        </Boton>
      </div>

      <ModalConfirmacion
        abierto={familiaAQuitar !== null}
        titulo="Quitar familia"
        detalle={
          familiaAQuitar
            ? `¿Quitar a la familia ${familiaAQuitar.nombre_familia} de la lista? Los enlaces que ya compartiste dejarán de funcionar.`
            : ''
        }
        confirmarEtiqueta={quitandoFamilia ? 'Quitando…' : 'Quitar'}
        procesando={quitandoFamilia}
        onConfirmar={() => familiaAQuitar && void quitarFamilia(familiaAQuitar)}
        onCancelar={() => !quitandoFamilia && setFamiliaAQuitar(null)}
      />
    </section>
  );

  function actualizarBorrador(indice: number, fila: Borrador) {
    setBorradores(borradores.map((actual, i) => (i === indice ? fila : actual)));
  }
}

function Dato({
  etiqueta,
  valor,
  acento = false,
}: {
  etiqueta: string;
  valor: number;
  acento?: boolean;
}) {
  return (
    <div className="border border-borde bg-papel-alto px-4 py-4">
      <dt className="font-ticket text-[10px] uppercase tracking-[0.2em] text-tinta-suave">
        {etiqueta}
      </dt>
      <dd className={`mt-1 font-ticket text-2xl ${acento ? 'text-vino' : 'text-tinta'}`}>{valor}</dd>
    </div>
  );
}

function EstadoAsistencia({ estado }: { estado: string }) {
  const color =
    estado === 'confirmado'
      ? 'text-exito'
      : estado === 'rechazado'
        ? 'text-alerta'
        : 'text-tinta-suave';

  return (
    <span className={`inline-flex items-center gap-2 ${color}`}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  );
}
