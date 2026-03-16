import { isNative } from "./platform";

/**
 * Captura una foto usando la camara nativa (Capacitor) o el input del navegador.
 * Devuelve un File listo para subir a Supabase Storage.
 */
export async function takePhoto(): Promise<File | null> {
  if (!isNative()) {
    // En web, dejar que el componente use <input capture="environment">
    return null;
  }

  const { Camera, CameraResultType, CameraSource } = await import(
    "@capacitor/camera"
  );

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      correctOrientation: true,
    });

    if (!photo.webPath) return null;

    // Convertir la URI de Capacitor a un File
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const filename = `exam_${Date.now()}.${photo.format || "jpeg"}`;

    return new File([blob], filename, {
      type: `image/${photo.format || "jpeg"}`,
    });
  } catch {
    // Usuario cancelo la camara
    return null;
  }
}

/**
 * Selecciona fotos de la galeria usando Capacitor o input del navegador.
 */
export async function pickPhotos(): Promise<File[]> {
  if (!isNative()) {
    return [];
  }

  const { Camera, CameraResultType, CameraSource } = await import(
    "@capacitor/camera"
  );

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      correctOrientation: true,
    });

    if (!photo.webPath) return [];

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const filename = `exam_${Date.now()}.${photo.format || "jpeg"}`;

    return [
      new File([blob], filename, {
        type: `image/${photo.format || "jpeg"}`,
      }),
    ];
  } catch {
    return [];
  }
}
