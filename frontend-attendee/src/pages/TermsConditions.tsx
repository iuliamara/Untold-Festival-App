import React from 'react';
import { useI18n } from '../context/I18nContext';

const DATA_CONTROLLER = {
  name: 'Untold Festival SRL',
  address: 'Cluj-Napoca, România',
  email: 'contact@untoldfestival.ro',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-3">{title}</h2>
    <div className="text-sm text-white/70 leading-relaxed space-y-3">{children}</div>
  </section>
);

const ContentEN: React.FC = () => (
  <>
    <Section title="1. Acceptance of terms">
      <p>
        By creating an account or purchasing a ticket through this application, you agree to be bound by these
        Terms & Conditions and by our <a href="/privacy-policy" className="text-primary hover:text-tertiary underline">Privacy Policy</a>.
      </p>
    </Section>

    <Section title="2. The service">
      <p>
        {DATA_CONTROLLER.name} operates this application to sell tickets, manage cashless wristband top-ups, and
        provide festival information for Untold Festival.
      </p>
    </Section>

    <Section title="3. Tickets and check-in">
      <ul className="list-disc list-inside space-y-1">
        <li>Tickets are personal and non-transferable once check-in has been completed for a given attendee.</li>
        <li>You must provide accurate identification details during check-in; entry may be refused if the details do not match a valid identity document.</li>
        <li>Tickets are generally non-refundable, except where required by applicable consumer protection law.</li>
      </ul>
    </Section>

    <Section title="4. Your account">
      <p>
        You are responsible for keeping your login credentials confidential and for all activity that occurs under
        your account.
      </p>
    </Section>

    <Section title="5. Limitation of liability">
      <p>
        To the extent permitted by law, {DATA_CONTROLLER.name} is not liable for indirect or consequential losses
        arising from the use of this application, including event cancellations or changes beyond our control.
      </p>
    </Section>

    <Section title="6. Governing law">
      <p>These Terms are governed by the laws of Romania. Any disputes shall be subject to the jurisdiction of the Romanian courts.</p>
    </Section>

    <Section title="7. Contact">
      <p>Questions about these Terms? Email us at <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a>.</p>
    </Section>
  </>
);

const ContentRO: React.FC = () => (
  <>
    <Section title="1. Acceptarea termenilor">
      <p>
        Prin crearea unui cont sau achiziționarea unui bilet prin această aplicație, ești de acord să respecți acești
        Termeni & Condiții, precum și <a href="/privacy-policy" className="text-primary hover:text-tertiary underline">Politica noastră de Confidențialitate</a>.
      </p>
    </Section>

    <Section title="2. Serviciul">
      <p>
        {DATA_CONTROLLER.name} operează această aplicație pentru vânzarea biletelor, gestionarea reîncărcărilor
        brățării cashless și furnizarea de informații despre Untold Festival.
      </p>
    </Section>

    <Section title="3. Bilete și check-in">
      <ul className="list-disc list-inside space-y-1">
        <li>Biletele sunt personale și netransferabile odată ce check-in-ul a fost finalizat pentru un anumit participant.</li>
        <li>Trebuie să furnizezi date de identificare corecte la check-in; accesul poate fi refuzat dacă datele nu corespund unui document de identitate valid.</li>
        <li>Biletele sunt, în general, nerambursabile, cu excepția cazurilor prevăzute de legislația privind protecția consumatorilor.</li>
      </ul>
    </Section>

    <Section title="4. Contul tău">
      <p>
        Ești responsabil pentru păstrarea confidențialității datelor de autentificare și pentru toate activitățile
        desfășurate prin contul tău.
      </p>
    </Section>

    <Section title="5. Limitarea răspunderii">
      <p>
        În limitele permise de lege, {DATA_CONTROLLER.name} nu răspunde pentru pierderi indirecte sau subsecvente
        rezultate din utilizarea acestei aplicații, inclusiv anulări sau modificări ale evenimentului independente de
        voința noastră.
      </p>
    </Section>

    <Section title="6. Legea aplicabilă">
      <p>Acești Termeni sunt guvernați de legislația din România. Orice litigiu va fi soluționat de instanțele române competente.</p>
    </Section>

    <Section title="7. Contact">
      <p>Ai întrebări despre acești Termeni? Scrie-ne la <a href={`mailto:${DATA_CONTROLLER.email}`} className="text-primary hover:text-tertiary underline">{DATA_CONTROLLER.email}</a>.</p>
    </Section>
  </>
);

export const TermsConditions: React.FC = () => {
  const { language } = useI18n();

  return (
    <div className="min-h-screen text-on-surface relative overflow-hidden">
      <main className="pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-[900px] mx-auto w-full">
        <header className="mb-xl border-b border-white/5 pb-8">
          <span className="font-label-sm uppercase tracking-widest text-tertiary mb-2 block font-semibold">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white uppercase">
            {language === 'ro' ? 'Termeni & Condiții' : 'Terms & Conditions'}
          </h1>
        </header>
        {language === 'ro' ? <ContentRO /> : <ContentEN />}
      </main>
    </div>
  );
};
