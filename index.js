'use strict';

const HayBTechClient = require('./lib/client');
const Webhook = require('./lib/webhook');

/**
 * HayBTech JS SDK — Entry point.
 * 
 * Usage:
 *   const haybtech = require('@haybtech/sdk')('sk_test_...');
 *   const result = await haybtech.payments.create({...});
 */
module.exports = function(secretKey = null, options = {}) {
    return new HayBTechClient(secretKey, options);
};

// Expose Webhook utility as a static property
module.exports.Webhook = Webhook;
