import * as React from "react";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Zoom from "@mui/material/Zoom";
import { SxProps, Theme } from "@mui/material/styles";
import { ArrowDown2, ArrowUp2 } from "iconsax-react";

interface ScrollNavProps {
  // Scrollable element the rows live in (tables that scroll internally).
  // Omit for pages that scroll with the window.
  containerRef?: React.RefObject<HTMLElement>;
  // Long lists only: nothing to jump to on a short one.
  enabled?: boolean;
  // How far from an edge the user must be before that button appears.
  threshold?: number;
  sx?: SxProps<Theme>;
}

// Floating top/bottom shortcuts for long lists. Watches both the scroll
// container (when given) and the window, so it works whether the rows scroll
// inside a container or the whole page does, and drives both on click.
export default function ScrollNav({
  containerRef,
  enabled = true,
  threshold = 200,
  sx,
}: ScrollNavProps) {
  const [showUp, setShowUp] = React.useState(false);
  const [showDown, setShowDown] = React.useState(false);

  const updateVisibility = React.useCallback(() => {
    if (!enabled) {
      setShowUp(false);
      setShowDown(false);
      return;
    }

    const container = containerRef?.current;
    const containerTop = container?.scrollTop ?? 0;
    const containerRemaining = container
      ? container.scrollHeight - container.clientHeight - container.scrollTop
      : 0;

    const doc = document.documentElement;
    const windowTop = window.scrollY;
    const windowRemaining = doc.scrollHeight - window.innerHeight - window.scrollY;

    setShowUp(Math.max(containerTop, windowTop) > threshold);
    setShowDown(Math.max(containerRemaining, windowRemaining) > threshold);
  }, [containerRef, enabled, threshold]);

  React.useEffect(() => {
    updateVisibility();
    const container = containerRef?.current;
    container?.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      container?.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [containerRef, updateVisibility]);

  const scrollToTop = () => {
    containerRef?.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const container = containerRef?.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <Stack spacing={1} sx={{ zIndex: 3, ...sx }}>
      <Zoom in={showUp}>
        <Tooltip title="Go to top" placement="left">
          <Fab
            size="small"
            color="primary"
            aria-label="go to top"
            onClick={scrollToTop}
            sx={{ boxShadow: 3 }}
          >
            <ArrowUp2 size={20} />
          </Fab>
        </Tooltip>
      </Zoom>
      <Zoom in={showDown}>
        <Tooltip title="Go to bottom" placement="left">
          <Fab
            size="small"
            color="primary"
            aria-label="go to bottom"
            onClick={scrollToBottom}
            sx={{ boxShadow: 3 }}
          >
            <ArrowDown2 size={20} />
          </Fab>
        </Tooltip>
      </Zoom>
    </Stack>
  );
}
