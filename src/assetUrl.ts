/** 静态资源路径：配合 Vite `base`（如 GitHub Pages 的 /仓库名/），避免写成根路径 `/assets/...` 导致 404 */
export function assetUrl(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  if (base.endsWith('/')) return `${base}${trimmed}`;
  return `${base}/${trimmed}`;
}
