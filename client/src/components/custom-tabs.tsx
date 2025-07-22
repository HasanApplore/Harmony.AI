import React from "react";
import { cn } from "@/lib/utils";

interface TabProps {
  value: string;
  activeTab: string;
  onClick: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function CustomTab({ 
  value, 
  activeTab, 
  onClick, 
  children,
  className 
}: TabProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "px-6 py-2 rounded-full text-sm font-medium transition-colors",
        activeTab === value
          ? "bg-[#8a3ffc] text-white"
          : "bg-transparent text-gray-700 hover:bg-gray-100",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function CustomTabs({ 
  activeTab, 
  onTabChange, 
  children, 
  className 
}: TabsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<TabProps>(child)) {
          return React.cloneElement(child, {
            activeTab,
            onClick: onTabChange,
          });
        }
        return child;
      })}
    </div>
  );
}