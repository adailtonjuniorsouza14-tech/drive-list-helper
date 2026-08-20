import { Eraser, Lock, LockOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function SignaturePad({
  label,
  onChange,
}: {
  label: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#14261a";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!unlocked || locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || locked) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
    setLocked(true);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setLocked(false);
    setUnlocked(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          {!hasInk && (
            <Button
              type="button"
              variant={unlocked ? "secondary" : "default"}
              size="sm"
              onClick={() => setUnlocked((v) => !v)}
            >
              {unlocked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {unlocked ? "Liberado" : "Desbloquear"}
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
            <Eraser className="size-4" /> Refazer
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className={`h-32 w-full touch-none rounded-lg border border-dashed bg-card ${
          unlocked && !locked ? "border-primary cursor-crosshair" : "border-border"
        } ${!unlocked || locked ? "opacity-70" : ""}`}
      />
      <p className="text-xs text-muted-foreground">
        {locked
          ? "Assinatura registrada e bloqueada. Use Refazer para assinar novamente."
          : unlocked
            ? "Assine no quadro acima. Ao concluir, a assinatura será bloqueada."
            : "Bloqueado: toque em Desbloquear para liberar a assinatura."}
      </p>
    </div>
  );
}
