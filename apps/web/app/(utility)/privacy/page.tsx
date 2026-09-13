import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy – HigherBits.dev",
  description: "Privacy policy for HigherBits.dev",
}

import { JSX } from "react"

export default function PrivacyPolicy(): JSX.Element {
  return (
    <div className="container max-w-3xl py-6 md:py-10">
      <div className="prose dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>

        <p className="lead">Last updated: 12/25/2024</p>

        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy explains how HigherBits.dev ("we", "our", or "us"),
          operated by Higher Bits Labs Inc., collects and uses information through
          our website and services.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Anonymous Usage Data</h3>
        <p>
          We collect anonymous usage data to improve our services and understand
          how users interact with HigherBits.dev. This may include:
        </p>
        <ul>
          <li>Pages visited and features used</li>
          <li>
            Technical information such as browser type and device information
          </li>
          <li>Usage patterns and interaction with our components</li>
        </ul>

        <h3>2.2 Newsletter Subscription</h3>
        <p>
          If you opt in to receive our newsletter, we collect and store your
          email address. This is only done with your explicit consent when you:
        </p>
        <ul>
          <li>Subscribe through our website</li>
          <li>Sign up for updates about new components</li>
          <li>Register for an account</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for:</p>
        <ul>
          <li>Improving our component library and services</li>
          <li>Sending newsletters and updates (only to subscribed users)</li>
          <li>Analyzing usage patterns to enhance user experience</li>
          <li>Maintaining and optimizing our platform</li>
        </ul>

        <h2>4. Analytics & Cookies</h2>
        <p>
          We use essential cookies and local storage items strictly necessary for session management and user authentication (via Clerk). These are always active, because the site cannot function without them.
        </p>
        <p>
          <strong>No analytics run until you say yes.</strong> On your first visit we ask you to Accept or Reject analytics. Until you choose Accept, none of the services below load any script, set any analytics cookie, create any identifier, or record anything. Simply visiting or browsing the site does not start tracking. If you choose Reject, they stay off.
        </p>
        <p>
          Once you accept, we use the following to understand how the site is used:
        </p>
        <ul>
          <li><strong>Google Analytics:</strong> Aggregated traffic measurement — page views, referrers, and broad audience trends.</li>
          <li><strong>Amplitude:</strong> Aggregated feature usage, pageviews, and component interactions, plus a low-rate session replay sample, without capturing sensitive personal data.</li>
          <li><strong>PostHog:</strong> Product analytics and, on authoring pages only (the Studio and publishing flows), session recording used to diagnose problems in those editors.</li>
          <li><strong>First-party component analytics:</strong> We record which components are viewed and copied. If you are not signed in, this uses a random anonymous identifier stored in your browser (<code>21st_anon_id</code>); it is created only after you accept, and removed if you later reject.</li>
          <li><strong>First-party attribution:</strong> If you start a subscription, we store in your browser which part of the site you came from, so we know which pages are useful. Written only after you accept.</li>
        </ul>
        <p>
          Your choice is stored in your browser under <code>hb_analytics_consent</code>. That single item is functional, not a tracking cookie — it exists only to remember your answer so we do not ask again on every page.
        </p>
        <p>
          <strong>Changing your mind:</strong> the &ldquo;Cookie preferences&rdquo; link in the footer of every page reopens this choice at any time. Choosing Reject stops new data collection immediately — we opt you out of Amplitude and PostHog and set Google Analytics&rsquo; documented disable flag. It does not, however, delete cookies your browser has already stored from a period when analytics were accepted; clear your browser&rsquo;s cookies and site data for this site to remove those.
        </p>

        <h2>5. Third-Party Service Providers</h2>
        <p>
          We partner with trusted third-party services to deliver core functionality. These providers process information strictly on our behalf:
        </p>
        <ul>
          <li><strong>Clerk:</strong> Manages secure user authentication, identity verification, and profile sessions.</li>
          <li><strong>Stripe:</strong> Processes payment transactions, subscription billing, and invoices securely (PCI-DSS compliant). We do not store full payment card numbers on our servers.</li>
          <li><strong>Supabase:</strong> Provides encrypted relational database storage and cloud infrastructure.</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Unsubscribe from our newsletter at any time</li>
          <li>Request information about your data we store</li>
          <li>Request deletion of your email and user account from our database</li>
        </ul>

        <h2>7. Contact Information</h2>
        <p>
          For any privacy-related questions or concerns, please contact:
          <br />
          Higher Bits Labs Inc.
          <br />
          Samson St. Purok 3, Barangay 3,
          <br />
          San Francisco,
          <br />
          Agusan del Sur,
          <br />
          Philippines 8501
          <br />
          Phone: +81 070 8986 1692
          <br />
          Email: support@higherbits.dev
        </p>
      </div>
    </div>
  )
}
