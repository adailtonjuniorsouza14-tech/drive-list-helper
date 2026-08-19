export const CLIENTES_PADRAO = ["LongPing", "Shull", "Bayer", "Syngenta", "Nortox", "Gdm"];

export const OPERACOES_PADRAO = [
  "Transferência",
  "Transferência e Venda",
  "Venda",
  "Venda AG",
  "Cliente Retira",
];

export const TRANSPORTADORAS_PADRAO = [
  "Rodoghel Transportes",
  "Global Transportes",
  "Delefratti Transportes",
  "G10 Transportes",
];

export const MODELOS_VEICULO = [
  "Toco",
  "Truck",
  "Bi-trem",
  "Rodo-trem",
  "Sider",
  "Rodo-sider",
  "Carreta simples",
  "Carreta LS",
  "Baú",
  "Outros",
];

export const DOCAS = ["Doca 1", "Doca 2", "Doca 3", "Doca 4", "Doca 5"];

export const MATERIAIS = ["Sacaria", "BBG", "Insumos", "Sacaria e Insumos", "Sacaria e BBG"];

export interface InspecaoItem {
  id: string;
  label: string;
  /** Resposta que caracteriza não conformidade */
  reprovaEm: "SIM" | "NÃO";
}

export const INSPECAO_ITENS: InspecaoItem[] = [
  {
    id: "laterais",
    label: "As laterais da carroceria ou lonas (Sider) estão em boas condições",
    reprovaEm: "NÃO",
  },
  { id: "reguas", label: "Réguas das tampas estão em boas condições", reprovaEm: "NÃO" },
  {
    id: "pinos",
    label: "Tampas da carroceria possuem todos os pinos de segurança",
    reprovaEm: "NÃO",
  },
  {
    id: "lascas",
    label: "Há presença de lascas de madeira, pregos ou parafusos expostos",
    reprovaEm: "SIM",
  },
  { id: "fueiros", label: "Os fueiros estão em boas condições", reprovaEm: "NÃO" },
  { id: "limpeza", label: "Limpeza da carroceria está conforme", reprovaEm: "NÃO" },
  { id: "lona", label: "Lona do veículo está em boas condições", reprovaEm: "NÃO" },
  {
    id: "derrame",
    label: "Veículo possui evidência de derrame de produtos químicos e/ou fluídos",
    reprovaEm: "SIM",
  },
];

export const RESPOSTAS = ["SIM", "NÃO", "NA"] as const;
export type Resposta = (typeof RESPOSTAS)[number];
