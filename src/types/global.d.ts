declare const APP_VERSION: string;
declare const __ACCESS_KEY__: string;

interface Window {
  Dos: (
    canvas: HTMLCanvasElement,
    options: Record<string, unknown>,
  ) => {
    ready: (
      callback: (
        fs: DosFileSystem,
        main: (args: string[]) => Promise<void>,
      ) => void,
    ) => void;
  };
  DosController: {
    Move: (elem: HTMLDivElement, consumer: unknown) => void;
  };
}

interface DosFileSystem {
  extract: (url: string) => Promise<void>;
  fs: {
    readdir: (path: string) => string[];
    stat: (path: string) => { mtime: Date; isFile: () => boolean };
    readFile: (path: string) => Uint8Array;
    writeFile: (path: string, data: Uint8Array) => void;
  };
}
