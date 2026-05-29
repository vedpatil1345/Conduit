import { ThemeToggle } from "@/components/theme-toggle";
import ThemedIcon from "@/components/ThemedIcon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-camel-900 dark:bg-dark-walnut-100 p-4 transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-6 sm:top-8 sm:right-10 z-50">
        <ThemeToggle />
      </div>

      {/* Container simulating a single popup modal/rectangle */}
      <div className="relative w-full max-w-[80%] lg:h-[90vh] bg-camel-900/90 dark:bg-khaki-beige-100/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-camel-700/20 dark:border-white/5 backdrop-blur-md">
        
        {/* Child Pages Container (Forms). They render into their absolute positions (left or right half) on desktop. */}
        <div className="relative lg:absolute inset-0 w-full h-full flex flex-col">
          <div className="w-full h-full text-foreground dark:text-khaki-beige-800">
            {children}
          </div>
        </div>

        {/* Sliding Overlay Panel connecting the two sides - Hidden on Mobile for better UX */}
        <div className="hidden lg:flex absolute top-0 left-0 w-1/2 h-full bg-saddle-brown-100 dark:bg-linear-to-br dark:from-dark-walnut-100 dark:to-dark-walnut-300 z-10 text-camel-900 overflow-hidden shadow-2xl ">
          {/* Inner Content wrapper sliding slightly in opposite direction for parallax */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-12 text-center text-primary-foreground">
             <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <ThemedIcon className="bg-camel-900 h-24 rounded-lg dark:bg-transparent mb-5 drop-shadow-xl dark:border-2 dark:border-khaki-beige-900"/>
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-md text-camel-900 dark:text-khaki-beige-900">Welcome Back!</h2>
              <p className="text-camel-800/80 dark:text-khaki-beige-800/80 mb-8 max-w-xs text-base font-medium">
                 Please sign in with your credentials to continue.
               </p>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
}
