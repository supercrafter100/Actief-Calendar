import crypto from 'crypto';

export function base64URLEncode(str: Buffer) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function GenerateCodeVerifier() {
    return base64URLEncode(crypto.randomBytes(32));
}

export function sha256(buffer: string) {
    return crypto.createHash('sha256').update(buffer).digest();
}