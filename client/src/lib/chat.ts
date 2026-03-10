export interface TextAttachment {
  kind: "text";
  name: string;
  content: string;
}

export interface ImageAttachment {
  kind: "image";
  name: string;
  content: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  previewUrl?: string;
}

export type ChatAttachment = TextAttachment | ImageAttachment;

export function isImageAttachment(attachment: ChatAttachment | { kind?: string; mediaType?: string }) {
  return attachment.kind === "image";
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}
