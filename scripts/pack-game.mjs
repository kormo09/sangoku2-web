import { createWriteStream } from "fs";
import { mkdir, readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createDeflateRaw } from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "sangoku2_ko");
const outDir = path.join(root, "game");
const outZip = path.join(outDir, "sangoku2_ko.zip");

await mkdir(outDir, { recursive: true });

const files = await readdir(srcDir);
if (files.length === 0) {
  console.error("sangoku2_ko 폴더에 게임 파일이 없습니다.");
  process.exit(1);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16LE(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function writeU32LE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

async function deflate(buf) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    const deflater = createDeflateRaw();
    deflater.on("data", (c) => chunks.push(c));
    deflater.on("end", () => resolve(Buffer.concat(chunks)));
    deflater.on("error", reject);
    deflater.end(buf);
  });
}

const localParts = [];
const centralParts = [];
let offset = 0;

for (const name of files) {
  const filePath = path.join(srcDir, name);
  const data = await readFile(filePath);
  const compressed = await deflate(data);
  const nameBuf = Buffer.from(name, "utf8");
  const crc = crc32(data);

  const localHeader = Buffer.concat([
    writeU32LE(0x04034b50),
    writeU16LE(20),
    writeU16LE(0),
    writeU16LE(8),
    writeU16LE(0),
    writeU16LE(0),
    writeU32LE(crc),
    writeU32LE(compressed.length),
    writeU32LE(data.length),
    writeU16LE(nameBuf.length),
    writeU16LE(0),
    nameBuf,
    compressed,
  ]);

  const centralHeader = Buffer.concat([
    writeU32LE(0x02014b50),
    writeU16LE(20),
    writeU16LE(20),
    writeU16LE(0),
    writeU16LE(8),
    writeU16LE(0),
    writeU16LE(0),
    writeU32LE(crc),
    writeU32LE(compressed.length),
    writeU32LE(data.length),
    writeU16LE(nameBuf.length),
    writeU16LE(0),
    writeU16LE(0),
    writeU16LE(0),
    writeU16LE(0),
    writeU32LE(0),
    writeU32LE(offset),
    nameBuf,
  ]);

  localParts.push(localHeader);
  centralParts.push(centralHeader);
  offset += localHeader.length;
}

const centralDir = Buffer.concat(centralParts);
const localData = Buffer.concat(localParts);
const endRecord = Buffer.concat([
  writeU32LE(0x06054b50),
  writeU16LE(0),
  writeU16LE(0),
  writeU16LE(files.length),
  writeU16LE(files.length),
  writeU32LE(centralDir.length),
  writeU32LE(offset),
  writeU16LE(0),
]);

await new Promise((resolve, reject) => {
  const stream = createWriteStream(outZip);
  stream.on("finish", resolve);
  stream.on("error", reject);
  stream.write(localData);
  stream.write(centralDir);
  stream.end(endRecord);
});

console.log(`게임 패키지 생성: ${outZip} (${files.length}개 파일)`);
