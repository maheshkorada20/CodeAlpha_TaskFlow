const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const uploadFile = async (file, folder = 'taskflow') => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
      });

      // Cleanup local temp file after Cloudinary upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size,
      };
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local storage:', error.message);
    }
  }

  // Fallback to local storage
  const filename = path.basename(file.path);
  const fileUrl = `/uploads/${filename}`;

  return {
    fileUrl: fileUrl,
    publicId: '',
    fileType: file.mimetype,
    fileName: file.originalname,
    fileSize: file.size,
  };
};

const deleteFile = async (publicId, fileUrl) => {
  try {
    if (publicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(publicId);
    } else if (fileUrl && fileUrl.startsWith('/uploads/')) {
      const filename = path.basename(fileUrl);
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
