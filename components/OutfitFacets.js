import { COLORS, kindLabel } from "@/lib/taxonomy";

// Compact display of the structured facets: clothing type + color dots.
export default function OutfitFacets({ outfit, small }) {
  return (
    <span className={`facets ${small ? "small" : ""}`}>
      <span className="tag kind">{kindLabel(outfit.kind || "outfit")}</span>
      {(outfit.colors || []).map((c) => (
        <span className="color-dot" key={c} title={c} style={{ background: COLORS[c] }} />
      ))}
    </span>
  );
}
