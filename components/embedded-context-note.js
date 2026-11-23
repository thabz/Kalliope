import Link from 'next/link';
import _ from '../common/translations.js';
import * as Links from './links.js';
import Note from './note.js';

const EmbeddedContextNote = ({ text, workTitle, lang }) => {
  const context = text.parent_context;
  const parts = (context?.parts ?? []).map(part => part.number != null
    ? _(`{number}. ${part.unit}`, lang, { number: part.number })
    : part.title);
  const title = context?.title ?? workTitle;
  const location = parts.length > 0 ? `, ${parts.join(', ')}` : '';
  const punctuation = /[.!?]$/.test(parts.at(-1) ?? title) === true ? ' ' : '. ';
  return <Note type="embedded-context" editorial={true}>
    {_('Fra', lang)} <i>{title}</i>{location}{punctuation}
    <Link href={`${Links.textURL(lang, text.parent_text_id)}#embedded-${text.id}`}>
      {_('Læs i sammenhæng', lang)}
    </Link>
  </Note>;
};

export default EmbeddedContextNote;
