# Gradient Reading Debug Guide

This guide explains how to inspect and debug gradient reading issues in EPUBs.

## Quick Start

1. Open the browser's Developer Console (F12 or Right-click → Inspect → Console)
2. The debugging tools are automatically enabled in development mode
3. Use the commands below to inspect EPUB styles

## Available Commands

### Get the Current EPUB Document

```javascript
const doc = debugGradient.getCurrentDoc();
```

This returns the Document object of the currently displayed EPUB page.

### Log Gradient Debug Information

```javascript
const doc = debugGradient.getCurrentDoc();
debugGradient.log(doc, 'My EPUB');
```

This will log:
- All text elements and their computed styles
- Elements grouped by tag name
- Elements with transparent text but no background image (problematic elements)
- Inline styles that might be interfering

### Inspect Specific Elements

```javascript
const doc = debugGradient.getCurrentDoc();
const info = debugGradient.inspect(doc);

// Find elements with transparent text but no background
const problematic = info.filter(item => {
  const s = item.computedStyles;
  return (s.color === 'transparent' || s.webkitTextFillColor === 'transparent') &&
         (!s.backgroundImage || s.backgroundImage === 'none');
});

console.log('Problematic elements:', problematic);
```

### Compare Working vs Broken EPUBs

1. Open a working EPUB and run:
```javascript
const workingDoc = debugGradient.getCurrentDoc();
```

2. Open the broken EPUB and run:
```javascript
const brokenDoc = debugGradient.getCurrentDoc();
```

3. Compare them:
```javascript
const comparison = debugGradient.compare(workingDoc, brokenDoc);
console.log('Differences:', comparison.differences);
```

## Manual Inspection in Browser DevTools

### Step 1: Find the EPUB Content

1. Open DevTools (F12)
2. Go to the Elements/Inspector tab
3. Look for `<foliate-view>` element
4. Inside it, find `<iframe>` elements - these contain the EPUB content

### Step 2: Inspect the iframe Content

1. Click on an iframe element
2. In the console, run:
```javascript
// Get the iframe
const iframe = document.querySelector('foliate-view iframe');
// Access its document
const doc = iframe.contentDocument;
// Inspect an element
const p = doc.querySelector('p');
console.log(window.getComputedStyle(p));
```

### Step 3: Check Computed Styles

For any text element, check these properties:
- `color` - should be `transparent` when gradient is active
- `-webkit-text-fill-color` - should be `transparent`
- `background-image` - should contain the gradient image URL
- `background-clip` - should be `text`
- `-webkit-background-clip` - should be `text`

### Step 4: Check for Inline Styles

Some EPUBs have inline styles that override our CSS:
```javascript
const doc = debugGradient.getCurrentDoc();
const elementsWithInlineStyles = Array.from(doc.querySelectorAll('[style]'));
elementsWithInlineStyles.forEach(el => {
  const style = el.getAttribute('style');
  if (style.includes('color') || style.includes('background')) {
    console.warn('Element with inline styles:', el, style);
  }
});
```

## Common Issues and Solutions

### Issue: Text is completely invisible

**Possible causes:**
1. Inline styles overriding gradient CSS
2. Background image not loading
3. Elements excluded from gradient selector

**Debug:**
```javascript
const doc = debugGradient.getCurrentDoc();
const info = debugGradient.inspect(doc);
const invisible = info.filter(item => {
  const s = item.computedStyles;
  return s.color === 'transparent' && 
         (!s.backgroundImage || s.backgroundImage === 'none');
});
console.log('Invisible elements:', invisible);
```

### Issue: Gradient not applying to certain elements

**Check:**
- Is the element excluded in our CSS selector?
- Does it have inline styles?
- Is it a non-text element (img, svg, etc.)?

**Debug:**
```javascript
const doc = debugGradient.getCurrentDoc();
const element = doc.querySelector('YOUR_SELECTOR_HERE');
const computed = window.getComputedStyle(element);
console.log('Computed styles:', {
  color: computed.color,
  backgroundImage: computed.backgroundImage,
  backgroundClip: computed.backgroundClip,
  webkitTextFillColor: computed.webkitTextFillColor
});
```

## Exporting Debug Information

To save debug information for analysis:

```javascript
const doc = debugGradient.getCurrentDoc();
const info = debugGradient.inspect(doc);
const json = JSON.stringify(info, (key, value) => {
  // Exclude circular references
  if (key === 'element') return value.tagName;
  return value;
}, 2);
console.log(json);
// Copy the output and save to a file
```

## Tips

1. **Use the console filter**: Type "Gradient Debug" in the console filter to see only debug messages
2. **Inspect multiple pages**: EPUBs can have different styles per page, check multiple pages
3. **Compare with working EPUBs**: Use the compare function to see what's different
4. **Check the Network tab**: Verify that gradient images are loading correctly

## Example Workflow

```javascript
// 1. Get current document
const doc = debugGradient.getCurrentDoc();

// 2. Log all gradient info
debugGradient.log(doc, 'Broken EPUB');

// 3. Find problematic elements
const info = debugGradient.inspect(doc);
const problematic = info.filter(item => {
  const s = item.computedStyles;
  return s.color === 'transparent' && 
         (!s.backgroundImage || s.backgroundImage === 'none');
});

// 4. Inspect a specific problematic element
if (problematic.length > 0) {
  const el = problematic[0].element;
  console.log('Element:', el);
  console.log('Computed styles:', problematic[0].computedStyles);
  console.log('Inline styles:', problematic[0].inlineStyles);
  console.log('Parent:', el.parentElement);
  
  // Check if parent has styles that might affect it
  if (el.parentElement) {
    console.log('Parent styles:', window.getComputedStyle(el.parentElement));
  }
}
```

