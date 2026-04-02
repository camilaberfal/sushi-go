# Interfaz de Usuario y Experiencia (UI/UX)

## Propósito
Detallar exhaustivamente la estética particular, fuentes, disposiciones de color y sensación kinestésica digital a través de todo "Sushi Go! Online", en adición a las distribuciones visuales solicitadas textualmente para cada pantalla (Menu Principal, Lobby, Juego Activo, Scoreboards, Modales de error intermedios). 

La estética principal estipulada es: coherente con Gamewright, colorida, viva, **kawaii**, espaciada, minimalista, transmitiendo velocidad, fluidez y sensación de alegría.

## 1. Tipografías Oficiles
- **Fredoka:** Para Títulos (Headings: Título del Landing, Título del Modal de Revancha, "Scoreboard").
- **Outfit:** Para texto (Botones, Nombres de jugador, Reglas textuales, "esperando...").
- **Iconografía Activa:** Uso sistemático de "Lucide Icons" para botones de ajustes, copia de links, iconos en los logros.

## 2. Layouts y Aspecto General por Pantalla
### A. Landing (Menú Principal)
- **Centro:** Logotipo SVG de Sushi Go!. 
- **Flujo Inferior:** Dos botones coloridos vibrantes primarios (Ej. Rosa Coral / Cian, bordes redondeados y sombra suave, con hover scale `1.05`). 
- **Modales (Popup) de Creación o Unión a Sala:** 
  - Al abrirse, un `backdrop-blur` de fondo oscuro.
  - El diseño interno es pastel suave, inputs espaciados, bordes redondeados, texto grande *Outfit*.
  - Transiciones del Drop (Framer Motion `opacity`, `translateY`).
  - Avisos de "Sala Incorrecta" (Error) con sacudida horizontal ligera de Framer Motion. 

### B. Lobby de Espera
- Fondo con un patrón sutil Kawaii (Makis semitransparentes). 
- El código de la sala se presenta textualmente enorme y un icono Lucide de *Copy-to-Clipboard* adherido.
- La lista de jugadores usa Avatares planos amigables, agrupados con padding amplio (`p-4`, `gap-4`).

### C. Juego Activo (La Mesa o Game View)
- HUD Minimalista. Arriba: Indicador de la ronda actual (`Fredoka`) y texto flotante. Abajo: TUS pudines, TUS puntos, TUS cartas restantes.  Arriba: Puntos de otros y pudines en avatares comprimidos con indicadores reversos de cuántas cartas restan en su mano.
- **La Mano / Cartas Activas (Bottom de Pantalla):** 
  - Las cartas de tu mazo se juntan **automáticamente** por el mismo tipo en grupos superpuestos. Y visualmente se **aíslan** siempre las cartas especiales como Wasabis y Palillos (con *margin-left* extra). 
  - Todo rodeado con mucho padding para evitar equivocaciones de `Touch/Click`.
- **Mesa Expuesta (Centro de Pantalla):** 
  - Las cartas que todos ya han jugado (incluso tú). 
  - Aún en la zona central de cada Avatar o Espacio (Side Layout), se apilarán unas sobre otras.

## 3. Animaciones Principales y Critical Game Feel (Framer Motion)
"Animaciones, transiciones y efectos de sonido muy presentes que hagan que elegir y revelar cada carta se sienta satisfactorio".

- Acción 1: Hover de Tarjeta. La carta del jugador se sobredimensiona (`1.1 scale`) con una curva de elasticidad suave (*spring*).
- Acción 2: Seleccionar una Tarjeta. La carta cambia su *border* a un color llamativo (Kawaii Yellow o similar). Se emite sonido en Howler.js (*pop/bloop*), un microshake positivo.
- Fase de Retención (Espera del resto): Overlay blureado con el texto "esperando a otros jugadores".
- **Hito de Revelación Simultánea (La acción clave del diseño):**
  - Desencadena todas simultáneamente. El servidor emite `REVEAL_CARDS`.
  - Animación pesada y muy gratificante Framer Motion: Las N cartas giran desde el centro, volteándose 180º en 3D en milisegundos (`duration: 0.4`), el texto *SushiGo* Fredoka de "RESULTADO" puede golpear la pantalla con un sonido "Ta-Da" alegre de Howler.js.
  - La rotación de mazos se anima visualmente "desplazando" fluidamente todo el bloque sobrante hacia un costado de la pantalla izquierda o derecha y dejando espacio vacío medio segundo, antes de que entren las nuevas re-agrupadas (por tipo / aislado palillos) desde el extremo opuesto con un "Whoosh".

## 4. Diseño del Breakdown y Highlights Scoreboard (Reporting)
- Presentación Visual Tipo Podio con animaciones en Y para 1ro, 2do y 3ro usando Lucide Icons y colores metálicos pastel. 
- Sección tipo *Card Grid* para el Breakdown: 
  - Logros textuales "Más wasabis usados", "Completar 2 pares de tempura...", "Acumular 5 gyozas".
  - Historias "Carta más jugada", "X fue el jugador más veloz, con un tiempo promedio de Y", "Z generó más puntos base", todo utilizando las métricas de estado descritas en STATE_MANAGEMENT.md de forma humana y cálida.
