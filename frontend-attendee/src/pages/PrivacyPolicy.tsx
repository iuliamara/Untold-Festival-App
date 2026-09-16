import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const DATA_CONTROLLER = {
  name: 'Untold Festival SRL',
  address: 'Cluj-Napoca, România',
  email: 'privacy@untoldfestival.ro',
  representative: 'Responsabil protecția datelor (DPO)',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-3">{title}</h2>
    <div className="text-sm text-white/70 leading-relaxed space-y-3">{children}</div>
  </section>
);

const ContentEN: React.FC = () => (
  <>
    <Section title="1. Who we are">
      <p>
        {DATA_CONTROLLER.name} ("Untold Festival", "we", "us"), based in {DATA_CONTROLLER.address}, is the data
        controller responsible for the personal data collected through this application.
      </p>
      <p>
        Contact: <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a> ({DATA_CONTROLLER.representative}).
      </p>
    </Section>

    <Section title="2. What data we collect">
      <p><strong className="text-white">Account data:</strong> username, email address, password (stored hashed).</p>
      <p><strong className="text-white">Ticket / attendee data:</strong> first and last name, date of birth, gender, country, city, identity document type and number, phone number — collected during mandatory check-in for each ticket holder.</p>
      <p><strong className="text-white">Order data:</strong> ticket type, price, purchase date. Payment card details are processed directly by our payment provider (Stripe) and are never stored on our servers.</p>
    </Section>

    <Section title="3. Why we process your data and our legal basis">
      <ul className="list-disc list-inside space-y-1">
        <li>To create and manage your account, and issue and fulfil ticket orders — <em>performance of a contract</em>.</li>
        <li>To verify attendee identity at festival entry, as required by applicable event-safety regulations — <em>legal obligation</em>.</li>
        <li>To process payments and top-ups via our payment provider — <em>performance of a contract</em>.</li>
        <li>To send you order confirmations and essential event communications — <em>legitimate interest</em>.</li>
      </ul>
    </Section>

    <Section title="4. How long we keep your data">
      <p>
        Account and ticket data is kept for as long as your account is active, plus any additional period required
        to comply with fiscal/accounting obligations (typically up to 10 years for financial records under Romanian
        law). You may request earlier deletion where no legal retention obligation applies.
      </p>
    </Section>

    <Section title="5. Who we share your data with">
      <p>
        We share payment data with our payment processor (Stripe) solely to complete transactions. We do not sell
        or rent your personal data to third parties.
      </p>
    </Section>

    <Section title="6. Your rights">
      <p>Under the GDPR, you have the right to:</p>
      <ul className="list-disc list-inside space-y-1">
        <li><strong className="text-white">Access</strong> — download a full copy of the data we hold about you from the <Link to="/my-account" className="text-primary hover:text-tertiary underline">My Account</Link> page.</li>
        <li><strong className="text-white">Rectification</strong> — correct inaccurate data via your account or by contacting us.</li>
        <li><strong className="text-white">Erasure</strong>, <strong className="text-white">restriction</strong>, <strong className="text-white">portability</strong> and <strong className="text-white">objection</strong> — contact us at {DATA_CONTROLLER.email} to exercise these rights.</li>
        <li><strong className="text-white">Lodge a complaint</strong> with the Romanian supervisory authority (ANSPDCP, dataprotection.ro) if you believe your data has been mishandled.</li>
      </ul>
    </Section>

    <Section title="7. Cookies">
      <p>We currently do not use tracking or advertising cookies. Only strictly necessary session data (your login token) is stored locally in your browser to keep you signed in.</p>
    </Section>

    <Section title="8. Contact">
      <p>Questions about this policy or your data? Email us at <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a>.</p>
    </Section>
  </>
);

const ContentRO: React.FC = () => (
  <>
    <Section title="1. Cine suntem">
      <p>
        {DATA_CONTROLLER.name} ("Untold Festival", "noi"), cu sediul în {DATA_CONTROLLER.address}, este operatorul de
        date responsabil pentru datele cu caracter personal colectate prin această aplicație.
      </p>
      <p>
        Contact: <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a> ({DATA_CONTROLLER.representative}).
      </p>
    </Section>

    <Section title="2. Ce date colectăm">
      <p><strong className="text-white">Date de cont:</strong> nume de utilizator, adresă de email, parolă (stocată criptat).</p>
      <p><strong className="text-white">Date de bilet / participant:</strong> prenume, nume, data nașterii, gen, țară, oraș, tip și număr document de identitate, telefon — colectate la check-in-ul obligatoriu pentru fiecare deținător de bilet.</p>
      <p><strong className="text-white">Date de comandă:</strong> tip bilet, preț, data achiziției. Datele cardului de plată sunt procesate direct de furnizorul nostru de plăți (Stripe) și nu sunt niciodată stocate pe serverele noastre.</p>
    </Section>

    <Section title="3. De ce prelucrăm datele tale și temeiul legal">
      <ul className="list-disc list-inside space-y-1">
        <li>Pentru crearea și gestionarea contului tău, precum și emiterea și onorarea comenzilor de bilete — <em>executarea unui contract</em>.</li>
        <li>Pentru verificarea identității participanților la intrarea în festival, conform reglementărilor aplicabile privind siguranța evenimentelor — <em>obligație legală</em>.</li>
        <li>Pentru procesarea plăților și a reîncărcărilor prin furnizorul nostru de plăți — <em>executarea unui contract</em>.</li>
        <li>Pentru a-ți trimite confirmări de comandă și comunicări esențiale legate de eveniment — <em>interes legitim</em>.</li>
      </ul>
    </Section>

    <Section title="4. Cât timp păstrăm datele">
      <p>
        Datele de cont și de bilet sunt păstrate atât timp cât contul tău este activ, plus orice perioadă suplimentară
        necesară pentru respectarea obligațiilor fiscale/contabile (de regulă până la 10 ani pentru evidențele
        financiare, conform legislației române). Poți solicita ștergerea anticipată acolo unde nu se aplică o
        obligație legală de păstrare.
      </p>
    </Section>

    <Section title="5. Cu cine partajăm datele">
      <p>
        Partajăm datele de plată cu procesatorul nostru de plăți (Stripe), exclusiv pentru finalizarea tranzacțiilor.
        Nu vindem și nu închiriem datele tale personale către terți.
      </p>
    </Section>

    <Section title="6. Drepturile tale">
      <p>Conform GDPR, ai dreptul la:</p>
      <ul className="list-disc list-inside space-y-1">
        <li><strong className="text-white">Acces</strong> — descarcă o copie completă a datelor pe care le deținem despre tine din pagina <Link to="/my-account" className="text-primary hover:text-tertiary underline">Contul Meu</Link>.</li>
        <li><strong className="text-white">Rectificare</strong> — corectează datele inexacte din cont sau contactându-ne.</li>
        <li><strong className="text-white">Ștergere</strong>, <strong className="text-white">restricționare</strong>, <strong className="text-white">portabilitate</strong> și <strong className="text-white">opoziție</strong> — contactează-ne la {DATA_CONTROLLER.email} pentru a exercita aceste drepturi.</li>
        <li><strong className="text-white">Depunerea unei plângeri</strong> la autoritatea de supraveghere din România (ANSPDCP, dataprotection.ro) dacă consideri că datele tale au fost gestionate necorespunzător.</li>
      </ul>
    </Section>

    <Section title="7. Cookie-uri">
      <p>În prezent nu folosim cookie-uri de tracking sau publicitate. Doar datele strict necesare sesiunii (tokenul tău de autentificare) sunt stocate local în browser pentru a te menține autentificat.</p>
    </Section>

    <Section title="8. Contact">
      <p>Ai întrebări despre această politică sau despre datele tale? Scrie-ne la <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a>.</p>
    </Section>
  </>
);

export const PrivacyPolicy: React.FC = () => {
  const { language } = useI18n();

  return (
    <div className="min-h-screen text-on-surface relative overflow-hidden">
      <main className="pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-[900px] mx-auto w-full">
        <header className="mb-xl border-b border-white/5 pb-8">
          <span className="font-label-sm uppercase tracking-widest text-tertiary mb-2 block font-semibold">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white uppercase">
            {language === 'ro' ? 'Politică de Confidențialitate' : 'Privacy Policy'}
          </h1>
        </header>
        {language === 'ro' ? <ContentRO /> : <ContentEN />}
      </main>
    </div>
  );
};
