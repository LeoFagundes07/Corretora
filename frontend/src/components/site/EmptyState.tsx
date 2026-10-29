import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DED7C8] bg-white/70 px-6 py-14 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-[#F5EBD9]">
        <Icon className="size-7 text-[#6B4912]" aria-hidden />
      </span>
      <h3 className="mt-4 font-heading text-xl text-[#101014]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-[#57534E]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
