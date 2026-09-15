import { redirect } from "next/navigation"

export default function CommunityLibrariesRedirect() {
  redirect("/?tab=libraries")
}
