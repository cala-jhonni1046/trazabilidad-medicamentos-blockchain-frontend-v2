// Los SVG de @material-symbols se importan como texto (loader ".svg": "text" en angular.json).
declare module '*.svg' {
  const contenido: string;
  export default contenido;
}
