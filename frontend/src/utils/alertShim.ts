import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';

export function installWebAlertShim() {
  if (Platform.OS !== 'web') return;

  // En react-native-web el método Alert.alert es un no-op (clase vacía),
  // por lo que todos los mensajes de error/éxito del app se trazaban en
  // silencio en la web (botones "Reservando..." que volvían a "Pagar" sin
  // mostrar nada). Lo reemplazamos por el diálogo nativo del navegador.
  Alert.alert = (title?: string, message?: string, buttons?: AlertButton[]): void => {
    const text = [title, message].filter(Boolean).join('\n\n');

    if (buttons && buttons.length > 0) {
      const primaryAction = buttons.find((button) => button && button.style !== 'cancel') ?? buttons[buttons.length - 1];
      if (window.confirm(text)) {
        primaryAction?.onPress?.();
      }
      return;
    }

    window.alert(text);
  };
}