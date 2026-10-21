# PrestaFlow · Gestor de Préstamos

Aplicación web (Angular 21 + Tailwind CSS) para gestionar préstamos personales y de una red de prestamistas por rutas. Los datos se guardan localmente en el navegador (`localStorage`), sin backend.

## Cómo ejecutar

```bash
npm install
npm start        # http://localhost:4200
npm run build    # producción en dist/
```

## Flujo de la app

La navegación está organizada siguiendo el trabajo diario:

1. **Acceso** — `/login` y `/register` (cuenta local por dispositivo).
2. **Panel** — `/dashboard`: saludo, indicadores (capital, recuperado, pendiente, activos), accesos rápidos y alerta de vencidos.
3. **Mi cartera** — `/clientes` → `/mis-prestamos` → `/mis-pagos`: registra clientes, presta tu propio dinero y anota los cobros.
4. **Red de cobro** — `/prestamistas` → `/rutas` → `/prestamos-prestamistas` → `/liquidacion`: prestamistas que cobran por ti, sus rutas y el cierre de cuentas.
5. **Análisis** — `/seguimiento`: métricas, gráficos y notas por préstamo.

## Estructura del código

```
src/app/
  core/          # Única fuente de verdad: modelos, servicios (signals + localStorage) y guards
  features/      # Pantallas por dominio (carga diferida por ruta)
    auth/        # login y register
    dashboard/   # panel principal
    ...
  layouts/       # Layout principal: sidebar por secciones, encabezado dinámico, usuario y salida
  shared/        # Componentes reutilizables (modal, confirmación, tabla, buscador, tarjetas)
```

## Rendimiento

- Carga diferida por ruta; Chart.js solo se descarga al entrar a Seguimiento.
- Sin frameworks CSS/JS pesados: el diseño es Tailwind + una capa ligera de compatibilidad en `src/styles.css`.
- Animaciones solo con `transform`/`opacity` (GPU) y soporte de `prefers-reduced-motion`.
- Transiciones entre rutas con la View Transitions API nativa del navegador.

## Notas técnicas

- Los servicios de datos (`core/services/data.service.ts`) actualizan el estado de forma inmutable para que la interfaz se refresque al instante al crear, editar o eliminar.
- Las rutas aceptan alias heredados: `/personas` → `/clientes`, `/prestamos` → `/mis-prestamos`, `/pagos` → `/mis-pagos`.
