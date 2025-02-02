import { RouteObject } from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ResendVerification from "@/pages/ResendVerification";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import Verification from "@/pages/Verification";

export const authRoutes: RouteObject[] = [
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "signup",
    element: <Signup />,
  },
  {
    path: "resend-verification",
    element: <ResendVerification />,
  },
  {
    path: "reset-password",
    element: <ResetPassword />,
  },
  {
    path: "update-password",
    element: <UpdatePassword />,
  },
  {
    path: "verification",
    element: <Verification />,
  },
];