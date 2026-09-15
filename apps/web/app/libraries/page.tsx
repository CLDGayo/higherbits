import { redirect } from "next/navigation"

export default function LibrariesRedirect() {
  redirect("/?tab=libraries")
}
