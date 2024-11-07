const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BASE32_LENGTH = BASE32_ALPHABET.length;
const MAX_TIME = Math.pow(2, 48) - 1;
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;

class ULIDError extends Error {
  constructor(message) {
    super(message);
    this.source = 'ulid';
  }
}

function replaceCharAt(str, index, char) {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + char + str.substr(index + 1);
}

function incrementBase32(str) {
  let idx;
  let length = str.length;
  let i;
  let newChar;
  let maxChar = BASE32_LENGTH - 1;

  while (!idx && length-- >= 0) {
    i = str[length];
    const charIndex = BASE32_ALPHABET.indexOf(i);
    if (charIndex === -1) throw new ULIDError('incorrectly encoded string');
    
    if (charIndex !== maxChar) {
      return replaceCharAt(str, length, BASE32_ALPHABET[charIndex + 1]);
    } else {
      str = replaceCharAt(str, length, BASE32_ALPHABET[0]);
    }
  }

  throw new ULIDError('cannot increment this string');
}

function randomChar(random) {
  let randIndex = Math.floor(random() * BASE32_LENGTH);
  if (randIndex === BASE32_LENGTH) randIndex = BASE32_LENGTH - 1;
  return BASE32_ALPHABET.charAt(randIndex);
}

function encodeTime(time, length) {
  if (isNaN(time)) throw new Error(`${time} must be a number`);
  if (time > MAX_TIME) throw new ULIDError(`cannot encode time greater than ${MAX_TIME}`);
  if (time < 0) throw new ULIDError('time must be positive');
  if (!Number.isInteger(time)) throw new ULIDError('time must be an integer');

  let encoded = '';
  let currentTime = time;
  
  while (length > 0) {
    const mod = currentTime % BASE32_LENGTH;
    encoded = BASE32_ALPHABET.charAt(mod) + encoded;
    currentTime = (currentTime - mod) / BASE32_LENGTH;
    length--;
  }

  return encoded;
}

function encodeRandom(length, random) {
  let encoded = '';
  while (length > 0) {
    encoded += randomChar(random);
    length--;
  }
  return encoded;
}

function detectPrng(allowInsecure = false, environment = typeof window !== 'undefined' ? window : null) {
  const crypto = environment && (environment.crypto || environment.msCrypto);
  
  if (crypto) {
    return () => {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      return array[0] / 255;
    };
  }

  try {
    const nodeCrypto = require('crypto');
    return () => nodeCrypto.randomBytes(1).readUInt8() / 255;
  } catch (error) {
    if (allowInsecure) {
      console.error('Secure crypto unusable, falling back to insecure Math.random()!');
      return () => Math.random();
    } else {
      throw new ULIDError('secure crypto unusable, insecure Math.random not allowed');
    }
  }
}

function ulidFactory(prng) {
  prng = prng || detectPrng();
  
  return (timestamp = Date.now()) => {
    return encodeTime(timestamp, TIME_LENGTH) + encodeRandom(RANDOM_LENGTH, prng);
  };
}

function decodeTime(ulid) {
  if (ulid.length !== TIME_LENGTH + RANDOM_LENGTH) {
    throw new ULIDError('malformed ulid');
  }

  const timePart = ulid.substr(0, TIME_LENGTH);
  const time = timePart.split('').reverse().reduce((acc, char, index) => {
    const charIndex = BASE32_ALPHABET.indexOf(char);
    if (charIndex === -1) throw new ULIDError(`invalid character found: ${char}`);
    return acc + charIndex * Math.pow(BASE32_LENGTH, index);
  }, 0);

  if (time > MAX_TIME) {
    throw new ULIDError('malformed ulid, timestamp too large');
  }

  return time;
}

function monotonicFactory(prng) {
  prng = prng || detectPrng();
  let lastTime = 0;
  let lastRandom;

  return (timestamp = Date.now()) => {
    if (timestamp <= lastTime) {
      lastRandom = incrementBase32(lastRandom);
      return encodeTime(lastTime, TIME_LENGTH) + lastRandom;
    }

    lastTime = timestamp;
    lastRandom = encodeRandom(RANDOM_LENGTH, prng);
    return encodeTime(timestamp, TIME_LENGTH) + lastRandom;
  };
}

export {
  replaceCharAt,
  incrementBase32,
  randomChar,
  encodeTime,
  encodeRandom,
  decodeTime,
  detectPrng,
  ulidFactory as ulid,
  monotonicFactory
};
