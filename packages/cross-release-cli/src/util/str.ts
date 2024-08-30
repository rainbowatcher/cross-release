/**
 * Accepts a message string template (e.g. "release %s" or "This is the %s release").
 * If the template contains any "%s" placeholders, then they are replaced with the version number;
 * otherwise, the version number is appended to the string.
 */
export function formatMessageString(template: string, nextVersion: string): string {
    return template?.includes("%s") ? template.replaceAll("%s", nextVersion) : template + nextVersion
}
