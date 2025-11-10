import type { Transformer } from './types';
import { footnoteTransformer } from './footnote';
import { languageTransformer } from './language';
import { punctuationTransformer } from './punctuation';
import { whitespaceTransformer } from './whitespace';
import { gradientTransformer } from './gradient';
import { sanitizerTransformer } from './sanitizer';

export const availableTransformers: Transformer[] = [
  punctuationTransformer,
  footnoteTransformer,
  languageTransformer,
  whitespaceTransformer,
  gradientTransformer,
  sanitizerTransformer,
  // Add more transformers here
];
