'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'var(--sans)', color: 'var(--ink)', minHeight: '100vh', background: 'var(--white)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[['Products', '/products'], ['Pricing', '/pricing'], ['About', '/about']].map(([label, href]) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 300 }}>{label}</Link>
          ))}
          <Link href="/login" style={{ padding: '0.45rem 1rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>Sign in →</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '1rem' }}>Legal</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--ink-faint)', fontSize: '0.9rem' }}>Last updated: March 29, 2026</p>
        </div>

        <div style={{ lineHeight: 1.8, color: 'var(--ink-muted)' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing or using ZyloShipping ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p>
              ZyloShipping is a dropshipping platform that connects merchants with suppliers to facilitate product sourcing and order fulfillment. These Terms apply to all users of the Service, including merchants, customers, and visitors.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>2. Account Registration</h2>
            <p style={{ marginBottom: '1rem' }}>
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
            <p>
              You must be at least 18 years old to create an account. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>3. Merchant Responsibilities</h2>
            <p style={{ marginBottom: '1rem' }}>
              As a merchant using ZyloShipping, you agree to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Comply with all applicable laws and regulations</li>
              <li>Provide accurate product descriptions and pricing</li>
              <li>Honor all confirmed orders and refund policies</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Not sell prohibited, illegal, or counterfeit products</li>
              <li>Maintain appropriate business licenses and permits</li>
            </ul>
            <p>
              You are solely responsible for your business operations, customer service, and compliance with tax laws. ZyloShipping is a technology platform and does not take ownership of products or assume merchant liabilities.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>4. Payment Terms</h2>
            <p style={{ marginBottom: '1rem' }}>
              <strong>For Merchants:</strong>
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Subscription fees are billed monthly or annually based on your chosen plan</li>
              <li>Fees are non-refundable except as required by law</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>Price changes will be communicated 30 days in advance</li>
            </ul>
            <p style={{ marginBottom: '1rem' }}>
              <strong>For Customers:</strong>
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>All prices are in Indian Rupees (INR) unless otherwise stated</li>
              <li>Payment is required at time of order placement</li>
              <li>We accept UPI, credit/debit cards, net banking, and digital wallets</li>
              <li>Refunds are processed according to our refund policy</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>5. Refunds and Returns</h2>
            <p style={{ marginBottom: '1rem' }}>
              We offer a 7-day return policy for most products. To be eligible for a return:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Item must be unused and in original packaging</li>
              <li>Return request must be initiated within 7 days of delivery</li>
              <li>Proof of purchase must be provided</li>
              <li>Certain items (perishables, custom products) are non-returnable</li>
            </ul>
            <p>
              Refunds are processed within 5-7 business days after receiving the returned item. Shipping costs are non-refundable unless the return is due to our error.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>6. Intellectual Property</h2>
            <p style={{ marginBottom: '1rem' }}>
              The Service and its original content, features, and functionality are owned by ZyloShipping and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              You may not:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Copy, modify, or distribute our content without permission</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use our trademarks without written consent</li>
              <li>Remove or alter any copyright notices</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>7. AI-Powered Features</h2>
            <p style={{ marginBottom: '1rem' }}>
              ZyloShipping uses artificial intelligence for various features including product curation, pricing optimization, content generation, and customer support. You acknowledge that:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>AI-generated content may contain errors and should be reviewed</li>
              <li>Pricing suggestions are recommendations, not guarantees</li>
              <li>You retain final control over all business decisions</li>
              <li>We continuously improve AI models but cannot guarantee 100% accuracy</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>8. Prohibited Activities</h2>
            <p style={{ marginBottom: '1rem' }}>
              You agree not to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Engage in fraudulent activities</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated systems to scrape or data mine</li>
              <li>Sell prohibited items (weapons, drugs, counterfeit goods, etc.)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>9. Limitation of Liability</h2>
            <p style={{ marginBottom: '1rem' }}>
              To the maximum extent permitted by law, ZyloShipping shall not be liable for:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, or data</li>
              <li>Business interruption or loss of opportunity</li>
              <li>Actions or omissions of third-party suppliers</li>
              <li>Product quality or delivery issues from suppliers</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ZyloShipping, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your products or business operations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>11. Termination</h2>
            <p style={{ marginBottom: '1rem' }}>
              We may terminate or suspend your account immediately, without prior notice, for:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>At our sole discretion for any reason</li>
            </ul>
            <p>
              Upon termination, your right to use the Service will cease immediately. You may terminate your account at any time through your account settings.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu, India.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>14. Contact Information</h2>
            <p style={{ marginBottom: '1rem' }}>
              For questions about these Terms, please contact us:
            </p>
            <ul style={{ listStyle: 'none', marginLeft: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> legal@zyloshipping.com</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> ZyloShipping Technologies Pvt. Ltd., Chennai, Tamil Nadu, India</li>
              <li><strong>Support:</strong> support@zyloshipping.com</li>
            </ul>
          </section>

        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--off-white)', borderRadius: 4, borderLeft: '3px solid var(--red)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <strong>Note:</strong> By using ZyloShipping, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use our Service.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', background: 'var(--off-white)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
            <Link href="/terms" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 500 }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/contact" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Contact</Link>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>© 2026 ZyloShipping. Built in Chennai 🇮🇳</span>
        </div>
      </footer>

    </div>
  );
}
