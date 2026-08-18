import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Plus, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PhotoField } from "@/components/checklist/PhotoField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { sections, type Field } from "@/lib/checklist-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check List de Carregamento | Controle de Expedição" },
      {
        name: "description",
        content:
          "Check list digital de carregamento: inspeção do veículo, conformidades, fotos e registro do responsável.",
      },
      { property: "og:title", content: "Check List de Carregamento" },
      {
        property: "og:description",
        content: "Inspeção de veículo, conformidades e fotos do carregamento em um só formulário.",
      },
    ],
  }),
  component: Index,
});

type Value = string | File | null;

function Index() {
  const [values, setValues] = useState<Record<string, Value>>({});
  const [extraPhotos, setExtraPhotos] = useState<(File | null)[]>([null, null]);
  const [started] = useState(() => new Date());

  const set = (id: string, v: Value) => setValues((prev) => ({ ...prev, [id]: v }));

  const inspecao = sections.find((s) => s.id === "inspecao")!;
  const respondidos = inspecao.fields.filter((f) => values[f.id]).length;
  const aprovado = useMemo(
    () => respondidos === inspecao.fields.length && !values["derrame"]?.toString().includes("NÃO"),
    [respondidos, values, inspecao.fields.length],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (respondidos < inspecao.fields.length) {
      toast.error("Responda todos os itens da inspeção antes de finalizar.");
      return;
    }
    toast.success("Check list finalizado", {
      description: `Início ${started.toLocaleString("pt-BR")} · Término ${new Date().toLocaleString("pt-BR")}`,
    });
  };

  return (
    <main className="min-h-screen pb-28">
      <Toaster />
      <header className="bg-primary px-4 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="rounded-lg bg-accent p-2 text-accent-foreground">
            <Truck className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold uppercase">Check list de carregamento</h1>
            <p className="text-sm opacity-80">
              Início {started.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {sections.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-panel)]"
          >
            <h2 className="text-base font-bold uppercase text-foreground">{section.title}</h2>
            {section.description && (
              <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
            )}
            <div
              className={
                section.id === "inspecao"
                  ? "mt-4 space-y-3"
                  : "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
              }
            >
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? null}
                  onChange={(v) => set(field.id, v)}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-panel)]">
          <h2 className="text-base font-bold uppercase">Fotos do carregamento</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registre quantas fotos forem necessárias durante o carregamento.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {extraPhotos.map((photo, i) => (
              <PhotoField
                key={i}
                label={`Foto ${i + 1}`}
                value={photo}
                onChange={(file) =>
                  setExtraPhotos((prev) => prev.map((p, idx) => (idx === i ? file : p)))
                }
              />
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => setExtraPhotos((prev) => [...prev, null])}
          >
            <Plus className="size-4" /> Adicionar foto
          </Button>
        </section>

        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            aprovado
              ? "border-success/40 bg-success/10 text-success"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <CheckCircle2 className="size-6 shrink-0" />
          <div>
            <p className="font-semibold">
              {aprovado ? "Aprovado para carregamento" : "Aguardando inspeção completa"}
            </p>
            <p className="text-xs">
              {respondidos} de {inspecao.fields.length} itens de inspeção respondidos
            </p>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setValues({})}>
            Limpar
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            <ClipboardCheck className="size-4" /> Finalizar check list
          </Button>
        </div>
      </div>
    </main>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: Value;
  onChange: (v: Value) => void;
}) {
  if (field.type === "photo") {
    return (
      <PhotoField
        label={field.label}
        value={value instanceof File ? value : null}
        onChange={(f) => onChange(f)}
      />
    );
  }

  if (field.type === "conformity") {
    const current = typeof value === "string" ? value : "";
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <span className="text-sm leading-snug">{field.label}</span>
        <div className="flex shrink-0 gap-2">
          {["SIM", "NÃO", "N/A"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(current === opt ? "" : opt)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                current === opt
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-accent"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const strValue = typeof value === "string" ? value : "";

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {field.label}
      </Label>
      {field.type === "textarea" ? (
        <Textarea id={field.id} value={strValue} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Selecione…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={field.id}
          type={field.type === "number" ? "number" : "text"}
          placeholder={field.placeholder}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
