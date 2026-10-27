import { Link } from "react-router-dom";

export function LegalLinks() {
  return (
    <nav aria-label="Privacy and terms" className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
      <Link to="/privacy" className="inline-flex min-h-11 items-center text-purple-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Privacy Policy</Link>
      <Link to="/terms" className="inline-flex min-h-11 items-center text-purple-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Terms of Service</Link>
    </nav>
  );
}
