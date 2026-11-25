# Reconstrucción ideal de señales muestreadas

Presentación hecha con **reveal.js** para el curso de **Señales y Sistemas** (UNSA).

Tema: *reconstrucción ideal de señales muestreadas: interpolación sinc, reconstrucción perfecta y errores de reconstrucción.*

La presentación solo usa herramientas que ya se vieron en clase: transformada del rectángulo, dualidad, convolución con impulsos, muestreo (Cap. 3, Ej. 9), aliasing y energía.

## Cómo abrirla

- **Más simple:** doble clic en `index.html`. No necesita instalar nada ni compilar.
- **Con servidor local** (opcional): `python -m http.server 8000` y abrir `http://localhost:8000`.
- **GitHub Pages:** subir esta carpeta a un repositorio y activar Pages sobre la rama principal (carpeta raíz).

Estructura de la exposición: fundamentos matemáticos, ejemplo desarrollado, simulación en Python e interpretación de resultados.

## Teclas útiles

| Tecla | Acción |
|-------|--------|
| Flechas / Espacio | Avanzar y retroceder |
| `F` | Pantalla completa |
| `O` | Vista general de las diapositivas |

## Estructura

```
index.html        # las 12 diapositivas
css/estilo.css    # estilo oscuro, parecido al de las diapositivas del ingeniero
js/graficas.js    # gráficas SVG (espectros, sinc, aliasing)
js/main.js        # arranque de reveal.js (+ plugin KaTeX)
lib/reveal/       # reveal.js 5 (copia local)
lib/katex/dist/   # KaTeX 0.16 (copia local, para las fórmulas)
```

## Contenido (12 diapositivas)

1. Portada
2-3. Reconstrucción ideal: réplicas del espectro y filtro paso bajo ideal
4-5. Interpolación sinc: dualidad y fórmula de Whittaker-Shannon
6. Ejemplo numérico: x_r(1/8)
7. Reconstrucción perfecta: condiciones de Nyquist-Shannon
8-10. Errores: aliasing, truncamiento e interpolación lineal
11-12. Ejercicio tipo examen y su solución

`simulacion/` contiene el script de Python usado para comprobar los valores (material extra, no se presenta).
