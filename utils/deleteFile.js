import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, bucketName } from './storage.js';

async function deleteFile(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

export { deleteFile };