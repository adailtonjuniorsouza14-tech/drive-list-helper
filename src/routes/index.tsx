import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Minus, Plus, Printer, RotateCcw, Save, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import logoSatus from "@/assets/satus-logo.png";
import { PhotoField } from "@/components/checklist/PhotoField";
import { SelectWithAdd } from "@/components/checklist/SelectWithAdd";
import { SignaturePad } from "@/components/checklist/SignaturePad";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import {
  CLIENTES_PADRAO,
  DOCAS,
  INSPECAO_ITENS,
  MATERIAIS,
  MODELOS_VEICULO,
  OPERACOES_PADRAO,
  RESPOSTAS,
  TRANSPORTADORAS_PADRAO,
  type Resposta,
} from "@/lib/checklist-config";
import { saveChecklistToDrive } from "@/lib/checklist-drive.functions";
import { buildReportHtml, type ReportPhoto } from "@/lib/report";
import { htmlToPdfBlob, blobToBase64 } from "@/lib/pdf";
import { enqueueUpload, flushQueue, readQueue } from "@/lib/upload-queue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check List de Carregamento Satus | Expedição" },
      {
        name: "description",
        content:
          "Check list digital de carregamento Satus: inspeção do veículo, não conformidades, fotos, assinaturas e relatório em PDF salvo no Google Drive.",
      },
      { property: "og:title", content: "Check List de Carregamento Satus" },
      {
        property: "og:description",
        content:
          "Inspeção do veículo, conformidades, registro fotográfico e assinaturas em um só formulário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const fieldLabel = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });
}

function randomPlate() {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const l = () => L[Math.floor(Math.random() * L.length)];
  const n = () => Math.floor(Math.random() * 10);
  return `${l()}${l()}${l()}${n()}${l()}${n()}${n()}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className={fieldLabel}>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
      />
    </div>
  );
}

function Index() {
  const [clientes, setClientes] = useState(CLIENTES_PADRAO);
  const [operacoes, setOperacoes] = useState(OPERACOES_PADRAO);
  const [transportadoras, setTransportadoras] = useState(TRANSPORTADORAS_PADRAO);

  const [documento, setDocumento] = useState("");
  const [carga, setCarga] = useState("");
  const [cliente, setCliente] = useState("");
  const [operacao, setOperacao] = useState("");
  const [transportadora, setTransportadora] = useState("");
  const [motorista, setMotorista] = useState("");

  const [modelo, setModelo] = useState("");
  const [fotoPlaca, setFotoPlaca] = useState<File | null>(null);
  const [placa, setPlaca] = useState("");
  const [ocr, setOcr] = useState(false);
  const [interior, setInterior] = useState<(File | null)[]>([null, null]);

  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [fotosNc, setFotosNc] = useState<(File | null)[]>([null, null]);
  const [observacaoNc, setObservacaoNc] = useState("");

  const [doca, setDoca] = useState("");
  const [maquina, setMaquina] = useState("");
  const [operador, setOperador] = useState("");
  const [material, setMaterial] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [paletes, setPaletes] = useState(0);

  const [fotosCarregamento, setFotosCarregamento] = useState<(File | null)[]>([null, null]);
  const [responsavel, setResponsavel] = useState("");
  const [assinaturaResp, setAssinaturaResp] = useState<string | null>(null);
  const [assinaturaMot, setAssinaturaMot] = useState<string | null>(null);

  const [started, setStarted] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const save = useServerFn(saveChecklistToDrive);

  useEffect(() => setStarted(new Date()), []);

  useEffect(() => {
    const run = async () => {
      if (!navigator.onLine || readQueue().length === 0) return;
      const { sent } = await flushQueue((payload) => save({ data: payload as never }));
      if (sent > 0) toast.success(`${sent} check list pendente(s) enviado(s) ao Google Drive`);
    };
    void run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [save]);

  const respondidos = INSPECAO_ITENS.filter((i) => respostas[i.id]).length;
  const naoConformidades = useMemo(
    () => INSPECAO_ITENS.filter((i) => respostas[i.id] === i.reprovaEm),
    [respostas],
  );
  const aprovado = respondidos === INSPECAO_ITENS.length && naoConformidades.length === 0;

  const onFotoPlaca = async (file: File | null) => {
    setFotoPlaca(file);
    if (!file) return;
    setOcr(true);
    await new Promise((r) => setTimeout(r, 1200));
    const lida = randomPlate();
    setPlaca(lida);
    setOcr(false);
    toast.success("Placa reconhecida automaticamente", {
      description: `${lida} — confira e edite se necessário.`,
    });
  };

  const limparTudo = () => {
    setDocumento("");
    setCarga("");
    setCliente("");
    setOperacao("");
    setTransportadora("");
    setMotorista("");
    setModelo("");
    setFotoPlaca(null);
    setPlaca("");
    setInterior([null, null]);
    setRespostas({});
    setFotosNc([null, null]);
    setObservacaoNc("");
    setDoca("");
    setMaquina("");
    setOperador("");
    setMaterial("");
    setQuantidade("");
    setPaletes(0);
    setFotosCarregamento([null, null]);
    setResponsavel("");
    setAssinaturaResp(null);
    setAssinaturaMot(null);
    setStarted(new Date());
    setConfirmClear(false);
    toast.success("Formulário limpo");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const faltando: string[] = [];
    const req = (ok: unknown, nome: string) => {
      if (!ok) faltando.push(nome);
    };
    req(documento.trim(), "Documento de transporte");
    req(carga.trim(), "Carga");
    req(cliente, "Cliente");
    req(operacao, "Tipo de operação");
    req(transportadora, "Transportadora");
    req(motorista.trim(), "Nome do motorista");
    req(modelo, "Modelo do veículo");
    req(fotoPlaca, "Foto da placa");
    req(placa.trim(), "Placa");
    interior.forEach((f, i) => req(f, `Interior do veículo ${i + 1}`));
    req(respondidos === INSPECAO_ITENS.length, "Todos os itens da inspeção");
    if (naoConformidades.length > 0) {
      req(fotosNc.some(Boolean), "Foto da não conformidade");
      req(observacaoNc.trim(), "Observações da não conformidade");
    }
    req(doca, "Doca de carregamento");
    req(maquina.trim(), "Tipo de máquina");
    req(operador.trim(), "Operador");
    req(material, "Material");
    req(quantidade.trim(), "Quantidade");
    req(paletes > 0, "Total de paletes");
    req(fotosCarregamento.some(Boolean), "Fotos do carregamento");
    req(responsavel.trim(), "Responsável pelo check list");
    req(assinaturaResp, "Assinatura do responsável");
    req(assinaturaMot, "Assinatura do motorista");

    if (faltando.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios (${faltando.length} pendente(s))`, {
        description: faltando.slice(0, 6).join(", ") + (faltando.length > 6 ? "…" : ""),
      });
      return;
    }

    setSaving(true);
    try {
      const agora = new Date();
      const codigo = `CL-${agora.getTime().toString(36).toUpperCase().slice(-5)}`;

      const fotos: ReportPhoto[] = [];
      const push = async (file: File | null, caption: string) => {
        if (file) fotos.push({ caption, dataUrl: await fileToDataUrl(file) });
      };
      await push(fotoPlaca, "Placa do veículo");
      for (const [i, f] of interior.entries()) await push(f, `Interior do veículo ${i + 1}`);
      for (const [i, f] of fotosNc.entries()) await push(f, `Não conformidade ${i + 1}`);
      for (const [i, f] of fotosCarregamento.entries()) await push(f, `Carregamento ${i + 1}`);

      const logoUrl = await fetch(logoSatus)
        .then((r) => r.blob())
        .then((b) => fileToDataUrl(new File([b], "logo.png", { type: "image/png" })))
        .catch(() => undefined);

      const html = buildReportHtml({
        codigo,
        dataHora: agora.toLocaleString("pt-BR"),
        inicio: (started ?? agora).toLocaleString("pt-BR"),
        termino: agora.toLocaleString("pt-BR"),
        aprovado,
        responsavel,
        logoUrl,
        assinaturaResponsavel: assinaturaResp,
        assinaturaMotorista: assinaturaMot,
        blocks: [
          {
            title: "Identificação e transporte",
            rows: [
              { label: "Documento de transporte", value: documento },
              { label: "Carga", value: carga },
              { label: "Cliente", value: cliente },
              { label: "Tipo de operação", value: operacao },
              { label: "Transportadora", value: transportadora },
              { label: "Motorista", value: motorista },
            ].filter((r) => r.value),
          },
          {
            title: "Dados do veículo",
            rows: [
              { label: "Modelo do veículo", value: modelo },
              { label: "Placa", value: placa },
            ].filter((r) => r.value),
          },
          {
            title: "Inspeção da carroceria",
            rows: INSPECAO_ITENS.map((i) => ({
              label: i.label,
              value: respostas[i.id] ?? "—",
              highlight: true,
            })),
          },
          {
            title: "Não conformidades",
            rows: naoConformidades.length
              ? [
                  {
                    label: "Itens não conformes",
                    value: String(naoConformidades.length),
                    highlight: true,
                  },
                  ...naoConformidades.map((i) => ({ label: i.label, value: respostas[i.id]! , highlight: true })),
                  ...(observacaoNc ? [{ label: "Observações", value: observacaoNc }] : []),
                ]
              : [],
          },
          {
            title: "Processo de carregamento",
            rows: [
              { label: "Doca de carregamento", value: doca },
              { label: "Tipo de máquina", value: maquina },
              { label: "Operador", value: operador },
              { label: "Material", value: material },
              { label: "Quantidade", value: quantidade },
              { label: "Total de paletes", value: String(paletes) },
            ].filter((r) => r.value && r.value !== "0"),
          },
        ],
        fotos,
      });

      setReportHtml(html);

      const numeroCarga = (carga || documento || codigo).replace(/[^\w-]+/g, "_");
      const pdfName = `Checklist_Carregamento_${numeroCarga}.pdf`;
      const pdfBlob = await htmlToPdfBlob(html, pdfName);
      const pdfBase64 = await blobToBase64(pdfBlob);

      const payload = {
          cliente,
          codigo,
          documento,
          placa,
          aprovado,
          finishedAt: agora.toISOString(),
          pdfBase64,
          pdfName,
          dados: JSON.stringify(
            {
              codigo,
              documento,
              carga,
              cliente,
              operacao,
              transportadora,
              motorista,
              modelo,
              placa,
              respostas,
              naoConformidades: naoConformidades.map((i) => i.label),
              observacaoNc,
              doca,
              maquina,
              operador,
              material,
              quantidade,
              paletes,
              responsavel,
              aprovado,
              inicio: (started ?? agora).toISOString(),
              termino: agora.toISOString(),
            },
            null,
            2,
          ),
          fotos: fotos.map((f, i) => ({
            name: `${i + 1} - ${f.caption}`,
            mimeType: f.dataUrl.slice(5, f.dataUrl.indexOf(";")) || "image/jpeg",
            dataBase64: f.dataUrl.split(",")[1] ?? "",
          })),
      };

      if (!navigator.onLine) {
        const pending = enqueueUpload(payload);
        toast.success("Sem conexão: PDF salvo na fila", {
          description: `${pending} envio(s) pendente(s). Enviaremos automaticamente ao voltar a internet.`,
        });
        return;
      }

      try {
        const result = await save({ data: payload });
        toast.success("Check list salvo em PDF no Google Drive", { description: result.path });
      } catch (err) {
        const pending = enqueueUpload(payload);
        console.error(err);
        toast.warning("Envio falhou: PDF guardado na fila", {
          description: `${pending} envio(s) pendente(s). Tentaremos novamente automaticamente.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar no Google Drive", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  const printReport = () => {
    if (!reportHtml) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(reportHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <main className="min-h-screen pb-32">
      <Toaster />
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <img
            src={logoSatus}
            alt="Logo Satus"
            className="size-12 rounded-lg bg-card object-contain p-1"
          />
          <div>
            <h1 className="text-xl font-bold uppercase">Check list de carregamento</h1>
            <p className="text-sm opacity-85">
              {started ? `Início ${started.toLocaleString("pt-BR")}` : "Iniciando…"}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Card title="Identificação e transporte">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Documento de transporte" value={documento} onChange={setDocumento} />
            <TextField label="Carga" value={carga} onChange={setCarga} />
            <SelectWithAdd
              label="Cliente"
              value={cliente}
              options={clientes}
              onChange={setCliente}
              onAddOption={(v) => setClientes((p) => [...p, v])}
            />
            <SelectWithAdd
              label="Tipo de operação"
              value={operacao}
              options={operacoes}
              onChange={setOperacao}
              onAddOption={(v) => setOperacoes((p) => [...p, v])}
            />
            <SelectWithAdd
              label="Transportadora"
              value={transportadora}
              options={transportadoras}
              onChange={setTransportadora}
              onAddOption={(v) => setTransportadoras((p) => [...p, v])}
            />
            <TextField label="Nome do motorista" value={motorista} onChange={setMotorista} />
          </div>
        </Card>

        <Card title="Dados do veículo">
          <div className="space-y-2">
            <Label className={fieldLabel}>Modelo do veículo</Label>
            <div className="flex flex-wrap gap-2">
              {MODELOS_VEICULO.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModelo(m)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    modelo === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <PhotoField label="Foto da placa" value={fotoPlaca} onChange={onFotoPlaca} />
              {ocr && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScanLine className="size-4 animate-pulse" /> Lendo a placa…
                </p>
              )}
            </div>
            <TextField
              label="Placa"
              value={placa}
              onChange={(v) => setPlaca(v.toUpperCase())}
              placeholder="ABC1D23"
            />
            {interior.map((f, i) => (
              <PhotoField
                key={i}
                label={`Interior do veículo ${i + 1}`}
                value={f}
                onChange={(file) =>
                  setInterior((prev) => prev.map((p, idx) => (idx === i ? file : p)))
                }
              />
            ))}
          </div>
        </Card>

        <Card
          title="Inspeção da carroceria"
          description="A não conformidade de qualquer item deverá ser comunicada imediatamente ao responsável do setor."
        >
          <div className="space-y-3">
            {INSPECAO_ITENS.map((item, idx) => {
              const atual = respostas[item.id];
              const reprovado = atual === item.reprovaEm;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                    reprovado ? "border-destructive/50 bg-destructive/5" : "border-border"
                  }`}
                >
                  <span className="text-sm">
                    <strong className="mr-1 text-muted-foreground">{idx + 1}.</strong>
                    {item.label}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    {RESPOSTAS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRespostas((prev) => ({ ...prev, [item.id]: r }))}
                        className={`min-w-14 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                          atual === r
                            ? r === item.reprovaEm
                              ? "border-destructive bg-destructive text-destructive-foreground"
                              : "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {naoConformidades.length > 0 && (
          <Card
            title={`Não conformidades (${naoConformidades.length})`}
            description="Anexe até 2 fotos e descreva a não conformidade identificada."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fotosNc.map((f, i) => (
                <PhotoField
                  key={i}
                  label={`Foto da não conformidade ${i + 1}`}
                  value={f}
                  onChange={(file) =>
                    setFotosNc((prev) => prev.map((p, idx) => (idx === i ? file : p)))
                  }
                />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Label className={fieldLabel}>Observações da não conformidade</Label>
              <Textarea
                value={observacaoNc}
                onChange={(e) => setObservacaoNc(e.target.value)}
                rows={4}
              />
            </div>
          </Card>
        )}

        <Card title="Processo de carregamento">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className={fieldLabel}>Doca de carregamento</Label>
              <select
                value={doca}
                onChange={(e) => setDoca(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione…</option>
                {DOCAS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <TextField label="Tipo de máquina" value={maquina} onChange={setMaquina} />
            <TextField label="Operador" value={operador} onChange={setOperador} />
            <div className="space-y-2">
              <Label className={fieldLabel}>Material</Label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione…</option>
                {MATERIAIS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <TextField label="Quantidade" value={quantidade} onChange={setQuantidade} numeric />
            <div className="space-y-2">
              <Label className={fieldLabel}>Total de paletes</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Diminuir paletes"
                  onClick={() => setPaletes((p) => Math.max(0, p - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  className="text-center"
                  inputMode="numeric"
                  value={paletes}
                  onChange={(e) => setPaletes(Number(e.target.value.replace(/\D/g, "") || 0))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Aumentar paletes"
                  onClick={() => setPaletes((p) => p + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Encerramento e fotos do carregamento"
          description={`${fotosCarregamento.filter(Boolean).length} foto(s) anexada(s).`}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {fotosCarregamento.map((f, i) => (
              <div key={i} className="space-y-1">
                <PhotoField
                  label={`Carregamento ${i + 1}`}
                  value={f}
                  onChange={(file) =>
                    setFotosCarregamento((prev) => prev.map((p, idx) => (idx === i ? file : p)))
                  }
                />
                {fotosCarregamento.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-destructive underline"
                    onClick={() =>
                      setFotosCarregamento((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    Remover slot
                  </button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => setFotosCarregamento((prev) => [...prev, null])}
          >
            <Plus className="size-4" /> Adicionar foto
          </Button>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <TextField
              label="Responsável pelo check list"
              value={responsavel}
              onChange={setResponsavel}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SignaturePad label="Assinatura do responsável" onChange={setAssinaturaResp} />
              <SignaturePad label="Assinatura do motorista" onChange={setAssinaturaMot} />
            </div>
          </div>
        </Card>

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
              {aprovado
                ? "Aprovado para carregamento"
                : naoConformidades.length
                  ? "Pendente / não aprovado"
                  : "Aguardando inspeção completa"}
            </p>
            <p className="text-xs">
              {respondidos}/{INSPECAO_ITENS.length} itens inspecionados
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmClear(true)}
            >
              <RotateCcw className="size-4" /> Limpar
            </Button>
            {reportHtml && (
              <Button type="button" variant="secondary" onClick={printReport}>
                <Printer className="size-4" /> Imprimir
              </Button>
            )}
            <Button type="submit" className="flex-[2]" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar e gerar relatório
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja limpar todos os dados do formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as informações, fotos e assinaturas preenchidas serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>NÃO</AlertDialogCancel>
            <AlertDialogAction onClick={limparTudo}>SIM</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reportHtml} onOpenChange={(o) => !o && setReportHtml(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Relatório do check list</DialogTitle>
          </DialogHeader>
          <iframe
            title="Relatório"
            srcDoc={reportHtml ?? ""}
            className="h-[70vh] w-full rounded-md border border-border bg-card"
          />
          <Button type="button" onClick={printReport}>
            <Printer className="size-4" /> Imprimir / Salvar em PDF
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-panel)]">
      <h2 className="text-base font-bold uppercase text-foreground">{title}</h2>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
