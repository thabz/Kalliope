import { useContext } from 'react';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import Tooltip from './tooltip.js';

const EditorialNoteLabel = () => {
  const lang = useContext(LangContext);
  const explanation = _('Kalliopes redaktionelle note', lang);
  return (
    <span className="editorial-note-label">
      <Tooltip text={explanation} ariaLabel={explanation} focusable>
        Kalliope
      </Tooltip>
      <style jsx>{`
        .editorial-note-label {
          display: inline-block;
          color: #666;
          border: 1px solid #bbb;
          border-radius: 0.3em;
          padding: 0.05em 0.35em;
          margin-right: 0.5em;
          font-size: 0.75em;
          line-height: 1.3;
          font-style: normal;
          font-weight: normal;
          white-space: nowrap;
          vertical-align: 0.05em;
        }
        @media print {
          .editorial-note-label {
            color: black;
          }
        }
      `}</style>
    </span>
  );
};

export default EditorialNoteLabel;
