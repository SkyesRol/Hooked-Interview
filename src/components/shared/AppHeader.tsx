import type { ReactNode } from "react";
import { PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";

type HeaderNav = "practice" | "history" | "questions" | "import";

function NavButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  if (active) {
    return (
      <button type="button" className="text-ink font-bold">
        {label}
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="transition-colors hover:text-ink">
      {label}
    </button>
  );
}

export default function AppHeader({
  active,
  onPractice,
  right,
  importLabel = "IMPORT QUESTIONS",
}: {
  active?: HeaderNav;
  onPractice?: () => void;
  right?: ReactNode;
  importLabel?: string;
}) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between py-4">
      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-heading text-xl font-bold italic transition-colors hover:text-gold"
        >
          <PenTool className="h-4 w-4 text-gold" aria-hidden="true" />
          Frontend Playground
        </button>
        <div className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light md:flex">
          <NavButton
            active={active === "practice"}
            label="PRACTICE"
            onClick={() => (onPractice ? onPractice() : navigate("/"))}
          />
          <NavButton active={active === "history"} label="HISTORY" onClick={() => navigate("/history")} />
          <NavButton active={active === "questions"} label="QUESTIONS" onClick={() => navigate("/questions")} />
          <NavButton active={active === "import"} label={importLabel} onClick={() => navigate("/import")} />
        </div>
      </div>

      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </nav>
  );
}

