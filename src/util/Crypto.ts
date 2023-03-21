import crypto from 'crypto';

export function encryptPassword(input: string) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPT_KEY!, 'hex'), Buffer.from(process.env.ENCRYPT_IV!, 'hex'));
    const encrypted = cipher.update(input);
    const final = Buffer.concat([encrypted, cipher.final()]);
    return final.toString('hex');
}

export function decryptPassword(input: string) {
    const encryptedText = Buffer.from(input, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPT_KEY!, 'hex'), Buffer.from(process.env.ENCRYPT_IV!, 'hex'));
    const decrypted = decipher.update(encryptedText);
    const final = Buffer.concat([decrypted, decipher.final()]);
    return final.toString();
}