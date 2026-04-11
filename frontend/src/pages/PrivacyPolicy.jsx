import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-8 last:mb-0">
    <h2 className="text-base font-semibold text-navy mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
      {title}
    </h2>
    {children}
  </div>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-bg-app px-6 py-16 flex flex-col items-center">
    <div className="w-full max-w-[720px]">
      <Link to="/" className="text-navy text-sm font-medium no-underline hover:underline mb-8 inline-block">
        ← Back to Korsana
      </Link>
      <h1 className="text-3xl font-bold text-navy mb-4 font-heading">
        Privacy Policy
      </h1>
      <p className="text-text-muted text-sm mb-10">Last updated: April 2026</p>

      <div className="bg-white rounded-2xl border border-border-light p-10 text-text-secondary text-sm leading-relaxed">

        <Section title="1. Information We Collect">
          <p className="font-medium text-navy mb-2">Account information</p>
          <p>Email address and hashed password, managed by Supabase Auth.</p>

          <p className="font-medium text-navy mt-4 mb-2">Profile data</p>
          <p>
            Display name, profile photo, personal records (5K / 10K / half / marathon times),
            weekly run target, training zones (heart rate bpm ranges), notification preferences,
            and unit preference (miles or km). All provided by you.
          </p>

          <p className="font-medium text-navy mt-4 mb-2">Strava activity data</p>
          <p>
            When you connect Strava, Korsana reads and stores your activity data including type,
            distance, duration, pace, heart rate, elevation, and start time. We also store your
            Strava athlete ID and OAuth tokens required to keep the sync active.
          </p>

          <p className="font-medium text-navy mt-4 mb-2">AI coach conversations</p>
          <p>
            Messages you send to the AI Coach and responses generated are stored to maintain
            session history and provide context for follow-up questions.
          </p>

          <p className="font-medium text-navy mt-4 mb-2">Usage data</p>
          <p>
            Standard server logs (IP address, browser type, pages visited, timestamps) collected
            automatically. Used for security and debugging.
          </p>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and personalise the Service's training metrics, dashboard widgets, and AI coaching</li>
            <li>Sync and analyse your Strava activities to compute training load, recovery, and race predictions</li>
            <li>Generate AI coach responses informed by your training context</li>
            <li>Send notification emails if you opt in (when email notifications are enabled)</li>
            <li>Diagnose bugs and maintain service security</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data. We do not use your data for advertising.
          </p>
        </Section>

        <Section title="3. Strava Data">
          <p>
            Korsana accesses Strava data under read-only OAuth scope. We store activity records in
            our database to power offline analysis and historical trends. Strava OAuth tokens are
            stored encrypted and used only to refresh your activity feed.
          </p>
          <p className="mt-3">
            Disconnecting Strava from Settings → Integrations revokes our access and deletes your
            stored Strava tokens. Cached activity data is deleted when you delete your account.
          </p>
        </Section>

        <Section title="4. AI Coach Data">
          <p>
            Coach session messages are sent to Google's Gemini API to generate responses. Your
            training context (goal, recent activities, training zones) is included in each request
            so the coach can give relevant answers. Google's use of this data is governed by the{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy underline"
            >
              Gemini API Terms of Service
            </a>
            .
          </p>
          <p className="mt-3">
            Coach conversation history is stored in our database. You can delete individual
            sessions or all data via account deletion.
          </p>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your data is stored in a Supabase-managed PostgreSQL database hosted in the US.
            Profile photos are stored in Supabase Storage. The backend runs on DigitalOcean.
            OAuth state tokens and rate-limit counters are stored ephemerally in Upstash Redis.
          </p>
          <p className="mt-3">
            We use HTTPS for all data in transit. Authentication is handled by Supabase Auth with
            JWT tokens. Passwords are hashed and never stored in plaintext. We apply
            principle-of-least-privilege to all internal service access.
          </p>
          <p className="mt-3">
            No security system is perfect. In the event of a breach affecting your data, we will
            notify you as required by applicable law.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your data for as long as your account is active. When you delete your
            account, your personal data, activity records, coach conversations, and training
            history are permanently deleted within 30 days.
          </p>
          <p className="mt-3">
            Server logs are retained for up to 90 days for security purposes.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You can, at any time:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><span className="font-medium text-navy">Access</span> — view all data we hold about you within the app</li>
            <li><span className="font-medium text-navy">Export</span> — download a copy of your data from Settings → Account</li>
            <li><span className="font-medium text-navy">Correct</span> — update your profile and preferences in Settings</li>
            <li><span className="font-medium text-navy">Delete</span> — permanently delete your account and all associated data from Settings → Account</li>
            <li><span className="font-medium text-navy">Disconnect Strava</span> — revoke Strava access from Settings → Integrations</li>
          </ul>
          <p className="mt-3">
            If you are in the EEA or UK, you have additional rights under GDPR / UK GDPR including
            the right to restrict processing and to lodge a complaint with your supervisory
            authority. Contact us at{' '}
            <a href="mailto:contact@korsana.run" className="text-navy underline">
              contact@korsana.run
            </a>{' '}
            to exercise any of these rights.
          </p>
        </Section>

        <Section title="8. Third-Party Services">
          <p>Korsana uses the following third-party services to operate:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><span className="font-medium text-navy">Supabase</span> — authentication, database, and file storage</li>
            <li><span className="font-medium text-navy">Strava</span> — activity data via OAuth 2.0</li>
            <li><span className="font-medium text-navy">Google Gemini</span> — AI coach responses</li>
            <li><span className="font-medium text-navy">Vercel</span> — frontend hosting</li>
            <li><span className="font-medium text-navy">DigitalOcean</span> — backend hosting</li>
            <li><span className="font-medium text-navy">Upstash</span> — Redis cache (rate limiting, OAuth state)</li>
          </ul>
          <p className="mt-3">
            Each provider has its own privacy practices. We choose providers that meet reasonable
            security standards, but we are not responsible for their independent data handling.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Korsana is not directed at children under 16. We do not knowingly collect personal
            data from anyone under 16. If you believe a child has provided us data, please contact
            us and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via the app or email before they take effect. The "Last updated" date at the
            top of this page will always reflect the most recent revision.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions or requests regarding your privacy? Email us at{' '}
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

export default PrivacyPolicy;
