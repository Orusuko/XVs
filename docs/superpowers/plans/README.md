# Planes de implementación

Ningún plan está pendiente. No volver a ejecutarlos.

## Hecho en esta pasada

| Plan | Qué se entregó |
|---|---|
| [2026-10-12-pulido-oficio.md](./2026-10-12-pulido-oficio.md) | Selector por layout, vista previa, cuerpos distintos, foto, PDF de Corona/Picado/Vitela, editar familias, publicar, vestimenta, aforo en admin, enlace de staff. Falta el recorrido con sesión iniciada. |

## Hecho — no volver a implementar

| Plan | Qué se entregó |
|---|---|
| [2026-09-01-xv-invitaciones.md](./2026-09-01-xv-invitaciones.md) | MVP: admin, invitación + QR, staff, offline, PDF, RLS |
| [2026-09-02-desbloquear-login.md](./2026-09-02-desbloquear-login.md) | Login correo/contraseña + script `crear-organizador` |
| [2026-09-03-pulido-mensajes-estados.md](./2026-09-03-pulido-mensajes-estados.md) | EstadoHoja, mensajes, error.tsx, nav admin, quitar familia |
| [2026-09-04-catalogo-20-disenos-gestion-eventos.md](./2026-09-04-catalogo-20-disenos-gestion-eventos.md) | 20 diseños (6 layouts × paleta), crear/borrar eventos |

Después de ese catálogo se sumaron 8 layouts únicos (Picado, Corona, Charra, Retrato, Celeste, Editorial, Vitela, Itinerario), chips de filtro y `foto_url`. Eso **ya está en el código**. El plan del 12 de octubre no los vuelve a crear; los pule.

También está hecho (no reabrir): WhatsApp, `.ics` + Google Calendar, historial/búsqueda de escaneos, aforo en **staff** (`VistaConteo`), `PATCH /api/families` (falta la UI), `events.estado` en DB (falta publicar y candar enlaces).

## Fuera de alcance (spec §11 y Fase 3)

- Wallet Apple/Google
- Upload a Supabase Storage (Retrato sigue con URL)
- Más skins de color de Clásica/Jardín/Mariposas
- Tabla `guests`, i18n, analytics, TOTP
- Versionado de `events.template_id` (la plantilla vive en `template_config.plantilla`)
- Email al confirmar (Fase 2: no hay proveedor en el repo; el plan de oficio lo deja fuera)
