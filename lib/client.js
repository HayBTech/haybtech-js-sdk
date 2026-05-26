'use strict';

const https = require('https');
const crypto = require('crypto');
const Payments = require('./resources/payments');
const Webhooks = require('./resources/webhooks');

/**
 * HayBTech Node.js Client - Hardened for maximum security.
 */
class HayBTechClient {
    /**
     * @param {string} secretKey - Your sk_live_... or sk_test_... key
     * @param {Object} options 
     */
    constructor(secretKey = null, options = {}) {
        secretKey = secretKey || process.env.HAYBTECH_SECRET_KEY;
        if (!secretKey || !secretKey.startsWith('sk_')) {
            throw new Error("Invalid secret key. Expected 'sk_live_...' or 'sk_test_...' or set HAYBTECH_SECRET_KEY environment variable.");
        }

        // Prevent CRLF injection
        if (/[\r\n]/.test(secretKey)) {
            throw new Error("Invalid secret key: contains forbidden characters.");
        }

        // Security: Warn if used in browser context
        if (typeof window !== 'undefined') {
            console.warn("[HayBTech] SECURITY WARNING: You are using a Secret Key in a browser environment. This exposes your account to full takeover. Use only on the server.");
        }

        this._secretKey = secretKey;
        this.options = Object.freeze({
            baseUrl: options.baseUrl || process.env.HAYBTECH_API_URL || 'https://app.haybtech.com/v1',
            timeout: options.timeout || 15000,
            ...options
        });

        this.payments = new Payments(this);
        this.webhooks = new Webhooks(this);

        // Make the client immutable
        Object.freeze(this);
    }

    /**
     * Security: Hide secret key from console.log and JSON.stringify
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.toJSON();
    }

    toJSON() {
        return {
            baseUrl: this.options.baseUrl,
            isTestMode: this._secretKey.startsWith('sk_test_'),
            secretKey: `sk_...${this._secretKey.slice(-4)}`
        };
    }

    async request(method, path, body = null, extraHeaders = {}) {
        const url = new URL(`${this.options.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
        
        const headers = {
            'Authorization': `Bearer ${this._secretKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Request-ID': crypto.randomUUID(),
            'User-Agent': `HayBTech-Node-SDK/1.0.0 Node/${process.version}`,
            ...extraHeaders
        };

        const payload = body ? JSON.stringify(body) : '';

        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                method,
                headers,
                timeout: this.options.timeout
            }, (res) => {
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(rawData);
                        if (res.statusCode >= 400) {
                            return reject(this._buildError(parsed, res.statusCode));
                        }
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Invalid JSON response from HayBTech API: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (e) => reject(new Error(`HayBTech API Connection Error: ${e.message}`)));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('HayBTech API Request Timeout'));
            });

            if (payload) req.write(payload);
            req.end();
        });
    }

    _buildError(data, status) {
        const error = data.error || {};
        const message = error.message || 'Unknown API Error';
        const code = error.code || 'api_error';
        
        const err = new Error(message);
        err.status = status;
        err.code = code;
        err.requestId = data.request_id;
        
        // Security: Scrub sensitive fields from error object
        err.data = this._sanitize(data);
        
        return err;
    }

    _sanitize(data) {
        const sensitive = ['secret', 'password', 'token', 'key', 'pin', 'cvv'];
        const scrubbed = JSON.parse(JSON.stringify(data));
        
        const walk = (obj) => {
            for (let key in obj) {
                if (sensitive.includes(key.toLowerCase())) {
                    obj[key] = '********';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    walk(obj[key]);
                }
            }
        };
        
        walk(scrubbed);
        return scrubbed;
    }
}

module.exports = HayBTechClient;
