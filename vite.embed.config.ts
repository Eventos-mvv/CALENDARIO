import { defineConfig } from 'vite';

/**
 * Build da versão incorporada (pré-visualização publicada pelo Claude).
 * Gera um único script IIFE que usa React/ReactDOM carregados da CDN,
 * e desativa imprimir/baixar (bloqueados naquele ambiente).
 * Para o site oficial use `npm run build`.
 */
export default defineConfig({
  // A pré-visualização carrega a Archivo do Google Fonts; não embute os arquivos da fonte.
  resolve: {
    alias: { '@fontsource-variable/archivo/standard.css': '/src/styles/empty.css' },
  },
  define: {
    'import.meta.env.VITE_EMBEDDED': JSON.stringify('1'),
    'import.meta.env.VITE_LOCAL_PHOTOS': JSON.stringify('0'),
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsxInject: "import React from 'react'",
  },
  build: {
    outDir: 'dist-embed',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'CalendarioMVV',
      fileName: () => 'app.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' },
        assetFileNames: 'app.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
