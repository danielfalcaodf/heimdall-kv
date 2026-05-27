// Permite importações side-effect de arquivos CSS no TypeScript 6+
declare module '*.css' {
  const styles: { readonly [key: string]: string };
  export default styles;
}
