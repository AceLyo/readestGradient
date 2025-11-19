/**
 * Debugging utility for gradient reading issues
 * Use this in the browser console to inspect EPUB styles
 */

export interface GradientDebugInfo {
  element: HTMLElement;
  tagName: string;
  computedStyles: {
    color: string;
    webkitTextFillColor: string;
    backgroundImage: string;
    backgroundClip: string;
    webkitBackgroundClip: string;
    display: string;
    visibility: string;
    opacity: string;
  };
  inlineStyles: string | null;
  hasText: boolean;
  textContent: string;
}

/**
 * Get all text elements and their computed styles from an EPUB document
 */
export function inspectGradientStyles(doc: Document): GradientDebugInfo[] {
  const results: GradientDebugInfo[] = [];
  
  // Get all elements that could contain text
  const textElements = doc.querySelectorAll(
    'p, span, div, h1, h2, h3, h4, h5, h6, li, dd, dt, blockquote, section, article, a, em, strong, i, b, u'
  );
  
  textElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);
    const hasText = htmlEl.textContent?.trim().length > 0 || false;
    
    // Only include elements that have text or are likely to contain text
    if (hasText || ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dd', 'dt', 'blockquote'].includes(htmlEl.tagName.toLowerCase())) {
      results.push({
        element: htmlEl,
        tagName: htmlEl.tagName.toLowerCase(),
        computedStyles: {
          color: computed.color,
          webkitTextFillColor: computed.webkitTextFillColor || 'not set',
          backgroundImage: computed.backgroundImage,
          backgroundClip: computed.backgroundClip,
          webkitBackgroundClip: computed.webkitBackgroundClip || 'not set',
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
        },
        inlineStyles: htmlEl.getAttribute('style'),
        hasText,
        textContent: htmlEl.textContent?.substring(0, 50) || '',
      });
    }
  });
  
  return results;
}

/**
 * Compare gradient styles between two documents
 */
export function compareGradientStyles(
  workingDoc: Document,
  brokenDoc: Document,
): {
  working: GradientDebugInfo[];
  broken: GradientDebugInfo[];
  differences: Array<{
    tagName: string;
    working: GradientDebugInfo;
    broken: GradientDebugInfo;
    differences: string[];
  }>;
} {
  const working = inspectGradientStyles(workingDoc);
  const broken = inspectGradientStyles(brokenDoc);
  
  const differences: Array<{
    tagName: string;
    working: GradientDebugInfo;
    broken: GradientDebugInfo;
    differences: string[];
  }> = [];
  
  // Find matching elements and compare
  working.forEach((w) => {
    const matching = broken.find(
      (b) => b.tagName === w.tagName && b.textContent.substring(0, 30) === w.textContent.substring(0, 30)
    );
    
    if (matching) {
      const diffs: string[] = [];
      const wStyles = w.computedStyles;
      const bStyles = matching.computedStyles;
      
      if (wStyles.color !== bStyles.color) {
        diffs.push(`color: working="${wStyles.color}" vs broken="${bStyles.color}"`);
      }
      if (wStyles.webkitTextFillColor !== bStyles.webkitTextFillColor) {
        diffs.push(`webkitTextFillColor: working="${wStyles.webkitTextFillColor}" vs broken="${bStyles.webkitTextFillColor}"`);
      }
      if (wStyles.backgroundImage !== bStyles.backgroundImage) {
        diffs.push(`backgroundImage: working="${wStyles.backgroundImage}" vs broken="${bStyles.backgroundImage}"`);
      }
      if (wStyles.backgroundClip !== bStyles.backgroundClip) {
        diffs.push(`backgroundClip: working="${wStyles.backgroundClip}" vs broken="${bStyles.backgroundClip}"`);
      }
      if (wStyles.webkitBackgroundClip !== bStyles.webkitBackgroundClip) {
        diffs.push(`webkitBackgroundClip: working="${wStyles.webkitBackgroundClip}" vs broken="${bStyles.webkitBackgroundClip}"`);
      }
      if (w.inlineStyles !== matching.inlineStyles) {
        diffs.push(`inline styles: working="${w.inlineStyles}" vs broken="${matching.inlineStyles}"`);
      }
      
      if (diffs.length > 0) {
        differences.push({
          tagName: w.tagName,
          working: w,
          broken: matching,
          differences: diffs,
        });
      }
    }
  });
  
  return { working, broken, differences };
}

/**
 * Log gradient debug info to console in a readable format
 */
export function logGradientDebug(doc: Document, label = 'EPUB Document') {
  const info = inspectGradientStyles(doc);
  
  console.group(`🔍 Gradient Debug: ${label}`);
  console.log(`Total text elements found: ${info.length}`);
  
  // Group by tag name
  const byTag = info.reduce((acc, item) => {
    if (!acc[item.tagName]) {
      acc[item.tagName] = [];
    }
    const tagArray = acc[item.tagName];
    if (tagArray) {
      tagArray.push(item);
    }
    return acc;
  }, {} as Record<string, GradientDebugInfo[]>);
  
  Object.entries(byTag).forEach(([tag, items]) => {
    console.group(`📄 ${tag.toUpperCase()} (${items.length} elements)`);
    items.slice(0, 5).forEach((item, idx) => {
      console.group(`Element ${idx + 1}${item.hasText ? ' (has text)' : ' (no text)'}`);
      console.log('Text preview:', item.textContent);
      console.log('Computed styles:', item.computedStyles);
      if (item.inlineStyles) {
        console.warn('⚠️ Has inline styles:', item.inlineStyles);
      }
      console.log('Element:', item.element);
      console.groupEnd();
    });
    if (items.length > 5) {
      console.log(`... and ${items.length - 5} more`);
    }
    console.groupEnd();
  });
  
  // Find problematic elements
  const problematic = info.filter((item) => {
    const styles = item.computedStyles;
    return (
      (styles.color === 'transparent' || styles.webkitTextFillColor === 'transparent') &&
      (!styles.backgroundImage || styles.backgroundImage === 'none')
    );
  });
  
  if (problematic.length > 0) {
    console.warn(`⚠️ Found ${problematic.length} elements with transparent text but no background image:`);
    problematic.slice(0, 10).forEach((item) => {
      console.warn(`- ${item.tagName}: "${item.textContent.substring(0, 30)}"`, item.element);
    });
  }
  
  console.groupEnd();
  
  return info;
}

/**
 * Get the current EPUB document(s) from the reader
 * Use this in the browser console: window.debugGradient.getCurrentDoc()
 * Returns the first document, or use getCurrentDocs() to get all documents
 */
export function getCurrentDoc(): Document | null {
  const docs = getCurrentDocs();
  return docs.length > 0 ? docs[0]! : null;
}

/**
 * Get all current EPUB documents from the reader
 * EPUBs can have multiple pages/iframes, this returns all of them
 */
export function getCurrentDocs(): Document[] {
  const docs: Document[] = [];
  
  // Try to find all foliate-view elements
  const foliateViews = document.querySelectorAll('foliate-view');
  
  foliateViews.forEach((foliateView) => {
    // Access the renderer's contents
    const renderer = (foliateView as any).renderer;
    if (!renderer) return;
    
    const contents = renderer.getContents();
    if (!contents || contents.length === 0) return;
    
    contents.forEach((content: { doc: Document }) => {
      if (content.doc) {
        docs.push(content.doc);
      }
    });
  });
  
  // Also try to get documents from iframes directly
  const iframes = document.querySelectorAll('foliate-view iframe');
  iframes.forEach((iframe) => {
    const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
    if (iframeDoc && !docs.includes(iframeDoc)) {
      docs.push(iframeDoc);
    }
  });
  
  if (docs.length === 0) {
    console.warn('No EPUB documents found. Make sure an EPUB is open.');
  }
  
  return docs;
}

/**
 * Make gradient debugging functions available globally
 * Call this once to enable debugging in the console
 */
export function enableGradientDebugging() {
  (window as any).debugGradient = {
    inspect: inspectGradientStyles,
    compare: compareGradientStyles,
    log: logGradientDebug,
    getCurrentDoc,
    getCurrentDocs,
  };
  
  console.log(`
🔧 Gradient debugging enabled!
  
Available commands:
  - debugGradient.getCurrentDoc() - Get the first EPUB document
  - debugGradient.getCurrentDocs() - Get all EPUB documents (multiple pages)
  - debugGradient.log(doc) - Log gradient debug info for a document
  - debugGradient.inspect(doc) - Get detailed gradient style info
  - debugGradient.compare(workingDoc, brokenDoc) - Compare two documents

Example:
  const doc = debugGradient.getCurrentDoc();
  debugGradient.log(doc);
  
  // Or inspect all documents
  const docs = debugGradient.getCurrentDocs();
  docs.forEach((doc, i) => debugGradient.log(doc, \`Page \${i + 1}\`));
  `);
}

