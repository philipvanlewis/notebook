import { redirect } from "next/navigation";

export default function AppIndexPage() {
  // Redirect to notes by default
  redirect("/notes");
}
