
import { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

export const paymentRoutes: RouteObject[] = [
  {
    path: "payment-success",
    element: <Navigate to="/tokens" replace />,
  },
  {
    path: "payment-cancelled",
    element: <Navigate to="/tokens" replace />,
  },
];
