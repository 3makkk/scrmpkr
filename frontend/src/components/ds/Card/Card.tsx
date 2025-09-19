import type { UIProps } from "../uiTypes";

type CardProps = UIProps<"div">;

export default function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
