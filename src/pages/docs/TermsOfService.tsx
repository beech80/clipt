
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">Clipt Terms of Service</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">Last Updated: 2/11/2025</p>

        <p className="mb-6">
          Welcome to Clipt! Clipt is a social media and streaming platform that combines video sharing, live streaming, and interactive gaming elements. By using Clipt, you agree to these Terms of Service ("Terms"). Please read them carefully.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4">
          By accessing or using Clipt, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use Clipt.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Who Can Use Clipt?</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You must be 13 years or older (or the minimum age required in your country) to use Clipt.</li>
          <li>If you are under 18, you need permission from a parent or legal guardian.</li>
          <li>You must create an account using accurate and up-to-date information.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts & Security</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You are responsible for keeping your account secure.</li>
          <li>You must not share your password or allow others to access your account.</li>
          <li>If you believe your account has been compromised, contact us immediately.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Content & Conduct Rules</h2>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">4.1 What You Can Post</h3>
        <p className="text-muted-foreground mb-4">
          You can upload videos, stream live, and interact with content, but you must follow our Community Guidelines:
        </p>
        <ul className="list-none pl-6 space-y-2 text-muted-foreground">
          <li>✅ Share original or properly licensed content.</li>
          <li>✅ Respect other users and engage in positive interactions.</li>
          <li>✅ Follow local laws and regulations.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">4.2 What You Cannot Post</h3>
        <ul className="list-none pl-6 space-y-2 text-muted-foreground">
          <li>🚫 No hateful, violent, or illegal content.</li>
          <li>🚫 No spam, scams, or misleading information.</li>
          <li>🚫 No nudity, sexual content, or explicit material.</li>
          <li>🚫 No harassment, threats, or bullying.</li>
          <li>🚫 No copyright-infringing content.</li>
        </ul>

        <p className="text-muted-foreground mt-4 mb-6">
          We reserve the right to remove content that violates these rules and take action against repeat offenders.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Copyright & Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You own the content you create but grant Clipt a license to display, share, and promote it within the platform.</li>
          <li>If you believe someone is using your content without permission, you can submit a DMCA takedown request.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Live Streaming & Monetization</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>If you stream live, you are responsible for what you broadcast.</li>
          <li>If you earn money through Clipt (e.g., ads, tipping, or paid content), you must comply with our Monetization Policy.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Account Suspension & Termination</h2>
        <p className="text-muted-foreground mb-4">We may suspend or terminate accounts that:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Violate these Terms or our Community Guidelines.</li>
          <li>Engage in illegal activities.</li>
          <li>Attempt to exploit or manipulate Clipt's systems.</li>
        </ul>
        <p className="text-muted-foreground mt-4">You can appeal a suspension by following our Report & Appeal Process.</p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Disclaimers & Limitations of Liability</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Clipt is provided "as is" without warranties.</li>
          <li>We do not guarantee uninterrupted access to our services.</li>
          <li>We are not responsible for content posted by users.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to These Terms</h2>
        <p className="text-muted-foreground mb-6">
          We may update these Terms from time to time. Continued use of Clipt means you accept the new Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p className="text-muted-foreground">
          For questions or concerns, contact us at:<br />
          📧 <a href="mailto:cliptgaming@gmail.com" className="text-purple-500 hover:text-purple-400">cliptgaming@gmail.com</a>
        </p>
      </div>
    </Card>
  );
};

export default TermsOfService;
