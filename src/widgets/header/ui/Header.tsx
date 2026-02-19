import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { BodyScrollRefContext, ThemeToggle } from "@/features/theme";
import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { PreparingRouteLink } from "@/shared/ui/PreparingRouteLink";

const navItems = [
  { to: ROUTES.HOME, label: "Home" },
  { to: ROUTES.ABOUT, label: "About" },
  { to: ROUTES.PROJECTS_LIST, label: "Projects" },
  { to: ROUTES.BLOG, label: "Blog" },
  { to: ROUTES.CONTACT, label: "Contact" },
] as const;

const iconTransition = { duration: 0.25, ease: "easeOut" as const };

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block size-6" aria-hidden>
      <motion.span
        className="absolute left-0 h-0.5 w-5 rounded-full bg-current"
        style={{ top: 5 }}
        animate={
          open
            ? {
                top: 11,
                left: 2,
                rotate: 45,
              }
            : { top: 5, left: 0, rotate: 0 }
        }
        transition={iconTransition}
      />
      <motion.span
        className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current"
        animate={{ opacity: open ? 0 : 1 }}
        transition={iconTransition}
      />
      <motion.span
        className="absolute left-0 h-0.5 w-5 rounded-full bg-current"
        style={{ top: 17 }}
        animate={
          open
            ? {
                top: 11,
                left: 2,
                rotate: -45,
              }
            : { top: 17, left: 0, rotate: 0 }
        }
        transition={iconTransition}
      />
    </span>
  );
}

export function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bodyScrollRef = useContext(BodyScrollRefContext);
  const previousOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    const os = bodyScrollRef?.current;
    const viewport = os?.elements().viewport;

    if (mobileOpen) {
      if (viewport) {
        previousOverflowRef.current = viewport.style.overflow ?? "";
        viewport.style.overflow = "hidden";
      } else {
        previousOverflowRef.current = document.body.style.overflow ?? "";
        document.body.style.overflow = "hidden";
      }
    } else {
      if (viewport && previousOverflowRef.current !== null) {
        viewport.style.overflow = previousOverflowRef.current;
      } else if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
      }
    }

    return () => {
      if (viewport && previousOverflowRef.current !== null) {
        viewport.style.overflow = previousOverflowRef.current;
      } else if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
      }
    };
  }, [mobileOpen, bodyScrollRef]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-[60] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            to={ROUTES.HOME}
            className="font-medium text-foreground no-underline hover:text-primary"
          >
            raven
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="메인 네비게이션"
          >
            {navItems.map(({ to, label }) => (
              <PreparingRouteLink
                key={to}
                to={to}
                className={cn(
                  "rounded text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  location.pathname === to
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </PreparingRouteLink>
            ))}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(o => !o)}
              className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
              title={mobileOpen ? "닫기" : "메뉴"}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-14 z-50 md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="메뉴"
            initial={false}
          >
            <motion.button
              type="button"
              onClick={closeMobile}
              className="absolute inset-0 bg-black/50"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
            <motion.div
              id="mobile-nav"
              className="absolute inset-x-0 top-0 overflow-hidden border-b border-border bg-background"
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="flex min-h-full flex-col pb-8 pt-6">
                <div className="container mx-auto flex flex-1 flex-col gap-2 px-4">
                  {navItems.map(({ to, label }) => (
                    <PreparingRouteLink
                      key={to}
                      to={to}
                      onClick={closeMobile}
                      className={cn(
                        "w-full rounded-lg px-4 py-3 text-left text-base font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        location.pathname === to
                          ? "bg-muted/50 text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </PreparingRouteLink>
                  ))}
                  <div className="mt-4 border-t border-border pt-4">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
