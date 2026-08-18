import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";

export function PhotoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img src={preview} alt={label} className="h-32 w-full object-cover" />
          <button
            type="button"
            aria-label={`Remover ${label}`}
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent-foreground"
        >
          <Camera className="size-5" />
          Adicionar foto
        </button>
      )}
    </div>
  );
}