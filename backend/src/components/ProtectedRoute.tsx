import { Navigate, Outlet, useLocation } from "react-router-dom";
import BackdropLoader from "@components/BackdropLoader";
import { useAppSelector } from "@hooks/useRedux";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, checked, pathLogin } = useAppSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (!checked || loading) {
    return <BackdropLoader show />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={pathLogin ?? "/login-admin"}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
