import type { UploadApiResponse } from "cloudinary";
import { getCloudinary } from "../config/cloudinary";
import { HttpError } from "../utils/http";

export const EVENT_IMAGE_FOLDER = "EventYatwon/events";
export const AVATAR_IMAGE_FOLDER = "EventYatwon/avatars";

export interface UploadedImage {
  secureUrl: string;
  publicId: string;
}

export const uploadImage = async (buffer: Buffer, folder: string): Promise<UploadedImage> => {
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = getCloudinary().uploader.upload_stream(
        { folder, resource_type: "image", use_filename: false, unique_filename: true },
        (error, uploaded) => {
          if (error || !uploaded) reject(error ?? new Error("Upload failed"));
          else resolve(uploaded);
        },
      );
      stream.end(buffer);
    });
    return { secureUrl: result.secure_url, publicId: result.public_id };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "Image upload failed");
  }
};

export const deleteImage = async (publicId: string | undefined, folder: string): Promise<void> => {
  if (!publicId || !publicId.startsWith(`${folder}/`)) return;
  try {
    await getCloudinary().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch {
    console.error("Cloudinary image cleanup failed");
  }
};
