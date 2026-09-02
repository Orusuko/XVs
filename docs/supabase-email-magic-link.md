# Plantilla Magic Link (correo del organizador)

El correo por defecto de Supabase **no muestra el código de 6 dígitos** y manda a una página alojada de «Sign In». Esa página extra no sirve: los escáneres de Gmail suelen abrir el enlace antes que tú y aparece `otp_expired`.

Pega esta plantilla en el dashboard:

**Authentication → Email Templates → Magic Link**

```html
<h2>Tu código de acceso</h2>

<p style="font-size: 32px; letter-spacing: 0.2em; font-weight: 700;">
  {{ .Token }}
</p>

<p>
  Copia ese código y pégalo en el panel del organizador
  <strong>en el mismo equipo donde pediste el acceso</strong>.
  No uses la página de Sign In de Supabase.
</p>

<p>
  Si prefieres el enlace (solo en este mismo equipo):
  <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Entrar al panel</a>
</p>

<p style="color: #666; font-size: 13px;">
  Enlace de respaldo (puede mostrar Sign In; evítalo si puedes):
  <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
</p>
```

`{{ .Token }}` es el código que se escribe en `/admin`.  
`{{ .RedirectTo }}` es el `emailRedirectTo` de la app (`…/auth/callback?next=/admin`), así el enlace respeta el origen real (localhost o Vercel) y **no** pasa por la página de Sign In.  
`{{ .ConfirmationURL }}` también respeta `emailRedirectTo`, pero sí pasa por el verify alojado de Supabase.

Si el botón del enlace se ve mal (falta `?` vs `&`), confirma que Redirect URLs incluye exactamente:

- `http://localhost:3000/auth/callback`
- `https://TU-DOMINIO.vercel.app/auth/callback`

La app ya acepta `token_hash` y `code` en `/auth/callback`.
