import { uploadFile } from './uploadFile.js';
import { deleteFile } from './deleteFile.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateFile(createKey, file, deleteKey, contentType) {
    const baseUrl = process.env.BASE_URL
    let newFileUrl;

    try {
        await uploadFile(contentType, createKey, file);
        newFileUrl = `${createKey}`;

        if (deleteKey) {
            await deleteFile(deleteKey);
        }

        return newFileUrl;
    } catch (error) {
        if (createKey) {
            try {
                await deleteFile(createKey);
            } catch (cleanupError) {
                console.error(`Failed to clean up new file ${createKey}:`, cleanupError);
            }
        }
        throw new Error(`Failed to update file: ${error.message}`);
    }
}

export { updateFile };