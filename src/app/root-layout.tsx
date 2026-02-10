import { Helmet, HelmetProvider } from "react-helmet-async";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import {
  RouteTransitionFade,
  RouteTransitionIndicator,
} from "@/features/route-transition";
import { BodyOverlayScrollbars, ThemeProvider } from "@/features/theme";
import { Toaster } from "@/shared/ui/sonner";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

const defaultMeta = {
  title: "raven",
  description: "개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스.",
};

const siteBaseUrl =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://raven.kr";

export function RootLayout() {
  const { pathname } = useLocation();
  const canonicalUrl =
    pathname === "/" ? siteBaseUrl : `${siteBaseUrl}${pathname}`;
  const ogImageUrl = `${siteBaseUrl}/assets/profile/dark.png`;

  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s" defaultTitle={defaultMeta.title}>
        <meta name="description" content={defaultMeta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="raven" />
        <meta property="og:title" content={defaultMeta.title} />
        <meta property="og:description" content={defaultMeta.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
      </Helmet>
      <ThemeProvider>
        <BodyOverlayScrollbars />
        <RouteTransitionIndicator />
        <ScrollRestoration />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <RouteTransitionFade>
              <Outlet />
            </RouteTransitionFade>
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    </HelmetProvider>
  );
}
