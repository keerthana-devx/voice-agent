import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const Card = ({
  children,
  className,
  variant = "default",
  hover = false,
  glow = false,
  ...props
}) => {
  const baseStyles = "relative rounded-2xl backdrop-blur-xl transition-all duration-500";

  const variants = {
    default: "bg-white/[0.03] border border-white/10",
    elevated: "bg-white/[0.06] border border-white/15 shadow-xl",
    glass: "bg-white/[0.02] border border-white/5 backdrop-blur-2xl",
    solid: "bg-[#131323] border border-white/5",
  };

  const hoverStyles = hover
    ? "hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
    : "";

  const glowStyles = glow
    ? "shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
    : "";

  const CardComponent = hover ? motion.div : "div";

  const cardProps = hover
    ? {
        whileHover: { y: -4, transition: { duration: 0.3 } },
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }
    : {};

  return (
    <CardComponent
      className={cn(baseStyles, variants[variant], hoverStyles, glowStyles, className)}
      {...(hover ? cardProps : {})}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </CardComponent>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={cn("px-6 py-5 border-b border-white/5", className)} {...props}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={cn("px-6 py-5", className)} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, ...props }) => {
  return (
    <div className={cn("px-6 py-4 border-t border-white/5", className)} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;