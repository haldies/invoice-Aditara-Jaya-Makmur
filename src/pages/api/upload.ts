import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT;
const bucketName = process.env.AWS_BUCKET || "invoice-ajm";
const publicBaseUrl = process.env.AWS_PUBLIC_URL;
const usePathStyleEndpoint = process.env.AWS_USE_PATH_STYLE_ENDPOINT === "true";

const s3Client = (accessKeyId && secretAccessKey && endpoint)
  ? new S3Client({
      region: "auto",
      endpoint: endpoint,
      forcePathStyle: usePathStyleEndpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileBase64, fileName, contentType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "File data base64 diperlukan" });
    }

    // Decode base64 buffer
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const mime = contentType || "image/png";
    const cleanFileName = (fileName || `image-${Date.now()}.png`).replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `company-assets/${Date.now()}-${cleanFileName}`;
    const objectUrl = `${key}`.replace(/^\/+/, "");

    if (s3Client) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mime,
      });

      await s3Client.send(command);

      if (publicBaseUrl) {
        const normalizedBase = publicBaseUrl.replace(/\/+$/, "");
        const publicUrl = `${normalizedBase}/${objectUrl}`;
        return res.status(200).json({ success: true, url: publicUrl });
      }

      return res.status(200).json({
        success: true,
        url: fileBase64,
        warning: "File berhasil diupload ke R2, tetapi AWS_PUBLIC_URL belum diset sehingga URL publik tidak bisa dibentuk. Menggunakan base64 fallback.",
        key,
      });
    } else {
      // Fallback: return base64 if S3 not fully initialized
      return res.status(200).json({ success: true, url: fileBase64 });
    }
  } catch (err: any) {
    console.error("Gagal upload gambar Cloudflare R2:", err);
    // Return base64 as safe fallback if upload fails
    return res.status(200).json({ success: true, url: req.body?.fileBase64, warning: err.message });
  }
}
