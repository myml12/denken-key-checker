import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", disabled, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
        ${
          variant === "default"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : variant === "outline"
              ? "border border-gray-300 bg-transparent hover:bg-gray-100"
              : "bg-transparent hover:bg-gray-100"
        } ${className}`}
        disabled={disabled}
        ref={ref}
        {...props}
      />
    )
  },
)

Button.displayName = "Button"
