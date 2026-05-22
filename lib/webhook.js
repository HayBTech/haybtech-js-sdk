'use strict';

const crypto = require('crypto');

/**
 * Webhook verification utility.
 */
class Webhook {
    /**
     * Tolerance for replay attacks (5 minutes)
     */
    static TOLERANCE = 300;

    /**
     * Max payload size to prevent memory exhaustion (1MB)
     */
    static MAX_SIZE = 1024 * 1024;

    /**
     * Verify the signature and return the event payload.
     * 
     * @param {string} payload - Raw JSON body from the request
     * @param {string} signatureHeader - The X-HayBTech-Signature header
     * @param {string} secret - Your webhook endpoint secret
     * @returns {Object} The verified event
     */
    static constructEvent(payload, signatureHeader, secret) {
        if (!payload || !signatureHeader || !secret) {
            throw new Error("Missing required parameters for webhook verification.");
        }

        if (payload.length > this.MAX_SIZE) {
            throw new Error("Webhook payload exceeds maximum allowed size.");
        }

        // Parse header: t=123,v1=abc
        const parts = signatureHeader.split(',').reduce((acc, part) => {
            const [key, value] = part.split('=');
            acc[key.trim()] = value.trim();
            return acc;
        }, {});

        if (!parts.t || !parts.v1) {
            throw new Error("Invalid signature header format.");
        }

        const timestamp = parseInt(parts.t, 10);
        const receivedSig = parts.v1;

        // Replay protection
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > this.TOLERANCE) {
            throw new Error("Webhook signature expired (replay attack protection).");
        }

        // Compute expected signature
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');

        // Constant-time comparison
        if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig))) {
            throw new Error("Invalid webhook signature.");
        }

        try {
            return JSON.parse(payload);
        } catch (e) {
            throw new Error("Webhook payload is not valid JSON.");
        }
    }
}

module.exports = Webhook;
