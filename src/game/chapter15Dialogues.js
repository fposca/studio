const line = (speaker, text, id) => ({ speaker, text, audioId: `ch15-${id}`, audioUrl: null });

export const CHAPTER15_DIALOGUES = {
  arrival: [
    line("NEONBOY", "¡1999! ¡Por fin volvimos!", "arrival-01"),
    line("DESCONECTADA", "Es extraño... No veo pantallas conectadas a la Red.", "arrival-02"),
    line("NEONBOY", "En esta época todavía hablamos con la gente, ¿viste?", "arrival-03"),
    line("DESCONECTADA", "¿Y cómo sabemos si la Anomalía ya estaba acá?", "arrival-04"),
    line("NEONBOY", "Conozco a alguien que puede ayudarnos. Vamos al estudio.", "arrival-05"),
  ],
  storeArrival: [
    line("NEONBOY", "Pará... Esta tienda estaba completamente destruida.", "store-arrival-01"),
    line("DESCONECTADA", "Entonces no regresamos exactamente al momento del que te fuiste.", "store-arrival-02"),
    line("NEONBOY", "¿Me estás diciendo que llegamos antes de que todo pasara?", "store-arrival-03"),
    line("DESCONECTADA", "Eso parece. Y quizás todavía estemos a tiempo de descubrir quién lo provocó.", "store-arrival-04"),
  ],
  hugo: [
    line("HUGO", "¡NeonBoy! ¿Dónde te metiste? Hace rato que te estamos buscando.", "hugo-01"),
    line("NEONBOY", "Es una historia larga. Digamos que fui al futuro y volví.", "hugo-02"),
    line("HUGO", "¿Al futuro?", "hugo-03"),
    line("NEONBOY", "Sí, Hugo. Y allá también tenemos problemas con las grabaciones.", "hugo-04"),
    line("DESCONECTADA", "Trajimos un registro que podría explicar cómo comenzó la Anomalía.", "hugo-05"),
    line("HUGO", "Mostrame.", "hugo-06"),
    line("NEONBOY", "Viene de un sistema que controlaba medio Buenos Aires en 2049.", "hugo-07"),
    line("HUGO", "Esto es imposible... La estructura de esa señal se parece muchísimo a una grabación que analizamos acá.", "hugo-08"),
    line("NEONBOY", "Entonces necesitamos escucharla otra vez.", "hugo-09"),
    line("HUGO", "Hay algo que nunca logramos separar. Un canal que no debería existir.", "hugo-10"),
  ],
  tito: [
    line("NEONBOY", "Tito, este disco aparece vendido antes de haber entrado en la tienda.", "tito-01"),
    line("TITO", "Vi ese asiento en el libro. No recuerdo haberlo vendido, y no me gusta que figure con mi letra.", "tito-02"),
    line("DESCONECTADA", "La fecha está alterada. El registro del futuro usa la misma marca.", "tito-03"),
    line("TITO", "No escondo nada, pibe. Si querés seguir la pista, mirá bien la funda.", "tito-04"),
  ],
  roxy: [
    line("NEONBOY", "Roxy, hay símbolos extraños entre los versos de esta letra.", "roxy-01"),
    line("ROXY", "Sí. Aparecieron cuando volví a abrir el cuaderno. Yo no los dibujé.", "roxy-02"),
    line("DESCONECTADA", "En 2049 esa forma aparecía en las transmisiones de la Red.", "roxy-03"),
    line("ROXY", "Entonces alguien está escribiendo sobre mis canciones. Y eso no me causa gracia.", "roxy-04"),
  ],
  rulo: [
    line("NEONBOY", "Rulo, ¿te suena esta referencia a una cinta magnética?", "rulo-01"),
    line("RULO", "Me suena una frecuencia rara. La escuché en una prueba y me dejó el oído como después de tres recitales.", "rulo-02"),
    line("NEONBOY", "¿Y sabés de dónde salió?", "rulo-03"),
    line("RULO", "Si lo supiera ya le habría puesto nombre a una banda. No estaba en el catálogo, eso seguro.", "rulo-04"),
  ],
  compare: [
    line("DESCONECTADA", "En 2049 la Red controla millones de dispositivos. Pero acá todavía necesita una señal física.", "compare-01"),
    line("NEONBOY", "Una cinta, un disco... O una grabación.", "compare-02"),
    line("DESCONECTADA", "Entonces quien tuvo acceso al original pudo haber iniciado todo.", "compare-03"),
  ],
};
