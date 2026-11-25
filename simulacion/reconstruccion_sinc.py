"""
Reconstrucción ideal de señales muestreadas (interpolación sinc)
Señales y Sistemas · UNSA

Simula la fórmula de la exposición:

    x_r(t) = sum_k x(k*Ts) * sinc((t - k*Ts)/Ts)

con la sinc de clase: sinc(x) = sin(pi*x)/(pi*x)  (es exactamente np.sinc de NumPy).

Casos (señal x(t) = 3 cos(2*pi*t), o sea B = 1 Hz):
  1) Ts = 1/4        -> fs = 4 Hz   > 2B : se cumple Nyquist
  2) Ts = 1/sqrt(2)  -> fs = 1.41 Hz < 2B : aliasing
  3) Ts = 1/4 pero con pocas muestras      : error por truncar la suma

El error se mide con la energía de clase:  E_e = integral e(t)^2 dt,  e(t) = x(t) - x_r(t),
calculada en la ventana [-2, 2] s.

Cómo ejecutarlo:
  - Python 3 con numpy y matplotlib:   python reconstruccion_sinc.py
  - O pegar el archivo en Google Colab (las líneas "# %%" separan las celdas).
Genera las figuras en la carpeta figuras/ y el archivo resultados.txt.
"""

# %% Librerías y parámetros
from pathlib import Path

import numpy as np
import matplotlib

matplotlib.use("Agg")  # para guardar figuras sin abrir ventanas (en Colab se puede quitar)
import matplotlib.pyplot as plt

A, F0 = 3.0, 1.0            # x(t) = A cos(2 pi F0 t)  ->  B = F0 = 1 Hz
VENTANA = (-2.0, 2.0)       # intervalo donde medimos el error
CARPETA = Path(__file__).resolve().parent
FIGURAS = CARPETA / "figuras"
FIGURAS.mkdir(exist_ok=True)


# %% Funciones
def x(t):
    """Señal original x(t) = 3 cos(2 pi t)."""
    return A * np.cos(2 * np.pi * F0 * t)


def muestrear(Ts, T):
    """Muestras x(k*Ts) para k = -K, ..., K, con K = floor(T/Ts)."""
    K = int(np.floor(T / Ts + 1e-9))
    k = np.arange(-K, K + 1)
    return k * Ts, x(k * Ts)


def reconstruir(t, tk, xk, Ts):
    """x_r(t) = sum_k x[k] * sinc((t - k*Ts)/Ts). np.sinc(x) = sin(pi x)/(pi x)."""
    return np.sinc((t[:, None] - tk[None, :]) / Ts) @ xk


def energia(y, t):
    """E = integral y(t)^2 dt  (regla del trapecio)."""
    z = y ** 2
    return float(np.sum((z[1:] + z[:-1]) / 2 * np.diff(t)))


def simular(Ts, T):
    """Muestrea con Ts hasta +-T, reconstruye con sincs y mide el error."""
    t = np.linspace(VENTANA[0], VENTANA[1], 4001)
    tk, xk = muestrear(Ts, T)
    xr = reconstruir(t, tk, xk, Ts)
    e = x(t) - xr
    Ee, Ex = energia(e, t), energia(x(t), t)
    return dict(t=t, tk=tk, xk=xk, xr=xr, e=e, Ee=Ee, Ex=Ex, n=len(tk), Ts=Ts, T=T)


def frecuencia_dominante(t, y):
    """Frecuencia (Hz) y amplitud de la cosenoidal que mejor ajusta a y(t) (mínimos cuadrados)."""
    tt, yy = t[::4], y[::4]
    mejor = (np.inf, 0.0, 0.0)
    for f in np.arange(0.01, 3.0, 0.002):
        M = np.column_stack([np.cos(2 * np.pi * f * tt), np.sin(2 * np.pi * f * tt)])
        coef = np.linalg.lstsq(M, yy, rcond=None)[0]
        r = float(np.sum((yy - M @ coef) ** 2))
        if r < mejor[0]:
            mejor = (r, f, float(np.hypot(*coef)))
    return mejor[1], mejor[2]


def frecuencia_alias(f0, fs):
    """Frecuencia que aparece tras muestrear f0 con fs: resto en [-fs/2, fs/2), en valor absoluto."""
    return abs(f0 - round(f0 / fs) * fs)


# %% Estilo de las figuras (mismo estilo oscuro de las diapositivas)
FONDO, TEXTO, EJE = "#1b1d23", "#e8eaf0", "#8892a6"
AZUL, NARANJA, AMARILLO, VERDE = "#4aa3ff", "#ff9a3c", "#ffe14d", "#7ddc7d"
plt.rcParams.update({
    "figure.facecolor": FONDO, "axes.facecolor": "#16181d", "savefig.facecolor": FONDO,
    "text.color": TEXTO, "axes.labelcolor": TEXTO, "xtick.color": TEXTO, "ytick.color": TEXTO,
    "axes.edgecolor": EJE, "grid.color": "#2a2e38", "font.size": 12,
})


def figura(r, titulo, archivo, extra=None):
    """Arriba: x(t), x_r(t) y muestras. Abajo: error e(t)."""
    fig, (a1, a2) = plt.subplots(2, 1, figsize=(9, 5.6), sharex=True,
                                 gridspec_kw={"height_ratios": [2.2, 1]})
    t = r["t"]
    a1.plot(t, x(t), color=AZUL, lw=2.6, label="x(t)")
    a1.plot(t, r["xr"], color=NARANJA, lw=2.2, ls="--", label="x_r(t)")
    if extra is not None:
        a1.plot(t, extra[0], color=TEXTO, lw=1.4, ls=":", label=extra[1])
    en = (r["tk"] >= VENTANA[0]) & (r["tk"] <= VENTANA[1])
    a1.plot(r["tk"][en], r["xk"][en], "o", color=AMARILLO, ms=7, label="muestras")
    a1.set_ylim(-4.4, 4.4)
    a1.set_ylabel("amplitud")
    a1.grid(True)
    a1.legend(loc="upper right", ncol=4, fontsize=10, facecolor=FONDO, edgecolor=EJE)
    a1.set_title(titulo, loc="left", fontsize=13, color=AZUL)
    a2.plot(t, r["e"], color=VERDE, lw=2)
    a2.set_ylabel("e(t)")
    a2.set_xlabel("t (s)")
    a2.grid(True)
    a2.set_title("E_e = %.3g  (%.2f %% de la energía de x)" % (r["Ee"], 100 * r["Ee"] / r["Ex"]),
                 loc="left", fontsize=11, color=VERDE)
    fig.tight_layout()
    fig.savefig(FIGURAS / archivo, dpi=140)
    plt.close(fig)


# %% Caso 1: fs = 4 Hz (cumple Nyquist)
lineas = []
c1 = simular(Ts=1 / 4, T=6)
figura(c1, "Caso 1 · Ts = 1/4 (fs = 4 Hz > 2B): %d muestras" % c1["n"], "caso1.png")
lineas.append("CASO 1  Ts=1/4  fs=4 Hz  muestras=%d  E_e=%.4g  (%.4f %% de E_x=%.4g)"
              % (c1["n"], c1["Ee"], 100 * c1["Ee"] / c1["Ex"], c1["Ex"]))

# %% Caso 2: fs = 1.41 Hz (aliasing)
Ts2 = 1 / np.sqrt(2)
c2 = simular(Ts=Ts2, T=40)
f_med, a_med = frecuencia_dominante(c2["t"], c2["xr"])
f_teo = frecuencia_alias(F0, 1 / Ts2)
esperado = A * np.cos(2 * np.pi * f_teo * c2["t"])
figura(c2, "Caso 2 · Ts = 1/sqrt(2) (fs = %.2f Hz < 2B): aliasing" % (1 / Ts2), "caso2.png",
       extra=(esperado, "alias esperado %.3f Hz" % f_teo))
lineas.append("CASO 2  Ts=1/sqrt(2)  fs=%.4f Hz  muestras=%d  E_e=%.4g  (%.1f %% de E_x)"
              % (1 / Ts2, c2["n"], c2["Ee"], 100 * c2["Ee"] / c2["Ex"]))
lineas.append("        frecuencia alias esperada = |F0 - round(F0/fs)*fs| = %.4f Hz" % f_teo)
lineas.append("        frecuencia medida en x_r(t) = %.4f Hz, amplitud = %.3f" % (f_med, a_med))

# %% Caso 3: fs = 4 Hz pero con pocas muestras (+-0.5 s)
c3 = simular(Ts=1 / 4, T=0.5)
figura(c3, "Caso 3 · Ts = 1/4 con solo %d muestras (+-0.5 s)" % c3["n"], "caso3.png")
lineas.append("CASO 3  Ts=1/4  muestras=%d  E_e=%.4g  (%.1f %% de E_x)"
              % (c3["n"], c3["Ee"], 100 * c3["Ee"] / c3["Ex"]))

# %% Tabla A: error vs número de muestras (fs = 4 Hz y fs = 2.5 Hz)
lineas.append("")
lineas.append("TABLA A  Energía del error vs muestras usadas (ventana [-2,2], x(t)=3cos(2 pi t))")
lineas.append("%8s %10s %14s %14s" % ("T (s)", "fs (Hz)", "muestras", "E_e"))
curvas = {}
for fs in (4.0, 2.5):
    n_lista, e_lista = [], []
    for T in (0.5, 1, 2, 4, 6, 12, 24, 48):
        r = simular(Ts=1 / fs, T=T)
        n_lista.append(r["n"])
        e_lista.append(r["Ee"])
        lineas.append("%8g %10g %14d %14.4g" % (T, fs, r["n"], r["Ee"]))
    curvas[fs] = (n_lista, e_lista)

# %% Tabla B: error vs frecuencia de muestreo (T = 6 s)
lineas.append("")
lineas.append("TABLA B  Energía del error vs fs (muestras de -6 s a 6 s)")
lineas.append("%10s %12s %10s %14s %12s" % ("fs (Hz)", "fs > 2B ?", "muestras", "E_e", "% de E_x"))
for fs in (np.sqrt(2), 2.5, 3.0, 4.0, 6.0, 8.0):
    r = simular(Ts=1 / fs, T=6)
    lineas.append("%10.3f %12s %10d %14.4g %12.3f"
                  % (fs, "si" if fs > 2 * F0 else "NO", r["n"], r["Ee"], 100 * r["Ee"] / r["Ex"]))

# %% Figura: error vs número de muestras
fig, ax = plt.subplots(figsize=(7.4, 4.6))
ax.loglog(*curvas[4.0], "o-", color=AZUL, lw=2.4, ms=7, label="fs = 4 Hz")
ax.loglog(*curvas[2.5], "s-", color=NARANJA, lw=2.4, ms=7, label="fs = 2.5 Hz (cerca de 2B)")
ax.set_xlabel("número de muestras usadas")
ax.set_ylabel("energía del error E_e")
ax.set_title("El error baja al usar más muestras", loc="left", color=AZUL, fontsize=13)
ax.grid(True, which="both")
ax.legend(facecolor=FONDO, edgecolor=EJE)
fig.tight_layout()
fig.savefig(FIGURAS / "error_vs_muestras.png", dpi=140)
plt.close(fig)

# %% Figura resumen de los tres casos (la que se usa en la diapositiva de resultados)
fig, ejes = plt.subplots(1, 3, figsize=(13.5, 3.6), sharey=True)
paneles = [
    (c1, "Caso 1 · fs = 4 Hz (49 muestras)", "E_e = 1,12$\\times$10$^{-4}$  (0,0006 %)", None),
    (c2, "Caso 2 · fs = 1,41 Hz (aliasing)", "E_e = 32,0  (178 %)", esperado),
    (c3, "Caso 3 · fs = 4 Hz, solo 5 muestras", "E_e = 11,05  (61,4 %)", None),
]
for ax, (r, titulo, sub, ext) in zip(ejes, paneles):
    ax.plot(r["t"], x(r["t"]), color=AZUL, lw=2.4, label="x(t)")
    ax.plot(r["t"], r["xr"], color=NARANJA, lw=2.0, ls="--", label="x_r(t)")
    if ext is not None:
        ax.plot(r["t"], ext, color=TEXTO, lw=1.2, ls=":", label="alias esperado")
    en = (r["tk"] >= VENTANA[0]) & (r["tk"] <= VENTANA[1])
    ax.plot(r["tk"][en], r["xk"][en], "o", color=AMARILLO, ms=6, label="muestras")
    ax.set_ylim(-4.4, 4.4)
    ax.grid(True)
    ax.set_xlabel("t (s)")
    ax.set_title(titulo, loc="left", fontsize=12, color=AZUL)
    ax.text(0.02, 0.04, sub, transform=ax.transAxes, fontsize=11, color=VERDE,
            bbox=dict(facecolor=FONDO, edgecolor="none", alpha=0.85, pad=2))
ejes[0].set_ylabel("amplitud")
ejes[0].legend(loc="upper right", fontsize=9, ncol=2, facecolor=FONDO, edgecolor=EJE)
fig.tight_layout()
fig.savefig(FIGURAS / "resumen.png", dpi=140)
plt.close(fig)

# %% Guardar resultados
texto = "\n".join(lineas)
(CARPETA / "resultados.txt").write_text(texto + "\n", encoding="utf-8")
print(texto)
