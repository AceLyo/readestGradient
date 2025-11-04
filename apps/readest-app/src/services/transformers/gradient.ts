import type { Transformer } from './types';

// Gradient reading transformer inspired by WaspLine Reader – applies a color gradient to paragraphs
// Only run when gradientEnabled is true in the current ViewSettings
export const gradientTransformer: Transformer = {
  name: 'gradient',

  async transform(ctx) {
    // Early-exit if the feature is disabled to avoid unnecessary work
    if (!ctx.viewSettings.gradientEnabled) return ctx.content;

    let paragraphIndex = 0;

    // Add gradient classes (g-line g-l0..g-l3) to successive <p> elements
    const result = ctx.content.replace(
      /<p([^>]*)>([\s\S]*?)<\/p>/gi,
      (_, attrs: string, inner: string) => {
        const classRegex = /class="([^"]*)"/i;
        const gradientClass = `g-line g-l${paragraphIndex % 4}`;
        paragraphIndex += 1;

        if (classRegex.test(attrs)) {
          // paragraph already has class attribute – append our classes
          attrs = attrs.replace(classRegex, (_match: string, classes: string) => `class="${classes} ${gradientClass}"`);
        } else {
          // no class attribute – inject one
          attrs = `${attrs} class="${gradientClass}"`;
        }

        return `<p${attrs}>${inner}</p>`;
      },
    );

    return result;
  },
};
