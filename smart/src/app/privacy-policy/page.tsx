import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import CbrixiLogo from "../../../components/CbrixiLogo";

const canonicalUrl = "https://cbrixi.com/privacy-policy";
const effectiveDate = "August 12, 2026";
const lastUpdated = "August 12, 2026";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use-information", title: "How We Use Information" },
  { id: "how-we-share-information", title: "How We Share Information" },
  { id: "payment-information", title: "Payment Information" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "data-storage-security", title: "Data Storage and Security" },
  { id: "data-retention", title: "Data Retention" },
  { id: "rights-choices", title: "User Rights and Choices" },
  { id: "account-deletion", title: "Account and Data Deletion" },
  { id: "childrens-privacy", title: "Children&apos;s Privacy" },
  { id: "cookies", title: "Cookies and Similar Technologies" },
  { id: "international-transfers", title: "International Data Transfers" },
  { id: "changes", title: "Changes to This Privacy Policy" },
  { id: "contact", title: "Contact Us" },
];

export const metadata: Metadata = {
  title: "Privacy Policy | Cbrixi",
  description:
    "Learn how Cbrixi collects, uses, protects, and manages your personal information when you use our website and mobile application.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Privacy Policy | Cbrixi",
    description:
      "Learn how Cbrixi collects, uses, protects, and manages your personal information when you use our website and mobile application.",
    url: canonicalUrl,
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-blue-300/80">
            Cbrixi Privacy
          </p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
            This Privacy Policy explains how Cbrixi handles personal information when you use our
            website, mobile application, account features, product browsing, cart, checkout, orders,
            referrals, receipts, notifications, and support features.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-sm text-white/50 sm:flex-row sm:gap-6">
            <span>Effective date: {effectiveDate}</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav
            aria-label="Privacy policy sections"
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
          >
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
              Contents
            </h2>
            <ol className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-white/62 transition-colors hover:bg-white/8 hover:text-white"
                    dangerouslySetInnerHTML={{ __html: section.title }}
                  />
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 leading-8 text-white/72 shadow-2xl shadow-black/20 sm:p-8">
          <PolicySection id="introduction" title="1. Introduction">
            <p>
              Cbrixi is an e-commerce platform for browsing products, creating an account, managing
              a profile, adding products to a cart, placing orders, viewing receipts, receiving
              notifications, using referrals, and contacting support. This policy applies to the
              Cbrixi website and the Cbrixi mobile application.
            </p>
            <p>
              We have written this policy in clear language so you can understand what information
              is involved when you use Cbrixi. Where the current project does not verify a specific
              practice, this policy describes the practice conservatively and leaves room for updates.
            </p>
          </PolicySection>

          <PolicySection id="information-we-collect" title="2. Information We Collect">
            <p>Based on the current Cbrixi application flows, we may collect the following information.</p>
            <h3>Account information</h3>
            <ul>
              <li>First name and last name.</li>
              <li>Username.</li>
              <li>Email address.</li>
              <li>Password submitted during sign-up or password reset flows.</li>
              <li>Referral code, if you sign up through a referral link.</li>
            </ul>
            <h3>Profile and account-related information</h3>
            <ul>
              <li>Profile updates you submit, including name, username, and email address.</li>
              <li>Cbrilliance email information used for installment approval where applicable.</li>
              <li>Referral activity, referred users, rewards, payout requests, bank name, account name, and account number when you request referral payouts.</li>
            </ul>
            <h3>Shopping, order, and transaction information</h3>
            <ul>
              <li>Products and variants you view or add to your cart.</li>
              <li>Cart items, quantities, prices, discounts, and installment selections.</li>
              <li>Delivery or shipping information, including delivery address and phone number, when you provide it during order or delivery flows.</li>
              <li>Orders, order status, payment mode, payment schedule, amounts, payment references, and receipt records.</li>
              <li>Customer email or phone information where it appears on receipts or payment/order records.</li>
            </ul>
            <h3>Support and communications</h3>
            <ul>
              <li>Messages you send through the support chat or support conversation features.</li>
              <li>Notifications sent to your account, including order, payment, referral, and support-related notices.</li>
            </ul>
            <h3>Device or technical information</h3>
            <p>
              The current frontend uses browser or app storage for authentication state and selected
              user data. Server logs and hosting infrastructure may process technical information
              such as IP address, device/browser type, timestamps, and request metadata as part of
              normal website, app, security, and troubleshooting operations.
            </p>
            <p>
              We do not state that Cbrixi uses a specific analytics, advertising, crash-reporting,
              or tracking provider unless that provider is added to the application and this policy is updated.
            </p>
          </PolicySection>

          <PolicySection id="how-we-use-information" title="3. How We Use Information">
            <p>Cbrixi uses personal information to:</p>
            <ul>
              <li>Create and manage user accounts.</li>
              <li>Authenticate users and keep accounts secure.</li>
              <li>Show products, carts, orders, receipts, notifications, referrals, and profile information.</li>
              <li>Process cart checkout, order placement, installment approval flows, and payment confirmation workflows.</li>
              <li>Provide customer support and respond to user messages.</li>
              <li>Maintain referral rewards and payout request workflows.</li>
              <li>Detect, prevent, and respond to misuse, errors, fraud, or security issues.</li>
              <li>Improve and maintain the website, mobile app, backend services, and user experience.</li>
            </ul>
          </PolicySection>

          <PolicySection id="how-we-share-information" title="4. How We Share Information">
            <p>
              We do not sell your personal information. Cbrixi may share or make information
              available only where reasonably needed to operate the platform, including:
            </p>
            <ul>
              <li>With Cbrixi administrators and support staff who need access to manage orders, payments, users, referrals, notifications, receipts, or support conversations.</li>
              <li>With service providers or infrastructure used to host, secure, deliver, or operate the Cbrixi website, mobile app, API, database, storage, communications, and related services.</li>
              <li>Where required to comply with applicable law, lawful requests, dispute resolution, fraud prevention, or enforcement of Cbrixi policies.</li>
              <li>In connection with a business transfer, restructuring, or similar event, subject to appropriate handling of user information.</li>
            </ul>
          </PolicySection>

          <PolicySection id="payment-information" title="5. Payment Information">
            <p>
              Cbrixi order and payment flows currently include bank-payment style records such as
              payment mode, payment amounts, payment schedules, payment references, approval status,
              and receipts. The frontend code does not verify that Cbrixi directly collects full card
              numbers or card security codes.
            </p>
            <p>
              If Cbrixi later adds a payment processor or additional payment methods, this policy
              should be updated to identify the relevant provider and explain the related data handling.
            </p>
          </PolicySection>

          <PolicySection id="third-party-services" title="6. Third-Party Services">
            <p>
              Cbrixi relies on third-party infrastructure and software services to run an e-commerce
              website and mobile app, such as hosting, database, networking, app distribution, and
              development platform services. The current frontend code does not substantiate specific
              analytics, advertising, or payment-provider names for this policy.
            </p>
            <p>
              Third-party services may process information according to their own terms and privacy
              policies where they provide infrastructure or functionality used by Cbrixi.
            </p>
          </PolicySection>

          <PolicySection id="data-storage-security" title="7. Data Storage and Security">
            <p>
              Cbrixi uses authentication tokens to keep users signed in. The web application stores
              user session information in browser local storage, and the mobile app stores user
              session information in app storage. These tokens should be protected because they can
              be used to access authenticated account features.
            </p>
            <p>
              We use reasonable administrative, technical, and operational measures intended to
              protect personal information. However, no internet or mobile application can be
              guaranteed to be completely secure.
            </p>
          </PolicySection>

          <PolicySection id="data-retention" title="8. Data Retention">
            <p>
              Cbrixi keeps personal information for as long as reasonably needed to provide the
              platform, maintain accounts, process orders and receipts, support customers, handle
              referrals, meet operational needs, resolve disputes, prevent fraud, and comply with
              applicable legal or accounting requirements.
            </p>
            <p>
              We do not publish a fixed retention period here because the current project does not
              verify one. If a specific retention schedule is adopted, this policy should be updated.
            </p>
          </PolicySection>

          <PolicySection id="rights-choices" title="9. User Rights and Choices">
            <p>Depending on your location and applicable law, you may be able to:</p>
            <ul>
              <li>Access or review the personal information associated with your account.</li>
              <li>Update your profile information from your Cbrixi profile page.</li>
              <li>Request correction or deletion of personal information.</li>
              <li>Logout and clear local session information from your browser or device.</li>
              <li>Contact Cbrixi support with privacy-related questions or requests.</li>
            </ul>
            <p>
              Cbrixi is operated in a Nigerian context and aims to handle personal information
              responsibly under applicable Nigerian privacy and data-protection expectations. This
              policy does not claim certification or compliance with any specific privacy framework
              unless Cbrixi separately substantiates that status.
            </p>
          </PolicySection>

          <PolicySection id="account-deletion" title="10. Account and Data Deletion">
            <p>
              Authenticated users can delete their account from the Cbrixi Profile page. Sign in to
              your account, open <Link href="/profile">Profile</Link>, choose <strong>Delete account</strong>,
              and confirm the permanent deletion. The Cbrixi mobile app also provides a delete-account
              option in the authenticated Profile flow.
            </p>
            <p>
              When account deletion succeeds, Cbrixi clears the user session and deletes the
              authenticated account through the backend. The backend is responsible for deleting or
              anonymizing related account records according to the account-deletion process.
            </p>
            <p>
              If you cannot access your account, contact Cbrixi through the website support/contact
              channel and request account deletion. You may be asked to verify that you control the
              account before deletion is processed.
            </p>
          </PolicySection>

          <PolicySection id="childrens-privacy" title="11. Children&apos;s Privacy">
            <p>
              Cbrixi is an e-commerce platform and is not intended for children. Users who are not
              old enough to enter into online purchases or provide personal information under
              applicable law should not create an account or use checkout features without appropriate
              parental or guardian involvement.
            </p>
          </PolicySection>

          <PolicySection id="cookies" title="12. Cookies and Similar Technologies">
            <p>
              The current frontend verifies the use of browser local storage for user tokens, user
              data, campaign session state, and related app state. Local storage helps keep users
              signed in and supports normal website functionality.
            </p>
            <p>
              The current codebase does not verify a separate advertising-cookie or analytics-cookie
              program. If Cbrixi adds cookies, analytics tags, or advertising technologies, this
              section should be updated.
            </p>
          </PolicySection>

          <PolicySection id="international-transfers" title="13. International Data Transfers">
            <p>
              Cbrixi services may be accessed from different locations, and infrastructure used to
              host or operate the website, API, mobile app, database, or support features may process
              information outside your country. When that happens, information may be handled in
              locations with different data-protection rules.
            </p>
          </PolicySection>

          <PolicySection id="changes" title="14. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy as Cbrixi changes, as new features are added, or as
              legal or operational requirements evolve. The updated version will be posted on this
              page with a revised &quot;Last updated&quot; date.
            </p>
          </PolicySection>

          <PolicySection id="contact" title="15. Contact Us">
            <p>
              For privacy questions, account deletion help, or support requests, contact Cbrixi
              through the support/contact features available on the Cbrixi website. The project does
              not currently verify a public official email address, phone number, or physical mailing
              address to publish in this policy.
            </p>
            <p>
              Visit <Link href="/">cbrixi.com</Link> and use the available contact or support channel.
            </p>
          </PolicySection>
        </article>
      </div>

      <PrivacyFooter />
    </main>
  );
}

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b border-white/10 py-8 first:pt-0 last:border-b-0 last:pb-0 [&_a]:text-blue-300 [&_a]:underline [&_a]:underline-offset-4 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_li]:pl-1 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
    >
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">{title}</h2>
      <div className="text-sm leading-7 text-white/72 sm:text-base sm:leading-8">{children}</div>
    </section>
  );
}

function PrivacyFooter() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CbrixiLogo animate={false} textSize="text-lg" />
          <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
            Smart devices for a smarter life. Premium tech, delivered.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/45">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/marketplace" className="transition-colors hover:text-white">
            Shop
          </Link>
          <Link href="/privacy-policy" className="transition-colors hover:text-white">
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-5 text-sm text-white/30">
        © 2026 CBRIXI. All rights reserved.
      </div>
    </footer>
  );
}
