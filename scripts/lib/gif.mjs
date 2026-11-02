// A small animated GIF encoder for UI recordings: no dependencies.
import zlib from "node:zlib";

// 8-bit RGB or RGBA, non-interlaced PNGs, which is what Chrome writes.
export function decodePng(buf) {
  let pos = 8, width, height, type;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      type = data[9];
      if (data[8] !== 8 || ![2, 6].includes(type) || data[12] !== 0) throw new Error("unsupported PNG");
    } else if (kind === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const bpp = type === 6 ? 4 : 3, stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[row + x - bpp] : 0, b = y ? px[row - stride + x] : 0, c = x >= bpp && y ? px[row - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[row + x] = v & 255;
    }
  }
  const rgb = new Uint32Array(width * height);
  for (let i = 0; i < rgb.length; i++) rgb[i] = (px[i * bpp] << 16) | (px[i * bpp + 1] << 8) | px[i * bpp + 2];
  return {width, height, rgb};
}

// The 256 most common colours of all frames; everything else maps to its nearest one.
function palette(frames) {
  const count = new Map();
  for (const f of frames) for (let i = 0; i < f.rgb.length; i += 3) count.set(f.rgb[i], (count.get(f.rgb[i]) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256).map(([c]) => c);
}

function lzw(indices) {
  const out = [];
  let cur = 0, bits = 0;
  const emit = (code, size) => {
    cur |= code << bits;
    bits += size;
    while (bits >= 8) {
      out.push(cur & 255);
      cur >>>= 8;
      bits -= 8;
    }
  };
  const clear = 256, end = 257;
  let size = 9, next = 258, dict = new Map();
  emit(clear, size);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 256 + k;
    if (dict.has(key)) {
      prefix = dict.get(key);
      continue;
    }
    emit(prefix, size);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << size && size < 12) size++;
    } else {
      emit(clear, size);
      dict = new Map();
      size = 9;
      next = 258;
    }
    prefix = k;
  }
  emit(prefix, size);
  emit(end, size);
  if (bits) out.push(cur & 255);
  const blocks = [Buffer.from([8])];
  for (let i = 0; i < out.length; i += 255) blocks.push(Buffer.from([Math.min(255, out.length - i)]), Buffer.from(out.slice(i, i + 255)));
  blocks.push(Buffer.from([0]));
  return Buffer.concat(blocks);
}

// frames: [{width, height, rgb, delay (ms)}], all the same size. Later frames store only what changed.
export function encodeGif(frames) {
  const {width, height} = frames[0];
  const pal = palette(frames);
  const nearest = new Map(pal.map((c, i) => [c, i]));
  const index = (c) => {
    let i = nearest.get(c);
    if (i !== undefined) return i;
    let best = 0, dist = Infinity;
    for (let j = 0; j < pal.length; j++) {
      const p = pal[j], dr = ((c >> 16) & 255) - ((p >> 16) & 255), dg = ((c >> 8) & 255) - ((p >> 8) & 255), db = (c & 255) - (p & 255);
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < dist) [dist, best] = [d, j];
    }
    nearest.set(c, best);
    return best;
  };
  const parts = [];
  let bytes = [];
  const flush = () => {
    parts.push(Buffer.from(bytes));
    bytes = [];
  };
  const u16 = (n) => bytes.push(n & 255, n >> 8);
  bytes.push(...Buffer.from("GIF89a"));
  u16(width);
  u16(height);
  bytes.push(0xf7, 0, 0);
  for (let i = 0; i < 256; i++) {
    const c = pal[i] ?? 0;
    bytes.push((c >> 16) & 255, (c >> 8) & 255, c & 255);
  }
  bytes.push(0x21, 0xff, 11, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0);
  let prev = null;
  for (const f of frames) {
    let x0 = 0, y0 = 0, x1 = width - 1, y1 = height - 1;
    if (prev) {
      [x0, y0, x1, y1] = [width, height, -1, -1];
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if (f.rgb[y * width + x] !== prev.rgb[y * width + x]) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 < 0) [x0, y0, x1, y1] = [0, 0, 0, 0];
    }
    bytes.push(0x21, 0xf9, 4, 0x04);
    u16(Math.round((f.delay || 100) / 10));
    bytes.push(0, 0);
    bytes.push(0x2c);
    u16(x0);
    u16(y0);
    u16(x1 - x0 + 1);
    u16(y1 - y0 + 1);
    bytes.push(0);
    const idx = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1));
    let k = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) idx[k++] = index(f.rgb[y * width + x]);
    flush();
    parts.push(lzw(idx));
    prev = f;
  }
  bytes.push(0x3b);
  flush();
  return Buffer.concat(parts);
}
