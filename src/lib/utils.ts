export const BELT_COLORS: Record<string, string> = {
  BRANCA: "#FFFFFF",
  AZUL: "#1D4ED8",
  ROXA: "#7C3AED",
  MARROM: "#92400E",
  PRETA: "#000000",
};

export const BELTS = ["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"];

export const KIDS_BELTS = [
  "BRANCA", "CINZA_BRANCA", "CINZA", "CINZA_PRETA",
  "AMARELA_BRANCA", "AMARELA", "AMARELA_PRETA",
  "LARANJA_BRANCA", "LARANJA", "LARANJA_PRETA",
  "VERDE_BRANCA", "VERDE", "VERDE_PRETA",
];

export const KIDS_BELT_COLORS: Record<string, [string, string]> = {
  BRANCA: ["#FFFFFF", "#FFFFFF"],
  CINZA_BRANCA: ["#9CA3AF", "#FFFFFF"],
  CINZA: ["#9CA3AF", "#9CA3AF"],
  CINZA_PRETA: ["#9CA3AF", "#000000"],
  AMARELA_BRANCA: ["#EAB308", "#FFFFFF"],
  AMARELA: ["#EAB308", "#EAB308"],
  AMARELA_PRETA: ["#EAB308", "#000000"],
  LARANJA_BRANCA: ["#F97316", "#FFFFFF"],
  LARANJA: ["#F97316", "#F97316"],
  LARANJA_PRETA: ["#F97316", "#000000"],
  VERDE_BRANCA: ["#22C55E", "#FFFFFF"],
  VERDE: ["#22C55E", "#22C55E"],
  VERDE_PRETA: ["#22C55E", "#000000"],
};

export const KIDS_BELT_LABELS: Record<string, string> = {
  BRANCA: "Branca",
  CINZA_BRANCA: "Cinza e Branca",
  CINZA: "Cinza",
  CINZA_PRETA: "Cinza e Preta",
  AMARELA_BRANCA: "Amarela e Branca",
  AMARELA: "Amarela",
  AMARELA_PRETA: "Amarela e Preta",
  LARANJA_BRANCA: "Laranja e Branca",
  LARANJA: "Laranja",
  LARANJA_PRETA: "Laranja e Preta",
  VERDE_BRANCA: "Verde e Branca",
  VERDE: "Verde",
  VERDE_PRETA: "Verde e Preta",
};

export function getBeltsForType(isKids: boolean): string[] {
  return isKids ? KIDS_BELTS : BELTS;
}

export const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const PLAN_LABELS: Record<string, string> = {
  ESSENCIAL: "Essencial",
  PRO: "Pro",
  PREMIUM: "Premium",
};

export function getPlanLabel(studentType: string): string {
  return PLAN_LABELS[studentType] || studentType;
}

export function isPremiumOrPro(studentType: string): boolean {
  return studentType === "PREMIUM" || studentType === "PRO";
}
