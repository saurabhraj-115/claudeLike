const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

function findEndOfCentralDirectory(view: DataView) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  throw new Error("Invalid DOCX file.");
}

async function inflateRaw(data: Uint8Array) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function readZipEntry(buffer: ArrayBuffer, targetName: string) {
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);

  let cursor = centralDirectoryOffset;
  const decoder = new TextDecoder();

  for (let i = 0; i < totalEntries; i += 1) {
    if (view.getUint32(cursor, true) !== CENTRAL_DIR_SIGNATURE) {
      throw new Error("Invalid DOCX central directory.");
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileName = decoder.decode(
      new Uint8Array(buffer, cursor + 46, fileNameLength)
    );

    cursor += 46 + fileNameLength + extraLength + commentLength;

    if (fileName !== targetName) {
      continue;
    }

    if (view.getUint32(localHeaderOffset, true) !== LOCAL_FILE_SIGNATURE) {
      throw new Error("Invalid DOCX local file header.");
    }

    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = new Uint8Array(buffer, dataOffset, compressedSize);

    if (compressionMethod === 0) {
      return compressedData;
    }

    if (compressionMethod === 8) {
      return inflateRaw(compressedData);
    }

    throw new Error("Unsupported DOCX compression method.");
  }

  throw new Error(`Missing ${targetName} in DOCX file.`);
}

function xmlNodeText(node: Node): string {
  const nodeName = node.nodeName;

  if (nodeName === "w:t") {
    return node.textContent ?? "";
  }

  if (nodeName === "w:tab") {
    return "\t";
  }

  if (nodeName === "w:br" || nodeName === "w:cr") {
    return "\n";
  }

  let text = "";
  node.childNodes.forEach((child) => {
    text += xmlNodeText(child);
  });

  if (nodeName === "w:p") {
    return `${text}\n\n`;
  }

  if (nodeName === "w:tr") {
    return `${text}\n`;
  }

  if (nodeName === "w:tc") {
    return `${text}\t`;
  }

  return text;
}

export async function extractDocxText(file: File) {
  const buffer = await file.arrayBuffer();
  const documentXml = await readZipEntry(buffer, "word/document.xml");
  const xml = new TextDecoder().decode(documentXml);
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const body = parsed.getElementsByTagName("w:body")[0];

  if (!body) {
    throw new Error("DOCX body not found.");
  }

  return xmlNodeText(body).replace(/\n{3,}/g, "\n\n").trim();
}
