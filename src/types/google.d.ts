// Crea un archivo de declaración de tipos, por ejemplo: src/types/google.d.ts
interface GsiAccounts {
  id: {
    initialize: (config: any) => void;
    renderButton: (element: HTMLElement | null, config: any) => void;
    prompt: () => void;
  };
  oauth2: {
    initCodeClient: (config: any) => void;
    launchCodeFlow: () => void;
  }
}

interface Window {
  google: {
    accounts: GsiAccounts;
  };
}