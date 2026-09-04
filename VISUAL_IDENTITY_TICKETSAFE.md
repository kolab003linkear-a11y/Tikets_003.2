# Manual de Identidad Visual: TiKetSafe

Este documento establece los lineamientos de diseño visual, paleta de colores, tipografías y estándares de accesibilidad para la aplicación TiKetSafe.

## 1. Concepto de diseño: Calma Pacífica

La interfaz está diseñada para entornos de baja luminosidad, como vestíbulos y salas de cine. Combina un fondo profundo para reducir la fatiga visual con acentos vibrantes que guían al usuario durante la selección, el pago y la validación.

## 2. Paleta de colores

| Elemento | Nombre | Hexadecimal | Uso |
| --- | --- | --- | --- |
| Fondo principal | Azul marino profundo | `#0B1220` | Base de la aplicación y superficies principales. |
| Acción principal | Azul eléctrico | `#4F8CFF` | Botones, foco, enlaces e interacciones críticas. |
| Éxito y validación | Turquesa confianza | `#2DD4BF` | Confirmaciones, acceso aprobado y sincronización. |
| Alertas críticas | Coral de atención | `#F97068` | Errores, advertencias y estados de atención. |
| Texto primario | Blanco limpio | `#F7F9FC` | Títulos y contenido principal. |
| Texto secundario | Gris acero | `#A8B3C4` | Etiquetas, metadatos y texto de soporte. |

Superficies auxiliares pueden usar `#111C2E` y `#18263A`, siempre conservando contraste suficiente con el texto.

## 3. Tipografía

- **Satoshi**: títulos, nombres de eventos y acciones destacadas.
- **DM Sans**: cuerpo, etiquetas, formularios y tablas.

En React Native, las fuentes deben cargarse como assets antes de asignar un `fontFamily` específico. Mientras esos assets no estén incluidos, se usa la familia sans-serif nativa como fallback para evitar fallos en Expo Go.

### Tamaños recomendados

- Título de pantalla: 24 px, peso 700.
- Título de tarjeta: 20 px, peso 600.
- Cuerpo: 14 px, peso 400.
- Texto de botón: 13.6 px, peso 700.
- Texto auxiliar: 12 px o mayor cuando sea información funcional.

## 4. Accesibilidad WCAG AA

- El texto normal debe alcanzar una relación de contraste mínima de 4.5:1.
- El texto grande debe alcanzar como mínimo 3:1.
- El color nunca debe ser la única señal de estado.
- Los errores deben incluir texto explícito, por ejemplo: `ERROR: no se pudo validar el boleto.`
- Los éxitos deben incluir texto explícito, por ejemplo: `ACCESO AUTORIZADO.`
- Los controles táctiles deben tener un área cómoda y estados visibles de foco, presión y deshabilitado.
- Los mensajes de carga, error y vacío deben ser legibles y no depender solo de iconos.

## 5. Componentes y superficies

La interfaz usa superficies profundas, bordes finos y transparencias moderadas para crear profundidad sin perder legibilidad:

```css
background: rgba(15, 23, 42, 0.45);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

En React Native, `backdrop-filter` no está disponible de forma uniforme en todas las plataformas. Se representa mediante fondos semitransparentes, bordes sutiles y sombras ligeras.

Las transiciones deben durar aproximadamente `0.2s` y comunicar cambios de estado, sin animaciones que dificulten la lectura.

## 6. Aplicación en TicketSafe

- La navegación y las acciones principales usan Azul Cielo.
- Los errores de reserva o validación usan Rosa Vibrante con mensaje descriptivo.
- Las confirmaciones de pago y acceso usan Verde Azulado con mensaje explícito.
- El fondo Azul Profundo se mantiene como base para uso nocturno.
- Las tarjetas, formularios y grillas deben conservar bordes sutiles y separación suficiente.
- El QR y los estados de ticket deben ser claramente distinguibles del fondo.

## 7. Archivos relacionados

- `frontend/src/theme.ts`: tokens compartidos de color, tipografía y espaciado.
- `frontend/src/screens/`: aplicación de los tokens en las pantallas móviles.
- `frontend/app.json`: configuración de Expo y plataforma.
