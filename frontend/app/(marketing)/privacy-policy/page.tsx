import type { Metadata } from "next";
import { ArticleLayout } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Acme collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <ArticleLayout title="Privacy Policy" lead="Last updated: January 1, 2026">
      <p>
        <em>Sample text for layout purposes only. Replace this with terms written or reviewed by a qualified lawyer.</em>
      </p>
      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details such as your name and email address.</li>
        <li>Content you create or upload while using the service.</li>
        <li>Usage and device data, including log files and cookies.</li>
      </ul>
      <h2>2. How we use information</h2>
      <ul>
        <li>To provide, maintain and improve the service.</li>
        <li>To respond to requests and send important notices.</li>
        <li>To protect the security of our users and systems.</li>
      </ul>
      <h2>3. Sharing</h2>
      <p>We do not sell your personal information. We share it only with service providers working on our behalf, or where the law requires it.</p>
      <h2>4. Data retention</h2>
      <p>We keep personal information for as long as your account is active or as needed to meet legal obligations.</p>
      <h2>5. Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, export or delete your personal information.</p>
      <h2>6. Contact</h2>
      <p>
        Questions about this policy? Write to <a href="mailto:privacy@example.com">privacy@example.com</a>.
      </p>
    </ArticleLayout>
  );
}
