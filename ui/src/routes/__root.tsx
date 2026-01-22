import { useMediaQuery, useTheme } from "@mui/material";
import { createRootRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { client } from "@/client/client.gen";
import { getWebSocketConnections } from "@/client/sdk.gen";
import { SwipeIndicator } from "@/components/ui/SwipeIndicator";
import { WebSocketProvider } from "@/contexts/WebSocketProvider";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import Layout from "../components/Layout";

export const Route = createRootRoute({
  component: () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const apiKey = localStorage.getItem("apiKey");
    const [isValidated, setIsValidated] = useState(false);
    const isAuthPage = location.pathname === "/auth";

    // 移动端滑动导航
    const { swipeOffset, currentRouteIndex, totalRoutes } = useSwipeNavigation(location.pathname, {
      enabled: isMobile && !isAuthPage && isValidated,
    });

    useEffect(() => {
      if (isAuthPage) {
        return;
      }
      if (apiKey) {
        client.setConfig({ baseURL: import.meta.env.PROD ? "" : import.meta.env.PUBLIC_DEV_API_URL, auth: apiKey });
        console.debug(`Base URL: ${import.meta.env.PUBLIC_DEV_API_URL}`);
        // Perform a check on startup
        getWebSocketConnections()
          .then(() => {
            setIsValidated(true);
          })
          .catch((e) => {
            console.error("Failed to fetch connections:", e);
            // If the API key is invalid, redirect to auth page
            localStorage.removeItem("apiKey");
            navigate({ to: "/auth", replace: true });
          });
      } else {
        navigate({ to: "/auth", replace: true });
      }
    }, [apiKey, navigate, isAuthPage]);

    console.log(`isValidated: ${isValidated}, isAuthPage: ${isAuthPage}`);
    if (isAuthPage) return <Outlet />;

    return (
      <>
        <Layout>
          <WebSocketProvider>
            <Outlet />
          </WebSocketProvider>
        </Layout>
        {/* 移动端滑动导航指示器 */}
        {isMobile && isValidated && (
          <SwipeIndicator swipeOffset={swipeOffset} currentIndex={currentRouteIndex} totalPages={totalRoutes} />
        )}
        <TanStackRouterDevtools />
      </>
    );
  },
});
