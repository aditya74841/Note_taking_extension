# Sidepanel Rendering Collapse & Storage API Bug

## Overview
This document details the root cause and resolution for the sidepanel rendering issue in the **URL Notes Extension**, where opening the sidepanel resulted in a 1ms loading spinner flash followed by a completely blank screen ("nothing showing").

---

## 1. Root Cause Breakdown

### Primary Cause: Missing Storage Permission
In `wxt.config.ts`, the extension manifest lacked the `'storage'` permission:
```ts
permissions: ['tabs', 'contextMenus', 'activeTab', 'scripting'] // Missing 'storage'
```
Because `'storage'` was omitted from permissions:
- Chrome's extension runtime did **not** initialize `browser.storage`.
- `browser.storage` evaluated to `undefined` at runtime.

### Secondary Cause: Sidepanel Window Focus Context
When the extension sidepanel is opened, `browser.tabs.query({ active: true, lastFocusedWindow: true })` can evaluate the sidepanel window itself as the last focused window. Because sidepanel frames do not host web pages, `getActiveTabContext()` returned `null` instead of detecting the active web tab in the normal browser window.

---

## 2. Failure Execution Flow

1. **0ms (Mount)**:
   - App mounted with `loading = true`.
   - The loading spinner `<div className="spinner-loader"></div>` rendered on screen.

2. **~1ms (Async Load Resolution)**:
   - Initial async data fetching completed and called `setLoading(false)`.

3. **UI Render Execution**:
   - `loading` switched to `false`. React initiated rendering the main component tree (`<Header />`, `<NavTabs />`, `<NoteEditor />`).

4. **Fatal JavaScript Exception**:
   - Inside `<Header />`, a `useEffect` executed `browser.storage.local.get(...)`.
   - Since `browser.storage` was `undefined`, accessing `.local` threw an uncaught error:
     ```text
     TypeError: Cannot read properties of undefined (reading 'local')
     ```

5. **React 18 Unmounting**:
   - In React 18, an uncaught error during render without a surrounding `<ErrorBoundary>` triggers React's safety unmount mechanism, completely removing `#root` from the DOM and leaving a blank screen.

---

## 3. Implemented Fixes

### 1. Added Storage Permission to Manifest
Updated `wxt.config.ts`:
```ts
permissions: ['tabs', 'contextMenus', 'activeTab', 'scripting', 'storage']
```

### 2. Optional Chaining & Fallbacks
Updated `Header.tsx` to safely check for `browser.storage?.local` before executing storage operations:
```ts
if (!browser.storage?.local) return;
browser.storage.local.get([BADGE_PREF_KEY, LAST_EXPORT_KEY]).then(...).catch(() => {});
```

### 3. React Error Boundary
Created `ErrorBoundary.tsx` and wrapped `<App />` in `main.tsx` so any unexpected runtime errors display a recovery UI instead of collapsing to a blank screen.

### 4. Normal Window Tab Querying
Updated `getActiveTabContext()` in `App.tsx` to explicitly query `{ windowType: 'normal' }`:
```ts
let tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true, windowType: 'normal' });
```

---

## Verification
- Built extension using `npm run build`.
- Compilation completed successfully with 0 errors.
