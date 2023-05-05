export const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b

export const isDark = (r: number, g: number, b: number) => luminance(r, g, b) < 128

export const rgbToHex = (r: number, g: number, b: number) => {
  const bin = (r << 16) | (g << 8) | b
  return ((h) => new Array(7 - h.length).join('0') + h)(bin.toString(16).toUpperCase())
}
