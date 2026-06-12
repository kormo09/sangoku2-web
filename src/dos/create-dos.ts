import { once, load } from "nano-loader";

const loadJsDos = once(() => load("/static/js-dos/js-dos.js"));

export async function createDos(
  canvas: HTMLCanvasElement,
): Promise<{ fs: DosFileSystem; main: (args: string[]) => Promise<void> }> {
  await loadJsDos();

  return await new Promise((resolve) => {
    window
      .Dos(canvas, {
        wdosboxUrl: "/static/js-dos/wdosbox.js",
        SDL_numSimultaneouslyQueuedBuffers: 10,
      })
      .ready((fs, main) => resolve({ fs, main }));
  });
}
