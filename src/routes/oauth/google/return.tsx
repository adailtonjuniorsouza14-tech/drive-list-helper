import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CONNECTOR_ID = "google_drive";

export const Route = createFileRoute("/oauth/google/return")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Conectando Google Drive | Check List Satus" },
      { name: "description", content: "Finalizando a conexão da sua conta Google Drive." },
      { property: "og:title", content: "Conectando Google Drive" },
      { property: "og:description", content: "Finalizando a conexão da sua conta Google Drive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finalizando conexão…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: CONNECTOR_ID, code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "A autorização não foi concluída.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("A autorização terminou sem código de troca.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
