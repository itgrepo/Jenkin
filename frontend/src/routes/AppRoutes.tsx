// src/AppRoutes.tsx
import { Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "@pages/LoginPage";
import ProtectedRoute from "@components/ProtectedRoute";

import NotFound from "@pages/NotFound";
import MainLayout from "@layout/MainLayout";
import { getRoutes } from "@data/routes";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@hooks/useRedux";
import LoginUserPage from "@pages/LoginUserPage";
import LoginUserIindustryPage from "@pages/LoginUserIindustryPage";

export default function AppRoutes() {
  const { t } = useTranslation();
  const roleId = useAppSelector((state) => state.auth.user?.role?.id); // หรือ context
  const location = useLocation();
  const routes = getRoutes(t, roleId ?? 0, location.pathname);

  return (
    <Routes>
      <Route path="/login-admin" element={<LoginPage />} />
      <Route path="/login" element={<LoginUserPage />} />
      <Route path="/login-Iindustry" element={<LoginUserIindustryPage />} />
      <Route element={<ProtectedRoute />}>
        {routes
          ?.filter((item) => item.enabled !== false)
          .map((item, index) => {
            const Component = item.component;
            return (
              <Route
                key={index}
                path={item.path}
                element={
                  <MainLayout>
                    <Component />
                  </MainLayout>
                }
              />
            );
          })}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
