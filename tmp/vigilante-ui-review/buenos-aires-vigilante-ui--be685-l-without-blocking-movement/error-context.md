# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buenos-aires-vigilante-ui.spec.js >> mobile touch controls reveal Matrix nodes, launch and recall without blocking movement
- Location: tests\game\buenos-aires-vigilante-ui.spec.js:45:1

# Error details

```
Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - region "Capitulo 14, Buenos Aires 2049" [ref=e4]:
    - generic "Capitulo 14, Buenos Aires 2049 3D recorrible" [ref=e6]
    - generic:
      - generic:
        - text: NEONBOY UNIVERSE / CAPÍTULO 14
        - heading "BUENOS AIRES 2049" [level=2]
        - paragraph: LA CIUDAD DE LOS AUSENTES
      - generic [ref=e7]:
        - button "INVENTARIO" [ref=e8] [cursor=pointer]
        - button "DIARIO" [ref=e13] [cursor=pointer]
        - button "MAPA" [ref=e14] [cursor=pointer]
    - status "Misión VIGILANTE DE LA RED":
      - generic:
        - generic:
          - generic: MISIÓN EN CURSO
          - heading "VIGILANTE DE LA RED" [level=3]
      - generic:
        - paragraph: Revelá los tres nodos con C y golpealos con el Orbe para desactivar el escudo (0/3).
      - generic:
        - generic: CIUDADANOS / 3 DE 3
        - generic: SEÑAL / DETECTADA
        - generic: OBELISCO / RECONOCIDO
        - generic: TRANSMISORES / 3 DE 3
        - generic: RED / TE DETECTÓ
    - button "VISIÓN DE FRECUENCIA C · INACTIVA" [disabled] [ref=e20]:
      - text: VISIÓN DE FRECUENCIA
      - generic [ref=e21]: C
      - text: · INACTIVA
    - status "Salud 0 de 3" [ref=e22]: ♡♡♡
    - progressbar "Vigilante de la Red":
      - strong: VIGILANTE DE LA RED
      - text: ESCUDO / NODOS 0/3
    - dialog "Has caído ante el Vigilante" [ref=e24]:
      - heading "LA RED TE ALCANZÓ" [level=2] [ref=e25]
      - paragraph [ref=e26]: Los tres transmisores se conservan. Volvé a intentar el encuentro con el Vigilante.
      - button "Reintentar combate" [ref=e27] [cursor=pointer]
    - generic:
      - generic: CAPÍTULO 14 / BUENOS AIRES
      - generic: TERCERA PERSONA
      - generic: 2049 / LA CIUDAD DE LOS AUSENTES
  - button "Pausar juego" [ref=e28] [cursor=pointer]: PAUSA
```