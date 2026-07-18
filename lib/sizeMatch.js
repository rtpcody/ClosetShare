// User size preferences and item matching. Prefs are optional — set during
// onboarding or later from profile settings. Shoes support a +/- range
// (e.g. 7.5–8); other categories are a single size for now.

export const EMPTY_SIZES = { dress: "", top: "", bottom: "", shoeMin: "", shoeMax: "" };

export function hasAnySizes(sizes) {
  return !!sizes && Object.values(sizes).some((v) => String(v || "").trim());
}

const KIND_TO_PREF = { dress: "dress", top: "top", bottoms: "bottom" };

// Does this item plausibly fit the user? Unsized items and categories the
// user hasn't set a preference for stay visible — the filter narrows, it
// never hides things it can't judge.
export function fitsUser(outfit, sizes) {
  if (!hasAnySizes(sizes)) return true;
  const s = String(outfit.size || "").trim().toLowerCase();
  if (!s) return true;

  if (outfit.kind === "shoes") {
    const n = parseFloat(s);
    if (Number.isNaN(n)) return true;
    const lo = parseFloat(sizes.shoeMin);
    const hi = parseFloat(sizes.shoeMax);
    if (!Number.isNaN(lo) && n < lo) return false;
    if (!Number.isNaN(hi) && n > hi) return false;
    return true;
  }

  const prefKey = KIND_TO_PREF[outfit.kind];
  if (!prefKey) return true;
  const pref = String(sizes[prefKey] || "").trim().toLowerCase();
  if (!pref) return true;
  return pref === s;
}
