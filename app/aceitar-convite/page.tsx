"use client";

import { useEffect, useState } from "react";
import { browserDb } from "@/lib/supabase";

export default function AcceptInvitation() {
  const [message, setMessage] = useState("Validando seu convite…");
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const access_token = fragment.get("access_token");
    const refresh_token = fragment.get("refresh_token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!access_token || !refresh_token) {
      setMessage("Abra o convite mais recente recebido por e-mail.");
      return;
    }
    browserDb().auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setMessage("O convite expirou. Solicite um novo convite.");
      else window.location.replace("/set-password");
    }).catch(() => setMessage("Não foi possível validar o convite. Abra o link novamente."));
  }, []);
  return <main className="card"><h1>Convite AnimaPro</h1><p role="status">{message}</p><a href="/login">Entrar no CRM</a></main>;
}
