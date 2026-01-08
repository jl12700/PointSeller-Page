import React, { useState } from "react";
import '../Styles/PrivacyPolicyModal.css';

const PrivacyPolicyModal = ({ isOpen, onClose, onAccept, appType = "card" }) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (scrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="privacy-modal-overlay">
      <div className="privacy-modal">
        <div className="privacy-modal-header">
          <h2>Privacy Policy & Data Consent</h2>
          <p className="privacy-subtitle">PayTap Card System - Data Privacy Act of 2012 (RA 10173) Compliance</p>
        </div>

        <div className="privacy-modal-body" onScroll={handleScroll}>
          <section className="privacy-section">
            <h3>1. Introduction</h3>
            <p>
              The PayTap Card System is committed to protecting your privacy and personal data 
              in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your personal information when you use 
              the PayTap Card System for {appType === "card" ? "student card registration and cashless transactions" : "vendor registration and point-of-sale operations"}.
            </p>
          </section>

          <section className="privacy-section">
            <h3>2. Data Controller</h3>
            <p>
              <strong>System:</strong> PayTap Card System<br/>
              <strong>Contact Email:</strong> ptadm03@gmail.com
            </p>
          </section>

          <section className="privacy-section">
            <h3>3. Personal Data We Collect</h3>
            
            {appType === "card" ? (
              <>
                <h4>For Student Card Applications:</h4>
                <ul>
                  <li><strong>Personal Identification:</strong> Full name, email address, school ID number, course/section, contact number</li>
                  <li><strong>Supporting Documents:</strong> School ID photo (for identity verification)</li>
                  <li><strong>Application Details:</strong> Reason/purpose for card application, application date and status</li>
                  <li><strong>Card & Transaction Data:</strong> Card number, balance, transaction history, purchase records, top-up history</li>
                  <li><strong>Technical Data:</strong> IP address, device information, access logs</li>
                </ul>
              </>
            ) : (
              <>
                <h4>For Vendor Registrations:</h4>
                <ul>
                  <li><strong>Business Owner Information:</strong> Full name, email address, phone number</li>
                  <li><strong>Business Information:</strong> Business name, stall location, authorized seller name</li>
                  <li><strong>Supporting Documents:</strong> School cafeteria accreditation certificate, menu items with prices, DTI/SEC registration, mayor's permit</li>
                  <li><strong>Transaction & Financial Data:</strong> Sales records, transaction logs, revenue reports, payment settlements</li>
                  <li><strong>Technical Data:</strong> Login credentials, access logs, POS usage data</li>
                </ul>
              </>
            )}
          </section>

          <section className="privacy-section">
            <h3>4. Purpose of Data Collection</h3>
            <p>We collect and process your personal data for the following legitimate purposes:</p>
            <ul>
              <li><strong>Account Creation & Identification:</strong> To verify your identity and create your {appType === "card" ? "student card account" : "vendor account"}</li>
              <li><strong>Service Provision:</strong> To enable cashless transactions, balance management, and {appType === "card" ? "card top-ups" : "point-of-sale operations"}</li>
              <li><strong>Transaction Processing:</strong> To record, process, and maintain accurate transaction records</li>
              <li><strong>Financial Management:</strong> To manage account balances, settlements, and financial reconciliation</li>
              <li><strong>Security & Fraud Prevention:</strong> To protect against unauthorized access, fraud, and misuse</li>
              <li><strong>Communication:</strong> To send important notifications about your account, transactions, and system updates</li>
              <li><strong>Compliance:</strong> To comply with legal obligations, school policies, and regulatory requirements</li>
              <li><strong>System Improvement:</strong> To analyze usage patterns and improve system performance (using anonymized data)</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>5. Legal Basis for Processing</h3>
            <p>We process your personal data based on:</p>
            <ul>
              <li><strong>Consent:</strong> You have explicitly consented to the processing of your personal data</li>
              <li><strong>Contractual Necessity:</strong> Processing is necessary for the performance of the PayTap Card System services</li>
              <li><strong>Legitimate Interest:</strong> Processing is necessary for system security, fraud prevention, and service improvement</li>
              <li><strong>Legal Obligation:</strong> Processing is required to comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>6. Data Sharing & Authorized Access</h3>
            <p>Your personal data is accessible only to authorized personnel with legitimate need:</p>
            <ul>
              <li><strong>System Administrators:</strong> Full access for system management, user support, and technical maintenance</li>
              <li><strong>Points Sellers:</strong> Access to card holder information for top-up processing and balance verification</li>
              {appType === "vendor" && (
                <li><strong>Vendor Accounts:</strong> Access to transaction records related to their own sales and settlements</li>
              )}
              <li><strong>School Management:</strong> Access to aggregated reports for oversight and policy decisions</li>
            </ul>
            <p>
              <strong>We do NOT sell, rent, or share your personal data with third parties for marketing purposes.</strong> 
              Data may only be shared with third-party service providers (e.g., cloud hosting, payment processors) who are 
              contractually bound to protect your data and use it only for specified purposes.
            </p>
          </section>

          <section className="privacy-section">
            <h3>7. Data Security Measures</h3>
            <p>We implement comprehensive security measures to protect your personal data:</p>
            <ul>
              <li><strong>Authentication & Access Control:</strong> Multi-factor authentication, role-based access controls, secure login systems</li>
              <li><strong>Encryption:</strong> Data encryption in transit (HTTPS/TLS) and at rest</li>
              <li><strong>Database Security:</strong> Secure database configurations with row-level security policies</li>
              <li><strong>Audit Logging:</strong> Comprehensive logging of all data access and modifications</li>
              <li><strong>Regular Security Updates:</strong> Timely application of security patches and system updates</li>
              <li><strong>Personnel Training:</strong> Regular privacy and security training for authorized personnel</li>
              <li><strong>Incident Response Plan:</strong> Established procedures for detecting and responding to security incidents</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>8. Your Data Privacy Rights</h3>
            <p>Under the Data Privacy Act of 2012, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of your personal data we hold</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Erasure/Blocking:</strong> Request deletion or blocking of your data (subject to legal retention requirements)</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the National Privacy Commission</li>
              <li><strong>Right to Damages:</strong> Claim compensation for damages sustained due to privacy violations</li>
            </ul>
            <p>
              To exercise these rights, please contact our Data Protection Officer at privacy@paytap.edu.ph. 
              We will respond to your request within fifteen (15) days as required by law.
            </p>
          </section>

          <section className="privacy-section">
            <h3>9. Withdrawal of Consent</h3>
            <p>
              You have the right to withdraw your consent at any time. However, please note that withdrawal of consent may result in:
            </p>
            <ul>
              <li>Inability to process your application</li>
              <li>Suspension or termination of your {appType === "card" ? "card account and transaction privileges" : "vendor account and POS access"}</li>
              <li>Inability to provide system services</li>
            </ul>
            <p>
              Withdrawal of consent does not affect the lawfulness of processing based on consent before withdrawal, 
              nor does it affect processing based on other legal grounds.
            </p>
          </section>

          <section className="privacy-section">
            <h3>10. Data Retention Policy</h3>
            <p>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:</p>
            <ul>
              <li><strong>Active Accounts:</strong> Data retained while your account is active and for legitimate business purposes</li>
              <li><strong>Transaction Records:</strong> Maintained for 5 years from transaction date for financial auditing and tax compliance</li>
              <li><strong>Application Records:</strong> Approved applications retained for 3 years; rejected applications retained for 1 year</li>
              <li><strong>Closed Accounts:</strong> Personal data deleted or anonymized within 1 year after account closure, except where longer retention is required by law</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>11. Data Breach Notification</h3>
            <p>
              In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, 
              we will notify you and the National Privacy Commission within seventy-two (72) hours of becoming aware of the breach, 
              as required by law. The notification will include:
            </p>
            <ul>
              <li>Nature of the breach</li>
              <li>Categories and approximate number of affected data subjects</li>
              <li>Likely consequences of the breach</li>
              <li>Measures taken or proposed to address the breach and mitigate its effects</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>12. Cookies and Tracking Technologies</h3>
            <p>
              Our system uses essential cookies and similar technologies to maintain your session, ensure security, 
              and provide basic functionality. We do not use advertising or tracking cookies. You can control cookie 
              settings through your browser, but disabling cookies may affect system functionality.
            </p>
          </section>

          <section className="privacy-section">
            <h3>13. Children's Privacy</h3>
            <p>
              Our system is designed for use by students and school community members. If you are under 18 years of age, 
              we recommend that you review this Privacy Policy with your parent or guardian before using the system.
            </p>
          </section>

          <section className="privacy-section">
            <h3>14. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, 
              or system features. We will notify you of significant changes by email or through prominent notice in the system. 
              Your continued use of the system after changes are posted constitutes acceptance of the updated policy.
            </p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </section>

          <section className="privacy-section">
            <h3>15. Contact Information</h3>
            <p>For questions, concerns, or requests regarding this Privacy Policy or your personal data:</p>
            <p>
              PayTap Card System<br/>
              Email: ptadm03@gmail.com<br/>
            </p>
          </section>

          <div className="scroll-notice">
            {!hasScrolled && (
              <p className="scroll-reminder">
                ⬇️ Please scroll down to read the complete Privacy Policy before proceeding
              </p>
            )}
          </div>
        </div>

        <div className="privacy-modal-footer">
          <button 
            className="privacy-accept-btn" 
            onClick={onAccept}
            disabled={!hasScrolled}
          >
            I Have Read and Accept
          </button>
          <button className="privacy-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;