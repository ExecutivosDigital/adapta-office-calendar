import "server-only";
import ExcelJS from "exceljs";
import { config } from "@/lib/config";
import type { RoomReportEntry, RoomsReport } from "@/lib/api-client";

// Paleta alinhada ao painel: pedra escura nos cabeçalhos, âmbar nos títulos.
const TITLE_COLOR = "FFB45309";
const HEADER_FILL = "FF44403C";
const HEADER_FONT = "FFFFFFFF";
const SECTION_FILL = "FFF5F5F4";
const BORDER_COLOR = "FFE7E5E4";

const PERCENT_FMT = '0.0%';
const HOURS_FMT = "0.00";
const PEOPLE_FMT = "0.0";

// Larguras pensadas para a tabela analítica, que é a mais larga da aba. Os
// blocos de resumo usam células mescladas para caber nessas mesmas colunas.
const COLUMN_WIDTHS = [12, 16, 9, 9, 12, 12, 26, 26, 16, 9, 18, 18, 20];

const ANALYTIC_HEADERS = [
  "Data",
  "Dia da semana",
  "Início",
  "Fim",
  "Duração (h)",
  "Status",
  "Cliente",
  "Empresa",
  "Telefone",
  "Pessoas",
  "Criada em",
  "Cancelada em",
  "Cancelada por",
];

function hours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

function formatDate(dateISO: string): string {
  const [year, month, day] = dateISO.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: config.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(parsed)
    .replace(",", "");
}

function statusLabel(status: "confirmed" | "cancelled"): string {
  return status === "confirmed" ? "Confirmada" : "Cancelada";
}

// Excel: máximo de 31 caracteres, sem []:*?/\ e sem repetição entre abas.
function safeSheetName(name: string, taken: Set<string>): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim() || "Sala";
  let candidate = cleaned.slice(0, 31);
  let suffix = 2;
  while (taken.has(candidate.toLowerCase())) {
    const tag = ` (${suffix})`;
    candidate = `${cleaned.slice(0, 31 - tag.length)}${tag}`;
    suffix += 1;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number): void {
  for (let index = 1; index <= columnCount; index += 1) {
    const cell = row.getCell(index);
    cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", wrapText: true };
  }
  row.height = 22;
}

function styleDataRow(row: ExcelJS.Row, columnCount: number): void {
  for (let index = 1; index <= columnCount; index += 1) {
    const cell = row.getCell(index);
    cell.border = { bottom: { style: "thin", color: { argb: BORDER_COLOR } } };
    cell.alignment = { vertical: "middle", ...(cell.alignment ?? {}) };
  }
}

function addSectionTitle(sheet: ExcelJS.Worksheet, title: string): ExcelJS.Row {
  const row = sheet.addRow([title]);
  sheet.mergeCells(row.number, 1, row.number, 6);
  const cell = row.getCell(1);
  cell.font = { bold: true, size: 11, color: { argb: "FF1C1917" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SECTION_FILL } };
  cell.alignment = { vertical: "middle" };
  row.height = 20;
  return row;
}

// Linha rótulo/valor com o rótulo mesclado em A:B e o valor em C:D, para os
// textos longos do resumo caberem nas larguras da tabela analítica.
function addMetric(
  sheet: ExcelJS.Worksheet,
  label: string,
  value: string | number,
  numFmt?: string
): void {
  const row = sheet.addRow([label, null, value]);
  sheet.mergeCells(row.number, 1, row.number, 2);
  sheet.mergeCells(row.number, 3, row.number, 4);
  row.getCell(1).font = { size: 10, color: { argb: "FF57534E" } };
  row.getCell(1).alignment = { vertical: "middle", wrapText: true };
  const valueCell = row.getCell(3);
  valueCell.font = { bold: true, size: 10 };
  valueCell.alignment = { vertical: "middle", horizontal: "left" };
  if (numFmt) valueCell.numFmt = numFmt;
}

// Mini-tabela de 4 colunas: rótulo mesclado em A:B, dois números em C e D.
function addMiniTable(
  sheet: ExcelJS.Worksheet,
  headers: [string, string, string],
  rows: Array<[string, number, number]>,
  formats: [string, string],
  emptyMessage: string
): void {
  const headerRow = sheet.addRow([headers[0], null, headers[1], headers[2]]);
  sheet.mergeCells(headerRow.number, 1, headerRow.number, 2);
  styleHeaderRow(headerRow, 4);

  if (rows.length === 0) {
    const row = sheet.addRow([emptyMessage]);
    sheet.mergeCells(row.number, 1, row.number, 4);
    row.getCell(1).font = { italic: true, size: 10, color: { argb: "FF78716C" } };
    return;
  }

  for (const [label, first, second] of rows) {
    const row = sheet.addRow([label, null, first, second]);
    sheet.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).alignment = { vertical: "middle", wrapText: true };
    row.getCell(3).numFmt = formats[0];
    row.getCell(4).numFmt = formats[1];
    styleDataRow(row, 4);
  }
}

function periodLabel(report: RoomsReport): string {
  const range = `${formatDate(report.effectiveFrom)} a ${formatDate(report.effectiveTo)}`;
  return report.hasExplicitRange ? range : `${range} (todo o histórico)`;
}

function buildSummarySheet(
  workbook: ExcelJS.Workbook,
  report: RoomsReport,
  generatedAt: Date
): void {
  const sheet = workbook.addWorksheet("Resumo");
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  const title = sheet.addRow(["Relatório de utilização por sala"]);
  sheet.mergeCells(title.number, 1, title.number, 11);
  title.getCell(1).font = { bold: true, size: 16, color: { argb: TITLE_COLOR } };
  title.height = 26;

  addMetric(sheet, "Período", periodLabel(report));
  addMetric(sheet, "Dias de funcionamento no período", report.businessDays);
  addMetric(
    sheet,
    "Horário comercial",
    `${report.businessHours.opening} às ${report.businessHours.closing}`
  );
  addMetric(sheet, "Salas no relatório", report.rooms.length);
  addMetric(sheet, "Gerado em", formatDateTime(generatedAt.toISOString()));

  sheet.addRow([]);
  addSectionTitle(sheet, "Comparativo entre as salas");

  const headers = [
    "Sala",
    "Capacidade",
    "Reservas confirmadas",
    "Canceladas",
    "Taxa de cancelamento",
    "Horas utilizadas",
    "Horas disponíveis",
    "Taxa de ocupação",
    "Duração média (min)",
    "Média de pessoas",
    "Aproveitamento da capacidade",
  ];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow, headers.length);
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

  for (const entry of report.rooms) {
    const row = sheet.addRow([
      entry.room.name,
      entry.room.capacity,
      entry.summary.confirmedReservations,
      entry.summary.cancelledReservations,
      entry.summary.cancellationRate / 100,
      hours(entry.summary.minutesUsed),
      hours(entry.summary.availableMinutes),
      entry.summary.occupancyRate / 100,
      entry.summary.averageMinutes,
      entry.summary.averagePeople,
      entry.summary.capacityUsageRate / 100,
    ]);
    row.getCell(5).numFmt = PERCENT_FMT;
    row.getCell(6).numFmt = HOURS_FMT;
    row.getCell(7).numFmt = HOURS_FMT;
    row.getCell(8).numFmt = PERCENT_FMT;
    row.getCell(10).numFmt = PEOPLE_FMT;
    row.getCell(11).numFmt = PERCENT_FMT;
    styleDataRow(row, headers.length);
  }

  const legend = sheet.addRow([]);
  sheet.addRow([
    "Taxa de ocupação = horas utilizadas ÷ horas disponíveis (dias de funcionamento × janela comercial).",
  ]);
  sheet.addRow([
    "Aproveitamento da capacidade = média de pessoas por reserva ÷ capacidade da sala.",
  ]);
  for (let index = legend.number + 1; index <= legend.number + 2; index += 1) {
    sheet.mergeCells(index, 1, index, 11);
    sheet.getRow(index).getCell(1).font = {
      italic: true,
      size: 9,
      color: { argb: "FF78716C" },
    };
  }
}

function buildRoomSheet(
  workbook: ExcelJS.Workbook,
  entry: RoomReportEntry,
  report: RoomsReport,
  taken: Set<string>
): void {
  const sheet = workbook.addWorksheet(safeSheetName(entry.room.name, taken));
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  const title = sheet.addRow([entry.room.name]);
  sheet.mergeCells(title.number, 1, title.number, 8);
  title.getCell(1).font = { bold: true, size: 15, color: { argb: TITLE_COLOR } };
  title.height = 24;

  const details = [
    `Capacidade: ${entry.room.capacity} pessoa(s)`,
    entry.room.location ? `Local: ${entry.room.location}` : null,
    entry.room.is_active ? null : "Sala inativa",
    `Período: ${periodLabel(report)}`,
  ].filter(Boolean);
  const subtitle = sheet.addRow([details.join("  ·  ")]);
  sheet.mergeCells(subtitle.number, 1, subtitle.number, 8);
  subtitle.getCell(1).font = { size: 10, color: { argb: "FF78716C" } };

  sheet.addRow([]);
  addSectionTitle(sheet, "Resumo da sala");
  addMetric(sheet, "Reservas confirmadas", entry.summary.confirmedReservations);
  addMetric(sheet, "Reservas canceladas", entry.summary.cancelledReservations);
  addMetric(sheet, "Taxa de cancelamento", entry.summary.cancellationRate / 100, PERCENT_FMT);
  addMetric(sheet, "Horas utilizadas", hours(entry.summary.minutesUsed), HOURS_FMT);
  addMetric(sheet, "Horas disponíveis no período", hours(entry.summary.availableMinutes), HOURS_FMT);
  addMetric(sheet, "Taxa de ocupação", entry.summary.occupancyRate / 100, PERCENT_FMT);
  addMetric(sheet, "Duração média da reserva (min)", entry.summary.averageMinutes);
  addMetric(sheet, "Média de pessoas por reserva", entry.summary.averagePeople, PEOPLE_FMT);
  addMetric(sheet, "Capacidade da sala", entry.room.capacity);
  addMetric(sheet, "Aproveitamento da capacidade", entry.summary.capacityUsageRate / 100, PERCENT_FMT);

  sheet.addRow([]);
  addSectionTitle(sheet, "Quem usou a sala");
  addMiniTable(
    sheet,
    ["Empresa", "Horas", "Reservas"],
    entry.byCompany.map((item) => [item.companyName, hours(item.minutes), item.reservations]),
    [HOURS_FMT, "0"],
    "Nenhuma reserva confirmada no período."
  );

  sheet.addRow([]);
  addSectionTitle(sheet, "Quando a sala é procurada — por dia da semana");
  addMiniTable(
    sheet,
    ["Dia da semana", "Horas", "Reservas"],
    entry.byWeekday.map((item) => [item.label, hours(item.minutes), item.reservations]),
    [HOURS_FMT, "0"],
    "Nenhuma reserva confirmada no período."
  );

  sheet.addRow([]);
  addSectionTitle(sheet, "Quando a sala é procurada — por horário de início");
  addMiniTable(
    sheet,
    ["Horário", "Horas", "Reservas"],
    entry.byHour.map((item) => [item.startTime, hours(item.minutes), item.reservations]),
    [HOURS_FMT, "0"],
    "Nenhuma reserva confirmada no período."
  );

  sheet.addRow([]);
  addSectionTitle(sheet, "Reservas do período");
  const headerRow = sheet.addRow(ANALYTIC_HEADERS);
  styleHeaderRow(headerRow, ANALYTIC_HEADERS.length);

  if (entry.reservations.length === 0) {
    const row = sheet.addRow(["Nenhuma reserva registrada nesta sala no período."]);
    sheet.mergeCells(row.number, 1, row.number, ANALYTIC_HEADERS.length);
    row.getCell(1).font = { italic: true, size: 10, color: { argb: "FF78716C" } };
    return;
  }

  for (const reservation of entry.reservations) {
    const row = sheet.addRow([
      formatDate(reservation.date),
      reservation.weekday,
      reservation.startTime,
      reservation.endTime,
      hours(reservation.minutes),
      statusLabel(reservation.status),
      reservation.customerName,
      reservation.companyName,
      reservation.customerPhone ?? "",
      reservation.peopleCount,
      formatDateTime(reservation.createdAt),
      formatDateTime(reservation.cancelledAt),
      reservation.cancelledBy ?? "",
    ]);
    row.getCell(5).numFmt = HOURS_FMT;
    if (reservation.status === "cancelled") {
      row.getCell(6).font = { color: { argb: "FFB91C1C" }, size: 10 };
    }
    styleDataRow(row, ANALYTIC_HEADERS.length);
  }

  // Filtro só na tabela analítica — as seções acima ficam fora do intervalo.
  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number + entry.reservations.length, column: ANALYTIC_HEADERS.length },
  };
}

export async function buildRoomsWorkbook(
  report: RoomsReport,
  generatedAt: Date
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Adapta Offices";
  workbook.created = generatedAt;

  buildSummarySheet(workbook, report, generatedAt);

  const taken = new Set<string>(["resumo"]);
  for (const entry of report.rooms) {
    buildRoomSheet(workbook, entry, report, taken);
  }

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}
