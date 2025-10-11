export function validateSvg(code: string): { valid: boolean; reason?: string } {
  if (!code || typeof code !== "string") {
    return { valid: false, reason: "El código está vacío o no es un string" };
  }

  const src = code.trim();

  // longitud mínima razonable
  if (src.length < 15) {
    return { valid: false, reason: "El código es demasiado corto para ser un SVG" };
  }

  // debe abrir y cerrar con <svg>...</svg>
  if (!/^<svg[\s\S]*<\/svg>\s*$/i.test(src)) {
    return { valid: false, reason: "Debe empezar con <svg> y terminar con </svg>" };
  }

  // chequeo rápido de etiquetas prohibidas (ejemplo básico)
  if (/<script[\s>]/i.test(src)) {
    return { valid: false, reason: "No se permite <script> en SVG" };
  }

  return { valid: true };
}
