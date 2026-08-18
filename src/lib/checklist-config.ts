export type FieldType = "text" | "textarea" | "select" | "number" | "photo" | "conformity";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
}

export const TRANSPORTADORAS = [
  "G10 TRANSPORTES",
  "GLOBAL TRANSPORTES",
  "MATÃO TRANSPORTADORA",
  "OUTRA",
];

export const CLIENTES = ["BAYER", "LONGPING", "SHULL", "OUTRO"];

export const OPERACOES = ["VENDA", "VENDA AG", "TRANSFERÊNCIA", "CLIENTE RETIRA"];

export const sections: Section[] = [
  {
    id: "identificacao",
    title: "Identificação",
    description: "Dados do carregamento",
    fields: [
      { id: "documento_transporte", label: "Documento de transporte", type: "text" },
      { id: "carga", label: "Carga", type: "text" },
      { id: "cliente", label: "Cliente", type: "select", options: CLIENTES },
      { id: "tipo_operacao", label: "Tipo de operação", type: "select", options: OPERACOES },
      { id: "transportadora", label: "Transportadora", type: "select", options: TRANSPORTADORAS },
      { id: "nome_motorista", label: "Nome do motorista", type: "text" },
    ],
  },
  {
    id: "veiculo",
    title: "Veículo",
    description: "Modelo, placas e registros fotográficos",
    fields: [
      {
        id: "modelo",
        label: "Modelo",
        type: "select",
        options: ["TOCO", "TRUCK", "CARRETA", "BITREM", "VUC"],
      },
      { id: "foto_placa_1", label: "Foto placa 1", type: "photo" },
      { id: "placa_cavalo", label: "Placa cavalo", type: "text", placeholder: "ABC1D23" },
      { id: "foto_placa_2", label: "Foto placa 2", type: "photo" },
      { id: "placa_carreta", label: "Placa carreta", type: "text", placeholder: "ABC1D23" },
      { id: "foto_placa_3", label: "Foto placa 3", type: "photo" },
      { id: "placa_carreta_2", label: "Placa carreta 2", type: "text", placeholder: "ABC1D23" },
      { id: "foto_interior_1", label: "Foto interior do veículo 1", type: "photo" },
      { id: "foto_interior_2", label: "Foto interior do veículo 2", type: "photo" },
    ],
  },
  {
    id: "inspecao",
    title: "Inspeção da carroceria",
    description:
      "A não conformidade de qualquer item listado deverá ser comunicada imediatamente ao responsável do setor.",
    fields: [
      {
        id: "laterais",
        label: "As laterais da carroceria ou lonas (Sider) estão em boas condições",
        type: "conformity",
      },
      { id: "reguas", label: "Réguas das tampas estão em boas condições", type: "conformity" },
      {
        id: "pinos",
        label: "Tampas da carroceria possuem todos os pinos de segurança",
        type: "conformity",
      },
      {
        id: "lascas",
        label: "Há presença de lascas de madeira, pregos ou parafusos expostos",
        type: "conformity",
      },
      { id: "fueiros", label: "Os fueiros estão em boas condições", type: "conformity" },
      { id: "limpeza", label: "Limpeza da carroceria está conforme", type: "conformity" },
      { id: "lona", label: "Lona do veículo está em boas condições", type: "conformity" },
      {
        id: "derrame",
        label: "Veículo possui evidência de derrame de produtos químicos e/ou fluídos",
        type: "conformity",
      },
    ],
  },
  {
    id: "nao_conformidade",
    title: "Não conformidades",
    fields: [
      { id: "foto_nc_1", label: "Foto não conformidade 1", type: "photo" },
      { id: "foto_nc_2", label: "Foto não conformidade 2", type: "photo" },
      { id: "observacao", label: "Observação", type: "textarea" },
    ],
  },
  {
    id: "carregamento",
    title: "Carregamento",
    fields: [
      {
        id: "doca",
        label: "Doca",
        type: "select",
        options: ["DOCA 1", "DOCA 2", "DOCA 3", "DOCA 4"],
      },
      {
        id: "maquina",
        label: "Tipo de máquina",
        type: "select",
        options: ["EMPILHADEIRA", "TRANSPALETEIRA", "MANUAL"],
      },
      { id: "operador", label: "Operador", type: "text" },
      { id: "material", label: "Material", type: "text", placeholder: "SACARIA" },
      { id: "quantidade", label: "Quantidade", type: "number" },
      { id: "total_paletes", label: "Total de paletes", type: "number" },
    ],
  },
  {
    id: "encerramento",
    title: "Encerramento",
    fields: [
      { id: "foto_carregamento", label: "Foto carregamento", type: "photo" },
      { id: "foto_carregamento_2", label: "Foto carregamento 2", type: "photo" },
      { id: "responsavel", label: "Responsável pelo check list", type: "text" },
    ],
  },
];

export const PHOTO_SLOTS = 50;