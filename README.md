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
| `S` | Vista del orador con las notas |
| `F` | Pantalla completa |
| `O` | Vista general de las diapositivas |

## Estructura

```
index.html        # las 28 diapositivas y las notas del orador
css/estilo.css    # estilo oscuro, parecido al de las diapositivas del ingeniero
js/graficas.js    # gráficas SVG (espectros, sinc, aliasing)
js/main.js        # arranque de reveal.js + demostración interactiva
lib/reveal/       # reveal.js 5 (copia local)
lib/katex/dist/   # KaTeX 0.16 (copia local, para las fórmulas)
```

## Simulación en Python (diapositivas 22 a 25)

`simulacion/reconstruccion_sinc.py` reconstruye `x(t) = 3cos(2πt)` con la suma de sincs, mide la energía del error y genera las figuras (`simulacion/figuras/`) y `simulacion/resultados.txt`.

```
pip install numpy matplotlib
python simulacion/reconstruccion_sinc.py
```
También se puede pegar en Google Colab (las líneas `# %%` separan las celdas).

## Demostración interactiva (diapositiva 27)

Reconstruye `x(t) = 3cos(2π f0 t)` con la suma de sincs y muestra el error `e(t) = x(t) − x_r(t)` y su energía. Tres casos preparados:

1. `fs = 4 Hz`: se cumple Nyquist.
2. `fs ≈ 1,41 Hz`: aliasing.
3. `fs = 4 Hz` con pocas muestras (±0,5 s): error por truncar la suma.

## Pendiente antes de exponer

- Cambiar `[Nombre del expositor]` en la portada (`index.html`, primera diapositiva).
