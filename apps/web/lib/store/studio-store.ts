import { atom } from "jotai"

/**
 * Controls the Partner Program modal.
 *
 * This lived in `app/studio/[username]/analytics/page.client.tsx` and was imported
 * by three components, which meant the studio chrome depended on a route file. Moved
 * here so the sidebar and header can drop their Analytics entry without breaking.
 */
export const partnerModalOpenAtom = atom(false)
