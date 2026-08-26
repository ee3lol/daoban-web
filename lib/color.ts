export function getContrastColor(hexColor: string): string {
  // Remove hash
  let hex = hexColor;
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  
  // Convert 3-char hex to 6-char
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Parse RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate relative luminance
  // Using sRGB luminance formula simplified
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If the background is very bright, use a dark text color, otherwise white
  return luminance > 0.65 ? '#111111' : '#ffffff';
}
