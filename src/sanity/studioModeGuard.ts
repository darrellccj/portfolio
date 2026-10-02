// Shared limits for the Studio Mode write endpoints (api/studio/*). Those
// routes act with the server's Editor token, so what they will touch is
// narrowed here rather than left to whatever the caller sends.

/** Only the roles Studio Mode may be switched on for. Admin only. */
export const ALLOWED_ROLES = ['administrator'];

/** The document types authored on the site. System documents are never writable. */
export const EDITABLE_TYPES = ['profile', 'project', 'entry', 'ditherStudy'];

/** Fields starting with `_` (_id, _type, _rev…) are document internals. */
export const isWritablePath = (path: string) => !path.split('.').some((s) => s.startsWith('_'));
