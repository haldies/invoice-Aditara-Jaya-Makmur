/**
 * Dynamic Unit and Quantity Formatter for Invoice PDF Documents
 * Detects the correct unit (m³, m², lbr, pcs, time units, or empty) based on item description keywords,
 * and formats quantities elegantly (integer vs. decimal).
 */

export const getUnit = (description: string): string => {
  const desc = description.toLowerCase();

  // Construction materials — concrete / readymix / volume
  if (
    desc.includes("readymix") ||
    desc.includes("beton") ||
    desc.includes("mutu") ||
    desc.includes("ksc") ||
    desc.includes("slump") ||
    desc.includes("screening") ||
    desc.includes("kubik") ||
    desc.includes("volume")
  ) {
    return "m³";
  }

  // Sheet materials
  if (desc.includes("wiremesh") || desc.includes("lbr") || desc.includes("lembar")) {
    return "lbr";
  }

  // Area / finishing services
  if (
    desc.includes("trowel") ||
    desc.includes("floor hardener") ||
    desc.includes("epoxy") ||
    desc.includes(" m2") ||
    desc.includes("persegi")
  ) {
    return "m²";
  }

  // General services — detect sub-unit from description, otherwise no unit
  if (
    desc.includes("jasa") ||
    desc.includes("website") ||
    desc.includes("development") ||
    desc.includes("desain") ||
    desc.includes("design") ||
    desc.includes("pembuatan") ||
    desc.includes("setup") ||
    desc.includes("hosting") ||
    desc.includes("domain") ||
    desc.includes("maintenance") ||
    desc.includes("konsultasi") ||
    desc.includes("consulting") ||
    desc.includes("revisi") ||
    desc.includes("revision") ||
    desc.includes("instalasi") ||
    desc.includes("install")
  ) {
    if (desc.includes("bulan") || desc.includes("month")) return "Bulan";
    if (desc.includes("tahun") || desc.includes("year")) return "Tahun";
    if (desc.includes("hari") || desc.includes("day")) return "Hari";
    if (desc.includes("jam") || desc.includes("hour")) return "Jam";
    return ""; // clean — no unit for general services
  }

  // Retail / standard goods
  if (desc.includes(" pcs")) return "pcs";
  if (desc.includes(" unit")) return "unit";
  if (desc.includes(" box")) return "box";
  if (desc.includes(" roll")) return "roll";
  if (desc.includes(" kg")) return "kg";
  if (desc.includes(" ton")) return "ton";
  if (desc.includes(" liter")) return "liter";

  return "";
};

export const formatQuantity = (qty: number): string => {
  if (qty % 1 === 0) {
    return qty.toLocaleString("id-ID");
  }
  return qty.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatQtyWithUnit = (description: string, qty: number): string => {
  const unit = getUnit(description);
  const formattedQty = formatQuantity(qty);
  return unit ? `${formattedQty} ${unit}` : formattedQty;
};
