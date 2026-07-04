import { XMLParser } from "fast-xml-parser";

export type DartDocumentParseResult =
  | {
      ok: true;
      currentRatio: number;
      deltaRatio: number | null;
      reason: null;
    }
  | {
      ok: false;
      currentRatio: null;
      deltaRatio: null;
      reason: string;
    };

export const dartXmlParserVersion = "xml-parser-mvp-1";

const parseFailReason =
  "\uD604\uC7AC \uC9C0\uBD84\uC728\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";

const ratioLabels = [
  "\uBCF4\uC720\uBE44\uC728",
  "\uC8FC\uC2DD\uB4F1\uC758 \uBCF4\uC720\uBE44\uC728",
  "\uBCF4\uC720 \uC8FC\uC2DD\uB4F1\uC758 \uBE44\uC728",
  "\uC18C\uC720\uBE44\uC728",
  "\uC9C0\uBD84\uC728",
  "\uD569\uACC4",
];

function normalizeText(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function stripXmlTags(value: string) {
  return normalizeText(value.replace(/<[^>]+>/g, " "));
}

function removeKoreanDates(value: string) {
  return value.replace(
    /\d{4}\s*\uB144\s*\d{1,2}\s*\uC6D4\s*\d{1,2}\s*\uC77C/g,
    " ",
  );
}

function toFourDecimalNumber(value: number) {
  return Number(value.toFixed(4));
}

function normalizeDeltaRatio(value: number) {
  return toFourDecimalNumber(value);
}

function extractRatioNumbers(text: string) {
  const matches = removeKoreanDates(text).match(/[-+]?\d[\d,]*(?:\.\d+)?\s*%?/g) ?? [];

  return matches
    .map((match) => ({
      raw: match,
      value: toFourDecimalNumber(
        Number(match.replace("%", "").replaceAll(",", "").trim()),
      ),
      hasPercent: match.includes("%"),
    }))
    .filter(
      (item) => Number.isFinite(item.value) && item.value >= 0 && item.value <= 100,
    );
}

function collectTextValues(value: unknown, bucket: string[] = []) {
  if (value === null || value === undefined) {
    return bucket;
  }

  if (typeof value === "string" || typeof value === "number") {
    const text = normalizeText(String(value));

    if (text) {
      bucket.push(text);
    }

    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextValues(item, bucket);
    }

    return bucket;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) {
      collectTextValues(item, bucket);
    }
  }

  return bucket;
}

function pickSingleConservativeRatio(candidates: ReturnType<typeof extractRatioNumbers>) {
  const percentCandidates = candidates.filter((item) => item.hasPercent);

  if (percentCandidates.length === 1) {
    return percentCandidates[0].value;
  }

  if (percentCandidates.length > 1) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0].value;
  }

  return null;
}

function pickUniqueRatio(candidates: ReturnType<typeof extractRatioNumbers>) {
  const values = [...new Set(candidates.map((item) => item.value))];

  if (values.length === 1) {
    return values[0];
  }

  return null;
}

function extractTableRows(xml: string) {
  return [...xml.matchAll(/<TR\b[\s\S]*?<\/TR>/gi)]
    .map((rowMatch) => {
      const rowXml = rowMatch[0];
      const cells = [
        ...rowXml.matchAll(
          /<(?:TD|TH|TE|TU)\b[^>]*>([\s\S]*?)<\/(?:TD|TH|TE|TU)>/gi,
        ),
      ].map((cellMatch) => stripXmlTags(cellMatch[1]));

      return cells.length > 0 ? cells : [stripXmlTags(rowXml)];
    })
    .filter((row) => row.some((cell) => cell.length > 0));
}

function hasRatioHeader(row: string[]) {
  return row.some((cell) => {
    const compact = compactText(cell);

    return (
      compact.includes("\uBE44\uC728") ||
      compact.includes("\uC9C0\uBD84\uC728") ||
      compact.includes("\uC18C\uC720\uBE44\uC728") ||
      compact.includes("\uBCF4\uC720\uBE44\uC728")
    );
  });
}

function getNearbyRatioColumnIndexes(rows: string[][], rowIndex: number) {
  const indexes = new Set<number>();

  for (let index = Math.max(0, rowIndex - 6); index < rowIndex; index += 1) {
    rows[index].forEach((cell, cellIndex) => {
      if (hasRatioHeader([cell])) {
        indexes.add(cellIndex);
      }
    });
  }

  return [...indexes];
}

function pickRatioFromReportRow(rows: string[][], rowIndex: number) {
  const row = rows[rowIndex];
  const ratioColumnIndexes = getNearbyRatioColumnIndexes(rows, rowIndex);
  const columnCandidates = ratioColumnIndexes.flatMap((cellIndex) =>
    extractRatioNumbers(row[cellIndex] ?? ""),
  );
  const columnRatio = pickUniqueRatio(columnCandidates);

  if (columnRatio !== null) {
    return columnRatio;
  }

  const previousRows = rows.slice(Math.max(0, rowIndex - 6), rowIndex);

  if (!previousRows.some(hasRatioHeader)) {
    return null;
  }

  return pickUniqueRatio(row.flatMap((cell) => extractRatioNumbers(cell)));
}

function findCurrentReportComparison(rows: string[][]) {
  let previousRatio: number | null = null;
  let currentRatio: number | null = null;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowText = compactText(row.join(" "));

    if (rowText.includes("\uC9C1\uC804\uBCF4\uACE0\uC11C")) {
      previousRatio = pickRatioFromReportRow(rows, rowIndex);
    }

    if (
      rowText.includes("\uC774\uBC88\uBCF4\uACE0\uC11C") ||
      rowText.includes("\uBCF4\uACE0\uC11C\uC791\uC131\uAE30\uC900\uC77C\uD604\uC7AC")
    ) {
      currentRatio = pickRatioFromReportRow(rows, rowIndex);
    }
  }

  if (currentRatio === null) {
    return null;
  }

  return {
    currentRatio,
    deltaRatio:
      previousRatio === null
        ? null
        : normalizeDeltaRatio(currentRatio - previousRatio),
  };
}

function findRatioFromLabeledTableRows(rows: string[][]) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowText = compactText(row.join(" "));

    if (
      !rowText.includes("\uD569\uACC4") &&
      !rowText.includes("\uAD6D\uBBFC\uC5F0\uAE08\uACF5\uB2E8")
    ) {
      continue;
    }

    const ratioColumnIndexes = getNearbyRatioColumnIndexes(rows, rowIndex);
    const columnCandidates = ratioColumnIndexes.flatMap((cellIndex) =>
      extractRatioNumbers(row[cellIndex] ?? ""),
    );
    const columnRatio = pickUniqueRatio(columnCandidates);

    if (columnRatio !== null) {
      return columnRatio;
    }

    const rowRatio = pickSingleConservativeRatio(
      row.flatMap((cell) => extractRatioNumbers(cell)),
    );

    if (rowRatio !== null) {
      return rowRatio;
    }
  }

  return null;
}

function findRatioFromTableRows(xml: string) {
  const rows = extractTableRows(xml);
  const comparison = findCurrentReportComparison(rows);

  if (comparison !== null) {
    return comparison;
  }

  const currentRatio = findRatioFromLabeledTableRows(rows);

  return currentRatio === null ? null : { currentRatio, deltaRatio: null };
}

function findRatioNearStructuredText(textValues: string[]) {
  for (const label of ratioLabels) {
    for (let index = 0; index < textValues.length; index += 1) {
      const text = textValues[index];

      if (!text.includes(label)) {
        continue;
      }

      const windowText = textValues.slice(index, index + 10).join(" ");
      const ratio = pickSingleConservativeRatio(extractRatioNumbers(windowText));

      if (ratio !== null) {
        return ratio;
      }
    }
  }

  return null;
}

function findRatioNearPlainText(xml: string) {
  const plainText = normalizeText(
    xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&#160;/g, " "),
  );

  for (const label of ratioLabels) {
    const labelIndex = plainText.indexOf(label);

    if (labelIndex < 0) {
      continue;
    }

    const windowText = plainText.slice(labelIndex, labelIndex + 500);
    const ratio = pickSingleConservativeRatio(extractRatioNumbers(windowText));

    if (ratio !== null) {
      return ratio;
    }
  }

  return null;
}

export function parseCurrentRatioFromXml(xml: string): DartDocumentParseResult {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      parseTagValue: false,
      parseAttributeValue: false,
      textNodeName: "#text",
    });
    const parsed = parser.parse(xml) as unknown;
    const textValues = collectTextValues(parsed);
    const tableResult = findRatioFromTableRows(xml);
    const fallbackCurrentRatio =
      findRatioNearStructuredText(textValues) ??
      findRatioNearPlainText(xml);
    const currentRatio = tableResult?.currentRatio ?? fallbackCurrentRatio;
    const deltaRatio = tableResult?.deltaRatio ?? null;

    if (currentRatio === null) {
      return {
        ok: false,
        currentRatio: null,
        deltaRatio: null,
        reason: parseFailReason,
      };
    }

    return {
      ok: true,
      currentRatio,
      deltaRatio,
      reason: null,
    };
  } catch {
    return {
      ok: false,
      currentRatio: null,
      deltaRatio: null,
      reason: parseFailReason,
    };
  }
}
