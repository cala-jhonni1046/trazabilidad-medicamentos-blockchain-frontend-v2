// Se ejecuta antes de cada archivo de tests (angular.json → test.options.setupFiles).
//
// La primera carga de los módulos de Material tarda y, con varios archivos corriendo en paralelo,
// el primer test de cada uno puede pasar los 5 s por defecto sin que haya ningún problema real.
vi.setConfig({ testTimeout: 20_000 });
