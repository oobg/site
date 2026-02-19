import { Suspense } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Outlet, ScrollRestoration } from "react-router-dom";

import {
  RouteTransitionFade,
  RouteTransitionIndicator,
} from "@/features/route-transition";
import {
  BodyOverlayScrollbars,
  BodyScrollRefProvider,
  ThemeProvider,
} from "@/features/theme";
import { Toaster } from "@/shared/ui/Sonner";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

const defaultMeta = {
  title: "raven",
  description: "개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스.",
};

export function RootLayout() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s" defaultTitle={defaultMeta.title}>
        <meta name="description" content={defaultMeta.description} />
      </Helmet>
      <ThemeProvider>
        <BodyScrollRefProvider>
          <BodyOverlayScrollbars />
          <RouteTransitionIndicator />
          <ScrollRestoration />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <RouteTransitionFade>
                <Suspense fallback={null}>
                  <Outlet />
                </Suspense>
              </RouteTransitionFade>
            </main>
            <Footer />
          </div>
          <Toaster />
        </BodyScrollRefProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
