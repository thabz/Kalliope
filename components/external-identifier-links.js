import { buildExternalIdentifierLinks } from '../common/external-identifiers.js';
import _ from '../common/translations.js';
import TwoColumns from './twocolumns.js';

const ExternalIdentifierLinks = ({
  identifiers,
  lang,
  category,
  variant = 'sidebar',
}) => {
  const links = buildExternalIdentifierLinks(identifiers, { category });
  if (links.length === 0) {
    return null;
  }

  const heading =
    category === 'authority'
      ? _('Identifikatorer', lang)
      : _('Eksterne ressourcer', lang);

  if (variant === 'references') {
    const items = links.map((link) => (
      <div
        key={link.id}
        style={{
          marginBottom: '10px',
          breakInside: 'avoid',
          fontSize: '18px',
          lineHeight: '25px',
        }}>
        <a href={link.href}>{link.label}</a>
      </div>
    ));
    return (
      <section className="external-identifiers references" aria-label={heading}>
        <h3>{heading}</h3>
        <TwoColumns>{items}</TwoColumns>
        <style jsx>{`
          .references {
            margin-bottom: 40px;
          }
          h3 {
            margin-bottom: 20px;
            padding-bottom: 1px;
            border-bottom: 1px solid #888;
            font-size: 22px;
            font-weight: 300;
            line-height: 1.6;
          }
        `}</style>
      </section>
    );
  }

  return (
    <section
      className="external-identifiers"
      aria-label={heading}>
      <div className="heading">{heading}</div>
      <div className="links">
        {links.map((link) => (
          <a key={link.id} href={link.href} title={link.label}>
            <span className={`icon icon-${link.id}`} aria-hidden="true">
              {link.shortLabel}
            </span>
            <span className="visually-hidden">{link.label}</span>
          </a>
        ))}
      </div>
      <style jsx>{`
        .external-identifiers {
          margin-top: 28px;
        }
        .heading {
          margin-bottom: 8px;
          color: #666;
          font-size: 0.8em;
          font-weight: bold;
        }
        .links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        a {
          color: #111;
          text-decoration: none;
        }
        .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 34px;
          height: 34px;
          border: 1px solid #111;
          border-radius: 50%;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: -0.3px;
          line-height: 1;
          transition:
            color 120ms ease,
            background-color 120ms ease;
        }
        .icon-viaf {
          font-size: 8px;
          letter-spacing: -0.5px;
        }
        .icon-lex-dk {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 12px;
          font-weight: normal;
        }
        a:hover .icon,
        a:focus-visible .icon {
          color: white;
          background: #111;
        }
        a:focus-visible {
          border-radius: 50%;
          outline: 2px solid #111;
          outline-offset: 2px;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </section>
  );
};

export default ExternalIdentifierLinks;
