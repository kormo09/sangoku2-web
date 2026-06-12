import fileDialog from "file-dialog";
import { saveAs } from "file-saver";
import nipple from "nipplejs";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { GAME_CONFIG } from "../config/game-manifest";
import { createDos } from "../dos/create-dos";
import {
  blockAddEventListener,
  createKeyboardEvent,
  getBlockedHandler,
  restoreAddEventListener,
} from "../event";
import {
  IdbFileSystem,
  createIdbFileSystem,
} from "../fs/create-idb-file-system";
import {
  clearAllSaves,
  restoreSavedFiles,
  saveKey,
  watchSaveFiles,
} from "../fs/save-sync";
import { VirtualKeyboard } from "./VirtualKeyboard";

const { gameFile, mod, entry, width: GAME_WIDTH, height: GAME_HEIGHT } =
  GAME_CONFIG;

const JOYSTICK_MAPS = [103, 104, 105, 100, 97, 98, 99, 102];

const KEY_ALIAS: Record<string, number> = {
  ArrowLeftDown: 97,
  ArrowRightDown: 99,
  ArrowLeftUp: 103,
  ArrowRightUp: 105,
  Enter: 13,
  ArrowLeft: 100,
  ArrowUp: 104,
  ArrowRight: 102,
  ArrowDown: 98,
};

export function Game() {
  const [width, setWidth] = useState(GAME_WIDTH);
  const [height, setHeight] = useState(GAME_HEIGHT);

  const [joystickCode, setJoystickCode] = useState<number | null>(null);
  const joystickCodeBefore = useRef<number | null>(null);

  const [enabledToggleFns, setEnabledToggleFns] = useState(false);
  const [enabledToggleFullscreen, setEnabledToggleFullscreen] = useState(false);
  const [enabledToggleKeyboard, setEnabledToggleKeyboard] = useState(true);

  const screen = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mobileController = useRef<HTMLDivElement>(null);

  const isClearExit = useRef(false);
  const keydownHandlers = useRef<EventListener[]>([]);
  const keyupHandlers = useRef<EventListener[]>([]);

  const [toastMessage, setToastMessage] = useState<string | undefined>();
  const [innerToastMessage, setInnerToastMessage] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (toastMessage) {
      setInnerToastMessage(toastMessage);
      const timeout = setTimeout(() => setToastMessage(undefined), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  const database = useRef<IdbFileSystem | null>(null);

  const handleResize = useCallback(() => {
    const { width: screenWidth, height: screenHeight } =
      screen.current!.getBoundingClientRect();
    if (screenWidth / GAME_WIDTH > screenHeight / GAME_HEIGHT) {
      setWidth(~~((screenHeight * GAME_WIDTH) / GAME_HEIGHT));
      setHeight(screenHeight);
    } else {
      setWidth(screenWidth);
      setHeight(~~((screenWidth * GAME_HEIGHT) / GAME_WIDTH));
    }
  }, []);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isClearExit.current) {
      return;
    }
    e.preventDefault();
    return (e.returnValue =
      "페이지를 벗어나면 저장하지 않은 내용이 날아갈 수 있습니다.");
  }, []);

  const handleFullScreenChange = useCallback(() => {
    setEnabledToggleFullscreen(!!window.document.fullscreenElement);
  }, []);

  const handleKeyDown = useCallback((code: number) => {
    const event = createKeyboardEvent("keydown", code);
    keydownHandlers.current.forEach((handler) => handler(event));
  }, []);

  const handleKeyUp = useCallback((code: number) => {
    const event = createKeyboardEvent("keyup", code);
    keyupHandlers.current.forEach((handler) => handler(event));
  }, []);

  const handleDocumentKeyDown = useCallback(
    (e: KeyboardEvent) => {
      handleKeyDown(KEY_ALIAS[e.code] ?? e.keyCode);
    },
    [handleKeyDown],
  );

  const handleDocumentKeyUp = useCallback(
    (e: KeyboardEvent) => {
      handleKeyUp(KEY_ALIAS[e.code] ?? e.keyCode);
    },
    [handleKeyUp],
  );

  useEffect(() => {
    if (joystickCode === joystickCodeBefore.current) {
      return;
    }
    if (joystickCodeBefore.current) {
      handleKeyUp(joystickCodeBefore.current);
    }
    if (joystickCode) {
      handleKeyDown(joystickCode);
    }
    joystickCodeBefore.current = joystickCode;
  }, [joystickCode, handleKeyDown, handleKeyUp]);

  const start = useCallback(async () => {
    const joystick = nipple.create({
      zone: mobileController.current!,
    });
    blockAddEventListener(document, ["keydown", "keyup", "keypress"]);
    const db = (database.current = await createIdbFileSystem(mod, 1));
    const { fs, main } = await createDos(canvas.current!);
    await fs.extract(`/static/game/${gameFile}`);

    const restored = await restoreSavedFiles(db, fs);
    if (restored > 0) {
      setToastMessage(`저장 파일 ${restored}개를 불러왔습니다.`);
    }

    await main(["-c", entry]);
    keydownHandlers.current = getBlockedHandler(
      document,
      "keydown",
    ) as EventListener[];
    keyupHandlers.current = getBlockedHandler(
      document,
      "keyup",
    ) as EventListener[];
    restoreAddEventListener(document);

    document.addEventListener("keydown", handleDocumentKeyDown);
    document.addEventListener("keyup", handleDocumentKeyUp);

    joystick.on("move", (_, data) => {
      if (data.force > 0.3) {
        setJoystickCode(
          JOYSTICK_MAPS[(Math.floor((data.angle.degree - 22.5) / 45) + 8) % 8],
        );
      } else {
        setJoystickCode(null);
      }
    });

    joystick.on("end", () => {
      setJoystickCode(null);
    });

    watchSaveFiles(fs, db, (filename) => {
      setToastMessage(`"${filename}" 저장 완료 (브라우저)`);
      isClearExit.current = true;
      setTimeout(() => {
        isClearExit.current = false;
      }, 5000);
    });
  }, [handleDocumentKeyDown, handleDocumentKeyUp]);

  useEffect(() => {
    handleResize();

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    window.addEventListener("resize", handleResize);
    window.addEventListener("beforeunload", handleBeforeUnload);

    start();

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.removeEventListener("keyup", handleDocumentKeyUp);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    handleResize,
    handleBeforeUnload,
    handleFullScreenChange,
    handleDocumentKeyDown,
    handleDocumentKeyUp,
    start,
  ]);

  const toggleFns = useCallback(() => {
    setEnabledToggleFns(!enabledToggleFns);
  }, [enabledToggleFns]);

  const toggleFullscreen = useCallback(() => {
    const doc = window.document;
    if (!doc.fullscreenElement) {
      doc.documentElement.requestFullscreen();
    } else {
      doc.exitFullscreen();
    }
  }, []);

  const resetGame = useCallback(async () => {
    if (!database.current) {
      return;
    }
    if (
      !confirm(
        "게임을 초기화하면 브라우저에 저장된 모든 세이브가 삭제됩니다.\n계속 진행하시겠습니까?",
      )
    ) {
      return;
    }
    await clearAllSaves(database.current);
    setToastMessage(
      "세이브 파일이 삭제되었습니다.\n새로고침 후 새 게임을 시작할 수 있습니다.",
    );
  }, []);

  const downloadSaveFiles = useCallback(async () => {
    if (!database.current) {
      return;
    }
    const keys = await database.current.list("save:");
    if (keys.length === 0) {
      setToastMessage("저장된 세이브 파일이 없습니다.");
      return;
    }
    for (const key of keys) {
      const data = await database.current.load(key);
      if (!data) {
        continue;
      }
      const filename = key.slice("save:".length);
      const url = URL.createObjectURL(
        new Blob([data], { type: "application/octet-stream" }),
      );
      saveAs(url, filename);
    }
    setToastMessage(`세이브 파일 ${keys.length}개를 다운로드했습니다.`);
  }, []);

  const uploadSaveFiles = useCallback(async () => {
    if (!database.current) {
      return;
    }
    if (
      !confirm(
        "세이브 파일을 가져오면 현재 브라우저의 저장 데이터가 덮어씌워질 수 있습니다.\n계속 진행하시겠습니까?",
      )
    ) {
      return;
    }
    const files = await fileDialog({ multiple: true });
    if (!files.length) {
      return;
    }
    for (const file of files) {
      await database.current.save(
        saveKey(file.name),
        new Uint8Array(await file.arrayBuffer()),
      );
    }
    setToastMessage(
      "세이브 파일을 브라우저에 저장했습니다.\n새로고침 후 불러올 수 있습니다.",
    );
  }, []);

  const toggleKeyboard = useCallback(() => {
    setEnabledToggleKeyboard(!enabledToggleKeyboard);
  }, [enabledToggleKeyboard]);

  const ignoreStopAndPrevent = useCallback((e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <div
      class="game"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        "--screen-width": `${width}px`,
        "--screen-height": `${height}px`,
      }}
    >
      <div class="game__header">
        <nav class="game__header__nav">
          <a
            class="game__header__item"
            title="기능"
            onClick={toggleFns}
            onContextMenu={ignoreStopAndPrevent}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </a>
          <a
            class="game__header__item"
            title="전체화면"
            onClick={toggleFullscreen}
            onContextMenu={ignoreStopAndPrevent}
          >
            {enabledToggleFullscreen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </a>
          <a
            class={`game__header__item${enabledToggleKeyboard ? "" : " game__header__item--disabled"}`}
            title="가상 키패드"
            onClick={toggleKeyboard}
            onContextMenu={ignoreStopAndPrevent}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
            </svg>
          </a>
        </nav>

        <div
          class={`game__header__fns${enabledToggleFns ? " game__header__fns--toggled" : ""}`}
        >
          <a
            class="game__header__fns__item"
            onClick={resetGame}
            onContextMenu={ignoreStopAndPrevent}
          >
            <span>게임 초기화</span>
          </a>
          <a
            class="game__header__fns__item"
            onClick={downloadSaveFiles}
            onContextMenu={ignoreStopAndPrevent}
          >
            <span>세이브 다운로드</span>
          </a>
          <a
            class="game__header__fns__item"
            onClick={uploadSaveFiles}
            onContextMenu={ignoreStopAndPrevent}
          >
            <span>세이브 가져오기</span>
          </a>
        </div>

        <div class="game__screen" ref={screen}>
          <div class="game__canvas" ref={mobileController}>
            <canvas ref={canvas} />
          </div>
          <div class="game__event-blocker" />
          {enabledToggleKeyboard && (
            <VirtualKeyboard
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
            />
          )}
        </div>
      </div>

      <div class={`toast${innerToastMessage ? " toast--active" : ""}`}>
        {innerToastMessage}
      </div>
    </div>
  );
}
