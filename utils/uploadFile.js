import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from './storage.js';

async function uploadFile(fileType, key, file) {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: fileType,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error uploading file to R2:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

export { uploadFile };