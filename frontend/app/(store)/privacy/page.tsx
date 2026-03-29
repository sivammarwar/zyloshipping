'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--ink-faint)', fontSize: '0.9rem' }}>Last updated: March 29, 2026</p>
        </div>

        <div style={{ lineHeight: 1.8, color: 'var(--ink-muted)' }}>
          
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>1. Introduction</h2>
            <p style={{ marginBottom: '1rem' }}>
              ZyloShipping Technologies Pvt. Ltd. ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our dropshipping platform and services.
            </p>
            <p>
              By using ZyloShipping, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>2. Information We Collect</h2>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.1 Personal Information</h3>
            <p style={{ marginBottom: '1rem' }}>We collect information that identifies you personally, including:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Name and contact information (email, phone number)</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely by our payment partners)</li>
              <li>Account credentials (username, password hash)</li>
              <li>Business information (company name, tax ID, business license)</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.2 Transaction Data</h3>
            <p style={{ marginBottom: '1rem' }}>When you use our Service, we collect:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Order history and purchase details</li>
              <li>Product listings and inventory data</li>
              <li>Pricing and payment information</li>
              <li>Shipping and tracking information</li>
              <li>Customer reviews and ratings</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.3 Technical Information</h3>
            <p style={{ marginBottom: '1rem' }}>We automatically collect:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system and platform</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Usage data (pages visited, time spent, clicks)</li>
              <li>Log files and error reports</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.4 AI-Generated Data</h3>
            <p style={{ marginBottom: '1rem' }}>Our AI systems may process and generate:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Product descriptions and marketing content</li>
              <li>Pricing recommendations and analytics</li>
              <li>Customer support responses</li>
              <li>Business insights and reports</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: '1rem' }}>We use collected information for:</p>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.1 Service Delivery</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Processing orders and payments</li>
              <li>Managing your account and subscriptions</li>
              <li>Providing customer support</li>
              <li>Sending order confirmations and updates</li>
              <li>Facilitating communication with suppliers</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.2 Platform Improvement</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Analyzing usage patterns and trends</li>
              <li>Improving AI algorithms and features</li>
              <li>Developing new products and services</li>
              <li>Fixing bugs and technical issues</li>
              <li>Conducting research and analytics</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.3 Marketing and Communication</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Sending promotional emails (with your consent)</li>
              <li>Providing personalized recommendations</li>
              <li>Conducting surveys and feedback requests</li>
              <li>Announcing new features and updates</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.4 Legal and Security</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Preventing fraud and abuse</li>
              <li>Enforcing our Terms of Service</li>
              <li>Complying with legal obligations</li>
              <li>Protecting our rights and property</li>
              <li>Resolving disputes</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>4. Information Sharing and Disclosure</h2>
            <p style={{ marginBottom: '1rem' }}>We may share your information with:</p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4.1 Service Providers</h3>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li><strong>Payment Processors:</strong> Razorpay, Stripe (for payment processing)</li>
              <li><strong>Cloud Hosting:</strong> Vercel, Railway, Supabase (for infrastructure)</li>
              <li><strong>Email Service:</strong> Resend (for transactional emails)</li>
              <li><strong>AI Services:</strong> Groq, OpenAI (for AI features)</li>
              <li><strong>Analytics:</strong> Google Analytics (for usage analytics)</li>
              <li><strong>Shipping:</strong> AfterShip (for order tracking)</li>
            </ul>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4.2 Suppliers</h3>
            <p style={{ marginBottom: '1rem' }}>
              We share order details with suppliers (AliExpress, CJ Dropshipping) to fulfill your orders. This includes customer shipping information and product details.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4.3 Legal Requirements</h3>
            <p style={{ marginBottom: '1rem' }}>
              We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>4.4 Business Transfers</h3>
            <p style={{ marginBottom: '1rem' }}>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>5. Data Security</h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li><strong>Encryption:</strong> All data transmitted is encrypted using SSL/TLS</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt</li>
              <li><strong>Access Controls:</strong> Limited access to personal data</li>
              <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
              <li><strong>Secure Infrastructure:</strong> Data stored in secure, compliant data centers</li>
              <li><strong>Monitoring:</strong> 24/7 system monitoring and threat detection</li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>6. Cookies and Tracking</h2>
            <p style={{ marginBottom: '1rem' }}>
              We use cookies and similar technologies to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage and performance</li>
              <li>Provide personalized content</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p style={{ marginBottom: '1rem' }}>
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>7. Your Privacy Rights</h2>
            <p style={{ marginBottom: '1rem' }}>
              You have the right to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@zyloshipping.com. We will respond within 30 days.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>8. Data Retention</h2>
            <p style={{ marginBottom: '1rem' }}>
              We retain your information for as long as necessary to:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Provide our services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p>
              Account data is retained for 7 years after account closure for tax and legal purposes. Transaction data is retained for 10 years as required by Indian law.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>9. Children's Privacy</h2>
            <p>
              Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>10. International Data Transfers</h2>
            <p style={{ marginBottom: '1rem' }}>
              Your information may be transferred to and processed in countries other than India. We ensure appropriate safeguards are in place, including:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Standard contractual clauses</li>
              <li>Data processing agreements</li>
              <li>Compliance with applicable data protection laws</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>11. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies before providing any information.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>12. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>13. Contact Us</h2>
            <p style={{ marginBottom: '1rem' }}>
              For privacy-related questions or concerns, contact us:
            </p>
            <ul style={{ listStyle: 'none', marginLeft: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> privacy@zyloshipping.com</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Data Protection Officer:</strong> dpo@zyloshipping.com</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> ZyloShipping Technologies Pvt. Ltd., Chennai, Tamil Nadu, India</li>
              <li><strong>Support:</strong> support@zyloshipping.com</li>
            </ul>
          </section>

        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--off-white)', borderRadius: 4, borderLeft: '3px solid var(--red)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <strong>Your Privacy Matters:</strong> We are committed to transparency and protecting your personal information. If you have any questions or concerns about how we handle your data, please don't hesitate to contact us.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', background: 'var(--off-white)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
            <Link href="/terms" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
            <Link href="/contact" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Contact</Link>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>© 2026 ZyloShipping. Built in Chennai 🇮🇳</span>
        </div>
      </footer>

    </div>
  );
}
