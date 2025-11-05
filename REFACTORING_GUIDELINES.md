under /app : just mimimun code (route.js or page.js) imposed by next.js

under /app: no business related code. A state change requires a command and handle in a domain slice. 

All other files should be under /domain

Each slice should have one responsability, one capability only and all remaining file to provide that capability.

Capability: state change (command and commandHandler), state view (projection), or automation

events should be in "event".ts file like strategyCreated.ts  - code must use these event files.

projections should always provide queries
projections should be either a live projection reading from the event log or be a table updated with new events via INSERT/UPDATE

A projection must provide an API to empty  and a rebuild a projection. The UI elements "Empty" and "Rebuild" buttons will using these API for monitoring. So the /monitoring page will add view to the projection as well as the 2 buttons.

The UI always reads data using a query from a projection. the UI never accesses data directly from the event store or any database (mock or not)

Decoupling is critical.

Projection slice
- A query
- A live projection (reads events from the event store) or a table (Listens to events, pub/sub mecanism or synchronous INSERT/DELETE)
- A empty and rebuild API


Segregration of responsabilities and concerns: projections provide all the logic, mainly a query, empty and rebuild buttons, to customers (the UI). customers should not have to create projections. For instance, monitoring is a consumer and should be aware of end points.

