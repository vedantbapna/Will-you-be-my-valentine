import type { ReactNode } from "react";

export default function SlideFrame({ children }: { children: ReactNode }) {
  return <div className="slideFrame">{children}</div>;
}
