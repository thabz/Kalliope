import CommonData from '../common/commondata.js';
import { TextInline } from './textcontent.js';

const TextName = ({ text, renderMarkup = false }) => {
  const { title, title_html, title_prefix } = text;
  let renderedPrefix = null;
  if (title_prefix != null) {
    renderedPrefix = (
      <span style={{ color: CommonData.lightTextColor }}>{title_prefix} </span>
    );
  }
  const renderedTitle =
    renderMarkup === true && title_html != null ?
      <TextInline contentHtml={title_html} />
    : title;
  return (
    <span className="textname">
      {renderedPrefix}
      {renderedTitle}
    </span>
  );
};
export default TextName;

export function textTitleString(text) {
  return text.title;
}

export function textLinkTitleString(text) {
  return text.linktitle;
}
