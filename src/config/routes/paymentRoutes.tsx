import { RouteObject } from "react-router-dom";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";

export const paymentRoutes: RouteObject[] = [
  {
    path: "payment-success",
    element: <PaymentSuccess />,
  },
  {
    path: "payment-cancelled",
    element: <PaymentCancelled />,
  },
];