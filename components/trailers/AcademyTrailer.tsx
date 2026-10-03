'use client';

import { PlaceholderTrailer } from './PlaceholderTrailer';
import type { TrailerComponentProps } from './VerticalTrailer';

/** TEMPORARY (v2): replaced by the real trailer. */
export default function AcademyTrailer(props: TrailerComponentProps) {
  return <PlaceholderTrailer {...props} id="academy" />;
}
