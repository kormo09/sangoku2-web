interface SplashProps {
  onStartGame: () => void;
}

export function Splash({ onStartGame }: SplashProps) {
  return (
    <div class="splash">
      <div class="splash__hero">
        <h1 class="splash__title">삼국지 II</h1>
        <p class="splash__subtitle">한글판 · 웹버전</p>
      </div>

      <div class="menu">
        <button class="menu__item menu__item--primary" onClick={onStartGame}>
          <span>게임 시작</span>
        </button>
      </div>

      <ul class="splash__notes">
        <li>세이브 파일은 이 브라우저에만 저장됩니다 (IndexedDB).</li>
        <li>크롬, 파이어폭스, 모바일 브라우저를 권장합니다.</li>
        <li>모바일에서는 화면 하단 가상 키패드를 사용하세요.</li>
      </ul>
    </div>
  );
}
