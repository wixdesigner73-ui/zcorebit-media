import { useEffect, useState, type FormEvent } from 'react';
import { contact, services } from '../../data/content';
import { BRIEF_EVENT } from '../Services/Services';

const ENDPOINT = (import.meta.env.VITE_FORM_ENDPOINT as string | undefined)?.trim();

type Fields = { name: string; email: string; phone: string; service: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = { kind: 'idle' | 'sending' | 'sent' | 'mail' | 'error'; text?: string };

const EMPTY: Fields = { name: '', email: '', phone: '', service: '', message: '' };

function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (f.name.trim().length < 2) errors.name = 'Please tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = 'Please enter a valid email address.';
  if (f.phone && !/^[+\d][\d\s()-]{6,}$/.test(f.phone.trim())) errors.phone = 'That phone number looks incomplete.';
  if (f.message.trim().length < 10) errors.message = 'A sentence or two about the project helps us reply properly.';
  return errors;
}

function composeBody(f: Fields) {
  return [
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    f.phone && `Phone: ${f.phone}`,
    f.service && `Service: ${f.service}`,
    '',
    f.message,
  ].filter((line) => typeof line === 'string').join('\n');
}

/**
 * Sends to VITE_FORM_ENDPOINT (e.g. Formspree) when configured. Without a
 * backend it opens a pre-filled email to the studio and offers WhatsApp.
 */
export function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    const onBrief = (e: Event) => setFields((f) => ({ ...f, service: (e as CustomEvent<string>).detail }));
    window.addEventListener(BRIEF_EVENT, onBrief);
    return () => window.removeEventListener(BRIEF_EVENT, onBrief);
  }, []);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    if (ENDPOINT) {
      setStatus({ kind: 'sending' });
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...fields, _subject: `New project enquiry — ${fields.name}` }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus({ kind: 'sent', text: 'Thank you — your message is on its way. We typically respond within an hour.' });
        setFields(EMPTY);
      } catch {
        setStatus({ kind: 'error', text: `Something went wrong sending the form. Please email ${contact.email} or WhatsApp us instead.` });
      }
      return;
    }
    const subject = encodeURIComponent(`Project enquiry — ${fields.name}${fields.service ? ` (${fields.service})` : ''}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${encodeURIComponent(composeBody(fields))}`;
    setStatus({ kind: 'mail', text: 'Your email app should open with the message ready to send. Prefer WhatsApp?' });
  };

  const whatsappHref = `${contact.whatsapp}?text=${encodeURIComponent(composeBody(fields))}`;

  return (
    <form className="cform" noValidate onSubmit={submit} aria-describedby="cform-status">
      <div className="cform__row">
        <Field id="name" label="Your name" error={errors.name}>
          <input id="name" name="name" autoComplete="name" value={fields.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} required />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" value={fields.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} required />
        </Field>
      </div>
      <div className="cform__row">
        <Field id="phone" label="Phone (optional)" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" value={fields.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
        </Field>
        <Field id="service" label="Service">
          <select id="service" name="service" value={fields.service} onChange={set('service')}>
            <option value="">Not sure yet</option>
            {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
          </select>
        </Field>
      </div>
      <Field id="message" label="Tell us about the project" error={errors.message}>
        <textarea id="message" name="message" rows={4} value={fields.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} required />
      </Field>

      <div className="cform__actions">
        <button type="submit" className="glass-btn glass-btn--brand cform__submit" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Send message →'}
        </button>
        <p id="cform-status" className={`cform__status cform__status--${status.kind}`} role="status" aria-live="polite">
          {status.text}
          {status.kind === 'mail' && <> <a href={whatsappHref} target="_blank" rel="noopener noreferrer">Send it on WhatsApp ↗</a></>}
        </p>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`cform__field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="mono">{label}</label>
      {children}
      {error && <span id={`${id}-error`} className="cform__error">{error}</span>}
    </div>
  );
}
