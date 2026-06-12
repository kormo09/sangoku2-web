import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

const STORAGE_KEY = "sangoku2_access_key";

interface AuthGateProps {
  children: ComponentChildren;
}

export function AuthGate({ children }: AuthGateProps) {
  const accessKey = __ACCESS_KEY__;
  const [authed, setAuthed] = useState(!accessKey);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessKey) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const urlKey = params.get("key");
    const storedKey = sessionStorage.getItem(STORAGE_KEY);
    const candidate = urlKey ?? storedKey;

    if (candidate === accessKey) {
      sessionStorage.setItem(STORAGE_KEY, candidate);
      setAuthed(true);
      if (urlKey) {
        history.replaceState({}, "", location.pathname);
      }
    }
  }, [accessKey]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (input === accessKey) {
      sessionStorage.setItem(STORAGE_KEY, input);
      setAuthed(true);
      setError("");
      return;
    }
    setError("접속 키가 올바르지 않습니다.");
  };

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div class="auth-gate">
      <div class="auth-gate__panel">
        <h1 class="auth-gate__title">삼국지2 웹버전</h1>
        <p class="auth-gate__desc">개인 실험용 페이지입니다. 접속 키를 입력하세요.</p>
        <form class="auth-gate__form" onSubmit={handleSubmit}>
          <input
            class="auth-gate__input"
            type="password"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            placeholder="접속 키"
            autocomplete="off"
          />
          <button class="auth-gate__button" type="submit">
            입장
          </button>
        </form>
        {error && <p class="auth-gate__error">{error}</p>}
      </div>
    </div>
  );
}
