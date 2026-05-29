"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { ReactNode } from "react";

interface SmartLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SmartLink = ({ children, onClick, ...props }: SmartLinkProps) => {
  const router = useRouter();
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept normal left clicks without modifiers
    const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    const isExternal = props.href.toString().startsWith("http");

    if (!isModified && !isExternal) {
      e.preventDefault();
      setIsLoading(true);
      
      // If there's a custom onClick, run it
      if (onClick) onClick();

      // Navigate
      router.push(props.href.toString());
      
      // We rely on the layout or the next page to set isLoading back to false
      // or we can use a small timeout here to ensure the loader shows
      // but usually the next page's useEffect or the GlobalLoader's existence handles this.
    } else {
      if (onClick) onClick();
    }
  };

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  );
};
