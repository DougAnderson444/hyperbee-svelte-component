(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gethyperbee = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

exports.byteLength = byteLength;
exports.toByteArray = toByteArray;
exports.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
} // Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications


revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;

function getLens(b64) {
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  } // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42


  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
} // base64 is 4/3 + up to two characters of the original data


function byteLength(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}

function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars

  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;

  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }

  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }

  return arr;
}

function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}

function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];

  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }

  return output.join('');
}

function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3
  // go through the array every three bytes, we'll deal with trailing stuff later

  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  } // pad the end with zeros, but make sure to not forget the extra bytes


  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }

  return parts.join('');
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

/* eslint-disable no-proto */
'use strict';

var base64 = require('base64-js');

var ieee754 = require('ieee754');

exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.INSPECT_MAX_BYTES = 50;
var K_MAX_LENGTH = 0x7fffffff;
exports.kMaxLength = K_MAX_LENGTH;
/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */

Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
  console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}

function typedArraySupport() {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1);
    arr.__proto__ = {
      __proto__: Uint8Array.prototype,
      foo: function foo() {
        return 42;
      }
    };
    return arr.foo() === 42;
  } catch (e) {
    return false;
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.buffer;
  }
});
Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.byteOffset;
  }
});

function createBuffer(length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  } // Return an augmented `Uint8Array` instance


  var buf = new Uint8Array(length);
  buf.__proto__ = Buffer.prototype;
  return buf;
}
/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */


function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError('The "string" argument must be of type string. Received type number');
    }

    return allocUnsafe(arg);
  }

  return from(arg, encodingOrOffset, length);
} // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97


if (typeof Symbol !== 'undefined' && Symbol.species != null && Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  });
}

Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset);
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value);
  }

  if (value == null) {
    throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
  }

  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof value === 'number') {
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  }

  var valueOf = value.valueOf && value.valueOf();

  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length);
  }

  var b = fromObject(value);
  if (b) return b;

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
}
/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/


Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
}; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148


Buffer.prototype.__proto__ = Uint8Array.prototype;
Buffer.__proto__ = Uint8Array;

function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number');
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
  }
}

function alloc(size, fill, encoding) {
  assertSize(size);

  if (size <= 0) {
    return createBuffer(size);
  }

  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  }

  return createBuffer(size);
}
/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/


Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding);
};

function allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */


Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */


Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size);
};

function fromString(string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }

  var length = byteLength(string, encoding) | 0;
  var buf = createBuffer(length);
  var actual = buf.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual);
  }

  return buf;
}

function fromArrayLike(array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  var buf = createBuffer(length);

  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255;
  }

  return buf;
}

function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds');
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds');
  }

  var buf;

  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array);
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset);
  } else {
    buf = new Uint8Array(array, byteOffset, length);
  } // Return an augmented `Uint8Array` instance


  buf.__proto__ = Buffer.prototype;
  return buf;
}

function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0;
    var buf = createBuffer(len);

    if (buf.length === 0) {
      return buf;
    }

    obj.copy(buf, 0, 0, len);
    return buf;
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0);
    }

    return fromArrayLike(obj);
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}

function checked(length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
  }

  return length | 0;
}

function SlowBuffer(length) {
  if (+length != length) {
    // eslint-disable-line eqeqeq
    length = 0;
  }

  return Buffer.alloc(+length);
}

Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};

Buffer.compare = function compare(a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);

  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  }

  if (a === b) return 0;
  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};

Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true;

    default:
      return false;
  }
};

Buffer.concat = function concat(list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }

  if (list.length === 0) {
    return Buffer.alloc(0);
  }

  var i;

  if (length === undefined) {
    length = 0;

    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;

  for (i = 0; i < list.length; ++i) {
    var buf = list[i];

    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf);
    }

    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    buf.copy(buffer, pos);
    pos += buf.length;
  }

  return buffer;
};

function byteLength(string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length;
  }

  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength;
  }

  if (typeof string !== 'string') {
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + typeof string);
  }

  var len = string.length;
  var mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion

  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len;

      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length;

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2;

      case 'hex':
        return len >>> 1;

      case 'base64':
        return base64ToBytes(string).length;

      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
        }

        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}

Buffer.byteLength = byteLength;

function slowToString(encoding, start, end) {
  var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.
  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

  if (start === undefined || start < 0) {
    start = 0;
  } // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.


  if (start > this.length) {
    return '';
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return '';
  } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return '';
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end);

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end);

      case 'ascii':
        return asciiSlice(this, start, end);

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end);

      case 'base64':
        return base64Slice(this, start, end);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
} // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154


Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
  var len = this.length;

  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits');
  }

  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }

  return this;
};

Buffer.prototype.swap32 = function swap32() {
  var len = this.length;

  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits');
  }

  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }

  return this;
};

Buffer.prototype.swap64 = function swap64() {
  var len = this.length;

  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits');
  }

  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }

  return this;
};

Buffer.prototype.toString = function toString() {
  var length = this.length;
  if (length === 0) return '';
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};

Buffer.prototype.inspect = function inspect() {
  var str = '';
  var max = exports.INSPECT_MAX_BYTES;
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
  if (this.length > max) str += ' ... ';
  return '<Buffer ' + str + '>';
};

Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength);
  }

  if (!Buffer.isBuffer(target)) {
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target);
  }

  if (start === undefined) {
    start = 0;
  }

  if (end === undefined) {
    end = target ? target.length : 0;
  }

  if (thisStart === undefined) {
    thisStart = 0;
  }

  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index');
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }

  if (thisStart >= thisEnd) {
    return -1;
  }

  if (start >= end) {
    return 1;
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
}; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf


function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1; // Normalize byteOffset

  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }

  byteOffset = +byteOffset; // Coerce to Number.

  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : buffer.length - 1;
  } // Normalize byteOffset: negative offsets start from the end of the buffer


  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

  if (byteOffset >= buffer.length) {
    if (dir) return -1;else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;else return -1;
  } // Normalize val


  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  } // Finally, search either indexOf (if dir is true) or lastIndexOf


  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1;
    }

    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]

    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }

    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }

  throw new TypeError('val must be string, number or Buffer');
}

function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();

    if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }

      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read(buf, i) {
    if (indexSize === 1) {
      return buf[i];
    } else {
      return buf.readUInt16BE(i * indexSize);
    }
  }

  var i;

  if (dir) {
    var foundIndex = -1;

    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

    for (i = byteOffset; i >= 0; i--) {
      var found = true;

      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break;
        }
      }

      if (found) return i;
    }
  }

  return -1;
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;

  if (!length) {
    length = remaining;
  } else {
    length = Number(length);

    if (length > remaining) {
      length = remaining;
    }
  }

  var strLen = string.length;

  if (length > strLen / 2) {
    length = strLen / 2;
  }

  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (numberIsNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }

  return i;
}

function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}

function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}

function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}

function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}

function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}

Buffer.prototype.write = function write(string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0; // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0; // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0;

    if (isFinite(length)) {
      length = length >>> 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  } else {
    throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds');
  }

  if (!encoding) encoding = 'utf8';
  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length);

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length);

      case 'ascii':
        return asciiWrite(this, string, offset, length);

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length);

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON() {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};

function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf);
  } else {
    return base64.fromByteArray(buf.slice(start, end));
  }
}

function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;

  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }

          break;

        case 2:
          secondByte = buf[i + 1];

          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }

      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res);
} // Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety


var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;

  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
  } // Decode in chunks to avoid "call stack size exceeded".


  var res = '';
  var i = 0;

  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }

  return res;
}

function asciiSlice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }

  return ret;
}

function latin1Slice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }

  return ret;
}

function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = '';

  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }

  return out;
}

function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';

  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }

  return res;
}

Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;
  var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance

  newBuf.__proto__ = Buffer.prototype;
  return newBuf;
};
/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */


function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}

Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val;
};

Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;

  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val;
};

Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};

Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};

Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};

Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};

Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};

Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];

  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return this[offset];
  return (0xff - this[offset] + 1) * -1;
};

Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};

Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};

Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, true, 23, 4);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, false, 23, 4);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, true, 52, 8);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, false, 52, 8);
};

function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
}

Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset + 3] = value >>> 24;
  this[offset + 2] = value >>> 16;
  this[offset + 1] = value >>> 8;
  this[offset] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  this[offset + 2] = value >>> 16;
  this[offset + 3] = value >>> 24;
  return offset + 4;
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
  if (offset < 0) throw new RangeError('Index out of range');
}

function writeFloat(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  ieee754.write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}

Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};

function writeDouble(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  ieee754.write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
}; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds');
  }

  if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
  if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

  if (end > this.length) end = this.length;

  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end);
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  }

  return len;
}; // Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])


Buffer.prototype.fill = function fill(val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string');
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }

    if (val.length === 1) {
      var code = val.charCodeAt(0);

      if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code;
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  } // Invalid ranges are not set to a default, so can range check early.


  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index');
  }

  if (end <= start) {
    return this;
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;

  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
    var len = bytes.length;

    if (len === 0) {
      throw new TypeError('The value "' + val + '" is invalid for argument "value"');
    }

    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this;
}; // HELPER FUNCTIONS
// ================


var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

function base64clean(str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]; // Node strips out invalid characters like \n and \t from the string, base64-js does not

  str = str.trim().replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

  if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

  while (str.length % 4 !== 0) {
    str = str + '=';
  }

  return str;
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i); // is surrogate component

    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } // valid lead


        leadSurrogate = codePoint;
        continue;
      } // 2 leads in a row


      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      } // valid surrogate pair


      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null; // encode utf8

    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return bytes;
}

function asciiToBytes(str) {
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }

  return byteArray;
}

function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray;
}

function base64ToBytes(str) {
  return base64.toByteArray(base64clean(str));
}

function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }

  return i;
} // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166


function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}

function numberIsNaN(obj) {
  // For IE11 support
  return obj !== obj; // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":15}],3:[function(require,module,exports){
(function (process,global){(function (){
"use strict";

var next = global.process && process.nextTick || global.setImmediate || function (f) {
  setTimeout(f, 0);
};

module.exports = function maybe(cb, promise) {
  if (cb) {
    promise.then(function (result) {
      next(function () {
        cb(null, result);
      });
    }, function (err) {
      next(function () {
        cb(err);
      });
    });
    return undefined;
  } else {
    return promise;
  }
};

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":19}],4:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

module.exports = codecs;
codecs.ascii = createString('ascii');
codecs.utf8 = createString('utf-8');
codecs.hex = createString('hex');
codecs.base64 = createString('base64');
codecs.ucs2 = createString('ucs2');
codecs.utf16le = createString('utf16le');
codecs.ndjson = createJSON(true);
codecs.json = createJSON(false);
codecs.binary = {
  name: 'binary',
  encode: function encodeBinary(obj) {
    return typeof obj === 'string' ? Buffer.from(obj, 'utf-8') : Buffer.isBuffer(obj) ? obj : Buffer.from(obj.buffer, obj.byteOffset, obj.byteLength);
  },
  decode: function decodeBinary(buf) {
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  }
};

function codecs(fmt, fallback) {
  if (typeof fmt === 'object' && fmt && fmt.encode && fmt.decode) return fmt;

  switch (fmt) {
    case 'ndjson':
      return codecs.ndjson;

    case 'json':
      return codecs.json;

    case 'ascii':
      return codecs.ascii;

    case 'utf-8':
    case 'utf8':
      return codecs.utf8;

    case 'hex':
      return codecs.hex;

    case 'base64':
      return codecs.base64;

    case 'ucs-2':
    case 'ucs2':
      return codecs.ucs2;

    case 'utf16-le':
    case 'utf16le':
      return codecs.utf16le;
  }

  return fallback !== undefined ? fallback : codecs.binary;
}

function createJSON(newline) {
  return {
    name: newline ? 'ndjson' : 'json',
    encode: newline ? encodeNDJSON : encodeJSON,
    decode: function decodeJSON(buf) {
      return JSON.parse(buf.toString());
    }
  };

  function encodeJSON(val) {
    return Buffer.from(JSON.stringify(val));
  }

  function encodeNDJSON(val) {
    return Buffer.from(JSON.stringify(val) + '\n');
  }
}

function createString(type) {
  return {
    name: type,
    encode: function encodeString(val) {
      if (typeof val !== 'string') val = val.toString();
      return Buffer.from(val, type);
    },
    decode: function decodeString(buf) {
      return buf.toString(type);
    }
  };
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;

if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}

module.exports = EventEmitter;
module.exports.once = once; // Backwards-compat with node 0.10.x

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.

var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function get() {
    return defaultMaxListeners;
  },
  set: function set(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }

    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function () {
  if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}; // Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.


EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }

  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];

  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  var doError = type === 'error';
  var events = this._events;
  if (events !== undefined) doError = doError && events.error === undefined;else if (!doError) return false; // If there is no 'error' event listener then throw.

  if (doError) {
    var er;
    if (args.length > 0) er = args[0];

    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    } // At least give some kind of context to the user


    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];
  if (handler === undefined) return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);

    for (var i = 0; i < len; ++i) {
      ReflectApply(listeners[i], this, args);
    }
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;
  checkListener(listener);
  events = target._events;

  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object

      events = target._events;
    }

    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] : [existing, listener]; // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    } // Check for listener leak


    m = _getMaxListeners(target);

    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true; // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax

      var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0) return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = {
    fired: false,
    wrapFn: undefined,
    target: target,
    type: type,
    listener: listener
  };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
}; // Emits a 'removeListener' event if and only if the listener was removed.


EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events, position, i, originalListener;
  checkListener(listener);
  events = this._events;
  if (events === undefined) return this;
  list = events[type];
  if (list === undefined) return this;

  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0) this._events = Object.create(null);else {
      delete events[type];
      if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
    }
  } else if (typeof list !== 'function') {
    position = -1;

    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    if (position === 0) list.shift();else {
      spliceOne(list, position);
    }
    if (list.length === 1) events[type] = list[0];
    if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
  }

  return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners, events, i;
  events = this._events;
  if (events === undefined) return this; // not listening for removeListener, no need to emit

  if (events.removeListener === undefined) {
    if (arguments.length === 0) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    } else if (events[type] !== undefined) {
      if (--this._eventsCount === 0) this._events = Object.create(null);else delete events[type];
    }

    return this;
  } // emit removeListener for all listeners on all events


  if (arguments.length === 0) {
    var keys = Object.keys(events);
    var key;

    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }

    this.removeAllListeners('removeListener');
    this._events = Object.create(null);
    this._eventsCount = 0;
    return this;
  }

  listeners = events[type];

  if (typeof listeners === 'function') {
    this.removeListener(type, listeners);
  } else if (listeners !== undefined) {
    // LIFO order
    for (i = listeners.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners[i]);
    }
  }

  return this;
};

function _listeners(target, type, unwrap) {
  var events = target._events;
  if (events === undefined) return [];
  var evlistener = events[type];
  if (evlistener === undefined) return [];
  if (typeof evlistener === 'function') return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function (emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;

function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);

  for (var i = 0; i < n; ++i) {
    copy[i] = arr[i];
  }

  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++) {
    list[index] = list[index + 1];
  }

  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);

  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }

  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function eventListener() {
      if (errorListener !== undefined) {
        emitter.removeListener('error', errorListener);
      }

      resolve([].slice.call(arguments));
    }

    ;
    var errorListener; // Adding an error listener is not optional because
    // if an error is thrown on an event emitter we cannot
    // guarantee that the actual event we are waiting will
    // be fired. The result could be a silent way to create
    // memory or file descriptor leaks, which is something
    // we should avoid.

    if (name !== 'error') {
      errorListener = function errorListener(err) {
        emitter.removeListener(name, eventListener);
        reject(err);
      };

      emitter.once('error', errorListener);
    }

    emitter.once(name, eventListener);
  });
}

},{}],6:[function(require,module,exports){
"use strict";

module.exports = class FixedFIFO {
  constructor(hwm) {
    if (!(hwm > 0) || (hwm - 1 & hwm) !== 0) throw new Error('Max size for a FixedFIFO should be a power of two');
    this.buffer = new Array(hwm);
    this.mask = hwm - 1;
    this.top = 0;
    this.btm = 0;
    this.next = null;
  }

  push(data) {
    if (this.buffer[this.top] !== undefined) return false;
    this.buffer[this.top] = data;
    this.top = this.top + 1 & this.mask;
    return true;
  }

  shift() {
    var last = this.buffer[this.btm];
    if (last === undefined) return undefined;
    this.buffer[this.btm] = undefined;
    this.btm = this.btm + 1 & this.mask;
    return last;
  }

  isEmpty() {
    return this.buffer[this.btm] === undefined;
  }

};

},{}],7:[function(require,module,exports){
"use strict";

var FixedFIFO = require("./fixed-size");

module.exports = class FastFIFO {
  constructor(hwm) {
    this.hwm = hwm || 16;
    this.head = new FixedFIFO(this.hwm);
    this.tail = this.head;
  }

  push(val) {
    if (!this.head.push(val)) {
      var prev = this.head;
      this.head = prev.next = new FixedFIFO(2 * this.head.buffer.length);
      this.head.push(val);
    }
  }

  shift() {
    var val = this.tail.shift();

    if (val === undefined && this.tail.next) {
      var next = this.tail.next;
      this.tail.next = null;
      this.tail = next;
      return this.tail.shift();
    }

    return val;
  }

  isEmpty() {
    return this.head.isEmpty();
  }

};

},{"./fixed-size":6}],8:[function(require,module,exports){
(function (process,Buffer){(function (){
"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var codecs = require('codecs');

var {
  Readable
} = require('streamx');

var mutexify = require('mutexify/promise');

var {
  toPromises,
  unwrap
} = require('hypercore-promisifier');

var RangeIterator = require("./iterators/range");

var HistoryIterator = require("./iterators/history");

var DiffIterator = require("./iterators/diff");

var Extension = require("./lib/extension");

var {
  YoloIndex,
  Node,
  Header
} = require("./lib/messages");

var T = 5;
var MIN_KEYS = T - 1;
var MAX_CHILDREN = MIN_KEYS * 2 + 1;
var SEP = Buffer.alloc(1);
var EMPTY = Buffer.alloc(0);

class Key {
  constructor(seq, value) {
    this.seq = seq;
    this.value = value;
  }

}

class Child {
  constructor(seq, offset, value) {
    this.seq = seq;
    this.offset = offset;
    this.value = value;
  }

}

class Pointers {
  constructor(buf) {
    this.levels = YoloIndex.decode(buf).levels.map(l => {
      var children = [];
      var keys = [];

      for (var i = 0; i < l.keys.length; i++) {
        keys.push(new Key(l.keys[i], null));
      }

      for (var _i = 0; _i < l.children.length; _i += 2) {
        children.push(new Child(l.children[_i], l.children[_i + 1], null));
      }

      return {
        keys,
        children
      };
    });
  }

  get(i) {
    return this.levels[i];
  }

  hasKey(seq) {
    for (var lvl of this.levels) {
      for (var key of lvl.keys) {
        if (key.seq === seq) return true;
      }
    }

    return false;
  }

}

function inflate(buf) {
  return new Pointers(buf);
}

function deflate(index) {
  var levels = index.map(l => {
    var keys = [];
    var children = [];

    for (var i = 0; i < l.value.keys.length; i++) {
      keys.push(l.value.keys[i].seq);
    }

    for (var _i2 = 0; _i2 < l.value.children.length; _i2++) {
      children.push(l.value.children[_i2].seq, l.value.children[_i2].offset);
    }

    return {
      keys,
      children
    };
  });
  return YoloIndex.encode({
    levels
  });
}

class TreeNode {
  constructor(block, keys, children, offset) {
    this.block = block;
    this.offset = offset;
    this.keys = keys;
    this.children = children;
    this.changed = false;
  }

  insertKey(key) {
    var _arguments = arguments,
        _this = this;

    return _asyncToGenerator(function* () {
      var child = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : null;
      var overwrite = _arguments.length > 2 && _arguments[2] !== undefined ? _arguments[2] : true;
      var s = 0;
      var e = _this.keys.length;
      var c;

      while (s < e) {
        var mid = s + e >> 1;
        c = Buffer.compare(key.value, yield _this.getKey(mid));

        if (c === 0) {
          if (!overwrite) return true;
          _this.changed = true;
          _this.keys[mid] = key;
          return true;
        }

        if (c < 0) e = mid;else s = mid + 1;
      }

      var i = c < 0 ? e : s;

      _this.keys.splice(i, 0, key);

      if (child) _this.children.splice(i + 1, 0, new Child(0, 0, child));
      _this.changed = true;
      return _this.keys.length < MAX_CHILDREN;
    })();
  }

  removeKey(index) {
    this.keys.splice(index, 1);

    if (this.children.length) {
      this.children[index + 1].seq = 0; // mark as freed

      this.children.splice(index + 1, 1);
    }

    this.changed = true;
  }

  siblings(parent) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      for (var i = 0; i < parent.children.length; i++) {
        if (parent.children[i].value === _this2) {
          var left = i ? parent.getChildNode(i - 1) : null;
          var right = i < parent.children.length - 1 ? parent.getChildNode(i + 1) : null;
          return {
            left: yield left,
            index: i,
            right: yield right
          };
        }
      }

      throw new Error('Bad parent');
    })();
  }

  merge(node, median) {
    this.changed = true;
    this.keys.push(median);

    for (var i = 0; i < node.keys.length; i++) {
      this.keys.push(node.keys[i]);
    }

    for (var _i3 = 0; _i3 < node.children.length; _i3++) {
      this.children.push(node.children[_i3]);
    }
  }

  split() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var len = _this3.keys.length >> 1;
      var right = TreeNode.create(_this3.block);

      while (right.keys.length < len) {
        right.keys.push(_this3.keys.pop());
      }

      right.keys.reverse();
      yield _this3.getKey(_this3.keys.length - 1); // make sure the median is loaded

      var median = _this3.keys.pop();

      if (_this3.children.length) {
        while (right.children.length < len + 1) {
          right.children.push(_this3.children.pop());
        }

        right.children.reverse();
      }

      _this3.changed = true;
      return {
        left: _this3,
        median,
        right
      };
    })();
  }

  getChildNode(index) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var child = _this4.children[index];
      if (child.value) return child.value;
      var block = child.seq === _this4.block.seq ? _this4.block : yield _this4.block.tree.getBlock(child.seq);
      return child.value = block.getTreeNode(child.offset);
    })();
  }

  setKey(index, key) {
    this.keys[index] = key;
    this.changed = true;
  }

  getKey(index) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      var key = _this5.keys[index];
      if (key.value) return key.value;
      var k = key.seq === _this5.block.seq ? _this5.block.key : yield _this5.block.tree.getKey(key.seq);
      return key.value = k;
    })();
  }

  indexChanges(index, seq) {
    var offset = index.push(null) - 1;
    this.changed = false;

    for (var child of this.children) {
      if (!child.value || !child.value.changed) continue;
      child.seq = seq;
      child.offset = child.value.indexChanges(index, seq);
      index[child.offset] = child;
    }

    return offset;
  }

  static create(block) {
    var node = new TreeNode(block, [], [], 0);
    node.changed = true;
    return node;
  }

}

class BlockEntry {
  constructor(seq, tree, entry) {
    this.seq = seq;
    this.tree = tree;
    this.index = null;
    this.indexBuffer = entry.index;
    this.key = entry.key;
    this.value = entry.value;
  }

  isDeletion() {
    if (this.value !== null) return false;

    if (this.index === null) {
      this.index = inflate(this.indexBuffer);
      this.indexBuffer = null;
    }

    return !this.index.hasKey(this.seq);
  }

  final() {
    return {
      seq: this.seq,
      key: this.tree.keyEncoding ? this.tree.keyEncoding.decode(this.key) : this.key,
      value: this.value && (this.tree.valueEncoding ? this.tree.valueEncoding.decode(this.value) : this.value)
    };
  }

  getTreeNode(offset) {
    if (this.index === null) {
      this.index = inflate(this.indexBuffer);
      this.indexBuffer = null;
    }

    var entry = this.index.get(offset);
    return new TreeNode(this, entry.keys, entry.children, offset);
  }

}

class BatchEntry extends BlockEntry {
  constructor(seq, tree, key, value, index) {
    super(seq, tree, {
      key,
      value,
      index: null
    });
    this.pendingIndex = index;
  }

  getTreeNode(offset) {
    return this.pendingIndex[offset].value;
  }

} // small abstraction to track feed "get"s so they can be cancelled.
// we might wanna fold something like this into hypercore


class ActiveRequests {
  constructor(feed) {
    this.feed = feed;
    this.requests = new Set();
  }

  add(req) {
    this.requests.add(req);
  }

  remove(req) {
    this.requests.delete(req);
  }

  cancel() {
    for (var req of this.requests) {
      this.feed.cancel(req);
    }
  }

}

class HyperBee {
  constructor(feed) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._feed = toPromises(feed);
    this.keyEncoding = opts.keyEncoding ? codecs(opts.keyEncoding) : null;
    this.valueEncoding = opts.valueEncoding ? codecs(opts.valueEncoding) : null;
    this.extension = opts.extension !== false ? opts.extension || Extension.register(this) : null;
    this.metadata = opts.metadata || null;
    this.lock = opts.lock || mutexify();
    this.sep = opts.sep || SEP;
    this.readonly = !!opts.readonly;
    this.prefix = opts.prefix || null;
    this._unprefixedKeyEncoding = this.keyEncoding;
    this._sub = !!this.prefix;
    this._checkout = opts.checkout || 0;
    this._ready = opts._ready || null;
    if (this.prefix) this.keyEncoding = prefixEncoding(this.prefix, this.keyEncoding);
  }

  get feed() {
    if (!this._feed) return null;
    return unwrap(this._feed);
  }

  ready() {
    if (this._ready !== null) return this._ready;
    this._ready = this._open();
    return this._ready;
  }

  _open() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      yield _this6._feed.ready();
      if (_this6._feed.length > 0 || !_this6._feed.writable || _this6.readonly) return;
      return _this6._feed.append(Header.encode({
        protocol: 'hyperbee',
        metadata: _this6.metadata
      }));
    })();
  }

  get version() {
    return Math.max(1, this._checkout || this._feed.length);
  }

  update() {
    return this._feed.update({
      ifAvailable: true,
      hash: false
    }).then(() => true, () => false);
  }

  getRoot(opts) {
    var _arguments2 = arguments,
        _this7 = this;

    return _asyncToGenerator(function* () {
      var batch = _arguments2.length > 1 && _arguments2[1] !== undefined ? _arguments2[1] : _this7;
      yield _this7.ready();
      if (_this7._checkout === 0 && !_this7._feed.writable && (opts && opts.update) !== false) yield _this7.update();
      var len = _this7._checkout || _this7._feed.length;
      if (len < 2) return null;
      return (yield batch.getBlock(len - 1, opts)).getTreeNode(0);
    })();
  }

  getKey(seq) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      return (yield _this8.getBlock(seq)).key;
    })();
  }

  getBlock(seq, opts) {
    var _arguments3 = arguments,
        _this9 = this;

    return _asyncToGenerator(function* () {
      var batch = _arguments3.length > 2 && _arguments3[2] !== undefined ? _arguments3[2] : _this9;
      var active = opts.active;

      var request = _this9._feed.get(seq, _objectSpread(_objectSpread({}, opts), {}, {
        valueEncoding: Node
      }));

      if (active) active.add(request);

      try {
        var entry = yield request;
        return new BlockEntry(seq, batch, entry);
      } finally {
        if (active) active.remove(request);
      }
    })();
  }

  peek(opts) {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      // copied from the batch since we can then use the iterator warmup ext...
      // TODO: figure out how to not simply copy the code
      var ite = _this10.createRangeIterator(_objectSpread(_objectSpread({}, opts), {}, {
        limit: 1
      }));

      yield ite.open();
      return ite.next();
    })();
  }

  createRangeIterator() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var active = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var extension = opts.extension === false && opts.limit !== 0 ? null : this.extension;

    if (extension) {
      var {
        onseq,
        onwait
      } = opts;
      var version = 0;
      var next = 0;
      opts = encRange(this.keyEncoding, _objectSpread(_objectSpread({}, opts), {}, {
        sub: this._sub,
        active,

        onseq(seq) {
          if (!version) version = seq + 1;
          if (next) next--;
          if (onseq) onseq(seq);
        },

        onwait(seq) {
          if (!next) {
            next = Extension.BATCH_SIZE;
            extension.iterator(ite.snapshot(version));
          }

          if (onwait) onwait(seq);
        }

      }));
    } else {
      opts = encRange(this.keyEncoding, _objectSpread(_objectSpread({}, opts), {}, {
        sub: this._sub,
        active
      }));
    }

    var ite = new RangeIterator(new Batch(this, false, false, opts), opts);
    return ite;
  }

  createReadStream(opts) {
    return iteratorToStream(this.createRangeIterator(opts, new ActiveRequests(this._feed)));
  }

  createHistoryStream(opts) {
    var active = new ActiveRequests(this._feed);
    opts = _objectSpread({
      active
    }, opts);
    return iteratorToStream(new HistoryIterator(new Batch(this, false, false, opts), opts), active);
  }

  createDiffStream(right, opts) {
    var active = new ActiveRequests(this._feed);
    if (typeof right === 'number') right = this.checkout(right);
    if (this.keyEncoding) opts = encRange(this.keyEncoding, _objectSpread(_objectSpread({}, opts), {}, {
      sub: this._sub,
      active
    }));else opts = _objectSpread(_objectSpread({}, opts), {}, {
      active
    });
    return iteratorToStream(new DiffIterator(new Batch(this, false, false, opts), new Batch(right, false, false, opts), opts), active);
  }

  get(key, opts) {
    var b = new Batch(this, false, true, _objectSpread({}, opts));
    return b.get(key);
  }

  put(key, value, opts) {
    var b = new Batch(this, true, true, opts);
    return b.put(key, value);
  }

  batch(opts) {
    return new Batch(this, false, true, opts);
  }

  del(key, opts) {
    var b = new Batch(this, true, true, opts);
    return b.del(key);
  }

  checkout(version) {
    return new HyperBee(this._feed, {
      _ready: this.ready(),
      sep: this.sep,
      checkout: version,
      extension: this.extension,
      keyEncoding: this.keyEncoding,
      valueEncoding: this.valueEncoding
    });
  }

  snapshot() {
    return this.checkout(this.version);
  }

  sub(prefix) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var sep = opts.sep || this.sep;
    if (!Buffer.isBuffer(sep)) sep = Buffer.from(sep);
    prefix = Buffer.concat([this.prefix || EMPTY, Buffer.from(prefix), sep]);
    var valueEncoding = codecs(opts.valueEncoding || this.valueEncoding);
    var keyEncoding = codecs(opts.keyEncoding || this._unprefixedKeyEncoding);
    return new HyperBee(this._feed, {
      _ready: this.ready(),
      prefix,
      sep: this.sep,
      lock: this.lock,
      checkout: this._checkout,
      extension: this.extension,
      valueEncoding,
      keyEncoding
    });
  }

}

class Batch {
  constructor(tree, autoFlush, cache) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    this.tree = tree;
    this.keyEncoding = tree.keyEncoding;
    this.valueEncoding = tree.valueEncoding;
    this.blocks = cache ? new Map() : null;
    this.autoFlush = autoFlush;
    this.rootSeq = 0;
    this.root = null;
    this.length = 0;
    this.options = options;
    this.overwrite = options.overwrite !== false;
    this.locked = null;
    this.onseq = this.options.onseq || noop;
  }

  ready() {
    return this.tree.ready();
  }

  lock() {
    var _this11 = this;

    return _asyncToGenerator(function* () {
      if (_this11.tree.readonly) throw new Error('Hyperbee is marked as read-only');
      if (_this11.locked === null) _this11.locked = yield _this11.tree.lock();
    })();
  }

  get version() {
    return this.tree.version + this.length;
  }

  getRoot() {
    if (this.root !== null) return this.root;
    return this.tree.getRoot(this.options, this);
  }

  getKey(seq) {
    var _this12 = this;

    return _asyncToGenerator(function* () {
      return (yield _this12.getBlock(seq)).key;
    })();
  }

  getBlock(seq) {
    var _this13 = this;

    return _asyncToGenerator(function* () {
      if (_this13.rootSeq === 0) _this13.rootSeq = seq;

      var b = _this13.blocks && _this13.blocks.get(seq);

      if (b) return b;

      _this13.onseq(seq);

      b = yield _this13.tree.getBlock(seq, _this13.options, _this13);
      if (_this13.blocks) _this13.blocks.set(seq, b);
      return b;
    })();
  }

  _onwait(key) {
    this.options.onwait = null;
    this.tree.extension.get(this.rootSeq, key);
  }

  peek(range) {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      var ite = new RangeIterator(_this14, range);
      yield ite.open();
      return ite.next();
    })();
  }

  get(key) {
    var _this15 = this;

    return _asyncToGenerator(function* () {
      if (_this15.keyEncoding) key = enc(_this15.keyEncoding, key);
      if (_this15.options.extension !== false) _this15.options.onwait = _this15._onwait.bind(_this15, key);
      var node = yield _this15.getRoot();
      if (!node) return null;

      while (true) {
        var s = 0;
        var e = node.keys.length;
        var c = void 0;

        while (s < e) {
          var mid = s + e >> 1;
          c = Buffer.compare(key, yield node.getKey(mid));

          if (c === 0) {
            return (yield _this15.getBlock(node.keys[mid].seq)).final();
          }

          if (c < 0) e = mid;else s = mid + 1;
        }

        if (!node.children.length) return null;
        var i = c < 0 ? e : s;
        node = yield node.getChildNode(i);
      }
    })();
  }

  put(key, value) {
    var _this16 = this;

    return _asyncToGenerator(function* () {
      if (!_this16.locked) yield _this16.lock();
      key = enc(_this16.keyEncoding, key);
      value = enc(_this16.valueEncoding, value);
      var stack = [];
      var root;
      var node = root = yield _this16.getRoot();
      if (!node) node = root = TreeNode.create(null);
      var seq = _this16.tree._feed.length + _this16.length;
      var target = new Key(seq, key);

      while (node.children.length) {
        stack.push(node);
        node.changed = true; // changed, but compressible

        var s = 0;
        var e = node.keys.length;
        var c = void 0;

        while (s < e) {
          var mid = s + e >> 1;
          c = Buffer.compare(target.value, yield node.getKey(mid));

          if (c === 0) {
            if (!_this16.overwrite) return _this16._unlockMaybe();
            node.setKey(mid, target);
            return _this16._append(root, seq, key, value);
          }

          if (c < 0) e = mid;else s = mid + 1;
        }

        var i = c < 0 ? e : s;
        node = yield node.getChildNode(i);
      }

      var needsSplit = !(yield node.insertKey(target, null, _this16.overwrite));
      if (!node.changed) return _this16._unlockMaybe();

      while (needsSplit) {
        var parent = stack.pop();
        var {
          median,
          right
        } = yield node.split();

        if (parent) {
          needsSplit = !(yield parent.insertKey(median, right, false));
          node = parent;
        } else {
          root = TreeNode.create(node.block);
          root.changed = true;
          root.keys.push(median);
          root.children.push(new Child(0, 0, node), new Child(0, 0, right));
          needsSplit = false;
        }
      }

      return _this16._append(root, seq, key, value);
    })();
  }

  del(key) {
    var _this17 = this;

    return _asyncToGenerator(function* () {
      if (!_this17.locked) yield _this17.lock();
      key = enc(_this17.keyEncoding, key);
      var stack = [];
      var node = yield _this17.getRoot();
      if (!node) return _this17._unlockMaybe();
      var seq = _this17.tree._feed.length + _this17.length;

      while (true) {
        stack.push(node);
        var s = 0;
        var e = node.keys.length;
        var c = void 0;

        while (s < e) {
          var mid = s + e >> 1;
          c = Buffer.compare(key, yield node.getKey(mid));

          if (c === 0) {
            if (node.children.length) yield setKeyToNearestLeaf(node, mid, stack);else node.removeKey(mid); // we mark these as changed late, so we don't rewrite them if it is a 404

            for (var _node of stack) {
              _node.changed = true;
            }

            return _this17._append(yield rebalance(stack), seq, key, null);
          }

          if (c < 0) e = mid;else s = mid + 1;
        }

        if (!node.children.length) return _this17._unlockMaybe();
        var i = c < 0 ? e : s;
        node = yield node.getChildNode(i);
      }
    })();
  }

  flush() {
    if (!this.length) return Promise.resolve();
    var batch = new Array(this.length);

    for (var i = 0; i < this.length; i++) {
      var seq = this.tree._feed.length + i;
      var {
        pendingIndex,
        key,
        value
      } = this.blocks.get(seq);

      if (i < this.length - 1) {
        pendingIndex[0] = null;
        var j = 0;

        while (j < pendingIndex.length) {
          var idx = pendingIndex[j];

          if (idx !== null && idx.seq === seq) {
            idx.offset = j++;
            continue;
          }

          if (j === pendingIndex.length - 1) pendingIndex.pop();else pendingIndex[j] = pendingIndex.pop();
        }
      }

      batch[i] = Node.encode({
        key,
        value,
        index: deflate(pendingIndex)
      });
    }

    this.root = null;
    this.blocks.clear();
    this.length = 0;
    return this._appendBatch(batch);
  }

  _unlockMaybe() {
    if (this.autoFlush) this._unlock();
  }

  _unlock() {
    var locked = this.locked;
    this.locked = null;
    if (locked !== null) locked();
  }

  _append(root, seq, key, value) {
    var index = [];
    root.indexChanges(index, seq);
    index[0] = new Child(seq, 0, root);

    if (!this.autoFlush) {
      var block = new BatchEntry(seq, this, key, value, index);
      if (!root.block) root.block = block;
      this.root = root;
      this.length++;
      this.blocks.set(seq, block);
      return;
    }

    return this._appendBatch(Node.encode({
      key,
      value,
      index: deflate(index)
    }));
  }

  _appendBatch(raw) {
    var _this18 = this;

    return _asyncToGenerator(function* () {
      try {
        yield _this18.tree._feed.append(raw);
      } finally {
        _this18._unlock();
      }
    })();
  }

}

function leafSize(_x, _x2) {
  return _leafSize.apply(this, arguments);
}

function _leafSize() {
  _leafSize = _asyncToGenerator(function* (node, goLeft) {
    while (node.children.length) {
      node = yield node.getChildNode(goLeft ? 0 : node.children.length - 1);
    }

    return node.keys.length;
  });
  return _leafSize.apply(this, arguments);
}

function setKeyToNearestLeaf(_x3, _x4, _x5) {
  return _setKeyToNearestLeaf.apply(this, arguments);
}

function _setKeyToNearestLeaf() {
  _setKeyToNearestLeaf = _asyncToGenerator(function* (node, index, stack) {
    var [left, right] = yield Promise.all([node.getChildNode(index), node.getChildNode(index + 1)]);
    var [ls, rs] = yield Promise.all([leafSize(left, false), leafSize(right, true)]);

    if (ls < rs) {
      stack.push(right);

      while (right.children.length) {
        stack.push(right = right.children[0].value);
      }

      node.keys[index] = right.keys.shift();
    } else {
      stack.push(left);

      while (left.children.length) {
        stack.push(left = left.children[left.children.length - 1].value);
      }

      node.keys[index] = left.keys.pop();
    }
  });
  return _setKeyToNearestLeaf.apply(this, arguments);
}

function rebalance(_x6) {
  return _rebalance.apply(this, arguments);
}

function _rebalance() {
  _rebalance = _asyncToGenerator(function* (stack) {
    var root = stack[0];

    while (stack.length > 1) {
      var node = stack.pop();
      var parent = stack[stack.length - 1];
      if (node.keys.length >= MIN_KEYS) return root;
      var {
        left,
        index,
        right
      } = yield node.siblings(parent); // maybe borrow from left sibling?

      if (left && left.keys.length > MIN_KEYS) {
        left.changed = true;
        node.keys.unshift(parent.keys[index - 1]);
        if (left.children.length) node.children.unshift(left.children.pop());
        parent.keys[index - 1] = left.keys.pop();
        return root;
      } // maybe borrow from right sibling?


      if (right && right.keys.length > MIN_KEYS) {
        right.changed = true;
        node.keys.push(parent.keys[index]);
        if (right.children.length) node.children.push(right.children.shift());
        parent.keys[index] = right.keys.shift();
        return root;
      } // merge node with another sibling


      if (left) {
        index--;
        right = node;
      } else {
        left = node;
      }

      left.merge(right, parent.keys[index]);
      parent.removeKey(index);
    } // check if the tree shrunk


    if (!root.keys.length && root.children.length) return root.getChildNode(0);
    return root;
  });
  return _rebalance.apply(this, arguments);
}

function iteratorToStream(ite, active) {
  var done;
  var rs = new Readable({
    predestroy() {
      if (active) active.cancel();
    },

    open(cb) {
      done = cb;
      ite.open().then(fin, fin);
    },

    read(cb) {
      done = cb;
      ite.next().then(push, fin);
    }

  });
  return rs;

  function fin(err) {
    process.nextTick(done, err);
  }

  function push(val) {
    process.nextTick(pushNT, val);
  }

  function pushNT(val) {
    rs.push(val);
    done(null);
  }
}

function encRange(e, opts) {
  if (!e) return opts;
  if (opts.gt !== undefined) opts.gt = enc(e, opts.gt);
  if (opts.gte !== undefined) opts.gte = enc(e, opts.gte);
  if (opts.lt !== undefined) opts.lt = enc(e, opts.lt);
  if (opts.lte !== undefined) opts.lte = enc(e, opts.lte);
  if (opts.sub && !opts.gt && !opts.gte) opts.gt = enc(e, SEP);
  if (opts.sub && !opts.lt && !opts.lte) opts.lt = bump(enc(e, EMPTY));
  return opts;
}

function bump(key) {
  // key should have been copied by enc above before hitting this
  key[key.length - 1]++;
  return key;
}

function enc(e, v) {
  if (v === undefined || v === null) return null;
  if (e !== null) return e.encode(v);
  if (typeof v === 'string') return Buffer.from(v);
  return v;
}

function prefixEncoding(prefix, keyEncoding) {
  return {
    encode(key) {
      return Buffer.concat([prefix, Buffer.isBuffer(key) ? key : enc(keyEncoding, key)]);
    },

    decode(key) {
      var sliced = key.slice(prefix.length, key.length);
      return keyEncoding ? keyEncoding.decode(sliced) : sliced;
    }

  };
}

function noop() {}

module.exports = HyperBee;

}).call(this)}).call(this,require('_process'),require("buffer").Buffer)
},{"./iterators/diff":9,"./iterators/history":10,"./iterators/range":11,"./lib/extension":12,"./lib/messages":13,"_process":19,"buffer":2,"codecs":4,"hypercore-promisifier":14,"mutexify/promise":18,"streamx":22}],9:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

class SubTree {
  constructor(node, parent) {
    this.node = node;
    this.parent = parent;
    this.isKey = node.children.length === 0;
    this.i = this.isKey ? 1 : 0;
    this.n = 0;
    var child = this.isKey ? null : this.node.children[0];
    this.seq = child !== null ? child.seq : this.node.keys[0].seq;
    this.offset = child !== null ? child.offset : 0;
  }

  next() {
    this.i++;
    this.isKey = (this.i & 1) === 1;
    if (!this.isKey && !this.node.children.length) this.i++;
    return this.update();
  }

  bisect(key, incl) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var s = 0;
      var e = _this.node.keys.length;
      var c;

      while (s < e) {
        var mid = s + e >> 1;
        c = cmp(key, yield _this.node.getKey(mid));

        if (c === 0) {
          if (incl) _this.i = mid * 2 + 1;else _this.i = mid * 2 + (_this.node.children.length ? 2 : 3);
          return true;
        }

        if (c < 0) e = mid;else s = mid + 1;
      }

      var i = c < 0 ? e : s;
      _this.i = 2 * i + (_this.node.children.length ? 0 : 1);
      return _this.node.children.length === 0;
    })();
  }

  update() {
    this.isKey = (this.i & 1) === 1;
    this.n = this.i >> 1;
    if (this.n >= (this.isKey ? this.node.keys.length : this.node.children.length)) return false;
    var child = this.isKey ? null : this.node.children[this.n];
    this.seq = child !== null ? child.seq : this.node.keys[this.n].seq;
    this.offset = child !== null ? child.offset : 0;
    return true;
  }

  key() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return _this2.n < _this2.node.keys.length ? _this2.node.getKey(_this2.n) : _this2.parent && _this2.parent.key();
    })();
  }

  compare(tree) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var [a, b] = yield Promise.all([_this3.key(), tree.key()]);
      return cmp(a, b);
    })();
  }

}

class TreeIterator {
  constructor(db, opts) {
    this.db = db;
    this.stack = [];
    this.lt = opts.lt || opts.lte || null;
    this.lte = !!opts.lte;
    this.gt = opts.gt || opts.gte || null;
    this.gte = !!opts.gte;
    this.seeking = !!this.gt;
  }

  open() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var node = yield _this4.db.getRoot();
      if (!node.keys.length) return;
      var tree = new SubTree(node, null);
      if (_this4.seeking && !(yield _this4._seek(tree))) return;

      _this4.stack.push(tree);
    })();
  }

  _seek(tree) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      var done = yield tree.bisect(_this5.gt, _this5.gte);
      var oob = !tree.update();

      if (done || oob) {
        _this5.seeking = false;
        if (oob) return false;
      }

      return true;
    })();
  }

  peek() {
    if (!this.stack.length) return null;
    return this.stack[this.stack.length - 1];
  }

  skip() {
    if (!this.stack.length) return;
    if (!this.stack[this.stack.length - 1].next()) this.stack.pop();
  }

  nextKey() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      var n = null;

      while (_this6.stack.length && n === null) {
        n = yield _this6.next();
      }

      if (!_this6.lt) return n.final();
      var c = cmp(n.key, _this6.lt);
      if (_this6.lte ? c <= 0 : c < 0) return n.final();
      _this6.stack = [];
      return null;
    })();
  }

  next() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      if (!_this7.stack.length) return null;
      var top = _this7.stack[_this7.stack.length - 1];
      var {
        isKey,
        n,
        seq
      } = top;

      if (!top.next()) {
        _this7.stack.pop();
      }

      if (isKey) {
        _this7.seeking = false;
        return _this7.db.getBlock(seq);
      }

      var child = yield top.node.getChildNode(n);
      top.node.children[n] = null; // unlink to save memory

      var tree = new SubTree(child, top);
      if (_this7.seeking && !(yield _this7._seek(tree))) return;

      _this7.stack.push(tree);

      return null;
    })();
  }

}

module.exports = class DiffIterator {
  constructor(left, right) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    this.left = new TreeIterator(left, opts);
    this.right = new TreeIterator(right, opts);
    this.limit = typeof opts.limit === 'number' ? opts.limit : -1;
  }

  open() {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      yield Promise.all([_this8.left.open(), _this8.right.open()]);
    })();
  }

  next() {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      if (_this9.limit === 0) return null;
      var res = yield _this9._next();
      if (!res || res.left === null && res.right === null) return null;
      _this9.limit--;
      return res;
    })();
  }

  _next() {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      var a = _this10.left;
      var b = _this10.right;

      while (true) {
        var [l, r] = yield Promise.all([a.peek(), b.peek()]);
        if (!l && !r) return null;
        if (!l) return {
          left: null,
          right: yield b.nextKey()
        };
        if (!r) return {
          left: yield a.nextKey(),
          right: null
        };

        if (l.seq === r.seq && l.isKey === r.isKey && l.offset === r.offset) {
          a.skip();
          b.skip();
          continue;
        }

        var c = yield l.compare(r);

        if (l.isKey && !r.isKey) {
          if (c > 0) b.skip();else yield b.next();
          continue;
        }

        if (!l.isKey && r.isKey) {
          if (c < 0) a.skip();else yield a.next();
          continue;
        }

        if (l.isKey && r.isKey) {
          if (c === 0) return {
            left: yield a.nextKey(),
            right: yield b.nextKey()
          };
          if (c < 0) return {
            left: yield a.nextKey(),
            right: null
          };
          return {
            left: null,
            right: yield b.nextKey()
          };
        }

        if (c === 0) yield Promise.all([a.next(), b.next()]);else if (c < 0) yield b.next();else yield a.next();
      }
    })();
  }

};

function cmp(a, b) {
  if (!a) return b ? 1 : 0;
  if (!b) return a ? -1 : 0;
  return Buffer.compare(a, b);
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2}],10:[function(require,module,exports){
"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

module.exports = class HistoryIterator {
  constructor(db) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.db = db;
    this.options = opts;
    this.live = !!opts.live;
    this.gte = 0;
    this.lt = 0;
    this.reverse = !!opts.reverse;
    this.limit = typeof opts.limit === 'number' ? opts.limit : -1;

    if (this.live && this.reverse) {
      throw new Error('Cannot have both live and reverse enabled');
    }
  }

  open() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.db.getRoot(); // does the update dance

      _this.gte = gte(_this.options, _this.db.version);
      _this.lt = _this.live ? Infinity : lt(_this.options, _this.db.version);
    })();
  }

  next() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (_this2.limit === 0) return null;
      if (_this2.limit > 0) _this2.limit--;
      if (_this2.gte >= _this2.lt) return null;

      if (_this2.reverse) {
        if (_this2.lt <= 1) return null;
        return final(yield _this2.db.getBlock(--_this2.lt, _this2.options));
      }

      return final(yield _this2.db.getBlock(_this2.gte++, _this2.options));
    })();
  }

};

function final(node) {
  var type = node.isDeletion() ? 'del' : 'put';
  return _objectSpread({
    type
  }, node.final());
}

function gte(opts, version) {
  if (opts.gt) return (opts.gt < 0 ? opts.gt + version : opts.gt) + 1;
  var gte = opts.gte || opts.since || 1;
  return gte < 0 ? gte + version : gte;
}

function lt(opts, version) {
  if (opts.lte === 0 || opts.lt === 0 || opts.end === 0) return 0;
  if (opts.lte) return (opts.lte < 0 ? opts.lte + version : opts.lte) + 1;
  var lt = opts.lt || opts.end || version;
  return lt < 0 ? lt + version : lt;
}

},{}],11:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

module.exports = class RangeIterator {
  constructor(db) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.db = db;
    this.stack = [];
    this.opened = false;
    this._limit = typeof opts.limit === 'number' ? opts.limit : -1;
    this._gIncl = !opts.gt;
    this._gKey = opts.gt || opts.gte || null;
    this._lIncl = !opts.lt;
    this._lKey = opts.lt || opts.lte || null;
    this._reverse = !!opts.reverse;
    this._version = 0;
    this._checkpoint = opts.checkpoint && opts.checkpoint.length ? opts.checkpoint : null;
    this._nexting = false;
  }

  snapshot() {
    var version = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.db.version;
    var checkpoint = [];

    for (var s of this.stack) {
      var {
        node,
        i
      } = s;
      if (this._nexting && s === this.stack[this.stack.length - 1]) i = this._reverse ? i + 1 : i - 1;
      if (!node.block) continue;
      if (i < 0) continue;
      checkpoint.push(node.block.seq, node.offset, i);
    }

    return {
      version,
      gte: this._gIncl ? this._gKey : null,
      gt: this._gIncl ? null : this._gKey,
      lte: this._lIncl ? this._lKey : null,
      lt: this._lIncl ? null : this._lKey,
      limit: this._limit,
      reverse: this._reverse,
      ended: this.opened && !checkpoint.length,
      checkpoint: this.opened ? checkpoint : []
    };
  }

  open() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this._open();
      _this.opened = true;
    })();
  }

  _open() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (_this2._checkpoint) {
        for (var j = 0; j < _this2._checkpoint.length; j += 3) {
          var seq = _this2._checkpoint[j];
          var offset = _this2._checkpoint[j + 1];
          var i = _this2._checkpoint[j + 2];

          _this2.stack.push({
            node: (yield _this2.db.getBlock(seq)).getTreeNode(offset),
            i
          });
        }

        return;
      }

      _this2._nexting = true;
      var node = yield _this2.db.getRoot();

      if (!node) {
        _this2._nexting = false;
        return;
      }

      var incl = _this2._reverse ? _this2._lIncl : _this2._gIncl;
      var start = _this2._reverse ? _this2._lKey : _this2._gKey;

      if (!start) {
        _this2.stack.push({
          node,
          i: _this2._reverse ? node.keys.length << 1 : 0
        });

        _this2._nexting = false;
        return;
      }

      while (true) {
        var entry = {
          node,
          i: _this2._reverse ? node.keys.length << 1 : 0
        };
        var s = 0;
        var e = node.keys.length;
        var c = void 0;

        while (s < e) {
          var mid = s + e >> 1;
          c = Buffer.compare(start, yield node.getKey(mid));

          if (c === 0) {
            if (incl) entry.i = mid * 2 + 1;else entry.i = mid * 2 + (_this2._reverse ? 0 : 2);

            _this2.stack.push(entry);

            _this2._nexting = false;
            return;
          }

          if (c < 0) e = mid;else s = mid + 1;
        }

        var _i = c < 0 ? e : s;

        entry.i = 2 * _i + (_this2._reverse ? -1 : 1);
        if (entry.i >= 0 && entry.i <= node.keys.length << 1) _this2.stack.push(entry);

        if (!node.children.length) {
          _this2._nexting = false;
          return;
        }

        node = yield node.getChildNode(_i);
      }
    })();
  }

  next() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      // TODO: this nexting flag is only needed if someone asks for a snapshot during
      // a lookup (ie the extension, pretty important...).
      // A better solution would be to refactor this so top.i is incremented eagerly
      // to get the current block instead of the way it is done now (++i vs i++)
      _this3._nexting = true;
      var end = _this3._reverse ? _this3._gKey : _this3._lKey;
      var incl = _this3._reverse ? _this3._gIncl : _this3._lIncl;

      while (_this3.stack.length && (_this3._limit === -1 || _this3._limit > 0)) {
        var top = _this3.stack[_this3.stack.length - 1];
        var isKey = (top.i & 1) === 1;
        var n = _this3._reverse ? top.i < 0 ? top.node.keys.length : top.i-- >> 1 : top.i++ >> 1;

        if (!isKey) {
          if (!top.node.children.length) continue;
          var node = yield top.node.getChildNode(n);
          top.node.children[n] = null; // unlink it to save memory

          _this3.stack.push({
            i: _this3._reverse ? node.keys.length << 1 : 0,
            node
          });

          continue;
        }

        if (n >= top.node.keys.length) {
          _this3.stack.pop();

          continue;
        }

        var key = top.node.keys[n];
        var block = yield _this3.db.getBlock(key.seq);

        if (end) {
          var c = Buffer.compare(block.key, end);

          if (c === 0 ? !incl : _this3._reverse ? c < 0 : c > 0) {
            _this3._limit = 0;
            break;
          }
        }

        if (_this3._limit > 0) _this3._limit--;
        _this3._nexting = false;
        return block.final();
      }

      _this3._nexting = false;
      return null;
    })();
  }

};

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2}],12:[function(require,module,exports){
"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var {
  Extension
} = require("./messages"); // const MAX_ACTIVE = 32


var FLUSH_BATCH = 128;
var MAX_PASSIVE_BATCH = 2048;
var MAX_ACTIVE_BATCH = MAX_PASSIVE_BATCH + FLUSH_BATCH;

class Batch {
  constructor(outgoing, from) {
    this.blocks = [];
    this.start = 0;
    this.end = 0;
    this.outgoing = outgoing;
    this.from = from;
  }

  push(seq) {
    var len = this.blocks.push(seq);
    if (len === 1 || seq < this.start) this.start = seq;
    if (len === 1 || seq >= this.end) this.end = seq + 1;

    if (len >= FLUSH_BATCH) {
      this.send();
      this.clear();
    }
  }

  send() {
    if (!this.blocks.length) return;
    this.outgoing.send(Extension.encode({
      cache: {
        blocks: this.blocks,
        start: this.start,
        end: this.end
      }
    }), this.from);
  }

  clear() {
    this.start = this.end = 0;
    this.blocks = [];
  }

}

class HyperbeeExtension {
  constructor(db) {
    this.encoding = null;
    this.outgoing = null;
    this.db = db;
    this.active = 0;
  }

  get(version, key) {
    this.outgoing.broadcast(Extension.encode({
      get: {
        version,
        key
      }
    }));
  }

  iterator(snapshot) {
    if (snapshot.ended) return;
    if (snapshot.limit === 0) return;
    if (snapshot.limit === -1) snapshot.limit = 0;
    this.outgoing.broadcast(Extension.encode({
      iterator: snapshot
    }));
  }

  onmessage(buf, from) {
    // TODO: handle max active extension messages
    // this.active++
    var message = decode(buf);
    if (!message) return;
    if (message.cache) this.oncache(message.cache, from);
    if (message.get) this.onget(message.get, from);
    if (message.iterator) this.oniterator(message.iterator, from);
  }

  oncache(message, from) {
    if (!message.blocks.length) return;
    this.db.feed.download(message);
  }

  onget(message, from) {
    if (!message.version) return;
    var b = new Batch(this.outgoing, from);
    var done = b.send.bind(b);
    this.db.checkout(message.version).get(message.key, {
      extension: false,
      wait: false,
      update: false,
      onseq
    }).then(done, done);

    function onseq(seq) {
      b.push(seq);
    }
  }

  oniterator(message, from) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (!message.version) return;
      var b = new Batch(_this.outgoing, from);
      var skip = message.checkpoint.length;
      var work = 0;

      var db = _this.db.checkout(message.version);

      var ite = db.createRangeIterator(_objectSpread(_objectSpread({}, message), {}, {
        wait: false,
        extension: false,
        update: false,
        limit: message.limit === 0 ? -1 : message.limit,

        onseq(seq) {
          if (skip && skip--) return;
          work++;
          b.push(seq);
        }

      }));

      try {
        yield ite.open(); // eslint-disable-next-line no-unmodified-loop-condition

        while (work < MAX_ACTIVE_BATCH) {
          if (!(yield ite.next())) break;
        }
      } catch (_) {// do nothing
      } finally {
        b.send();
      }
    })();
  }

  static register(db) {
    var e = new this(db);
    e.outgoing = db.feed.registerExtension('hyperbee', e);
    return e;
  }

}

HyperbeeExtension.BATCH_SIZE = MAX_PASSIVE_BATCH;
module.exports = HyperbeeExtension;

function decode(buf) {
  try {
    return Extension.decode(buf);
  } catch (err) {
    return null;
  }
}

},{"./messages":13}],13:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

// This file is auto generated by the protocol-buffers compiler

/* eslint-disable quotes */

/* eslint-disable indent */

/* eslint-disable no-redeclare */

/* eslint-disable camelcase */
// Remember to `npm install --save protocol-buffers-encodings`
var encodings = require('protocol-buffers-encodings');

var varint = encodings.varint;
var skip = encodings.skip;
var YoloIndex = exports.YoloIndex = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
};
var Header = exports.Header = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
};
var Node = exports.Node = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
};
var Extension = exports.Extension = {
  buffer: true,
  encodingLength: null,
  encode: null,
  decode: null
};
defineYoloIndex();
defineHeader();
defineNode();
defineExtension();

function defineYoloIndex() {
  var Level = YoloIndex.Level = {
    buffer: true,
    encodingLength: null,
    encode: null,
    decode: null
  };
  defineLevel();

  function defineLevel() {
    Level.encodingLength = encodingLength;
    Level.encode = encode;
    Level.decode = decode;

    function encodingLength(obj) {
      var length = 0;

      if (defined(obj.keys)) {
        var packedLen = 0;

        for (var i = 0; i < obj.keys.length; i++) {
          if (!defined(obj.keys[i])) continue;
          var len = encodings.varint.encodingLength(obj.keys[i]);
          packedLen += len;
        }

        if (packedLen) {
          length += 1 + packedLen + varint.encodingLength(packedLen);
        }
      }

      if (defined(obj.children)) {
        var packedLen = 0;

        for (var i = 0; i < obj.children.length; i++) {
          if (!defined(obj.children[i])) continue;
          var len = encodings.varint.encodingLength(obj.children[i]);
          packedLen += len;
        }

        if (packedLen) {
          length += 1 + packedLen + varint.encodingLength(packedLen);
        }
      }

      return length;
    }

    function encode(obj, buf, offset) {
      if (!offset) offset = 0;
      if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
      var oldOffset = offset;

      if (defined(obj.keys)) {
        var packedLen = 0;

        for (var i = 0; i < obj.keys.length; i++) {
          if (!defined(obj.keys[i])) continue;
          packedLen += encodings.varint.encodingLength(obj.keys[i]);
        }

        if (packedLen) {
          buf[offset++] = 10;
          varint.encode(packedLen, buf, offset);
          offset += varint.encode.bytes;
        }

        for (var i = 0; i < obj.keys.length; i++) {
          if (!defined(obj.keys[i])) continue;
          encodings.varint.encode(obj.keys[i], buf, offset);
          offset += encodings.varint.encode.bytes;
        }
      }

      if (defined(obj.children)) {
        var packedLen = 0;

        for (var i = 0; i < obj.children.length; i++) {
          if (!defined(obj.children[i])) continue;
          packedLen += encodings.varint.encodingLength(obj.children[i]);
        }

        if (packedLen) {
          buf[offset++] = 18;
          varint.encode(packedLen, buf, offset);
          offset += varint.encode.bytes;
        }

        for (var i = 0; i < obj.children.length; i++) {
          if (!defined(obj.children[i])) continue;
          encodings.varint.encode(obj.children[i], buf, offset);
          offset += encodings.varint.encode.bytes;
        }
      }

      encode.bytes = offset - oldOffset;
      return buf;
    }

    function decode(buf, offset, end) {
      if (!offset) offset = 0;
      if (!end) end = buf.length;
      if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
      var oldOffset = offset;
      var obj = {
        keys: [],
        children: []
      };

      while (true) {
        if (end <= offset) {
          decode.bytes = offset - oldOffset;
          return obj;
        }

        var prefix = varint.decode(buf, offset);
        offset += varint.decode.bytes;
        var tag = prefix >> 3;

        switch (tag) {
          case 1:
            var packedEnd = varint.decode(buf, offset);
            offset += varint.decode.bytes;
            packedEnd += offset;

            while (offset < packedEnd) {
              obj.keys.push(encodings.varint.decode(buf, offset));
              offset += encodings.varint.decode.bytes;
            }

            break;

          case 2:
            var packedEnd = varint.decode(buf, offset);
            offset += varint.decode.bytes;
            packedEnd += offset;

            while (offset < packedEnd) {
              obj.children.push(encodings.varint.decode(buf, offset));
              offset += encodings.varint.decode.bytes;
            }

            break;

          default:
            offset = skip(prefix & 7, buf, offset);
        }
      }
    }
  }

  YoloIndex.encodingLength = encodingLength;
  YoloIndex.encode = encode;
  YoloIndex.decode = decode;

  function encodingLength(obj) {
    var length = 0;

    if (defined(obj.levels)) {
      for (var i = 0; i < obj.levels.length; i++) {
        if (!defined(obj.levels[i])) continue;
        var len = Level.encodingLength(obj.levels[i]);
        length += varint.encodingLength(len);
        length += 1 + len;
      }
    }

    return length;
  }

  function encode(obj, buf, offset) {
    if (!offset) offset = 0;
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
    var oldOffset = offset;

    if (defined(obj.levels)) {
      for (var i = 0; i < obj.levels.length; i++) {
        if (!defined(obj.levels[i])) continue;
        buf[offset++] = 10;
        varint.encode(Level.encodingLength(obj.levels[i]), buf, offset);
        offset += varint.encode.bytes;
        Level.encode(obj.levels[i], buf, offset);
        offset += Level.encode.bytes;
      }
    }

    encode.bytes = offset - oldOffset;
    return buf;
  }

  function decode(buf, offset, end) {
    if (!offset) offset = 0;
    if (!end) end = buf.length;
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
    var oldOffset = offset;
    var obj = {
      levels: []
    };

    while (true) {
      if (end <= offset) {
        decode.bytes = offset - oldOffset;
        return obj;
      }

      var prefix = varint.decode(buf, offset);
      offset += varint.decode.bytes;
      var tag = prefix >> 3;

      switch (tag) {
        case 1:
          var len = varint.decode(buf, offset);
          offset += varint.decode.bytes;
          obj.levels.push(Level.decode(buf, offset, offset + len));
          offset += Level.decode.bytes;
          break;

        default:
          offset = skip(prefix & 7, buf, offset);
      }
    }
  }
}

function defineHeader() {
  var Metadata = Header.Metadata = {
    buffer: true,
    encodingLength: null,
    encode: null,
    decode: null
  };
  defineMetadata();

  function defineMetadata() {
    Metadata.encodingLength = encodingLength;
    Metadata.encode = encode;
    Metadata.decode = decode;

    function encodingLength(obj) {
      var length = 0;

      if (defined(obj.contentFeed)) {
        var len = encodings.bytes.encodingLength(obj.contentFeed);
        length += 1 + len;
      }

      if (defined(obj.userData)) {
        var len = encodings.bytes.encodingLength(obj.userData);
        length += 1 + len;
      }

      return length;
    }

    function encode(obj, buf, offset) {
      if (!offset) offset = 0;
      if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
      var oldOffset = offset;

      if (defined(obj.contentFeed)) {
        buf[offset++] = 10;
        encodings.bytes.encode(obj.contentFeed, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      if (defined(obj.userData)) {
        buf[offset++] = 18;
        encodings.bytes.encode(obj.userData, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      encode.bytes = offset - oldOffset;
      return buf;
    }

    function decode(buf, offset, end) {
      if (!offset) offset = 0;
      if (!end) end = buf.length;
      if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
      var oldOffset = offset;
      var obj = {
        contentFeed: null,
        userData: null
      };

      while (true) {
        if (end <= offset) {
          decode.bytes = offset - oldOffset;
          return obj;
        }

        var prefix = varint.decode(buf, offset);
        offset += varint.decode.bytes;
        var tag = prefix >> 3;

        switch (tag) {
          case 1:
            obj.contentFeed = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          case 2:
            obj.userData = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          default:
            offset = skip(prefix & 7, buf, offset);
        }
      }
    }
  }

  Header.encodingLength = encodingLength;
  Header.encode = encode;
  Header.decode = decode;

  function encodingLength(obj) {
    var length = 0;
    if (!defined(obj.protocol)) throw new Error("protocol is required");
    var len = encodings.string.encodingLength(obj.protocol);
    length += 1 + len;

    if (defined(obj.metadata)) {
      var len = Metadata.encodingLength(obj.metadata);
      length += varint.encodingLength(len);
      length += 1 + len;
    }

    return length;
  }

  function encode(obj, buf, offset) {
    if (!offset) offset = 0;
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
    var oldOffset = offset;
    if (!defined(obj.protocol)) throw new Error("protocol is required");
    buf[offset++] = 10;
    encodings.string.encode(obj.protocol, buf, offset);
    offset += encodings.string.encode.bytes;

    if (defined(obj.metadata)) {
      buf[offset++] = 18;
      varint.encode(Metadata.encodingLength(obj.metadata), buf, offset);
      offset += varint.encode.bytes;
      Metadata.encode(obj.metadata, buf, offset);
      offset += Metadata.encode.bytes;
    }

    encode.bytes = offset - oldOffset;
    return buf;
  }

  function decode(buf, offset, end) {
    if (!offset) offset = 0;
    if (!end) end = buf.length;
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
    var oldOffset = offset;
    var obj = {
      protocol: "",
      metadata: null
    };
    var found0 = false;

    while (true) {
      if (end <= offset) {
        if (!found0) throw new Error("Decoded message is not valid");
        decode.bytes = offset - oldOffset;
        return obj;
      }

      var prefix = varint.decode(buf, offset);
      offset += varint.decode.bytes;
      var tag = prefix >> 3;

      switch (tag) {
        case 1:
          obj.protocol = encodings.string.decode(buf, offset);
          offset += encodings.string.decode.bytes;
          found0 = true;
          break;

        case 2:
          var len = varint.decode(buf, offset);
          offset += varint.decode.bytes;
          obj.metadata = Metadata.decode(buf, offset, offset + len);
          offset += Metadata.decode.bytes;
          break;

        default:
          offset = skip(prefix & 7, buf, offset);
      }
    }
  }
}

function defineNode() {
  Node.encodingLength = encodingLength;
  Node.encode = encode;
  Node.decode = decode;

  function encodingLength(obj) {
    var length = 0;
    if (!defined(obj.index)) throw new Error("index is required");
    var len = encodings.bytes.encodingLength(obj.index);
    length += 1 + len;
    if (!defined(obj.key)) throw new Error("key is required");
    var len = encodings.bytes.encodingLength(obj.key);
    length += 1 + len;

    if (defined(obj.value)) {
      var len = encodings.bytes.encodingLength(obj.value);
      length += 1 + len;
    }

    return length;
  }

  function encode(obj, buf, offset) {
    if (!offset) offset = 0;
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
    var oldOffset = offset;
    if (!defined(obj.index)) throw new Error("index is required");
    buf[offset++] = 10;
    encodings.bytes.encode(obj.index, buf, offset);
    offset += encodings.bytes.encode.bytes;
    if (!defined(obj.key)) throw new Error("key is required");
    buf[offset++] = 18;
    encodings.bytes.encode(obj.key, buf, offset);
    offset += encodings.bytes.encode.bytes;

    if (defined(obj.value)) {
      buf[offset++] = 26;
      encodings.bytes.encode(obj.value, buf, offset);
      offset += encodings.bytes.encode.bytes;
    }

    encode.bytes = offset - oldOffset;
    return buf;
  }

  function decode(buf, offset, end) {
    if (!offset) offset = 0;
    if (!end) end = buf.length;
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
    var oldOffset = offset;
    var obj = {
      index: null,
      key: null,
      value: null
    };
    var found0 = false;
    var found1 = false;

    while (true) {
      if (end <= offset) {
        if (!found0 || !found1) throw new Error("Decoded message is not valid");
        decode.bytes = offset - oldOffset;
        return obj;
      }

      var prefix = varint.decode(buf, offset);
      offset += varint.decode.bytes;
      var tag = prefix >> 3;

      switch (tag) {
        case 1:
          obj.index = encodings.bytes.decode(buf, offset);
          offset += encodings.bytes.decode.bytes;
          found0 = true;
          break;

        case 2:
          obj.key = encodings.bytes.decode(buf, offset);
          offset += encodings.bytes.decode.bytes;
          found1 = true;
          break;

        case 3:
          obj.value = encodings.bytes.decode(buf, offset);
          offset += encodings.bytes.decode.bytes;
          break;

        default:
          offset = skip(prefix & 7, buf, offset);
      }
    }
  }
}

function defineExtension() {
  var Get = Extension.Get = {
    buffer: true,
    encodingLength: null,
    encode: null,
    decode: null
  };
  var Iterator = Extension.Iterator = {
    buffer: true,
    encodingLength: null,
    encode: null,
    decode: null
  };
  var Cache = Extension.Cache = {
    buffer: true,
    encodingLength: null,
    encode: null,
    decode: null
  };
  defineGet();
  defineIterator();
  defineCache();

  function defineGet() {
    Get.encodingLength = encodingLength;
    Get.encode = encode;
    Get.decode = decode;

    function encodingLength(obj) {
      var length = 0;

      if (defined(obj.version)) {
        var len = encodings.varint.encodingLength(obj.version);
        length += 1 + len;
      }

      if (defined(obj.key)) {
        var len = encodings.bytes.encodingLength(obj.key);
        length += 1 + len;
      }

      return length;
    }

    function encode(obj, buf, offset) {
      if (!offset) offset = 0;
      if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
      var oldOffset = offset;

      if (defined(obj.version)) {
        buf[offset++] = 8;
        encodings.varint.encode(obj.version, buf, offset);
        offset += encodings.varint.encode.bytes;
      }

      if (defined(obj.key)) {
        buf[offset++] = 18;
        encodings.bytes.encode(obj.key, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      encode.bytes = offset - oldOffset;
      return buf;
    }

    function decode(buf, offset, end) {
      if (!offset) offset = 0;
      if (!end) end = buf.length;
      if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
      var oldOffset = offset;
      var obj = {
        version: 0,
        key: null
      };

      while (true) {
        if (end <= offset) {
          decode.bytes = offset - oldOffset;
          return obj;
        }

        var prefix = varint.decode(buf, offset);
        offset += varint.decode.bytes;
        var tag = prefix >> 3;

        switch (tag) {
          case 1:
            obj.version = encodings.varint.decode(buf, offset);
            offset += encodings.varint.decode.bytes;
            break;

          case 2:
            obj.key = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          default:
            offset = skip(prefix & 7, buf, offset);
        }
      }
    }
  }

  function defineIterator() {
    Iterator.encodingLength = encodingLength;
    Iterator.encode = encode;
    Iterator.decode = decode;

    function encodingLength(obj) {
      var length = 0;

      if (defined(obj.version)) {
        var len = encodings.varint.encodingLength(obj.version);
        length += 1 + len;
      }

      if (defined(obj.gte)) {
        var len = encodings.bytes.encodingLength(obj.gte);
        length += 1 + len;
      }

      if (defined(obj.gt)) {
        var len = encodings.bytes.encodingLength(obj.gt);
        length += 1 + len;
      }

      if (defined(obj.lte)) {
        var len = encodings.bytes.encodingLength(obj.lte);
        length += 1 + len;
      }

      if (defined(obj.lt)) {
        var len = encodings.bytes.encodingLength(obj.lt);
        length += 1 + len;
      }

      if (defined(obj.limit)) {
        var len = encodings.varint.encodingLength(obj.limit);
        length += 1 + len;
      }

      if (defined(obj.reverse)) {
        var len = encodings.bool.encodingLength(obj.reverse);
        length += 1 + len;
      }

      if (defined(obj.checkpoint)) {
        var packedLen = 0;

        for (var i = 0; i < obj.checkpoint.length; i++) {
          if (!defined(obj.checkpoint[i])) continue;
          var len = encodings.varint.encodingLength(obj.checkpoint[i]);
          packedLen += len;
        }

        if (packedLen) {
          length += 1 + packedLen + varint.encodingLength(packedLen);
        }
      }

      return length;
    }

    function encode(obj, buf, offset) {
      if (!offset) offset = 0;
      if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
      var oldOffset = offset;

      if (defined(obj.version)) {
        buf[offset++] = 8;
        encodings.varint.encode(obj.version, buf, offset);
        offset += encodings.varint.encode.bytes;
      }

      if (defined(obj.gte)) {
        buf[offset++] = 18;
        encodings.bytes.encode(obj.gte, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      if (defined(obj.gt)) {
        buf[offset++] = 26;
        encodings.bytes.encode(obj.gt, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      if (defined(obj.lte)) {
        buf[offset++] = 34;
        encodings.bytes.encode(obj.lte, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      if (defined(obj.lt)) {
        buf[offset++] = 42;
        encodings.bytes.encode(obj.lt, buf, offset);
        offset += encodings.bytes.encode.bytes;
      }

      if (defined(obj.limit)) {
        buf[offset++] = 48;
        encodings.varint.encode(obj.limit, buf, offset);
        offset += encodings.varint.encode.bytes;
      }

      if (defined(obj.reverse)) {
        buf[offset++] = 56;
        encodings.bool.encode(obj.reverse, buf, offset);
        offset += encodings.bool.encode.bytes;
      }

      if (defined(obj.checkpoint)) {
        var packedLen = 0;

        for (var i = 0; i < obj.checkpoint.length; i++) {
          if (!defined(obj.checkpoint[i])) continue;
          packedLen += encodings.varint.encodingLength(obj.checkpoint[i]);
        }

        if (packedLen) {
          buf[offset++] = 66;
          varint.encode(packedLen, buf, offset);
          offset += varint.encode.bytes;
        }

        for (var i = 0; i < obj.checkpoint.length; i++) {
          if (!defined(obj.checkpoint[i])) continue;
          encodings.varint.encode(obj.checkpoint[i], buf, offset);
          offset += encodings.varint.encode.bytes;
        }
      }

      encode.bytes = offset - oldOffset;
      return buf;
    }

    function decode(buf, offset, end) {
      if (!offset) offset = 0;
      if (!end) end = buf.length;
      if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
      var oldOffset = offset;
      var obj = {
        version: 0,
        gte: null,
        gt: null,
        lte: null,
        lt: null,
        limit: 0,
        reverse: false,
        checkpoint: []
      };

      while (true) {
        if (end <= offset) {
          decode.bytes = offset - oldOffset;
          return obj;
        }

        var prefix = varint.decode(buf, offset);
        offset += varint.decode.bytes;
        var tag = prefix >> 3;

        switch (tag) {
          case 1:
            obj.version = encodings.varint.decode(buf, offset);
            offset += encodings.varint.decode.bytes;
            break;

          case 2:
            obj.gte = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          case 3:
            obj.gt = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          case 4:
            obj.lte = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          case 5:
            obj.lt = encodings.bytes.decode(buf, offset);
            offset += encodings.bytes.decode.bytes;
            break;

          case 6:
            obj.limit = encodings.varint.decode(buf, offset);
            offset += encodings.varint.decode.bytes;
            break;

          case 7:
            obj.reverse = encodings.bool.decode(buf, offset);
            offset += encodings.bool.decode.bytes;
            break;

          case 8:
            var packedEnd = varint.decode(buf, offset);
            offset += varint.decode.bytes;
            packedEnd += offset;

            while (offset < packedEnd) {
              obj.checkpoint.push(encodings.varint.decode(buf, offset));
              offset += encodings.varint.decode.bytes;
            }

            break;

          default:
            offset = skip(prefix & 7, buf, offset);
        }
      }
    }
  }

  function defineCache() {
    Cache.encodingLength = encodingLength;
    Cache.encode = encode;
    Cache.decode = decode;

    function encodingLength(obj) {
      var length = 0;
      if (!defined(obj.start)) throw new Error("start is required");
      var len = encodings.varint.encodingLength(obj.start);
      length += 1 + len;
      if (!defined(obj.end)) throw new Error("end is required");
      var len = encodings.varint.encodingLength(obj.end);
      length += 1 + len;

      if (defined(obj.blocks)) {
        var packedLen = 0;

        for (var i = 0; i < obj.blocks.length; i++) {
          if (!defined(obj.blocks[i])) continue;
          var len = encodings.varint.encodingLength(obj.blocks[i]);
          packedLen += len;
        }

        if (packedLen) {
          length += 1 + packedLen + varint.encodingLength(packedLen);
        }
      }

      return length;
    }

    function encode(obj, buf, offset) {
      if (!offset) offset = 0;
      if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
      var oldOffset = offset;
      if (!defined(obj.start)) throw new Error("start is required");
      buf[offset++] = 8;
      encodings.varint.encode(obj.start, buf, offset);
      offset += encodings.varint.encode.bytes;
      if (!defined(obj.end)) throw new Error("end is required");
      buf[offset++] = 16;
      encodings.varint.encode(obj.end, buf, offset);
      offset += encodings.varint.encode.bytes;

      if (defined(obj.blocks)) {
        var packedLen = 0;

        for (var i = 0; i < obj.blocks.length; i++) {
          if (!defined(obj.blocks[i])) continue;
          packedLen += encodings.varint.encodingLength(obj.blocks[i]);
        }

        if (packedLen) {
          buf[offset++] = 26;
          varint.encode(packedLen, buf, offset);
          offset += varint.encode.bytes;
        }

        for (var i = 0; i < obj.blocks.length; i++) {
          if (!defined(obj.blocks[i])) continue;
          encodings.varint.encode(obj.blocks[i], buf, offset);
          offset += encodings.varint.encode.bytes;
        }
      }

      encode.bytes = offset - oldOffset;
      return buf;
    }

    function decode(buf, offset, end) {
      if (!offset) offset = 0;
      if (!end) end = buf.length;
      if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
      var oldOffset = offset;
      var obj = {
        start: 0,
        end: 0,
        blocks: []
      };
      var found0 = false;
      var found1 = false;

      while (true) {
        if (end <= offset) {
          if (!found0 || !found1) throw new Error("Decoded message is not valid");
          decode.bytes = offset - oldOffset;
          return obj;
        }

        var prefix = varint.decode(buf, offset);
        offset += varint.decode.bytes;
        var tag = prefix >> 3;

        switch (tag) {
          case 1:
            obj.start = encodings.varint.decode(buf, offset);
            offset += encodings.varint.decode.bytes;
            found0 = true;
            break;

          case 2:
            obj.end = encodings.varint.decode(buf, offset);
            offset += encodings.varint.decode.bytes;
            found1 = true;
            break;

          case 3:
            var packedEnd = varint.decode(buf, offset);
            offset += varint.decode.bytes;
            packedEnd += offset;

            while (offset < packedEnd) {
              obj.blocks.push(encodings.varint.decode(buf, offset));
              offset += encodings.varint.decode.bytes;
            }

            break;

          default:
            offset = skip(prefix & 7, buf, offset);
        }
      }
    }
  }

  Extension.encodingLength = encodingLength;
  Extension.encode = encode;
  Extension.decode = decode;

  function encodingLength(obj) {
    var length = 0;

    if (defined(obj.cache)) {
      var len = Cache.encodingLength(obj.cache);
      length += varint.encodingLength(len);
      length += 1 + len;
    }

    if (defined(obj.get)) {
      var len = Get.encodingLength(obj.get);
      length += varint.encodingLength(len);
      length += 1 + len;
    }

    if (defined(obj.iterator)) {
      var len = Iterator.encodingLength(obj.iterator);
      length += varint.encodingLength(len);
      length += 1 + len;
    }

    return length;
  }

  function encode(obj, buf, offset) {
    if (!offset) offset = 0;
    if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj));
    var oldOffset = offset;

    if (defined(obj.cache)) {
      buf[offset++] = 10;
      varint.encode(Cache.encodingLength(obj.cache), buf, offset);
      offset += varint.encode.bytes;
      Cache.encode(obj.cache, buf, offset);
      offset += Cache.encode.bytes;
    }

    if (defined(obj.get)) {
      buf[offset++] = 18;
      varint.encode(Get.encodingLength(obj.get), buf, offset);
      offset += varint.encode.bytes;
      Get.encode(obj.get, buf, offset);
      offset += Get.encode.bytes;
    }

    if (defined(obj.iterator)) {
      buf[offset++] = 26;
      varint.encode(Iterator.encodingLength(obj.iterator), buf, offset);
      offset += varint.encode.bytes;
      Iterator.encode(obj.iterator, buf, offset);
      offset += Iterator.encode.bytes;
    }

    encode.bytes = offset - oldOffset;
    return buf;
  }

  function decode(buf, offset, end) {
    if (!offset) offset = 0;
    if (!end) end = buf.length;
    if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid");
    var oldOffset = offset;
    var obj = {
      cache: null,
      get: null,
      iterator: null
    };

    while (true) {
      if (end <= offset) {
        decode.bytes = offset - oldOffset;
        return obj;
      }

      var prefix = varint.decode(buf, offset);
      offset += varint.decode.bytes;
      var tag = prefix >> 3;

      switch (tag) {
        case 1:
          var len = varint.decode(buf, offset);
          offset += varint.decode.bytes;
          obj.cache = Cache.decode(buf, offset, offset + len);
          offset += Cache.decode.bytes;
          break;

        case 2:
          var len = varint.decode(buf, offset);
          offset += varint.decode.bytes;
          obj.get = Get.decode(buf, offset, offset + len);
          offset += Get.decode.bytes;
          break;

        case 3:
          var len = varint.decode(buf, offset);
          offset += varint.decode.bytes;
          obj.iterator = Iterator.decode(buf, offset, offset + len);
          offset += Iterator.decode.bytes;
          break;

        default:
          offset = skip(prefix & 7, buf, offset);
      }
    }
  }
}

function defined(val) {
  return val !== null && val !== undefined && (typeof val !== 'number' || !isNaN(val));
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2,"protocol-buffers-encodings":20}],14:[function(require,module,exports){
"use strict";

var {
  EventEmitter
} = require('events');

var maybe = require('call-me-maybe');

var inspect = require('inspect-custom-symbol');

var SUPPORTS_PROMISES = Symbol.for('hypercore.promises');
var CORE = Symbol('hypercore-promisifier.core');
var REQUEST = Symbol('hypercore-promisifier.request');

class BaseWrapper extends EventEmitter {
  constructor(core) {
    super();
    this[CORE] = core;
    this.on('newListener', (eventName, listener) => {
      core.on(eventName, listener);
    });
    this.on('removeListener', (eventName, listener) => {
      core.removeListener(eventName, listener);
    });
  }

  [inspect](depth, opts) {
    return this[CORE][inspect](depth, opts);
  }

  get key() {
    return this[CORE].key;
  }

  get discoveryKey() {
    return this[CORE].discoveryKey;
  }

  get length() {
    return this[CORE].length;
  }

  get byteLength() {
    return this[CORE].byteLength;
  }

  get writable() {
    return this[CORE].writable;
  }

  get sparse() {
    return this[CORE].sparse;
  }

  get peers() {
    return this[CORE].peers;
  }

  get valueEncoding() {
    return this[CORE].valueEncoding;
  }

  get weak() {
    return this[CORE].weak;
  }

  get lazy() {
    return this[CORE].lazy;
  }

}

class CallbackToPromiseHypercore extends BaseWrapper {
  constructor(core) {
    super(core);
    this[SUPPORTS_PROMISES] = true;
  } // Async Methods


  ready() {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CORE].ready(err => {
        if (err) return reject(err);
        return resolve(null);
      });
    }));
  }

  close() {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CORE].close(err => {
        if (err) return reject(err);
        return resolve(null);
      });
    }));
  }

  get(index, opts) {
    var req = null;
    var prom = new Promise((resolve, reject) => {
      req = this[CORE].get(index, opts, (err, block) => {
        if (err) return reject(err);
        return resolve(block);
      });
    });
    prom[REQUEST] = req;
    return prom;
  }

  append(batch) {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CORE].append(batch, (err, seq) => {
        if (err) return reject(err);
        return resolve(seq);
      });
    }));
  }

  update(opts) {
    return alwaysCatch(new Promise((resolve, reject) => {
      this[CORE].update(opts, err => {
        if (err) return reject(err);
        return resolve(null);
      });
    }));
  }

  seek(bytes, opts) {
    return new Promise((resolve, reject) => {
      this[CORE].seek(bytes, opts, (err, index, relativeOffset) => {
        if (err) return reject(err);
        return resolve([index, relativeOffset]);
      });
    });
  }

  download(range) {
    var req = null;
    var prom = alwaysCatch(new Promise((resolve, reject) => {
      req = this[CORE].download(range, err => {
        if (err) return reject(err);
        return resolve(null);
      });
    }));
    prom[REQUEST] = req;
    return prom;
  }

  has(start, end) {
    return new Promise((resolve, reject) => {
      this[CORE].has(start, end, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  audit() {
    return new Promise((resolve, reject) => {
      this[CORE].audit((err, report) => {
        if (err) return reject(err);
        return resolve(report);
      });
    });
  }

  destroyStorage() {
    return new Promise((resolve, reject) => {
      this[CORE].destroyStorage(err => {
        if (err) return reject(err);
        return resolve(null);
      });
    });
  } // Sync Methods


  createReadStream(opts) {
    return this[CORE].createReadStream(opts);
  }

  createWriteStream(opts) {
    return this[CORE].createWriteStream(opts);
  }

  undownload(range) {
    return this[CORE].undownload(range[REQUEST] || range);
  }

  cancel(range) {
    return this[CORE].cancel(range[REQUEST] || range);
  }

  replicate(initiator, opts) {
    return this[CORE].replicate(initiator, opts);
  }

  registerExtension(name, handlers) {
    return this[CORE].registerExtension(name, handlers);
  }

  setUploading(uploading) {
    return this[CORE].setUploading(uploading);
  }

  setDownloading(downloading) {
    return this[CORE].setDownloading(downloading);
  }

}

class PromiseToCallbackHypercore extends BaseWrapper {
  constructor(core) {
    super(core);
    this[SUPPORTS_PROMISES] = false;
  } // Async Methods


  ready(cb) {
    return maybeOptional(cb, this[CORE].ready());
  }

  close(cb) {
    return maybeOptional(cb, this[CORE].close());
  }

  get(index, opts, cb) {
    var prom = this[CORE].get(index, opts);
    maybe(cb, prom);
    return prom;
  }

  append(batch, cb) {
    return maybeOptional(cb, this[CORE].append(batch));
  }

  update(opts, cb) {
    return maybeOptional(cb, this[CORE].update(opts));
  }

  seek(bytes, opts, cb) {
    return maybe(cb, this[CORE].seek(bytes, opts));
  }

  download(range, cb) {
    var prom = this[CORE].download(range);
    maybeOptional(cb, prom);
    return prom;
  }

  has(start, end, cb) {
    return maybe(cb, this[CORE].has(start, end));
  }

  audit(cb) {
    return maybe(cb, this[CORE].audit());
  }

  destroyStorage(cb) {
    return maybe(cb, this[CORE].destroyStorage());
  } // Sync Methods


  createReadStream(opts) {
    return this[CORE].createReadStream(opts);
  }

  createWriteStream(opts) {
    return this[CORE].createWriteStream(opts);
  }

  undownload(range) {
    return this[CORE].undownload(range);
  }

  cancel(range) {
    return this[CORE].cancel(range);
  }

  replicate(initiator, opts) {
    return this[CORE].replicate(initiator, opts);
  }

  registerExtension(name, handlers) {
    return this[CORE].registerExtension(name, handlers);
  }

  setUploading(uploading) {
    return this[CORE].setUploading(uploading);
  }

  setDownloading(downloading) {
    return this[CORE].setDownloading(downloading);
  }

}

module.exports = {
  toPromises,
  toCallbacks,
  unwrap
};

function toPromises(core) {
  return core[SUPPORTS_PROMISES] ? core : new CallbackToPromiseHypercore(core);
}

function toCallbacks(core) {
  return core[SUPPORTS_PROMISES] ? new PromiseToCallbackHypercore(core) : core;
}

function unwrap(core) {
  return core[CORE] || core;
}

function maybeOptional(cb, prom) {
  prom = maybe(cb, prom);
  if (prom) prom.catch(noop);
  return prom;
}

function alwaysCatch(prom) {
  prom.catch(noop);
  return prom;
}

function noop() {}

},{"call-me-maybe":3,"events":5,"inspect-custom-symbol":16}],15:[function(require,module,exports){
"use strict";

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);

    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }

    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }

    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = e << mLen | m;
  eLen += mLen;

  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
};

},{}],16:[function(require,module,exports){
"use strict";

module.exports = Symbol.for('nodejs.util.inspect.custom');

},{}],17:[function(require,module,exports){
(function (process){(function (){
"use strict";

var mutexify = function mutexify() {
  var queue = [];
  var used = null;

  var call = function call() {
    used(release);
  };

  var acquire = function acquire(fn) {
    if (used) return queue.push(fn);
    used = fn;
    acquire.locked = true;
    process.nextTick(call);
    return 0;
  };

  acquire.locked = false;

  var release = function release(fn, err, value) {
    used = null;
    acquire.locked = false;
    if (queue.length) acquire(queue.shift());
    if (fn) fn(err, value);
  };

  return acquire;
};

module.exports = mutexify;

}).call(this)}).call(this,require('_process'))
},{"_process":19}],18:[function(require,module,exports){
"use strict";

var mutexify = require('.');

var mutexifyPromise = function mutexifyPromise() {
  var lock = mutexify();

  var acquire = function acquire() {
    return new Promise(lock);
  };

  Object.defineProperty(acquire, 'locked', {
    get: function get() {
      return lock.locked;
    },
    enumerable: true
  });
  return acquire;
};

module.exports = mutexifyPromise;

},{".":17}],19:[function(require,module,exports){
"use strict";

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};

},{}],20:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

var varint = require('varint');

var svarint = require('signed-varint');

exports.make = encoder;

exports.name = function (enc) {
  var keys = Object.keys(exports);

  for (var i = 0; i < keys.length; i++) {
    if (exports[keys[i]] === enc) return keys[i];
  }

  return null;
};

exports.skip = function (type, buffer, offset) {
  switch (type) {
    case 0:
      varint.decode(buffer, offset);
      return offset + varint.decode.bytes;

    case 1:
      return offset + 8;

    case 2:
      var len = varint.decode(buffer, offset);
      return offset + varint.decode.bytes + len;

    case 3:
    case 4:
      throw new Error('Groups are not supported');

    case 5:
      return offset + 4;
  }

  throw new Error('Unknown wire type: ' + type);
};

exports.bytes = encoder(2, function encode(val, buffer, offset) {
  var oldOffset = offset;
  var len = bufferLength(val);
  varint.encode(len, buffer, offset);
  offset += varint.encode.bytes;
  if (Buffer.isBuffer(val)) val.copy(buffer, offset);else buffer.write(val, offset, len);
  offset += len;
  encode.bytes = offset - oldOffset;
  return buffer;
}, function decode(buffer, offset) {
  var oldOffset = offset;
  var len = varint.decode(buffer, offset);
  offset += varint.decode.bytes;
  var val = buffer.slice(offset, offset + len);
  offset += val.length;
  decode.bytes = offset - oldOffset;
  return val;
}, function encodingLength(val) {
  var len = bufferLength(val);
  return varint.encodingLength(len) + len;
});
exports.string = encoder(2, function encode(val, buffer, offset) {
  var oldOffset = offset;
  var len = Buffer.byteLength(val);
  varint.encode(len, buffer, offset, 'utf-8');
  offset += varint.encode.bytes;
  buffer.write(val, offset, len);
  offset += len;
  encode.bytes = offset - oldOffset;
  return buffer;
}, function decode(buffer, offset) {
  var oldOffset = offset;
  var len = varint.decode(buffer, offset);
  offset += varint.decode.bytes;
  var val = buffer.toString('utf-8', offset, offset + len);
  offset += len;
  decode.bytes = offset - oldOffset;
  return val;
}, function encodingLength(val) {
  var len = Buffer.byteLength(val);
  return varint.encodingLength(len) + len;
});
exports.bool = encoder(0, function encode(val, buffer, offset) {
  buffer[offset] = val ? 1 : 0;
  encode.bytes = 1;
  return buffer;
}, function decode(buffer, offset) {
  var bool = buffer[offset] > 0;
  decode.bytes = 1;
  return bool;
}, function encodingLength() {
  return 1;
});
exports.int32 = encoder(0, function encode(val, buffer, offset) {
  varint.encode(val < 0 ? val + 4294967296 : val, buffer, offset);
  encode.bytes = varint.encode.bytes;
  return buffer;
}, function decode(buffer, offset) {
  var val = varint.decode(buffer, offset);
  decode.bytes = varint.decode.bytes;
  return val > 2147483647 ? val - 4294967296 : val;
}, function encodingLength(val) {
  return varint.encodingLength(val < 0 ? val + 4294967296 : val);
});
exports.int64 = encoder(0, function encode(val, buffer, offset) {
  if (val < 0) {
    var last = offset + 9;
    varint.encode(val * -1, buffer, offset);
    offset += varint.encode.bytes - 1;
    buffer[offset] = buffer[offset] | 0x80;

    while (offset < last - 1) {
      offset++;
      buffer[offset] = 0xff;
    }

    buffer[last] = 0x01;
    encode.bytes = 10;
  } else {
    varint.encode(val, buffer, offset);
    encode.bytes = varint.encode.bytes;
  }

  return buffer;
}, function decode(buffer, offset) {
  var val = varint.decode(buffer, offset);

  if (val >= Math.pow(2, 63)) {
    var limit = 9;

    while (buffer[offset + limit - 1] === 0xff) {
      limit--;
    }

    limit = limit || 9;
    var subset = Buffer.allocUnsafe(limit);
    buffer.copy(subset, 0, offset, offset + limit);
    subset[limit - 1] = subset[limit - 1] & 0x7f;
    val = -1 * varint.decode(subset, 0);
    decode.bytes = 10;
  } else {
    decode.bytes = varint.decode.bytes;
  }

  return val;
}, function encodingLength(val) {
  return val < 0 ? 10 : varint.encodingLength(val);
});
exports.sint32 = exports.sint64 = encoder(0, svarint.encode, svarint.decode, svarint.encodingLength);
exports.uint32 = exports.uint64 = exports.enum = exports.varint = encoder(0, varint.encode, varint.decode, varint.encodingLength); // we cannot represent these in javascript so we just use buffers

exports.fixed64 = exports.sfixed64 = encoder(1, function encode(val, buffer, offset) {
  val.copy(buffer, offset);
  encode.bytes = 8;
  return buffer;
}, function decode(buffer, offset) {
  var val = buffer.slice(offset, offset + 8);
  decode.bytes = 8;
  return val;
}, function encodingLength() {
  return 8;
});
exports.double = encoder(1, function encode(val, buffer, offset) {
  buffer.writeDoubleLE(val, offset);
  encode.bytes = 8;
  return buffer;
}, function decode(buffer, offset) {
  var val = buffer.readDoubleLE(offset);
  decode.bytes = 8;
  return val;
}, function encodingLength() {
  return 8;
});
exports.fixed32 = encoder(5, function encode(val, buffer, offset) {
  buffer.writeUInt32LE(val, offset);
  encode.bytes = 4;
  return buffer;
}, function decode(buffer, offset) {
  var val = buffer.readUInt32LE(offset);
  decode.bytes = 4;
  return val;
}, function encodingLength() {
  return 4;
});
exports.sfixed32 = encoder(5, function encode(val, buffer, offset) {
  buffer.writeInt32LE(val, offset);
  encode.bytes = 4;
  return buffer;
}, function decode(buffer, offset) {
  var val = buffer.readInt32LE(offset);
  decode.bytes = 4;
  return val;
}, function encodingLength() {
  return 4;
});
exports.float = encoder(5, function encode(val, buffer, offset) {
  buffer.writeFloatLE(val, offset);
  encode.bytes = 4;
  return buffer;
}, function decode(buffer, offset) {
  var val = buffer.readFloatLE(offset);
  decode.bytes = 4;
  return val;
}, function encodingLength() {
  return 4;
});

function encoder(type, encode, decode, encodingLength) {
  encode.bytes = decode.bytes = 0;
  return {
    type: type,
    encode: encode,
    decode: decode,
    encodingLength: encodingLength
  };
}

function bufferLength(val) {
  return Buffer.isBuffer(val) ? val.length : Buffer.byteLength(val);
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":2,"signed-varint":21,"varint":25}],21:[function(require,module,exports){
"use strict";

var varint = require('varint');

exports.encode = function encode(v, b, o) {
  v = v >= 0 ? v * 2 : v * -2 - 1;
  var r = varint.encode(v, b, o);
  encode.bytes = varint.encode.bytes;
  return r;
};

exports.decode = function decode(b, o) {
  var v = varint.decode(b, o);
  decode.bytes = varint.decode.bytes;
  return v & 1 ? (v + 1) / -2 : v / 2;
};

exports.encodingLength = function (v) {
  return varint.encodingLength(v >= 0 ? v * 2 : v * -2 - 1);
};

},{"varint":25}],22:[function(require,module,exports){
(function (process){(function (){
"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var {
  EventEmitter
} = require('events');

var STREAM_DESTROYED = new Error('Stream was destroyed');
var PREMATURE_CLOSE = new Error('Premature close');

var FIFO = require('fast-fifo');
/* eslint-disable no-multi-spaces */


var MAX = (1 << 25) - 1; // Shared state

var OPENING = 0b001;
var DESTROYING = 0b010;
var DESTROYED = 0b100;
var NOT_OPENING = MAX ^ OPENING; // Read state

var READ_ACTIVE = 0b0000000000001 << 3;
var READ_PRIMARY = 0b0000000000010 << 3;
var READ_SYNC = 0b0000000000100 << 3;
var READ_QUEUED = 0b0000000001000 << 3;
var READ_RESUMED = 0b0000000010000 << 3;
var READ_PIPE_DRAINED = 0b0000000100000 << 3;
var READ_ENDING = 0b0000001000000 << 3;
var READ_EMIT_DATA = 0b0000010000000 << 3;
var READ_EMIT_READABLE = 0b0000100000000 << 3;
var READ_EMITTED_READABLE = 0b0001000000000 << 3;
var READ_DONE = 0b0010000000000 << 3;
var READ_NEXT_TICK = 0b0100000000001 << 3; // also active

var READ_NEEDS_PUSH = 0b1000000000000 << 3;
var READ_NOT_ACTIVE = MAX ^ READ_ACTIVE;
var READ_NON_PRIMARY = MAX ^ READ_PRIMARY;
var READ_NON_PRIMARY_AND_PUSHED = MAX ^ (READ_PRIMARY | READ_NEEDS_PUSH);
var READ_NOT_SYNC = MAX ^ READ_SYNC;
var READ_PUSHED = MAX ^ READ_NEEDS_PUSH;
var READ_PAUSED = MAX ^ READ_RESUMED;
var READ_NOT_QUEUED = MAX ^ (READ_QUEUED | READ_EMITTED_READABLE);
var READ_NOT_ENDING = MAX ^ READ_ENDING;
var READ_PIPE_NOT_DRAINED = MAX ^ (READ_RESUMED | READ_PIPE_DRAINED);
var READ_NOT_NEXT_TICK = MAX ^ READ_NEXT_TICK; // Write state

var WRITE_ACTIVE = 0b000000001 << 16;
var WRITE_PRIMARY = 0b000000010 << 16;
var WRITE_SYNC = 0b000000100 << 16;
var WRITE_QUEUED = 0b000001000 << 16;
var WRITE_UNDRAINED = 0b000010000 << 16;
var WRITE_DONE = 0b000100000 << 16;
var WRITE_EMIT_DRAIN = 0b001000000 << 16;
var WRITE_NEXT_TICK = 0b010000001 << 16; // also active

var WRITE_FINISHING = 0b100000000 << 16;
var WRITE_NOT_ACTIVE = MAX ^ WRITE_ACTIVE;
var WRITE_NOT_SYNC = MAX ^ WRITE_SYNC;
var WRITE_NON_PRIMARY = MAX ^ WRITE_PRIMARY;
var WRITE_NOT_FINISHING = MAX ^ WRITE_FINISHING;
var WRITE_DRAINED = MAX ^ WRITE_UNDRAINED;
var WRITE_NOT_QUEUED = MAX ^ WRITE_QUEUED;
var WRITE_NOT_NEXT_TICK = MAX ^ WRITE_NEXT_TICK; // Combined shared state

var ACTIVE = READ_ACTIVE | WRITE_ACTIVE;
var NOT_ACTIVE = MAX ^ ACTIVE;
var DONE = READ_DONE | WRITE_DONE;
var DESTROY_STATUS = DESTROYING | DESTROYED;
var OPEN_STATUS = DESTROY_STATUS | OPENING;
var AUTO_DESTROY = DESTROY_STATUS | DONE;
var NON_PRIMARY = WRITE_NON_PRIMARY & READ_NON_PRIMARY;
var TICKING = (WRITE_NEXT_TICK | READ_NEXT_TICK) & NOT_ACTIVE;
var ACTIVE_OR_TICKING = ACTIVE | TICKING;
var IS_OPENING = OPEN_STATUS | TICKING; // Combined read state

var READ_PRIMARY_STATUS = OPEN_STATUS | READ_ENDING | READ_DONE;
var READ_STATUS = OPEN_STATUS | READ_DONE | READ_QUEUED;
var READ_FLOWING = READ_RESUMED | READ_PIPE_DRAINED;
var READ_ACTIVE_AND_SYNC = READ_ACTIVE | READ_SYNC;
var READ_ACTIVE_AND_SYNC_AND_NEEDS_PUSH = READ_ACTIVE | READ_SYNC | READ_NEEDS_PUSH;
var READ_PRIMARY_AND_ACTIVE = READ_PRIMARY | READ_ACTIVE;
var READ_ENDING_STATUS = OPEN_STATUS | READ_ENDING | READ_QUEUED;
var READ_EMIT_READABLE_AND_QUEUED = READ_EMIT_READABLE | READ_QUEUED;
var READ_READABLE_STATUS = OPEN_STATUS | READ_EMIT_READABLE | READ_QUEUED | READ_EMITTED_READABLE;
var SHOULD_NOT_READ = OPEN_STATUS | READ_ACTIVE | READ_ENDING | READ_DONE | READ_NEEDS_PUSH;
var READ_BACKPRESSURE_STATUS = DESTROY_STATUS | READ_ENDING | READ_DONE; // Combined write state

var WRITE_PRIMARY_STATUS = OPEN_STATUS | WRITE_FINISHING | WRITE_DONE;
var WRITE_QUEUED_AND_UNDRAINED = WRITE_QUEUED | WRITE_UNDRAINED;
var WRITE_QUEUED_AND_ACTIVE = WRITE_QUEUED | WRITE_ACTIVE;
var WRITE_DRAIN_STATUS = WRITE_QUEUED | WRITE_UNDRAINED | OPEN_STATUS | WRITE_ACTIVE;
var WRITE_STATUS = OPEN_STATUS | WRITE_ACTIVE | WRITE_QUEUED;
var WRITE_PRIMARY_AND_ACTIVE = WRITE_PRIMARY | WRITE_ACTIVE;
var WRITE_ACTIVE_AND_SYNC = WRITE_ACTIVE | WRITE_SYNC;
var WRITE_FINISHING_STATUS = OPEN_STATUS | WRITE_FINISHING | WRITE_QUEUED;
var WRITE_BACKPRESSURE_STATUS = WRITE_UNDRAINED | DESTROY_STATUS | WRITE_FINISHING | WRITE_DONE;
var asyncIterator = Symbol.asyncIterator || Symbol('asyncIterator');

class WritableState {
  constructor(stream) {
    var {
      highWaterMark = 16384,
      map = null,
      mapWritable,
      byteLength,
      byteLengthWritable
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.stream = stream;
    this.queue = new FIFO();
    this.highWaterMark = highWaterMark;
    this.buffered = 0;
    this.error = null;
    this.pipeline = null;
    this.byteLength = byteLengthWritable || byteLength || defaultByteLength;
    this.map = mapWritable || map;
    this.afterWrite = afterWrite.bind(this);
  }

  get ended() {
    return (this.stream._duplexState & WRITE_DONE) !== 0;
  }

  push(data) {
    if (this.map !== null) data = this.map(data);
    this.buffered += this.byteLength(data);
    this.queue.push(data);

    if (this.buffered < this.highWaterMark) {
      this.stream._duplexState |= WRITE_QUEUED;
      return true;
    }

    this.stream._duplexState |= WRITE_QUEUED_AND_UNDRAINED;
    return false;
  }

  shift() {
    var data = this.queue.shift();
    var stream = this.stream;
    this.buffered -= this.byteLength(data);
    if (this.buffered === 0) stream._duplexState &= WRITE_NOT_QUEUED;
    return data;
  }

  end(data) {
    if (typeof data === 'function') this.stream.once('finish', data);else if (data !== undefined && data !== null) this.push(data);
    this.stream._duplexState = (this.stream._duplexState | WRITE_FINISHING) & WRITE_NON_PRIMARY;
  }

  autoBatch(data, cb) {
    var buffer = [];
    var stream = this.stream;
    buffer.push(data);

    while ((stream._duplexState & WRITE_STATUS) === WRITE_QUEUED_AND_ACTIVE) {
      buffer.push(stream._writableState.shift());
    }

    if ((stream._duplexState & OPEN_STATUS) !== 0) return cb(null);

    stream._writev(buffer, cb);
  }

  update() {
    var stream = this.stream;

    while ((stream._duplexState & WRITE_STATUS) === WRITE_QUEUED) {
      var data = this.shift();
      stream._duplexState |= WRITE_ACTIVE_AND_SYNC;

      stream._write(data, this.afterWrite);

      stream._duplexState &= WRITE_NOT_SYNC;
    }

    if ((stream._duplexState & WRITE_PRIMARY_AND_ACTIVE) === 0) this.updateNonPrimary();
  }

  updateNonPrimary() {
    var stream = this.stream;

    if ((stream._duplexState & WRITE_FINISHING_STATUS) === WRITE_FINISHING) {
      stream._duplexState = (stream._duplexState | WRITE_ACTIVE) & WRITE_NOT_FINISHING;

      stream._final(afterFinal.bind(this));

      return;
    }

    if ((stream._duplexState & DESTROY_STATUS) === DESTROYING) {
      if ((stream._duplexState & ACTIVE_OR_TICKING) === 0) {
        stream._duplexState |= ACTIVE;

        stream._destroy(afterDestroy.bind(this));
      }

      return;
    }

    if ((stream._duplexState & IS_OPENING) === OPENING) {
      stream._duplexState = (stream._duplexState | ACTIVE) & NOT_OPENING;

      stream._open(afterOpen.bind(this));
    }
  }

  updateNextTick() {
    if ((this.stream._duplexState & WRITE_NEXT_TICK) !== 0) return;
    this.stream._duplexState |= WRITE_NEXT_TICK;
    process.nextTick(updateWriteNT, this);
  }

}

class ReadableState {
  constructor(stream) {
    var {
      highWaterMark = 16384,
      map = null,
      mapReadable,
      byteLength,
      byteLengthReadable
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.stream = stream;
    this.queue = new FIFO();
    this.highWaterMark = highWaterMark;
    this.buffered = 0;
    this.error = null;
    this.pipeline = null;
    this.byteLength = byteLengthReadable || byteLength || defaultByteLength;
    this.map = mapReadable || map;
    this.pipeTo = null;
    this.afterRead = afterRead.bind(this);
  }

  get ended() {
    return (this.stream._duplexState & READ_DONE) !== 0;
  }

  pipe(pipeTo, cb) {
    if (this.pipeTo !== null) throw new Error('Can only pipe to one destination');
    this.stream._duplexState |= READ_PIPE_DRAINED;
    this.pipeTo = pipeTo;
    this.pipeline = new Pipeline(this.stream, pipeTo, cb || null);
    if (cb) this.stream.on('error', noop); // We already error handle this so supress crashes

    if (isStreamx(pipeTo)) {
      pipeTo._writableState.pipeline = this.pipeline;
      if (cb) pipeTo.on('error', noop); // We already error handle this so supress crashes

      pipeTo.on('finish', this.pipeline.finished.bind(this.pipeline)); // TODO: just call finished from pipeTo itself
    } else {
      var onerror = this.pipeline.done.bind(this.pipeline, pipeTo);
      var onclose = this.pipeline.done.bind(this.pipeline, pipeTo, null); // onclose has a weird bool arg

      pipeTo.on('error', onerror);
      pipeTo.on('close', onclose);
      pipeTo.on('finish', this.pipeline.finished.bind(this.pipeline));
    }

    pipeTo.on('drain', afterDrain.bind(this));
    this.stream.emit('piping', pipeTo);
    pipeTo.emit('pipe', this.stream);
  }

  push(data) {
    var stream = this.stream;

    if (data === null) {
      this.highWaterMark = 0;
      stream._duplexState = (stream._duplexState | READ_ENDING) & READ_NON_PRIMARY_AND_PUSHED;
      return false;
    }

    if (this.map !== null) data = this.map(data);
    this.buffered += this.byteLength(data);
    this.queue.push(data);
    stream._duplexState = (stream._duplexState | READ_QUEUED) & READ_PUSHED;
    return this.buffered < this.highWaterMark;
  }

  shift() {
    var data = this.queue.shift();
    this.buffered -= this.byteLength(data);
    if (this.buffered === 0) this.stream._duplexState &= READ_NOT_QUEUED;
    return data;
  }

  unshift(data) {
    var tail;
    var pending = [];

    while ((tail = this.queue.shift()) !== undefined) {
      pending.push(tail);
    }

    this.push(data);

    for (var i = 0; i < pending.length; i++) {
      this.queue.push(pending[i]);
    }
  }

  read() {
    var stream = this.stream;

    if ((stream._duplexState & READ_STATUS) === READ_QUEUED) {
      var data = this.shift();
      if ((stream._duplexState & READ_EMIT_DATA) !== 0) stream.emit('data', data);
      if (this.pipeTo !== null && this.pipeTo.write(data) === false) stream._duplexState &= READ_PIPE_NOT_DRAINED;
      return data;
    }

    return null;
  }

  drain() {
    var stream = this.stream;

    while ((stream._duplexState & READ_STATUS) === READ_QUEUED && (stream._duplexState & READ_FLOWING) !== 0) {
      var data = this.shift();
      if ((stream._duplexState & READ_EMIT_DATA) !== 0) stream.emit('data', data);
      if (this.pipeTo !== null && this.pipeTo.write(data) === false) stream._duplexState &= READ_PIPE_NOT_DRAINED;
    }
  }

  update() {
    var stream = this.stream;
    this.drain();

    while (this.buffered < this.highWaterMark && (stream._duplexState & SHOULD_NOT_READ) === 0) {
      stream._duplexState |= READ_ACTIVE_AND_SYNC_AND_NEEDS_PUSH;

      stream._read(this.afterRead);

      stream._duplexState &= READ_NOT_SYNC;
      if ((stream._duplexState & READ_ACTIVE) === 0) this.drain();
    }

    if ((stream._duplexState & READ_READABLE_STATUS) === READ_EMIT_READABLE_AND_QUEUED) {
      stream._duplexState |= READ_EMITTED_READABLE;
      stream.emit('readable');
    }

    if ((stream._duplexState & READ_PRIMARY_AND_ACTIVE) === 0) this.updateNonPrimary();
  }

  updateNonPrimary() {
    var stream = this.stream;

    if ((stream._duplexState & READ_ENDING_STATUS) === READ_ENDING) {
      stream._duplexState = (stream._duplexState | READ_DONE) & READ_NOT_ENDING;
      stream.emit('end');
      if ((stream._duplexState & AUTO_DESTROY) === DONE) stream._duplexState |= DESTROYING;
      if (this.pipeTo !== null) this.pipeTo.end();
    }

    if ((stream._duplexState & DESTROY_STATUS) === DESTROYING) {
      if ((stream._duplexState & ACTIVE_OR_TICKING) === 0) {
        stream._duplexState |= ACTIVE;

        stream._destroy(afterDestroy.bind(this));
      }

      return;
    }

    if ((stream._duplexState & IS_OPENING) === OPENING) {
      stream._duplexState = (stream._duplexState | ACTIVE) & NOT_OPENING;

      stream._open(afterOpen.bind(this));
    }
  }

  updateNextTick() {
    if ((this.stream._duplexState & READ_NEXT_TICK) !== 0) return;
    this.stream._duplexState |= READ_NEXT_TICK;
    process.nextTick(updateReadNT, this);
  }

}

class TransformState {
  constructor(stream) {
    this.data = null;
    this.afterTransform = afterTransform.bind(stream);
    this.afterFinal = null;
  }

}

class Pipeline {
  constructor(src, dst, cb) {
    this.from = src;
    this.to = dst;
    this.afterPipe = cb;
    this.error = null;
    this.pipeToFinished = false;
  }

  finished() {
    this.pipeToFinished = true;
  }

  done(stream, err) {
    if (err) this.error = err;

    if (stream === this.to) {
      this.to = null;

      if (this.from !== null) {
        if ((this.from._duplexState & READ_DONE) === 0 || !this.pipeToFinished) {
          this.from.destroy(this.error || new Error('Writable stream closed prematurely'));
        }

        return;
      }
    }

    if (stream === this.from) {
      this.from = null;

      if (this.to !== null) {
        if ((stream._duplexState & READ_DONE) === 0) {
          this.to.destroy(this.error || new Error('Readable stream closed before ending'));
        }

        return;
      }
    }

    if (this.afterPipe !== null) this.afterPipe(this.error);
    this.to = this.from = this.afterPipe = null;
  }

}

function afterDrain() {
  this.stream._duplexState |= READ_PIPE_DRAINED;
  if ((this.stream._duplexState & READ_ACTIVE_AND_SYNC) === 0) this.updateNextTick();
}

function afterFinal(err) {
  var stream = this.stream;
  if (err) stream.destroy(err);

  if ((stream._duplexState & DESTROY_STATUS) === 0) {
    stream._duplexState |= WRITE_DONE;
    stream.emit('finish');
  }

  if ((stream._duplexState & AUTO_DESTROY) === DONE) {
    stream._duplexState |= DESTROYING;
  }

  stream._duplexState &= WRITE_NOT_ACTIVE;
  this.update();
}

function afterDestroy(err) {
  var stream = this.stream;
  if (!err && this.error !== STREAM_DESTROYED) err = this.error;
  if (err) stream.emit('error', err);
  stream._duplexState |= DESTROYED;
  stream.emit('close');
  var rs = stream._readableState;
  var ws = stream._writableState;
  if (rs !== null && rs.pipeline !== null) rs.pipeline.done(stream, err);
  if (ws !== null && ws.pipeline !== null) ws.pipeline.done(stream, err);
}

function afterWrite(err) {
  var stream = this.stream;
  if (err) stream.destroy(err);
  stream._duplexState &= WRITE_NOT_ACTIVE;

  if ((stream._duplexState & WRITE_DRAIN_STATUS) === WRITE_UNDRAINED) {
    stream._duplexState &= WRITE_DRAINED;

    if ((stream._duplexState & WRITE_EMIT_DRAIN) === WRITE_EMIT_DRAIN) {
      stream.emit('drain');
    }
  }

  if ((stream._duplexState & WRITE_SYNC) === 0) this.update();
}

function afterRead(err) {
  if (err) this.stream.destroy(err);
  this.stream._duplexState &= READ_NOT_ACTIVE;
  if ((this.stream._duplexState & READ_SYNC) === 0) this.update();
}

function updateReadNT(rs) {
  rs.stream._duplexState &= READ_NOT_NEXT_TICK;
  rs.update();
}

function updateWriteNT(ws) {
  ws.stream._duplexState &= WRITE_NOT_NEXT_TICK;
  ws.update();
}

function afterOpen(err) {
  var stream = this.stream;
  if (err) stream.destroy(err);

  if ((stream._duplexState & DESTROYING) === 0) {
    if ((stream._duplexState & READ_PRIMARY_STATUS) === 0) stream._duplexState |= READ_PRIMARY;
    if ((stream._duplexState & WRITE_PRIMARY_STATUS) === 0) stream._duplexState |= WRITE_PRIMARY;
    stream.emit('open');
  }

  stream._duplexState &= NOT_ACTIVE;

  if (stream._writableState !== null) {
    stream._writableState.update();
  }

  if (stream._readableState !== null) {
    stream._readableState.update();
  }
}

function afterTransform(err, data) {
  if (data !== undefined && data !== null) this.push(data);

  this._writableState.afterWrite(err);
}

class Stream extends EventEmitter {
  constructor(opts) {
    super();
    this._duplexState = 0;
    this._readableState = null;
    this._writableState = null;

    if (opts) {
      if (opts.open) this._open = opts.open;
      if (opts.destroy) this._destroy = opts.destroy;
      if (opts.predestroy) this._predestroy = opts.predestroy;

      if (opts.signal) {
        opts.signal.addEventListener('abort', abort.bind(this));
      }
    }
  }

  _open(cb) {
    cb(null);
  }

  _destroy(cb) {
    cb(null);
  }

  _predestroy() {// does nothing
  }

  get readable() {
    return this._readableState !== null ? true : undefined;
  }

  get writable() {
    return this._writableState !== null ? true : undefined;
  }

  get destroyed() {
    return (this._duplexState & DESTROYED) !== 0;
  }

  get destroying() {
    return (this._duplexState & DESTROY_STATUS) !== 0;
  }

  destroy(err) {
    if ((this._duplexState & DESTROY_STATUS) === 0) {
      if (!err) err = STREAM_DESTROYED;
      this._duplexState = (this._duplexState | DESTROYING) & NON_PRIMARY;

      this._predestroy();

      if (this._readableState !== null) {
        this._readableState.error = err;

        this._readableState.updateNextTick();
      }

      if (this._writableState !== null) {
        this._writableState.error = err;

        this._writableState.updateNextTick();
      }
    }
  }

  on(name, fn) {
    if (this._readableState !== null) {
      if (name === 'data') {
        this._duplexState |= READ_EMIT_DATA | READ_RESUMED;

        this._readableState.updateNextTick();
      }

      if (name === 'readable') {
        this._duplexState |= READ_EMIT_READABLE;

        this._readableState.updateNextTick();
      }
    }

    if (this._writableState !== null) {
      if (name === 'drain') {
        this._duplexState |= WRITE_EMIT_DRAIN;

        this._writableState.updateNextTick();
      }
    }

    return super.on(name, fn);
  }

}

class Readable extends Stream {
  constructor(opts) {
    super(opts);
    this._duplexState |= OPENING | WRITE_DONE;
    this._readableState = new ReadableState(this, opts);

    if (opts) {
      if (opts.read) this._read = opts.read;
    }
  }

  _read(cb) {
    cb(null);
  }

  pipe(dest, cb) {
    this._readableState.pipe(dest, cb);

    this._readableState.updateNextTick();

    return dest;
  }

  read() {
    this._readableState.updateNextTick();

    return this._readableState.read();
  }

  push(data) {
    this._readableState.updateNextTick();

    return this._readableState.push(data);
  }

  unshift(data) {
    this._readableState.updateNextTick();

    return this._readableState.unshift(data);
  }

  resume() {
    this._duplexState |= READ_RESUMED;

    this._readableState.updateNextTick();

    return this;
  }

  pause() {
    this._duplexState &= READ_PAUSED;
    return this;
  }

  static _fromAsyncIterator(ite, opts) {
    var destroy;
    var rs = new Readable(_objectSpread(_objectSpread({}, opts), {}, {
      read(cb) {
        ite.next().then(push).then(cb.bind(null, null)).catch(cb);
      },

      predestroy() {
        destroy = ite.return();
      },

      destroy(cb) {
        destroy.then(cb.bind(null, null)).catch(cb);
      }

    }));
    return rs;

    function push(data) {
      if (data.done) rs.push(null);else rs.push(data.value);
    }
  }

  static from(data, opts) {
    if (isReadStreamx(data)) return data;
    if (data[asyncIterator]) return this._fromAsyncIterator(data[asyncIterator](), opts);
    if (!Array.isArray(data)) data = data === undefined ? [] : [data];
    var i = 0;
    return new Readable(_objectSpread(_objectSpread({}, opts), {}, {
      read(cb) {
        this.push(i === data.length ? null : data[i++]);
        cb(null);
      }

    }));
  }

  static isBackpressured(rs) {
    return (rs._duplexState & READ_BACKPRESSURE_STATUS) !== 0 || rs._readableState.buffered >= rs._readableState.highWaterMark;
  }

  static isPaused(rs) {
    return (rs._duplexState & READ_RESUMED) === 0;
  }

  [asyncIterator]() {
    var stream = this;
    var error = null;
    var promiseResolve = null;
    var promiseReject = null;
    this.on('error', err => {
      error = err;
    });
    this.on('readable', onreadable);
    this.on('close', onclose);
    return {
      [asyncIterator]() {
        return this;
      },

      next() {
        return new Promise(function (resolve, reject) {
          promiseResolve = resolve;
          promiseReject = reject;
          var data = stream.read();
          if (data !== null) ondata(data);else if ((stream._duplexState & DESTROYED) !== 0) ondata(null);
        });
      },

      return() {
        return destroy(null);
      },

      throw(err) {
        return destroy(err);
      }

    };

    function onreadable() {
      if (promiseResolve !== null) ondata(stream.read());
    }

    function onclose() {
      if (promiseResolve !== null) ondata(null);
    }

    function ondata(data) {
      if (promiseReject === null) return;
      if (error) promiseReject(error);else if (data === null && (stream._duplexState & READ_DONE) === 0) promiseReject(STREAM_DESTROYED);else promiseResolve({
        value: data,
        done: data === null
      });
      promiseReject = promiseResolve = null;
    }

    function destroy(err) {
      stream.destroy(err);
      return new Promise((resolve, reject) => {
        if (stream._duplexState & DESTROYED) return resolve({
          value: undefined,
          done: true
        });
        stream.once('close', function () {
          if (err) reject(err);else resolve({
            value: undefined,
            done: true
          });
        });
      });
    }
  }

}

class Writable extends Stream {
  constructor(opts) {
    super(opts);
    this._duplexState |= OPENING | READ_DONE;
    this._writableState = new WritableState(this, opts);

    if (opts) {
      if (opts.writev) this._writev = opts.writev;
      if (opts.write) this._write = opts.write;
      if (opts.final) this._final = opts.final;
    }
  }

  _writev(batch, cb) {
    cb(null);
  }

  _write(data, cb) {
    this._writableState.autoBatch(data, cb);
  }

  _final(cb) {
    cb(null);
  }

  static isBackpressured(ws) {
    return (ws._duplexState & WRITE_BACKPRESSURE_STATUS) !== 0;
  }

  write(data) {
    this._writableState.updateNextTick();

    return this._writableState.push(data);
  }

  end(data) {
    this._writableState.updateNextTick();

    this._writableState.end(data);

    return this;
  }

}

class Duplex extends Readable {
  // and Writable
  constructor(opts) {
    super(opts);
    this._duplexState = OPENING;
    this._writableState = new WritableState(this, opts);

    if (opts) {
      if (opts.writev) this._writev = opts.writev;
      if (opts.write) this._write = opts.write;
      if (opts.final) this._final = opts.final;
    }
  }

  _writev(batch, cb) {
    cb(null);
  }

  _write(data, cb) {
    this._writableState.autoBatch(data, cb);
  }

  _final(cb) {
    cb(null);
  }

  write(data) {
    this._writableState.updateNextTick();

    return this._writableState.push(data);
  }

  end(data) {
    this._writableState.updateNextTick();

    this._writableState.end(data);

    return this;
  }

}

class Transform extends Duplex {
  constructor(opts) {
    super(opts);
    this._transformState = new TransformState(this);

    if (opts) {
      if (opts.transform) this._transform = opts.transform;
      if (opts.flush) this._flush = opts.flush;
    }
  }

  _write(data, cb) {
    if (this._readableState.buffered >= this._readableState.highWaterMark) {
      this._transformState.data = data;
    } else {
      this._transform(data, this._transformState.afterTransform);
    }
  }

  _read(cb) {
    if (this._transformState.data !== null) {
      var data = this._transformState.data;
      this._transformState.data = null;
      cb(null);

      this._transform(data, this._transformState.afterTransform);
    } else {
      cb(null);
    }
  }

  _transform(data, cb) {
    cb(null, data);
  }

  _flush(cb) {
    cb(null);
  }

  _final(cb) {
    this._transformState.afterFinal = cb;

    this._flush(transformAfterFlush.bind(this));
  }

}

class PassThrough extends Transform {}

function transformAfterFlush(err, data) {
  var cb = this._transformState.afterFinal;
  if (err) return cb(err);
  if (data !== null && data !== undefined) this.push(data);
  this.push(null);
  cb(null);
}

function pipelinePromise() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  return new Promise((resolve, reject) => {
    return pipeline(...streams, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function pipeline(stream) {
  for (var _len2 = arguments.length, streams = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    streams[_key2 - 1] = arguments[_key2];
  }

  var all = Array.isArray(stream) ? [...stream, ...streams] : [stream, ...streams];
  var done = all.length && typeof all[all.length - 1] === 'function' ? all.pop() : null;
  if (all.length < 2) throw new Error('Pipeline requires at least 2 streams');
  var src = all[0];
  var dest = null;
  var error = null;

  for (var i = 1; i < all.length; i++) {
    dest = all[i];

    if (isStreamx(src)) {
      src.pipe(dest, onerror);
    } else {
      errorHandle(src, true, i > 1, onerror);
      src.pipe(dest);
    }

    src = dest;
  }

  if (done) {
    var fin = false;
    dest.on('finish', () => {
      fin = true;
    });
    dest.on('error', err => {
      error = error || err;
    });
    dest.on('close', () => done(error || (fin ? null : PREMATURE_CLOSE)));
  }

  return dest;

  function errorHandle(s, rd, wr, onerror) {
    s.on('error', onerror);
    s.on('close', onclose);

    function onclose() {
      if (rd && s._readableState && !s._readableState.ended) return onerror(PREMATURE_CLOSE);
      if (wr && s._writableState && !s._writableState.ended) return onerror(PREMATURE_CLOSE);
    }
  }

  function onerror(err) {
    if (!err || error) return;
    error = err;

    for (var s of all) {
      s.destroy(err);
    }
  }
}

function isStream(stream) {
  return !!stream._readableState || !!stream._writableState;
}

function isStreamx(stream) {
  return typeof stream._duplexState === 'number' && isStream(stream);
}

function isReadStreamx(stream) {
  return isStreamx(stream) && stream.readable;
}

function isTypedArray(data) {
  return typeof data === 'object' && data !== null && typeof data.byteLength === 'number';
}

function defaultByteLength(data) {
  return isTypedArray(data) ? data.byteLength : 1024;
}

function noop() {}

function abort() {
  this.destroy(new Error('Stream aborted.'));
}

module.exports = {
  pipeline,
  pipelinePromise,
  isStream,
  isStreamx,
  Stream,
  Writable,
  Readable,
  Duplex,
  Transform,
  // Export PassThrough for compatibility with Node.js core's stream module
  PassThrough
};

}).call(this)}).call(this,require('_process'))
},{"_process":19,"events":5,"fast-fifo":7}],23:[function(require,module,exports){
"use strict";

module.exports = read;
var MSB = 0x80,
    REST = 0x7F;

function read(buf, offset) {
  var res = 0,
      offset = offset || 0,
      shift = 0,
      counter = offset,
      b,
      l = buf.length;

  do {
    if (counter >= l) {
      read.bytes = 0;
      throw new RangeError('Could not decode varint');
    }

    b = buf[counter++];
    res += shift < 28 ? (b & REST) << shift : (b & REST) * Math.pow(2, shift);
    shift += 7;
  } while (b >= MSB);

  read.bytes = counter - offset;
  return res;
}

},{}],24:[function(require,module,exports){
"use strict";

module.exports = encode;
var MSB = 0x80,
    REST = 0x7F,
    MSBALL = ~REST,
    INT = Math.pow(2, 31);

function encode(num, out, offset) {
  out = out || [];
  offset = offset || 0;
  var oldOffset = offset;

  while (num >= INT) {
    out[offset++] = num & 0xFF | MSB;
    num /= 128;
  }

  while (num & MSBALL) {
    out[offset++] = num & 0xFF | MSB;
    num >>>= 7;
  }

  out[offset] = num | 0;
  encode.bytes = offset - oldOffset + 1;
  return out;
}

},{}],25:[function(require,module,exports){
"use strict";

module.exports = {
  encode: require("./encode.js"),
  decode: require("./decode.js"),
  encodingLength: require("./length.js")
};

},{"./decode.js":23,"./encode.js":24,"./length.js":26}],26:[function(require,module,exports){
"use strict";

var N1 = Math.pow(2, 7);
var N2 = Math.pow(2, 14);
var N3 = Math.pow(2, 21);
var N4 = Math.pow(2, 28);
var N5 = Math.pow(2, 35);
var N6 = Math.pow(2, 42);
var N7 = Math.pow(2, 49);
var N8 = Math.pow(2, 56);
var N9 = Math.pow(2, 63);

module.exports = function (value) {
  return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
};

},{}],27:[function(require,module,exports){
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var Hyperbee = require('hyperbee');

function getHyperbee() {
  return _getHyperbee.apply(this, arguments);
}

function _getHyperbee() {
  _getHyperbee = _asyncToGenerator(function* () {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    // make a new Hyperbee on top of the feed that stores string encoded keys and values.
    var config = {};
    if (opts.keyEncoding) config.keyEncoding = opts.keyEncoding;
    if (opts.valueEncoding) config.valueEncoding = opts.valueEncoding;
    var hyperbeeDb = new Hyperbee(opts.feed, config);
    yield hyperbeeDb.ready();
    return hyperbeeDb;
  });
  return _getHyperbee.apply(this, arguments);
}

module.exports = getHyperbee;

},{"hyperbee":8}]},{},[27])(27)
});
