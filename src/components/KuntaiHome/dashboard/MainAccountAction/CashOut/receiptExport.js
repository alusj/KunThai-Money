function inlineComputedStyles(sourceElement, cloneElement) {
  const sourceNodes = [sourceElement, ...sourceElement.querySelectorAll("*")];
  const cloneNodes = [cloneElement, ...cloneElement.querySelectorAll("*")];

  sourceNodes.forEach((node, index) => {
    const clone = cloneNodes[index];

    if (!clone || !(node instanceof Element)) {
      return;
    }

    const computed = window.getComputedStyle(node);
    let cssText = "";

    for (let i = 0; i < computed.length; i += 1) {
      const property = computed[i];
      cssText += `${property}:${computed.getPropertyValue(property)};`;
    }

    clone.style.cssText = cssText;
  });
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image could not be embedded."));
    reader.readAsDataURL(blob);
  });
}

// External images (e.g. profile avatars) are blocked inside SVG-as-image, so
// embed them as data URLs; drop any that cannot be fetched.
async function embedImages(cloneElement) {
  const images = Array.from(cloneElement.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || "";

      if (!src || src.startsWith("data:")) {
        return;
      }

      try {
        const response = await fetch(src, { mode: "cors" });

        if (!response.ok) {
          throw new Error(`Image fetch failed: ${response.status}`);
        }

        img.setAttribute("src", await blobToDataUrl(await response.blob()));
      } catch {
        img.remove();
      }
    })
  );
}

export async function renderReceiptImage(receiptElement) {
  const rect = receiptElement.getBoundingClientRect();
  const clone = receiptElement.cloneNode(true);

  inlineComputedStyles(receiptElement, clone);
  await embedImages(clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(rect.width)}" height="${Math.ceil(rect.height)}">
      <foreignObject width="100%" height="100%">${markup}</foreignObject>
    </svg>
  `;

  // A data URL keeps the canvas untainted; blob URLs with foreignObject
  // taint it in Chromium and make toBlob throw a SecurityError.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Receipt markup could not be rendered."));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(rect.width * 2);
  canvas.height = Math.ceil(rect.height * 2);
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas is not supported.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(2, 2);
  context.drawImage(image, 0, 0, rect.width, rect.height);

  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!pngBlob) throw new Error("Receipt image could not be generated.");

  return pngBlob;
}

async function imageBlobToJpegData(imageBlob) {
  const url = URL.createObjectURL(imageBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas is not supported.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!jpegBlob) throw new Error("PDF image could not be prepared.");

    return { blob: jpegBlob, width: image.width, height: image.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function buildPdfBlobFromJpegBytes(jpegBytes, imageWidth, imageHeight) {
  const encoder = new TextEncoder();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const ratio = Math.min(
    (pageWidth - margin * 2) / imageWidth,
    (pageHeight - margin * 2) / imageHeight
  );
  const renderWidth = imageWidth * ratio;
  const renderHeight = imageHeight * ratio;
  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;
  const contentStream = `q\n${renderWidth.toFixed(2)} 0 0 ${renderHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    null,
    `<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream`,
  ];

  const chunks = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];
  let currentLength = chunks[0].length;

  objects.forEach((objectBody, index) => {
    offsets.push(currentLength);

    if (index === 3) {
      const header = encoder.encode(
        `${index + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
      );
      const footer = encoder.encode("\nendstream\nendobj\n");
      chunks.push(header, jpegBytes, footer);
      currentLength += header.length + jpegBytes.length + footer.length;
      return;
    }

    const body = encoder.encode(`${index + 1} 0 obj\n${objectBody}\nendobj\n`);
    chunks.push(body);
    currentLength += body.length;
  });

  const xrefOffset = currentLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref), encoder.encode(trailer));

  return new Blob([concatUint8Arrays(chunks)], { type: "application/pdf" });
}

export async function createReceiptPdfBlob(receiptElement) {
  const imageBlob = await renderReceiptImage(receiptElement);
  const jpegData = await imageBlobToJpegData(imageBlob);
  const jpegBytes = new Uint8Array(await jpegData.blob.arrayBuffer());
  return buildPdfBlobFromJpegBytes(jpegBytes, jpegData.width, jpegData.height);
}
