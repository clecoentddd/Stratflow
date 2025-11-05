under /app : just mimimun code (route.js or page.js) imposed by next.js

All other files should be under /domain
under /domain, each slice should have one responsability, one capability only and all remaining file to provide that capability.

Capability: state change, state view (projection), or automation

projections should always provide queries
projections should be either a live projection reading from the event log or be a table updated with new events via INSERT/UPDATE

A projection must have an empty button and a rebuild button and be available for an administrator under /monitoring

