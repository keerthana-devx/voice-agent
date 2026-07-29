import { cn } from "../../lib/utils";

const LoadingSpinner = ({ size = "medium", className, ...props }) => {
  const sizes = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={cn("relative", className)}
      {...props}
    >
      <div
        className={cn(
          "rounded-full border-indigo-500/30 border-t-indigo-500 animate-spin",
          sizes[size]
        )}
      />
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md -z-10" />
    </div>
  );
};

const LoadingOverlay = ({ message = "Loading...", className }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
        "bg-[#0a0a0f]/80 backdrop-blur-sm",
        className
      )}
    >
      <LoadingSpinner size="large" />
      <p className="text-gray-400 text-sm animate-pulse">{message}</p>
    </div>
  );
};

const LoadingDots = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
    </div>
  );
};

export { LoadingSpinner, LoadingOverlay, LoadingDots };
export default LoadingSpinner;