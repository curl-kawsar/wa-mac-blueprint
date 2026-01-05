import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getEnv } from '@/lib/config/env';

/**
 * Local Filesystem Storage Adapter
 * For development use only - use cloud storage in production
 */

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Generate a unique storage path
 */
function generateStoragePath(originalFilename) {
    const ext = path.extname(originalFilename);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hash = crypto.randomBytes(16).toString('hex');

    return `${year}/${month}/${day}/${hash}${ext}`;
}

/**
 * Get the storage root path
 */
function getStorageRoot() {
    const env = getEnv();
    return env.STORAGE_LOCAL_PATH || './uploads';
}

/**
 * Upload a file
 * 
 * @param {Buffer} fileBuffer - File content
 * @param {string} originalFilename - Original filename
 * @param {object} options - Upload options
 * @returns {Promise<object>} Storage info
 */
export async function upload(fileBuffer, originalFilename, options = {}) {
    const storageRoot = getStorageRoot();
    const relativePath = generateStoragePath(originalFilename);
    const absolutePath = path.join(storageRoot, relativePath);

    // Ensure directory exists
    await ensureDir(path.dirname(absolutePath));

    // Write file
    await fs.writeFile(absolutePath, fileBuffer);

    return {
        adapter: 'local',
        path: relativePath,
    };
}

/**
 * Download a file
 * 
 * @param {string} storagePath - Relative storage path
 * @returns {Promise<Buffer>} File content
 */
export async function download(storagePath) {
    const storageRoot = getStorageRoot();
    const absolutePath = path.join(storageRoot, storagePath);

    try {
        return await fs.readFile(absolutePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('File not found');
        }
        throw error;
    }
}

/**
 * Delete a file
 * 
 * @param {string} storagePath - Relative storage path
 */
export async function remove(storagePath) {
    const storageRoot = getStorageRoot();
    const absolutePath = path.join(storageRoot, storagePath);

    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

/**
 * Check if a file exists
 * 
 * @param {string} storagePath - Relative storage path
 * @returns {Promise<boolean>} Whether file exists
 */
export async function exists(storagePath) {
    const storageRoot = getStorageRoot();
    const absolutePath = path.join(storageRoot, storagePath);

    try {
        await fs.access(absolutePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get file stats
 * 
 * @param {string} storagePath - Relative storage path
 * @returns {Promise<object>} File stats
 */
export async function stat(storagePath) {
    const storageRoot = getStorageRoot();
    const absolutePath = path.join(storageRoot, storagePath);

    const stats = await fs.stat(absolutePath);

    return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
    };
}

/**
 * Get a URL for the file (for local, this is just the path)
 * In production with cloud storage, this would return a signed URL
 * 
 * @param {string} storagePath - Relative storage path
 * @param {number} expiresIn - Expiration time in seconds (ignored for local)
 * @returns {Promise<string>} URL/path to file
 */
export async function getUrl(storagePath, expiresIn = 3600) {
    // For local storage, return the API endpoint path
    return `/api/documents/download?path=${encodeURIComponent(storagePath)}`;
}

export default {
    upload,
    download,
    remove,
    exists,
    stat,
    getUrl,
};
