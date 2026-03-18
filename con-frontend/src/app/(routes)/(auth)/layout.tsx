"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // By default, assume login if it's not explicitly register
  const isRegister = pathname?.includes("register");

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-camel-900 dark:bg-dark-walnut-100 p-4 transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-6 sm:top-8 sm:right-10 z-50">
        <ThemeToggle />
      </div>

      {/* Container simulating a single popup modal/rectangle */}
      <div className="relative w-full max-w-7xl h-auto min-h-150 lg:h-150 bg-camel-900/90 dark:bg-khaki-beige-100/90 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-camel-700/20 dark:border-white/5 backdrop-blur-md">
        
        {/* Child Pages Container (Forms). They render into their absolute positions (left or right half) on desktop. */}
        <div className="relative lg:absolute inset-0 w-full h-full flex flex-col">
           <AnimatePresence mode="wait">
             <motion.div
               key={pathname}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.4 }}
               className="w-full h-full text-foreground dark:text-khaki-beige-800"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Sliding Overlay Panel connecting the two sides - Hidden on Mobile for better UX */}
        <motion.div
          initial={false}
          animate={{
            x: isRegister ? "0%" : "100%",
            borderBottomLeftRadius: isRegister ? "0px" : "150px",
            borderTopLeftRadius: isRegister ? "0px" : "150px",
            borderBottomRightRadius: isRegister ? "150px" : "0px",
            borderTopRightRadius: isRegister ? "150px" : "0px",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25, duration: 0.7 }}
          className="hidden lg:flex absolute top-0 left-0 w-1/2 h-full bg-saddle-brown-100 dark:bg-linear-to-br dark:from-dark-walnut-100 dark:to-dark-walnut-300 z-10 text-camel-900 overflow-hidden shadow-2xl"
        >
          {/* Inner Content wrapper sliding slightly in opposite direction for parallax */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-12 text-center text-primary-foreground">
             
             {/* Content shown when on Login Route (Persuading them to "Sign Up") */}
             <motion.div
               initial={false}
               animate={{
                 x: isRegister ? "-100%" : "0%",
                 opacity: isRegister ? 0 : 1,
               }}
               transition={{ duration: 0.5 }}
               className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
               style={{ pointerEvents: isRegister ? "none" : "auto" }}
             >
               <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-saddle-brown-500/20 dark:bg-khaki-beige-100/30 shadow-xl text-camel-900 dark:text-khaki-beige-800">
                 <svg
                   className="h-8 w-8"
                   xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 >
                   <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                 </svg>
               </div>
               <h2 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-md text-camel-900 dark:text-khaki-beige-900">Hello, Friend!</h2>
               <p className="text-camel-800/80 dark:text-khaki-beige-800/80 mb-8 max-w-xs text-base font-medium">
                 Enter your personal details and start your journey with us today.
               </p>
               <Link href="/register">
                 <Button className="border-2 border-camel-800/30 dark:border-khaki-beige-800/30 text-camel-900 dark:text-khaki-beige-800 hover:bg-camel-900 hover:text-saddle-brown-100 dark:hover:text-dark-walnut-100 rounded-full px-12 py-6 text-sm font-bold uppercase tracking-wider bg-transparent transition-colors shadow-lg">
                   Sign Up
                 </Button>
               </Link>
             </motion.div>
 
             {/* Content shown when on Register Route (Persuading them to "Sign In") */}
             <motion.div
               initial={false}
               animate={{
                 x: isRegister ? "0%" : "100%",
                 opacity: isRegister ? 1 : 0,
               }}
               transition={{ duration: 0.5 }}
               className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
               style={{ pointerEvents: isRegister ? "auto" : "none" }}
             >
               <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-saddle-brown-500/20 dark:bg-khaki-beige-100/30 shadow-xl text-camel-900 dark:text-khaki-beige-800">
                 <svg
                   className="h-8 w-8"
                   xmlns="http://www.w3.org/2000/svg"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 >
                   <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                 </svg>
               </div>
               <h2 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-md text-camel-900 dark:text-khaki-beige-900">Welcome Back!</h2>
               <p className="text-camel-800/80 dark:text-khaki-beige-800/80 mb-8 max-w-xs text-base font-medium">
                 To keep connected with us please login with your personal info.
               </p>
               <Link href="/login">
                 <Button className="border-2 border-camel-800/30 dark:border-khaki-beige-800/30 text-camel-900 dark:text-khaki-beige-800 hover:bg-camel-900 hover:text-saddle-brown-100 dark:hover:text-dark-walnut-100 rounded-full px-12 py-6 text-sm font-bold uppercase tracking-wider bg-transparent transition-colors shadow-lg">
                   Sign In
                 </Button>
               </Link>
             </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
