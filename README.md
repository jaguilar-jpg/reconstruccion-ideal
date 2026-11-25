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
index.html        # las 12 diapositivas (portada + 11)
css/estilo.css    # estilo oscuro, parecido al de las diapositivas del ingeniero
js/graficas.js    # gráficas SVG (espectros, sinc, aliasing)
js/main.js        # arranque de reveal.js (+ plugin KaTeX)
lib/reveal/       # reveal.js 5 (copia local)
lib/katex/dist/   # KaTeX 0.16 (copia local, para las fórmulas)
```

## Simulación en Python (diapositivas 11 y 12)

`simulacion/reconstruccion_sinc.py` reconstruye `x(t) = 3cos(2πt)` con la suma de sincs, mide la energía del error y genera las figuras (`simulacion/figuras/`) y `simulacion/resultados.txt`.

```
pip install numpy matplotlib
python simulacion/reconstruccion_sinc.py
```
También se puede pegar en Google Colab (las líneas `# %%` separan las celdas).
