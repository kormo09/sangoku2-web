import { ComponentChildren } from "preact";
import { useCallback, useMemo, useRef } from "preact/hooks";

const enum KeyCode {
  Digit0 = 48,
  Digit1 = 49,
  Digit2 = 50,
  Digit3 = 51,
  Digit4 = 52,
  Digit5 = 53,
  Digit6 = 54,
  Digit7 = 55,
  Digit8 = 56,
  Digit9 = 57,

  Numpad0 = 96,
  Numpad1 = 97,
  Numpad2 = 98,
  Numpad3 = 99,
  Numpad4 = 100,
  Numpad5 = 101,
  Numpad6 = 102,
  Numpad7 = 103,
  Numpad8 = 104,
  Numpad9 = 105,

  NumpadAdd = 107,
  NumpadSubtract = 109,
  NumpadMultiply = 106,
  NumpadDivide = 111,
  NumpadEqual = 187,
  NumpadEnter = 13,

  NumpadDecimal = 110,

  PageUp = 33,
  PageDown = 34,

  Space = 32,
  Escape = 27,
}

export interface VirtualKeyboardProps {
  onKeyUp?: (code: number) => void;
  onKeyDown?: (code: number) => void;
}

export function VirtualKeyboard({ onKeyUp, onKeyDown }: VirtualKeyboardProps) {
  return useMemo(
    () => (
      <table class="virtual-keyboard">
        <tbody>
          <tr>
            <td>
              <Key
                label="Esc"
                onKeyDown={() => onKeyDown?.(KeyCode.Escape)}
                onKeyUp={() => onKeyUp?.(KeyCode.Escape)}
              />
            </td>
            <td>
              <Key
                label="/"
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadDivide)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadDivide)}
              />
            </td>
            <td>
              <Key
                label="*"
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadMultiply)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadMultiply)}
              />
            </td>
            <td>
              <Key
                label="-"
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadSubtract)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadSubtract)}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Key
                label="7"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit7)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit7)}
              />
            </td>
            <td>
              <Key
                label="8"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit8)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit8)}
              />
            </td>
            <td>
              <Key
                label="9"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit9)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit9)}
              />
            </td>
            <td>
              <Key
                label="+"
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadAdd)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadAdd)}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Key
                label="4"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit4)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit4)}
              />
            </td>
            <td>
              <Key
                label="5"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit5)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit5)}
              />
            </td>
            <td>
              <Key
                label="6"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit6)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit6)}
              />
            </td>
            <td>
              <Key
                label="="
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadEqual)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadEqual)}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Key
                label="1"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit1)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit1)}
              />
            </td>
            <td>
              <Key
                label="2"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit2)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit2)}
              />
            </td>
            <td>
              <Key
                label="3"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit3)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit3)}
              />
            </td>
            <td rowSpan={2}>
              <Key
                label="Enter"
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadEnter)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadEnter)}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <Key
                label="0"
                onKeyDown={() => onKeyDown?.(KeyCode.Digit0)}
                onKeyUp={() => onKeyUp?.(KeyCode.Digit0)}
              />
            </td>
            <td>
              <Key
                label="."
                onKeyDown={() => onKeyDown?.(KeyCode.NumpadDecimal)}
                onKeyUp={() => onKeyUp?.(KeyCode.NumpadDecimal)}
              />
            </td>
          </tr>
          <tr>
            <td>
              <Key
                label="PgUp"
                description="이전"
                onKeyDown={() => onKeyDown?.(KeyCode.PageUp)}
                onKeyUp={() => onKeyUp?.(KeyCode.PageUp)}
              />
            </td>
            <td>
              <Key
                label="Space"
                description="선택"
                onKeyDown={() => onKeyDown?.(KeyCode.Space)}
                onKeyUp={() => onKeyUp?.(KeyCode.Space)}
              />
            </td>
            <td colSpan={2}>
              <Key
                label="PgDn"
                description="다음"
                onKeyDown={() => onKeyDown?.(KeyCode.PageDown)}
                onKeyUp={() => onKeyUp?.(KeyCode.PageDown)}
              />
            </td>
          </tr>
        </tbody>
      </table>
    ),
    [onKeyUp, onKeyDown],
  );
}

export interface KeyProps {
  label: ComponentChildren;
  description?: string;
  onKeyDown?: () => void;
  onKeyUp?: () => void;
}

export function Key({ label, description, onKeyDown, onKeyUp }: KeyProps) {
  const isActiveRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    if (isActiveRef.current) {
      return;
    }
    isActiveRef.current = true;
    onKeyDown?.();
  }, [onKeyDown]);

  const handlePointerUp = useCallback(() => {
    if (!isActiveRef.current) {
      return;
    }
    isActiveRef.current = false;
    onKeyUp?.();
  }, [onKeyUp]);

  const handlePointerLeave = useCallback(() => {
    if (isActiveRef.current) {
      handlePointerUp();
    }
  }, [handlePointerUp]);

  const handlePointerCancel = useCallback(() => {
    if (isActiveRef.current) {
      handlePointerUp();
    }
  }, [handlePointerUp]);

  return (
    <button
      class="virtual-keyboard__key"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
    >
      <span class="virtual-keyboard__key__label">{label}</span>
      {description && (
        <span class="virtual-keyboard__key__description">{description}</span>
      )}
    </button>
  );
}
