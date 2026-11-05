import type { Metadata } from "next";
import { ArticleLayout } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Acme.",
};

export default function TermsPage() {
  return (
    <ArticleLayout title="Terms of Service" lead="Last updated: January 1, 2026">
      <p>
        <em>Sample text for layout purposes only. Replace this with terms written or reviewed by a qualified lawyer.</em>
      </p>
      <h2>1. Acceptance of terms</h2>
      <p>By using the service you agree to these terms. If you do not agree, please do not use the service.</p>
      <h2>2. Your account</h2>
      <ul>
        <li>Provide accurate and complete information.</li>
        <li>Keep your login details secure.</li>
        <li>You must be at least 18 years old to use the service.</li>
      </ul>
      <h2>3. Acceptable use</h2>
      <p>You agree not to break any law, infringe the rights of others, distribute malicious code, attempt unauthorized access, or send spam.</p>
      <h2>4. Payment</h2>
      <ul>
        <li>Subscriptions renew automatically unless cancelled.</li>
        <li>Prices may change with advance notice.</li>
        <li>Fees are non-refundable unless the law requires otherwise.</li>
      </ul>
      <h2>5. Intellectual property</h2>
      <p>You keep ownership of your content. We keep ownership of the service and its materials.</p>
      <h2>6. Limitation of liability</h2>
      <p>The service is provided &ldquo;as is&rdquo; without warranties, to the extent permitted by law.</p>
      <h2>7. Termination</h2>
      <p>We may suspend or end access if these terms are broken. You may stop using the service at any time.</p>
      <h2>8. Contact</h2>
      <p>
        Questions about these terms? Write to <a href="mailto:legal@example.com">legal@example.com</a>.
      </p>
    </ArticleLayout>
  );
}
