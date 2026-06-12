import { GAME_MANIFEST } from "../config/game-manifest";
import { debounce } from "../utils/timing";
import type { IdbFileSystem } from "./create-idb-file-system";

const SAVE_PREFIX = "save:";

export function saveKey(filename: string): string {
  return `${SAVE_PREFIX}${filename.toUpperCase()}`;
}

export function isGameFile(filename: string): boolean {
  return GAME_MANIFEST.has(filename.toUpperCase());
}

export async function restoreSavedFiles(
  db: IdbFileSystem,
  fs: DosFileSystem,
): Promise<number> {
  const keys = await db.list(SAVE_PREFIX);
  let count = 0;
  for (const key of keys) {
    const data = await db.load(key);
    if (!data) {
      continue;
    }
    const filename = key.slice(SAVE_PREFIX.length);
    fs.fs.writeFile(filename, data);
    count++;
  }
  return count;
}

export async function persistSaveFile(
  db: IdbFileSystem,
  fs: DosFileSystem,
  filename: string,
): Promise<void> {
  const data = fs.fs.readFile(filename);
  await db.save(saveKey(filename), data);
}

export async function clearAllSaves(db: IdbFileSystem): Promise<void> {
  const keys = await db.list(SAVE_PREFIX);
  await Promise.all(keys.map((key) => db.delete(key)));
}

export function watchSaveFiles(
  fs: DosFileSystem,
  db: IdbFileSystem,
  onSaved: (filename: string) => void,
): void {
  const lastModified = new Map<string, number>();
  const debouncedSave = debounce(async (filename: string) => {
    await persistSaveFile(db, fs, filename);
    onSaved(filename);
  }, 350);

  setInterval(() => {
    try {
      const files = fs.fs.readdir("/");
      for (const file of files) {
        if (isGameFile(file)) {
          continue;
        }
        const stat = fs.fs.stat(`/${file}`);
        if (!stat.isFile()) {
          continue;
        }
        const mtime = stat.mtime.getTime();
        const prev = lastModified.get(file);
        if (prev !== undefined && prev !== mtime) {
          debouncedSave(file);
        }
        lastModified.set(file, mtime);
      }
    } catch {
      // DOS 파일시스템이 아직 준비되지 않은 경우
    }
  }, 300);
}
