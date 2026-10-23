/// <reference types="vite/client" />
/// <reference types="chrome" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
