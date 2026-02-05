import type { CSSProperties } from "react";

export type StickerName = "heart" | "sparkles" | "gift" | "bow" | "drink" | "cake";

export type StickerPlacement = {
  name: StickerName;
  className?: string;
  style?: CSSProperties;
};

export default function ValentineDecor({
  stickers = []
}: {
  stickers?: StickerPlacement[];
}) {
  return (
    <div aria-hidden="true">
      {stickers.map((sticker, index) => (
        <img
          key={`${sticker.name}-${index}`}
          src={`/stickers/${sticker.name}.svg`}
          className={`sticker ${sticker.className ?? ""}`.trim()}
          style={sticker.style}
          alt=""
        />
      ))}
    </div>
  );
}
