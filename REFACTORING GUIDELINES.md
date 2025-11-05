under /app : just mimimun code (route.js or page.js) imposed by next.js

All other files should be under /domain
under /domain, each slice should have one responsability, one capability only and all remaining file to provide that capability.

Capability: state change, state view (projection), or automation

projections should always provide queries
projections should be either a live projection reading from the event log or be a table updated with new events via INSERT/UPDATE

A projection must have an empty button and a rebuild button and be available for an administrator under /monitoring

The UI always reads data using a query from a projection. the UI never accesses data directly from the event store or any database (mock or not)

Decoupling is critical.

Projection slice
- A query
- A live projection (reads events from the event store) or a table (Listens to events, pub/sub mecanism or synchronous INSERT/DELETE)
- the UI to show the results

Segregration of responsabilities and concerns: projections provide all the logic, mainly a query, empty and rebuild buttons, to customers (the UI). customers should not have to create projections. For instance, monitoring is a consumer and should be aware of end points.

