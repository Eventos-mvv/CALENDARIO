/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" na versão incorporada (pré-visualização no Claude), que não permite imprimir nem baixar arquivos. */
  readonly VITE_EMBEDDED?: string;
  /** Data fixa (AAAA-MM-DD) para testar o destaque do dia atual. */
  readonly VITE_TODAY?: string;
  /** "1" depois de `npm run fotos`: usa as fotos baixadas em public/fotos. */
  readonly VITE_LOCAL_PHOTOS?: string;
}
