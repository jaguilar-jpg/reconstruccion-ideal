/* Arranque: dibuja las gráficas SVG y luego inicia reveal.js.
   Las ecuaciones las renderiza el plugin RevealMath.KaTeX (igual que en el trabajo de Serie de Fourier). */
dibujarGraficas();

Reveal.initialize({
  hash: true,
  width: 1280,
  height: 720,
  margin: 0.04,
  slideNumber: 'c/t',
  transition: 'fade',
  transitionSpeed: 'fast',
  center: false,
  plugins: [RevealMath.KaTeX],
  katex: { local: 'lib/katex' }
});
