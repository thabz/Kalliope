// @flow
import React from 'react';
import type { Work, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';

type WorkSubtitlesProps = {
  work: Work,
  lang: Lang,
};
export default class WorkSubtitles extends React.Component<WorkSubtitlesProps> {
  render() {
    const { work, lang } = this.props;
    const { year } = work;
    if (work.subtitles != null && work.subtitles.length > 0) {
      return work.subtitles.map((subtitle, i) => {
        return (
          <div
            key={'subtitle' + i}
            style={{ fontSize: '0.8em', marginTop: '1em' }}>
            <TextContent contentHtml={subtitle} lang={lang} />
          </div>
        );
      });
    } else {
      return null;
    }
  }
}
