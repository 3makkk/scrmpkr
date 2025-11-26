import type { UIProps } from "../uiTypes";

type CardProps = UIProps<"div">;

export default function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  const cardClasses =
    "bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 shadow-2xl animate-fade-in-down";

  return (
    <div className={`${cardClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
