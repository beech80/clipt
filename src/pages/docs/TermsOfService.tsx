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
        <p className="text-sm text-muted-foreground mb-6">Last Updated: April 1, 2025</p>

        <p className="mb-6">
          Welcome to Clipt! Clipt is a next-generation social media and streaming platform built on the principles of free expression, creativity, and gaming culture. By using Clipt, you agree to these Terms of Service ("Terms"). Please read them carefully.
        </p>

        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-bold text-purple-300 mb-2">🔍 Our Commitment to Freedom of Speech</h3>
          <p className="text-white/90">
            Unlike many other platforms, Clipt is built on the fundamental belief that users should be able to express themselves freely. We believe in minimal content moderation and maximum user expression, setting us apart from restrictive policies found on platforms like Twitch and YouTube. While we have basic rules to maintain safety and legality, we err on the side of allowing content rather than censoring it.
          </p>
        </div>

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

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Content & Freedom of Expression</h2>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">4.1 Our Philosophy on Free Speech</h3>
        <p className="text-muted-foreground mb-4">
          At Clipt, we believe in the fundamental right to free expression. Unlike other platforms that may restrict certain viewpoints or content, we aim to provide a space where diverse opinions and creative expression can flourish. We maintain only the minimum necessary content restrictions required by law.
        </p>

        <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4 my-4">
          <h4 className="font-medium text-blue-300 mb-2">How We're Different:</h4>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>We don't demonetize content based on controversial topics or opinions</li>
            <li>We don't algorithmically suppress content that challenges mainstream narratives</li>
            <li>We aim for transparent, consistent enforcement of our minimal rules</li>
            <li>We don't bow to external pressure to remove otherwise legal content</li>
          </ul>
        </div>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">4.2 What You Can Post</h3>
        <p className="text-muted-foreground mb-4">
          You can upload videos, stream live, and interact with content with broad freedom of expression:
        </p>
        <ul className="list-none pl-6 space-y-2 text-muted-foreground">
          <li>✅ Share original or properly licensed content</li>
          <li>✅ Express diverse political, social, and cultural viewpoints</li>
          <li>✅ Create content that may be deemed controversial on other platforms</li>
          <li>✅ Engage in satire, parody, and criticism</li>
          <li>✅ Discuss topics that other platforms might restrict or demonetize</li>
        </ul>

        <h3 className="text-lg font-semibold mt-6 mb-3">4.3 Necessary Limitations</h3>
        <p className="text-muted-foreground mb-2">
          To maintain a functional platform and comply with legal requirements, we have these minimal restrictions:
        </p>
        <ul className="list-none pl-6 space-y-2 text-muted-foreground">
          <li>🚫 Content that directly violates applicable laws (illegal content)</li>
          <li>🚫 Direct and specific threats of violence against identifiable individuals</li>
          <li>🚫 Content that exposes minors to harm</li>
          <li>🚫 Malware, phishing, or content designed to compromise user security</li>
          <li>🚫 Spam that significantly impairs platform functionality</li>
          <li>🚫 Content that infringes on copyright (subject to fair use protections)</li>
        </ul>

        <p className="text-muted-foreground mt-4 mb-6">
          We believe adults should be able to choose what content they consume. We provide tools for users to filter content they don't wish to see, rather than removing content platform-wide.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Copyright & Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You own the content you create but grant Clipt a license to display, share, and promote it within the platform.</li>
          <li>We strongly support fair use protections for commentary, criticism, news reporting, and transformative content.</li>
          <li>If you believe someone is using your content without permission, you can submit a DMCA takedown request.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Live Streaming & Monetization</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>If you stream live, you are responsible for what you broadcast.</li>
          <li>Unlike other platforms, we do not demonetize content based on subjective criteria or advertiser pressure.</li>
          <li>If you earn money through Clipt (e.g., ads, tipping, or paid content), you must comply with our Monetization Policy.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Account Actions & Appeals</h2>
        <p className="text-muted-foreground mb-4">We may take action against accounts that:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Violate the minimal restrictions outlined in section 4.3</li>
          <li>Engage in illegal activities</li>
          <li>Attempt to exploit or manipulate Clipt's systems</li>
        </ul>
        <p className="text-muted-foreground mt-4">
          We believe in due process. Any action taken against an account will be accompanied by a clear explanation, and all users have the right to appeal decisions through our transparent appeals process.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Disclaimers & Limitations of Liability</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Clipt is provided "as is" without warranties.</li>
          <li>We do not guarantee uninterrupted access to our services.</li>
          <li>We are not responsible for content posted by users.</li>
          <li>We reserve the right to modify or discontinue services with reasonable notice.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to These Terms</h2>
        <p className="text-muted-foreground mb-6">
          We may update these Terms from time to time. Continued use of Clipt means you accept the new Terms. Major changes will be announced within the platform.
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
