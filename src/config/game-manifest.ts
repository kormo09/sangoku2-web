/** sangoku2_ko 원본 게임 파일 (세이브 대상에서 제외) */
export const GAME_MANIFEST = new Set(
  [
    "END.EXE",
    "ENDING.DAT",
    "FMDRV.COM",
    "GRPDATA.DAT",
    "HEXDATA.DAT",
    "KAODATA.DAT",
    "KOEI.BAT",
    "MAIN.EXE",
    "MONTAGE.DAT",
    "OPEN.EXE",
    "OPENING.DAT",
    "OPMSG.DAT",
    "PACKDATA.DAT",
    "RTK2.COM",
    "RTK2MAIN.16P",
    "SCENARIO.DAT",
    "SOUND.EXE",
    "TAIKI.DAT",
  ].map((name) => name.toUpperCase()),
);

export const GAME_CONFIG = {
  gameFile: "sangoku2_ko.zip",
  mod: "sangoku2_ko",
  entry: "KOEI.BAT",
  width: 640,
  height: 400,
} as const;
