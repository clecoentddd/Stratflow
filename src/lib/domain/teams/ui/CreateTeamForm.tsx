// DEPRECATED: CreateTeamForm was replaced by the modal `CreateTeamDialog`.
// Keep a lightweight stub to avoid accidental imports. Remove this file after confirming it's no longer used.

export default function DeprecatedCreateTeamForm() {
  // Warn in dev to help find leftover imports.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('DeprecatedCreateTeamForm used: switch to CreateTeamDialog modal instead.');
  }
  return null;
}
