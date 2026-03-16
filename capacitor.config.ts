import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eduscan.app",
  appName: "EduScan",
  // En produccion, apuntar a la URL desplegada en Vercel
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://eduscan.vercel.app",
    cleartext: false,
    allowNavigation: [
      "*.supabase.co",
      "accounts.google.com",
      "*.stripe.com",
      "checkout.stripe.com",
      "billing.stripe.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: "splash",
      backgroundColor: "#476550",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#476550",
    },
    Camera: {
      // Calidad de imagen para fotos de examenes
      quality: 85,
    },
  },
  // Deep links para OAuth callback
  android: {
    allowMixedContent: false,
  },
  ios: {
    scheme: "EduScan",
  },
};

export default config;
