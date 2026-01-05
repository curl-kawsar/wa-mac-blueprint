import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
    if (!password) {
        throw new Error('Password is required');
    }

    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 * 
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether the password matches
 */
export async function verifyPassword(password, hash) {
    if (!password || !hash) {
        return false;
    }

    return bcrypt.compare(password, hash);
}

/**
 * Check password strength
 * Returns an object with password strength details
 * 
 * @param {string} password - Password to check
 * @returns {object} Password strength analysis
 */
export function checkPasswordStrength(password) {
    const result = {
        score: 0,
        requirements: {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumber: false,
            hasSpecial: false,
        },
        feedback: [],
    };

    if (!password) {
        result.feedback.push('Password is required');
        return result;
    }

    // Check minimum length
    if (password.length >= 8) {
        result.requirements.minLength = true;
        result.score += 1;
    } else {
        result.feedback.push('Password should be at least 8 characters');
    }

    // Check for uppercase
    if (/[A-Z]/.test(password)) {
        result.requirements.hasUppercase = true;
        result.score += 1;
    } else {
        result.feedback.push('Add uppercase letters');
    }

    // Check for lowercase
    if (/[a-z]/.test(password)) {
        result.requirements.hasLowercase = true;
        result.score += 1;
    } else {
        result.feedback.push('Add lowercase letters');
    }

    // Check for numbers
    if (/\d/.test(password)) {
        result.requirements.hasNumber = true;
        result.score += 1;
    } else {
        result.feedback.push('Add numbers');
    }

    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.requirements.hasSpecial = true;
        result.score += 1;
    } else {
        result.feedback.push('Add special characters');
    }

    // Bonus for length
    if (password.length >= 12) {
        result.score += 1;
    }
    if (password.length >= 16) {
        result.score += 1;
    }

    return result;
}

/**
 * Validate password meets minimum requirements
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} Whether password meets requirements
 */
export function isValidPassword(password) {
    const strength = checkPasswordStrength(password);
    return (
        strength.requirements.minLength &&
        strength.requirements.hasUppercase &&
        strength.requirements.hasLowercase &&
        strength.requirements.hasNumber
    );
}

export default {
    hashPassword,
    verifyPassword,
    checkPasswordStrength,
    isValidPassword,
};
