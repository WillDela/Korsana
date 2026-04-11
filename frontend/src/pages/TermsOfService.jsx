import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-8 last:mb-0">
    <h2 className="text-base font-semibold text-navy mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
      {title}
    </h2>
    {children}
  </div>
);

const TermsOfService = () => (
  <div className="min-h-screen bg-bg-app px-6 py-16 flex flex-col items-center">
    <div className="w-full max-w-[720px]">
      <Link to="/" className="text-navy text-sm font-medium no-underline hover:underline mb-8 inline-block">
        ← Back to Korsana
      </Link>
      <h1 className="text-3xl font-bold text-navy mb-4 font-heading">
        Terms of Service
      </h1>
      <p className="text-text-muted text-sm mb-10">Last updated: April 2026</p>

      <div className="bg-white rounded-2xl border border-border-light p-10 text-text-secondary text-sm leading-relaxed">

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using Korsana ("the Service"), you agree to these Terms of
            Service. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Korsana is an AI-powered marathon and endurance training platform. It connects to your
            Strava account to analyse your training data and provides personalised coaching
            insights, training load metrics, race preparation tools, and a conversational AI coach.
          </p>
          <p className="mt-3">
            Korsana is a training support tool, not a medical service. Nothing on the Service
            constitutes medical, clinical, or professional health advice.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p>
            You must provide accurate information when creating your account. You are responsible
            for keeping your login credentials secure and for all activity that occurs under your
            account.
          </p>
          <p className="mt-3">You must be at least 16 years old to use Korsana.</p>
        </Section>

        <Section title="4. Strava Integration">
          <p>
            Korsana connects to Strava via OAuth 2.0 with read-only access to your activities. By
            connecting Strava, you authorise Korsana to access and store your Strava activity data
            to power the Service's features. You can disconnect Strava at any time from
            Settings → Integrations.
          </p>
          <p className="mt-3">
            Korsana's use of Strava data is governed by the{' '}
            <a
              href="https://www.strava.com/legal/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              Strava API Agreement
            </a>
            .
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Attempt to reverse-engineer, scrape, or disrupt the Service</li>
            <li>Use the Service to harm others or engage in unlawful activity</li>
            <li>Share your account with others or create multiple accounts to circumvent limits</li>
            <li>Submit false or misleading training data to manipulate AI outputs</li>
          </ul>
        </Section>

        <Section title="6. Health Disclaimer">
          <p>
            Korsana provides general training guidance based on your activity data. It does not
            account for your complete medical history and is not a substitute for advice from a
            qualified physician, physiotherapist, or certified running coach.
          </p>
          <p className="mt-3">
            If you experience pain, injury, or any health concern during training, stop the
            activity and consult a medical professional. You train at your own risk.
          </p>
        </Section>

        <Section title="7. AI Coach">
          <p>
            The AI Coach uses Google Gemini to generate responses based on your training context.
            AI-generated advice may not be accurate or appropriate for your individual
            circumstances. Use it as a starting point, not a definitive prescription.
          </p>
          <p className="mt-3">
            Daily message limits apply per account to ensure fair access across all users.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>
            Korsana and its content, features, and branding are owned by Korsana. Your training
            data remains yours. By using the Service you grant Korsana a limited licence to
            process and display your data solely to provide the features described.
          </p>
        </Section>

        <Section title="9. Disclaimers and Limitation of Liability">
          <p>
            The Service is provided "as is" without warranties of any kind. To the fullest extent
            permitted by applicable law, Korsana is not liable for indirect, incidental, or
            consequential damages arising from your use of the Service — including training
            injuries, missed race goals, or data loss.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may delete your account at any time from Settings → Account. Korsana may suspend
            or terminate accounts that violate these Terms. On termination, your personal data will
            be deleted in accordance with the Privacy Policy.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. Material changes will be communicated via
            the app or email before they take effect. Continued use of the Service after changes
            take effect constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Email us at{' '}
            <a href="mailto:contact@korsana.run" className="text-navy underline">
              contact@korsana.run
            </a>
            .
          </p>
        </Section>

      </div>
    </div>
  </div>
);

export default TermsOfService;
