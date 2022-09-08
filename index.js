import crypto from 'crypto'
import base32Encode from 'base32-encode'
import base32Decode from 'base32-decode'

/**
 * generate random base32 secret compatable with google authenticator
 * 
 * @returns string
 */
export function generateSecret() {
  const key = crypto.randomBytes(20);
  const secret = base32Encode(key, 'RFC4648', { padding: false });
  return secret;
}

/**
 * generate TOTP from base32 secret string valid for 30 seconds
 * 
 * @param {string} secret 
 * 
 * @returns string
 */
export function generateTOTP(secret) {
  // decode the base32 secret and convert it to buffer
  const key = Buffer.from(base32Decode(secret, 'RFC4648'));

  // 30 second interval counter
  let counter = parseInt(Date.now() / 30000)

  // convert counter to 8-byte byte-array
  const buf = Buffer.alloc(8);

  for (let i = 0; i < 8; i++) {
    buf[7 - i] = counter & 0xff;
    counter = counter >> 8;
  }

  // create hmac with the key
  const hmac = crypto.createHmac('sha1', key).update(buf);

  const digest = hmac.digest()

  // calculate the value of the lower 4 bits from last byte of hmac
  const offset = digest[digest.length - 1] & 0xf;

  // we take 4 bytes starting from offset index
  // calculate most significant bit of first offset byte so now we have 31-bit number
  // then calculate the mod for the 31-bit number 
  // 31-bit-number mod 10^8 
  // we get 8 digits code 
  let code = (digest[offset] & 0x7f) << 24 |
    (digest[offset + 1] & 0xff) << 16 |
    (digest[offset + 2] & 0xff) << 8 |
    (digest[offset + 3] & 0xff);

  // stringify the code
  code = code.toString(10);

  // we get last 6 digits
  return code.substring(code.length, code.length - 6)
}

