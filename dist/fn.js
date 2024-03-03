"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
// Function to create a signature for a given string
function createSignature(inputString, secretKey) {
    const hmac = crypto_1.default.createHmac('sha256', secretKey);
    hmac.update(inputString);
    return hmac.digest('hex');
}
const inputToVerify = "Hello, World!";
const receivedSignature = "yourReceivedSignature";
const isSignatureValid = verifySignature(inputToVerify, receivedSignature, secretKey);
function verifySignature(inputString, signatureToVerify, secretKey) {
    const generatedSignature = createSignature(inputString, secretKey);
    return signatureToVerify === generatedSignature;
}
const originalString = "Hello, World!";
const secretKey = "yourSecretKey";
const signature = createSignature(originalString, secretKey);
console.log(`Original String: ${originalString}`);
console.log(`Signature: ${signature}`);
