"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const fragment = window.location.hash;
    const params = new URLSearchParams(fragment.slice(1));
    if (params.get("type") === "invite" || params.get("type") === "recovery") {
      window.location.replace("/aceitar-convite" + fragment);
    } else {
      window.location.replace("/dashboard");
    }
  }, []);
  return <main><p>Abrindo AnimaPro CRM…</p><a href="/login">Entrar</a></main>;
}
