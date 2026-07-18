// Shared tagging taxonomy: two user-chosen facets (clothing type, event
// style) plus auto-detected colors compiled from the photo itself.

export const KINDS = [
  { value: "outfit", label: "Full outfit" },
  { value: "dress", label: "Dress" },
  { value: "top", label: "Top" },
  { value: "bottoms", label: "Bottoms" },
  { value: "suit", label: "Suit / tux" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

export const EVENT_TAGS = [
  "wedding",
  "bridesmaid",
  "black-tie",
  "formal",
  "cocktail",
  "rehearsal",
  "gala",
  "dance",
  "date night",
  "casual",
];

// name -> swatch used for the little color dots in the UI
export const COLORS = {
  black: "#1c1c1e",
  white: "#f2f0ec",
  gray: "#9a9a9a",
  brown: "#8b5e3c",
  red: "#c0392b",
  orange: "#e67e22",
  yellow: "#e0b94b",
  green: "#5f7360",
  blue: "#3a5a8c",
  purple: "#7d4edd",
  pink: "#d4667f",
};

export const KIND_VALUES = KINDS.map((k) => k.value);
export const COLOR_NAMES = Object.keys(COLORS);

export function kindLabel(value) {
  return KINDS.find((k) => k.value === value)?.label || value;
}
