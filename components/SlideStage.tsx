import { forwardRef } from "react";
import type { ReactNode } from "react";

const SlideStage = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="slideStage">
        {children}
      </div>
    );
  }
);

SlideStage.displayName = "SlideStage";

export default SlideStage;
