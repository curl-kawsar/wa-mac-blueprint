import crypto from 'crypto';
import { getEnv } from '@/lib/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for auth tag
const ENCODING = 'hex';

/**
 * Get the encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
function getKey() {
    const env = getEnv();
    return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:tag:ciphertext (all hex)
 */
export function encrypt(plaintext) {
    if (!plaintext) {
        return null;
    }

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext
    return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * 
 * @param {string} encryptedData - Data in format: iv:tag:ciphertext (all hex)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
    if (!encryptedData) {
        return null;
    }

    const key = getKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, tagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, ENCODING);
    const tag = Buffer.from(tagHex, ENCODING);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: TAG_LENGTH,
    });

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Encrypt and store SSN, returning last 4 digits for display
 * 
 * @param {string} ssn - Social Security Number (9 digits)
 * @returns {{ encrypted: string, last4: string }} Encrypted SSN and last 4 digits
 */
export function encryptSSN(ssn) {
    if (!ssn) {
        return { encrypted: null, last4: null };
    }

    // Remove any dashes or spaces
    const cleanSSN = ssn.replace(/[-\s]/g, '');

    if (!/^\d{9}$/.test(cleanSSN)) {
        throw new Error('SSN must be exactly 9 digits');
    }

    return {
        encrypted: encrypt(cleanSSN),
        last4: cleanSSN.slice(-4),
    };
}

/**
 * Decrypt SSN
 * 
 * @param {string} encryptedSSN - Encrypted SSN
 * @returns {string} Decrypted SSN
 */
export function decryptSSN(encryptedSSN) {
    return decrypt(encryptedSSN);
}

/**
 * Encrypt bank account information
 * 
 * @param {object} bankInfo - Bank account info
 * @param {string} bankInfo.routingNumber - Bank routing number
 * @param {string} bankInfo.accountNumber - Bank account number
 * @param {string} bankInfo.accountType - Account type (checking/savings)
 * @returns {object} Encrypted bank info with last 4 of account
 */
export function encryptBankInfo(bankInfo) {
    if (!bankInfo || !bankInfo.accountNumber) {
        return { encrypted: null, last4: null };
    }

    const cleanAccount = bankInfo.accountNumber.replace(/[-\s]/g, '');

    const dataToEncrypt = JSON.stringify({
        routingNumber: bankInfo.routingNumber,
        accountNumber: cleanAccount,
        accountType: bankInfo.accountType || 'checking',
    });

    return {
        encrypted: encrypt(dataToEncrypt),
        last4: cleanAccount.slice(-4),
        accountType: bankInfo.accountType || 'checking',
    };
}

/**
 * Decrypt bank account information
 * 
 * @param {string} encryptedBankInfo - Encrypted bank info
 * @returns {object} Decrypted bank info
 */
export function decryptBankInfo(encryptedBankInfo) {
    if (!encryptedBankInfo) {
        return null;
    }

    const decrypted = decrypt(encryptedBankInfo);
    return JSON.parse(decrypted);
}

/**
 * Generate a secure encryption key (for setup)
 * 
 * @returns {string} 32-byte hex-encoded key
 */
export function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}

export default {
    encrypt,
    decrypt,
    encryptSSN,
    decryptSSN,
    encryptBankInfo,
    decryptBankInfo,
    generateEncryptionKey,
};
