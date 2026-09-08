# 🐝 mi-apiario

PWA para gestionar apiarios, colonias, reinas, sanidad, producción, histórico y copias de seguridad.

## GitHub Pages

El proyecto está configurado para publicarse en:

`https://ttttooonni.github.io/mi-apiario/`

### Publicación

```bash
npm install
npm run build
```

El contenido generado queda en `dist/`. Para GitHub Pages se recomienda usar GitHub Actions.

## Funcionalidades

- Centro de mando con indicadores.
- Gestión de apiarios y colonias.
- Ficha individual de colonia.
- Seguimiento de reina.
- Semáforo sanitario.
- Registro de producción.
- Histórico de temporada.
- Copias de seguridad JSON e importación.
- Almacenamiento local y funcionamiento sin conexión para los datos ya cargados.
- PWA instalable.
- Diseño responsive y mobile-first.

## Filosofía

**Apiarios → Colonias → Revisiones → Sanidad → Producción → Histórico**

La primera versión prioriza un núcleo local, rápido y sencillo. La arquitectura puede evolucionar después hacia sincronización, fotografías, meteorología y asistente de IA.

> `mi-cuaderno` no forma parte de este proyecto y debe permanecer intacto.
