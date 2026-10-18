import { redirect } from "next/navigation";

export default function ApiRedirectPage() {
  redirect("/api-docs");
}
