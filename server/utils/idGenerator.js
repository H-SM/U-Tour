import crypto from "crypto";

export function generateCustomId(length = 28) {
 const charset =
   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
 const bytes = crypto.randomBytes(length);
 let result = "";
 for (let i = 0; i < length; i++) {
   result += charset[bytes[i] % charset.length];
 }
 return result;
}

export default {
 generateCustomId,
};