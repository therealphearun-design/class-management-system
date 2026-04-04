## Garbage Feature

This folder stores frontend code that is not connected to the active application anymore.

Confirmed inactive items:

- `frontend/src/CalendarPage.jsx`
  Former unified calendar page removed from the live app.
- `frontend/src/MessagesPage.jsx`
  Former admin communication page removed from the live app.
- `frontend/src/DeveloperToolsPage.jsx`
  Former internal admin-center utility page removed from the live app.
- `frontend/src/App.css`
  Legacy stylesheet that is not imported by the current app.
- `frontend/src/hooks/useDebounce.js`
  Old helper hook not referenced by the active frontend.
- `frontend/src/hooks/useInfiniteScroll.js`
  Old helper hook not referenced by the active frontend.
- `frontend/src/hooks/useLocalStorage.js`
  Old helper hook not referenced by the active frontend.
- `frontend/src/i18n/index.js`
  Old i18n setup that is not initialized by the current app.

Active app status:

- No disconnected files were found in the current `frontend/src` tree.
- Live pages, hooks, data files, contexts, and shared components are still wired into the app.

Rule for future cleanup:

- If we remove a feature from the live app, move its files here only after confirming they are no longer imported anywhere in `frontend/src`.
