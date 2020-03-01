// @flow

import { useEffect, useState } from 'react';

// Bruges således:
//
// const mobile = useMediaQuery('(max-width: 480px)');
//
// mobile er derefter true, hvis skærmen er under 480px bred.
//
const useMediaQuery = (query: string) => {
  if (typeof window !== 'undefined') {
    const mediaMatch = window.matchMedia(query);
    const [matches, setMatches] = useState(mediaMatch.matches);

    useEffect(() => {
      const handler = e => setMatches(e.matches);
      mediaMatch.addListener(handler);
      return () => mediaMatch.removeListener(handler);
    });
    return matches;
  } else {
    return () => {
      return false;
    };
  }
};

export default useMediaQuery;
