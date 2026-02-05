import type { ReactNode } from "react";
import ValentineDecor, { StickerPlacement } from "./ValentineDecor";

type QuestionSlideProps = {
  label: string;
  title: string;
  subtitle?: string;
  mutedSubtitle?: string;
  stickers?: StickerPlacement[];
  themeColor?: string;
  backgroundAccent?: string;
  align?: "center" | "left";
  children: ReactNode;
};

export default function QuestionSlide({
  label,
  title,
  subtitle,
  mutedSubtitle,
  stickers,
  themeColor,
  backgroundAccent,
  align = "left",
  children
}: QuestionSlideProps) {
  return (
    <section
      className={`questionSlide ${align === "center" ? "center" : ""}`}
      style={{ ["--themeColor" as string]: themeColor }}
    >
      {backgroundAccent && (
        <div className="slideAccent" style={{ backgroundImage: backgroundAccent }} />
      )}
      <ValentineDecor stickers={stickers} />
      <div className="questionHeader">
        <span className="slideLabel">{label}</span>
        <h1 className="title">{title}</h1>
        {mutedSubtitle && <p className="subtitle mutedSubtitle">{mutedSubtitle}</p>}
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="questionBody">{children}</div>
    </section>
  );
}
