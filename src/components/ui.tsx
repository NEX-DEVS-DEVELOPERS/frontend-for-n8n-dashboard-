
import React from 'react';

// A helper for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// Card Components
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("rounded-xl border border-border/40 bg-card/80 text-card-foreground shadow-xl backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_-5px_rgba(72,168,163,0.1)]", className)}
        {...props}
    />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-2xl font-semibold leading-none tracking-tight text-foreground", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";


const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-base text-muted-foreground mt-2", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";


const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

// Form Components
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                // Updated opacity for better visibility in light mode. 
                // bg-input/5 on white (if input is black) = light grey. 
                // Increased border opacity for definition.
                "flex h-12 w-full rounded-lg border border-border/50 bg-input/5 px-4 py-3 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 hover:bg-input/10 focus:bg-input/10",
                className
            )}
            ref={ref}
            {...props}
        />
    )
});
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 block text-muted-foreground", className)}
        {...props}
    />
));
Label.displayName = "Label";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn("flex min-h-[100px] w-full rounded-lg border border-border/50 bg-input/5 px-4 py-3 text-base text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 hover:bg-input/10 focus:bg-input/10", className)}
            ref={ref}
            {...props}
        />
    )
});
Textarea.displayName = "Textarea";


// Button Component
const buttonVariants = {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 border border-transparent",
            destructive: "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30",
            outline: "border border-border/60 bg-transparent hover:bg-input/10 hover:text-foreground hover:border-border/80",
            secondary: "bg-muted/10 text-secondary-foreground hover:bg-muted/20 border border-border/30",
            ghost: "hover:bg-input/10 hover:text-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-11 px-6 py-2 text-base",
            sm: "h-9 rounded-md px-3 text-sm",
            lg: "h-12 rounded-lg px-8 text-lg",
            icon: "h-10 w-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants['variants']['variant'];
  size?: keyof typeof buttonVariants['variants']['size'];
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                buttonVariants.variants.variant[variant],
                buttonVariants.variants.size[size],
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";


export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, Input, Label, Textarea, Button, cn };
