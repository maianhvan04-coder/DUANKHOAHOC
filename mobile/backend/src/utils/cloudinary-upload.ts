import cloudinary from "../config/cloudinary";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

export function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder = "products"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload ảnh thất bại"));

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export function deleteFromCloudinary(publicId?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!publicId) return resolve();

    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image" },
      (error) => {
        if (error) return reject(error);
        resolve();
      }
    );
  });
}