// src/types/google.d.ts

interface GsiAccounts {
  id: {
    initialize: (config: any) => void;
    renderButton: (element: HTMLElement | null, config: any) => void;
    prompt: () => void; // <-- Necesario para el prompt automático
    // Agrega aquí cualquier otra función de ID que uses
  };
  oauth2: {
    // 🚨 Tipos que ya usabas (Auth Code Flow):
    initCodeClient: (config: any) => void;
    launchCodeFlow: () => void;
    
    // 🚨 Tipos FALTANTES (Access Token Flow):
    initTokenClient: (config: any) => any; // Retorna el objeto TokenClient
    requestAccessToken: (overrideConfig?: any) => void; 
    // Agrega aquí cualquier otra función de OAuth2 que uses
  }
}

interface Window {
  google: {
    accounts: GsiAccounts;
  };
}