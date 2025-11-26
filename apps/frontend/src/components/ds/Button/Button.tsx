import type { UIProps } from "../uiTypes";

type Variant = "primary" | "secondary" | "danger";

type ButtonProps = UIProps<"button", { variant?: Variant }>;

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const getVariantClasses = (variant: Variant) => {
    const baseClasses =
      "font-semibold px-6 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

    switch (variant) {
      case "secondary":
        return `${baseClasses} bg-gray-800/80 backdrop-blur-sm border border-gray-700/60 text-gray-200 font-medium shadow-md hover:bg-gray-700/80 hover:border-gray-600/60 hover:shadow-lg hover:scale-[1.02] focus:ring-gray-400`;
      case "danger":
        return `${baseClasses} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-red-400`;
      default: // primary
        return `${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] focus:ring-blue-400`;
    }
  };

  return (
    <button
      className={`${getVariantClasses(variant)} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
