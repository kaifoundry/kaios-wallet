(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

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
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
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

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
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
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
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
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":3,"ieee754":5}],4:[function(require,module,exports){
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

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
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
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
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
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
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
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
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

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
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

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
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

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
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

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
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
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
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
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],5:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
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
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
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
    while(len) {
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
};

// v8 likes predictible objects
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

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],9:[function(require,module,exports){
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

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/lib/_stream_readable.js');
Stream.Writable = require('readable-stream/lib/_stream_writable.js');
Stream.Duplex = require('readable-stream/lib/_stream_duplex.js');
Stream.Transform = require('readable-stream/lib/_stream_transform.js');
Stream.PassThrough = require('readable-stream/lib/_stream_passthrough.js');
Stream.finished = require('readable-stream/lib/internal/streams/end-of-stream.js')
Stream.pipeline = require('readable-stream/lib/internal/streams/pipeline.js')

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":4,"inherits":6,"readable-stream/lib/_stream_duplex.js":11,"readable-stream/lib/_stream_passthrough.js":12,"readable-stream/lib/_stream_readable.js":13,"readable-stream/lib/_stream_transform.js":14,"readable-stream/lib/_stream_writable.js":15,"readable-stream/lib/internal/streams/end-of-stream.js":19,"readable-stream/lib/internal/streams/pipeline.js":21}],10:[function(require,module,exports){
'use strict';

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError =
  /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(typeof actual);
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;

},{}],11:[function(require,module,exports){
(function (process){(function (){
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
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';
/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


module.exports = Duplex;

var Readable = require('./_stream_readable');

var Writable = require('./_stream_writable');

require('inherits')(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});
}).call(this)}).call(this,require('_process'))
},{"./_stream_readable":13,"./_stream_writable":15,"_process":7,"inherits":6}],12:[function(require,module,exports){
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
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

require('inherits')(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":14,"inherits":6}],13:[function(require,module,exports){
(function (process,global){(function (){
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

module.exports = Readable;
/*<replacement>*/

var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = require('events').EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/


var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*<replacement>*/


var debugUtil = require('util');

var debug;

if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/


var BufferList = require('./internal/streams/buffer_list');

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT; // Lazy loaded to improve the startup performance.


var StringDecoder;
var createReadableStreamAsyncIterator;
var from;

require('inherits')(Readable, Stream);

var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'end' (and potentially 'finish')

  this.autoDestroy = !!options.autoDestroy; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder; // If setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding; // Iterate over current buffer to convert already stored Buffers:

  var p = this._readableState.buffer.head;
  var content = '';

  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }

  this._readableState.buffer.clear();

  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
}; // Don't raise the hwm > 1GB


var MAX_HWM = 0x40000000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
    ;
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = require('./internal/streams/async_iterator');
    }

    return createReadableStreamAsyncIterator(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');

    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;

      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}

if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = require('./internal/streams/from');
    }

    return from(Readable, iterable, opts);
  };
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":10,"./_stream_duplex":11,"./internal/streams/async_iterator":16,"./internal/streams/buffer_list":17,"./internal/streams/destroy":18,"./internal/streams/from":20,"./internal/streams/state":22,"./internal/streams/stream":23,"_process":7,"buffer":3,"events":4,"inherits":6,"string_decoder/":24,"util":2}],14:[function(require,module,exports){
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
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';

module.exports = Transform;

var _require$codes = require('../errors').codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;

var Duplex = require('./_stream_duplex');

require('inherits')(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}
},{"../errors":10,"./_stream_duplex":11,"inherits":6}],15:[function(require,module,exports){
(function (process,global){(function (){
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
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';

module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

var errorOrDestroy = destroyImpl.errorOrDestroy;

require('inherits')(Writable, Stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'finish' (and potentially 'end')

  this.autoDestroy = !!options.autoDestroy; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      errorOrDestroy(stream, err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');

      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;

        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};
}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../errors":10,"./_stream_duplex":11,"./internal/streams/destroy":18,"./internal/streams/state":22,"./internal/streams/stream":23,"_process":7,"buffer":3,"inherits":6,"util-deprecate":25}],16:[function(require,module,exports){
(function (process){(function (){
'use strict';

var _Object$setPrototypeO;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var finished = require('./end-of-stream');

var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this;

    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;

  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

module.exports = createReadableStreamAsyncIterator;
}).call(this)}).call(this,require('_process'))
},{"./end-of-stream":19,"_process":7}],17:[function(require,module,exports){
'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require('buffer'),
    Buffer = _require.Buffer;

var _require2 = require('util'),
    inspect = _require2.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}

module.exports =
/*#__PURE__*/
function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;

      while (p = p.next) {
        ret += s + p.data;
      }

      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;

      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }

      return ret;
    } // Consumes a specified amount of bytes or characters from the buffered data.

  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;

      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }

      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    } // Consumes a specified amount of characters from the buffered data.

  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;

      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;

        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Consumes a specified amount of bytes from the buffered data.

  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;

      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;

        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Make sure the linked list only shows the minimal necessary information.

  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread({}, options, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);

  return BufferList;
}();
},{"buffer":3,"util":2}],18:[function(require,module,exports){
(function (process){(function (){
'use strict'; // undocumented cb() API, needed for core, not for public API

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.
  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};
}).call(this)}).call(this,require('_process'))
},{"_process":7}],19:[function(require,module,exports){
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var ERR_STREAM_PREMATURE_CLOSE = require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;
},{"../../../errors":10}],20:[function(require,module,exports){
module.exports = function () {
  throw new Error('Readable.from is not available in the browser')
};

},{}],21:[function(require,module,exports){
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var eos;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes = require('../../../errors').codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;

function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = require('./end-of-stream');
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

module.exports = pipeline;
},{"../../../errors":10,"./end-of-stream":19}],22:[function(require,module,exports){
'use strict';

var ERR_INVALID_OPT_VALUE = require('../../../errors').codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

module.exports = {
  getHighWaterMark: getHighWaterMark
};
},{"../../../errors":10}],23:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":4}],24:[function(require,module,exports){
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

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":8}],25:[function(require,module,exports){
(function (global){(function (){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// browserify by default only pulls in files that are hard coded in requires
// In order of last to first in this file, the default wordlist will be chosen
// based on what is present. (Bundles may remove wordlists they don't need)
const wordlists = {};
exports.wordlists = wordlists;
let _default;
exports._default = _default;
try {
    exports._default = _default = require('./wordlists/czech.json');
    wordlists.czech = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/chinese_simplified.json');
    wordlists.chinese_simplified = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/chinese_traditional.json');
    wordlists.chinese_traditional = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/korean.json');
    wordlists.korean = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/french.json');
    wordlists.french = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/italian.json');
    wordlists.italian = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/spanish.json');
    wordlists.spanish = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/japanese.json');
    wordlists.japanese = _default;
    wordlists.JA = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/portuguese.json');
    wordlists.portuguese = _default;
}
catch (err) { }
try {
    exports._default = _default = require('./wordlists/english.json');
    wordlists.english = _default;
    wordlists.EN = _default;
}
catch (err) { }

},{"./wordlists/chinese_simplified.json":28,"./wordlists/chinese_traditional.json":29,"./wordlists/czech.json":30,"./wordlists/english.json":31,"./wordlists/french.json":32,"./wordlists/italian.json":33,"./wordlists/japanese.json":34,"./wordlists/korean.json":35,"./wordlists/portuguese.json":36,"./wordlists/spanish.json":37}],27:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createHash = require("create-hash");
const pbkdf2_1 = require("pbkdf2");
const randomBytes = require("randombytes");
const _wordlists_1 = require("./_wordlists");
let DEFAULT_WORDLIST = _wordlists_1._default;
const INVALID_MNEMONIC = 'Invalid mnemonic';
const INVALID_ENTROPY = 'Invalid entropy';
const INVALID_CHECKSUM = 'Invalid mnemonic checksum';
const WORDLIST_REQUIRED = 'A wordlist is required but a default could not be found.\n' +
    'Please pass a 2048 word array explicitly.';
function pbkdf2Promise(password, saltMixin, iterations, keylen, digest) {
    return Promise.resolve().then(() => new Promise((resolve, reject) => {
        const callback = (err, derivedKey) => {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(derivedKey);
            }
        };
        pbkdf2_1.pbkdf2(password, saltMixin, iterations, keylen, digest, callback);
    }));
}
function normalize(str) {
    return (str || '').normalize('NFKD');
}
function lpad(str, padString, length) {
    while (str.length < length) {
        str = padString + str;
    }
    return str;
}
function binaryToByte(bin) {
    return parseInt(bin, 2);
}
function bytesToBinary(bytes) {
    return bytes.map((x) => lpad(x.toString(2), '0', 8)).join('');
}
function deriveChecksumBits(entropyBuffer) {
    const ENT = entropyBuffer.length * 8;
    const CS = ENT / 32;
    const hash = createHash('sha256')
        .update(entropyBuffer)
        .digest();
    return bytesToBinary(Array.from(hash)).slice(0, CS);
}
function salt(password) {
    return 'mnemonic' + (password || '');
}
function mnemonicToSeedSync(mnemonic, password) {
    const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
    const saltBuffer = Buffer.from(salt(normalize(password)), 'utf8');
    return pbkdf2_1.pbkdf2Sync(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
}
exports.mnemonicToSeedSync = mnemonicToSeedSync;
function mnemonicToSeed(mnemonic, password) {
    return Promise.resolve().then(() => {
        const mnemonicBuffer = Buffer.from(normalize(mnemonic), 'utf8');
        const saltBuffer = Buffer.from(salt(normalize(password)), 'utf8');
        return pbkdf2Promise(mnemonicBuffer, saltBuffer, 2048, 64, 'sha512');
    });
}
exports.mnemonicToSeed = mnemonicToSeed;
function mnemonicToEntropy(mnemonic, wordlist) {
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
    const words = normalize(mnemonic).split(' ');
    if (words.length % 3 !== 0) {
        throw new Error(INVALID_MNEMONIC);
    }
    // convert word indices to 11 bit binary strings
    const bits = words
        .map((word) => {
        const index = wordlist.indexOf(word);
        if (index === -1) {
            throw new Error(INVALID_MNEMONIC);
        }
        return lpad(index.toString(2), '0', 11);
    })
        .join('');
    // split the binary string into ENT/CS
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
    // calculate the checksum and compare
    const entropyBytes = entropyBits.match(/(.{1,8})/g).map(binaryToByte);
    if (entropyBytes.length < 16) {
        throw new Error(INVALID_ENTROPY);
    }
    if (entropyBytes.length > 32) {
        throw new Error(INVALID_ENTROPY);
    }
    if (entropyBytes.length % 4 !== 0) {
        throw new Error(INVALID_ENTROPY);
    }
    const entropy = Buffer.from(entropyBytes);
    const newChecksum = deriveChecksumBits(entropy);
    if (newChecksum !== checksumBits) {
        throw new Error(INVALID_CHECKSUM);
    }
    return entropy.toString('hex');
}
exports.mnemonicToEntropy = mnemonicToEntropy;
function entropyToMnemonic(entropy, wordlist) {
    if (!Buffer.isBuffer(entropy)) {
        entropy = Buffer.from(entropy, 'hex');
    }
    wordlist = wordlist || DEFAULT_WORDLIST;
    if (!wordlist) {
        throw new Error(WORDLIST_REQUIRED);
    }
    // 128 <= ENT <= 256
    if (entropy.length < 16) {
        throw new TypeError(INVALID_ENTROPY);
    }
    if (entropy.length > 32) {
        throw new TypeError(INVALID_ENTROPY);
    }
    if (entropy.length % 4 !== 0) {
        throw new TypeError(INVALID_ENTROPY);
    }
    const entropyBits = bytesToBinary(Array.from(entropy));
    const checksumBits = deriveChecksumBits(entropy);
    const bits = entropyBits + checksumBits;
    const chunks = bits.match(/(.{1,11})/g);
    const words = chunks.map((binary) => {
        const index = binaryToByte(binary);
        return wordlist[index];
    });
    return wordlist[0] === '\u3042\u3044\u3053\u304f\u3057\u3093' // Japanese wordlist
        ? words.join('\u3000')
        : words.join(' ');
}
exports.entropyToMnemonic = entropyToMnemonic;
function generateMnemonic(strength, rng, wordlist) {
    strength = strength || 128;
    if (strength % 32 !== 0) {
        throw new TypeError(INVALID_ENTROPY);
    }
    rng = rng || randomBytes;
    return entropyToMnemonic(rng(strength / 8), wordlist);
}
exports.generateMnemonic = generateMnemonic;
function validateMnemonic(mnemonic, wordlist) {
    try {
        mnemonicToEntropy(mnemonic, wordlist);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.validateMnemonic = validateMnemonic;
function setDefaultWordlist(language) {
    const result = _wordlists_1.wordlists[language];
    if (result) {
        DEFAULT_WORDLIST = result;
    }
    else {
        throw new Error('Could not find wordlist for language "' + language + '"');
    }
}
exports.setDefaultWordlist = setDefaultWordlist;
function getDefaultWordlist() {
    if (!DEFAULT_WORDLIST) {
        throw new Error('No Default Wordlist set');
    }
    return Object.keys(_wordlists_1.wordlists).filter((lang) => {
        if (lang === 'JA' || lang === 'EN') {
            return false;
        }
        return _wordlists_1.wordlists[lang].every((word, index) => word === DEFAULT_WORDLIST[index]);
    })[0];
}
exports.getDefaultWordlist = getDefaultWordlist;
var _wordlists_2 = require("./_wordlists");
exports.wordlists = _wordlists_2.wordlists;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./_wordlists":26,"buffer":3,"create-hash":39,"pbkdf2":60,"randombytes":66}],28:[function(require,module,exports){
module.exports=[
    "τÜä",
    "Σ╕Ç",
    "µÿ»",
    "σ£¿",
    "Σ╕ì",
    "Σ║å",
    "µ£ë",
    "σÆî",
    "Σ║║",
    "Φ┐Ö",
    "Σ╕¡",
    "σñº",
    "Σ╕║",
    "Σ╕è",
    "Σ╕¬",
    "σ¢╜",
    "µêæ",
    "Σ╗Ñ",
    "Φªü",
    "Σ╗û",
    "µù╢",
    "µ¥Ñ",
    "τö¿",
    "Σ╗¼",
    "τöƒ",
    "σê░",
    "Σ╜£",
    "σ£░",
    "Σ║Ä",
    "σç║",
    "σ░▒",
    "σêå",
    "σ»╣",
    "µêÉ",
    "Σ╝Ü",
    "σÅ»",
    "Σ╕╗",
    "σÅæ",
    "σ╣┤",
    "σè¿",
    "σÉî",
    "σ╖Ñ",
    "Σ╣ƒ",
    "Φâ╜",
    "Σ╕ï",
    "Φ┐ç",
    "σ¡É",
    "Φ»┤",
    "Σ║º",
    "τºì",
    "Θ¥ó",
    "ΦÇî",
    "µû╣",
    "σÉÄ",
    "σñÜ",
    "σ«Ü",
    "Φíî",
    "σ¡ª",
    "µ│ò",
    "µëÇ",
    "µ░æ",
    "σ╛ù",
    "τ╗Å",
    "σìü",
    "Σ╕ë",
    "Σ╣ï",
    "Φ┐¢",
    "τ¥Ç",
    "τ¡ë",
    "Θâ¿",
    "σ║ª",
    "σ«╢",
    "τö╡",
    "σè¢",
    "Θçî",
    "σªé",
    "µ░┤",
    "σîû",
    "Θ½ÿ",
    "Φç¬",
    "Σ║î",
    "τÉå",
    "Φ╡╖",
    "σ░Å",
    "τë⌐",
    "τÄ░",
    "σ«₧",
    "σèá",
    "ΘçÅ",
    "Θâ╜",
    "Σ╕ñ",
    "Σ╜ô",
    "σê╢",
    "µ£║",
    "σ╜ô",
    "Σ╜┐",
    "τé╣",
    "Σ╗Ä",
    "Σ╕Ü",
    "µ£¼",
    "σÄ╗",
    "µèè",
    "µÇº",
    "σÑ╜",
    "σ║ö",
    "σ╝Ç",
    "σ«â",
    "σÉê",
    "Φ┐ÿ",
    "σ¢á",
    "τö▒",
    "σà╢",
    "Σ║¢",
    "τä╢",
    "σëì",
    "σñû",
    "σñ⌐",
    "µö┐",
    "σ¢¢",
    "µùÑ",
    "Θéú",
    "τñ╛",
    "Σ╣ë",
    "Σ║ï",
    "σ╣│",
    "σ╜ó",
    "τ¢╕",
    "σà¿",
    "Φí¿",
    "Θù┤",
    "µá╖",
    "Σ╕Ä",
    "σà│",
    "σÉä",
    "Θçì",
    "µû░",
    "τ║┐",
    "σåà",
    "µò░",
    "µ¡ú",
    "σ┐â",
    "σÅì",
    "Σ╜á",
    "µÿÄ",
    "τ£ï",
    "σÄƒ",
    "σÅê",
    "Σ╣ê",
    "σê⌐",
    "µ»ö",
    "µêû",
    "Σ╜å",
    "Φ┤¿",
    "µ░ö",
    "τ¼¼",
    "σÉæ",
    "Θüô",
    "σæ╜",
    "µ¡ñ",
    "σÅÿ",
    "µ¥í",
    "σÅ¬",
    "µ▓í",
    "τ╗ô",
    "Φºú",
    "Θù«",
    "µäÅ",
    "σ╗║",
    "µ£ê",
    "σà¼",
    "µùá",
    "τ│╗",
    "σå¢",
    "σ╛ê",
    "µâà",
    "ΦÇà",
    "µ£Ç",
    "τ½ï",
    "Σ╗ú",
    "µâ│",
    "σ╖▓",
    "ΘÇÜ",
    "σ╣╢",
    "µÅÉ",
    "τ¢┤",
    "Θóÿ",
    "σàÜ",
    "τ¿ï",
    "σ▒ò",
    "Σ║ö",
    "µ₧£",
    "µûÖ",
    "Φ▒í",
    "σæÿ",
    "Θ¥⌐",
    "Σ╜ì",
    "σàÑ",
    "σ╕╕",
    "µûç",
    "µÇ╗",
    "µ¼í",
    "σôü",
    "σ╝Å",
    "µ┤╗",
    "Φ«╛",
    "σÅè",
    "τ«í",
    "τë╣",
    "Σ╗╢",
    "Θò┐",
    "µ▒é",
    "ΦÇü",
    "σñ┤",
    "σƒ║",
    "Φ╡ä",
    "Φ╛╣",
    "µ╡ü",
    "Φ╖»",
    "τ║º",
    "σ░æ",
    "σ¢╛",
    "σ▒▒",
    "τ╗ƒ",
    "µÄÑ",
    "τƒÑ",
    "Φ╛â",
    "σ░å",
    "τ╗ä",
    "Φºü",
    "Φ«í",
    "σê½",
    "σÑ╣",
    "µëï",
    "ΦºÆ",
    "µ£ƒ",
    "µá╣",
    "Φ«║",
    "Φ┐É",
    "σå£",
    "µîç",
    "σçá",
    "Σ╣¥",
    "σî║",
    "σ╝║",
    "µö╛",
    "σå│",
    "ΦÑ┐",
    "Φó½",
    "σ╣▓",
    "σüÜ",
    "σ┐à",
    "µêÿ",
    "σàê",
    "σ¢₧",
    "σêÖ",
    "Σ╗╗",
    "σÅû",
    "µì«",
    "σñä",
    "Θÿƒ",
    "σìù",
    "τ╗Ö",
    "Φë▓",
    "σàë",
    "Θù¿",
    "σì│",
    "Σ┐¥",
    "µ▓╗",
    "σîù",
    "ΘÇá",
    "τÖ╛",
    "Φºä",
    "τâ¡",
    "Θóå",
    "Σ╕â",
    "µ╡╖",
    "σÅú",
    "Σ╕£",
    "σ»╝",
    "σÖ¿",
    "σÄï",
    "σ┐ù",
    "Σ╕û",
    "Θçæ",
    "σó₧",
    "Σ║ë",
    "µ╡Ä",
    "Θÿ╢",
    "µ▓╣",
    "µÇ¥",
    "µ£»",
    "µ₧ü",
    "Σ║ñ",
    "σÅù",
    "Φüö",
    "Σ╗Ç",
    "Φ«ñ",
    "σà¡",
    "σà▒",
    "µ¥â",
    "µö╢",
    "Φ»ü",
    "µö╣",
    "µ╕à",
    "τ╛Ä",
    "σåì",
    "Θçç",
    "Φ╜¼",
    "µ¢┤",
    "σìò",
    "ΘúÄ",
    "σêç",
    "µëô",
    "τÖ╜",
    "µòÖ",
    "ΘÇƒ",
    "Φè▒",
    "σ╕ª",
    "σ«ë",
    "σ£║",
    "Φ║½",
    "Φ╜ª",
    "Σ╛ï",
    "τ£ƒ",
    "σèí",
    "σà╖",
    "Σ╕ç",
    "µ»Å",
    "τ¢«",
    "Φç│",
    "Φ╛╛",
    "Φ╡░",
    "τº»",
    "τñ║",
    "Φ««",
    "σú░",
    "µèÑ",
    "µûù",
    "σ«î",
    "τ▒╗",
    "σà½",
    "τª╗",
    "σìÄ",
    "σÉì",
    "τí«",
    "µëì",
    "τºæ",
    "σ╝á",
    "Σ┐í",
    "Θ⌐¼",
    "Φèé",
    "Φ»¥",
    "τ▒│",
    "µò┤",
    "τ⌐║",
    "σàâ",
    "σå╡",
    "Σ╗è",
    "Θ¢å",
    "µ╕⌐",
    "Σ╝á",
    "σ£ƒ",
    "Φ«╕",
    "µ¡Ñ",
    "τ╛ñ",
    "σ╣┐",
    "τƒ│",
    "Φ«░",
    "Θ£Ç",
    "µ«╡",
    "τáö",
    "τòî",
    "µïë",
    "µ₧ù",
    "σ╛ï",
    "σÅ½",
    "Σ╕ö",
    "τ⌐╢",
    "Φºé",
    "Φ╢è",
    "τ╗ç",
    "Φúà",
    "σ╜▒",
    "τ«ù",
    "Σ╜Ä",
    "µîü",
    "Θƒ│",
    "Σ╝ù",
    "Σ╣ª",
    "σ╕â",
    "σñì",
    "σ«╣",
    "σä┐",
    "Θí╗",
    "ΘÖà",
    "σòå",
    "Θ¥₧",
    "Θ¬î",
    "Φ┐₧",
    "µû¡",
    "µ╖▒",
    "ΘÜ╛",
    "Φ┐æ",
    "τƒ┐",
    "σìâ",
    "σæ¿",
    "σºö",
    "τ┤á",
    "µèÇ",
    "σñç",
    "σìè",
    "σè₧",
    "Θ¥Æ",
    "τ£ü",
    "σêù",
    "Σ╣á",
    "σôì",
    "τ║ª",
    "µö»",
    "Φê¼",
    "σÅ▓",
    "µäƒ",
    "σè│",
    "Σ╛┐",
    "σ¢ó",
    "σ╛Ç",
    "Θà╕",
    "σÄå",
    "σ╕é",
    "σàï",
    "Σ╜ò",
    "ΘÖñ",
    "µ╢ê",
    "µ₧ä",
    "σ║£",
    "τº░",
    "σñ¬",
    "σçå",
    "τ▓╛",
    "σÇ╝",
    "σÅ╖",
    "τÄç",
    "µùÅ",
    "τ╗┤",
    "σêÆ",
    "ΘÇë",
    "µáç",
    "σåÖ",
    "σ¡ÿ",
    "σÇÖ",
    "µ»¢",
    "Σ║▓",
    "σ┐½",
    "µòê",
    "µû»",
    "ΘÖó",
    "µƒÑ",
    "µ▒ƒ",
    "σ₧ï",
    "τ£╝",
    "τÄï",
    "µîë",
    "µá╝",
    "σà╗",
    "µÿô",
    "τ╜«",
    "µ┤╛",
    "σ▒é",
    "τëç",
    "σºï",
    "σì┤",
    "Σ╕ô",
    "τè╢",
    "Φé▓",
    "σÄé",
    "Σ║¼",
    "Φ»å",
    "ΘÇé",
    "σ▒₧",
    "σ£å",
    "σîà",
    "τü½",
    "Σ╜Å",
    "Φ░â",
    "µ╗í",
    "σÄ┐",
    "σ▒Ç",
    "τàº",
    "σÅé",
    "τ║ó",
    "τ╗å",
    "σ╝ò",
    "σÉ¼",
    "Φ»Ñ",
    "Θôü",
    "Σ╗╖",
    "Σ╕Ñ",
    "Θªû",
    "σ║ò",
    "µ╢▓",
    "σ«ÿ",
    "σ╛╖",
    "ΘÜÅ",
    "τùà",
    "ΦïÅ",
    "σñ▒",
    "σ░ö",
    "µ¡╗",
    "Φ«▓",
    "Θàì",
    "σÑ│",
    "Θ╗ä",
    "µÄ¿",
    "µÿ╛",
    "Φ░ê",
    "τ╜¬",
    "τÑ₧",
    "Φë║",
    "σæó",
    "σ╕¡",
    "σÉ½",
    "Σ╝ü",
    "µ£¢",
    "σ»å",
    "µë╣",
    "ΦÉÑ",
    "Θí╣",
    "Θÿ▓",
    "Σ╕╛",
    "τÉâ",
    "Φï▒",
    "µ░º",
    "σè┐",
    "σæè",
    "µ¥Ä",
    "σÅ░",
    "ΦÉ╜",
    "µ£¿",
    "σ╕«",
    "Φ╜«",
    "τá┤",
    "Σ║Ü",
    "σ╕ê",
    "σ¢┤",
    "µ│¿",
    "Φ┐£",
    "σ¡ù",
    "µ¥É",
    "µÄÆ",
    "Σ╛¢",
    "µ▓│",
    "µÇü",
    "σ░ü",
    "σÅª",
    "µû╜",
    "σçÅ",
    "µáæ",
    "µ║╢",
    "µÇÄ",
    "µ¡ó",
    "µíê",
    "Φ¿Ç",
    "σú½",
    "σ¥ç",
    "µ¡ª",
    "σ¢║",
    "σÅ╢",
    "Θ▒╝",
    "µ│ó",
    "Φºå",
    "Σ╗à",
    "Φ┤╣",
    "τ┤º",
    "τê▒",
    "σ╖ª",
    "τ½á",
    "µù⌐",
    "µ£¥",
    "σ«│",
    "τ╗¡",
    "Φ╜╗",
    "µ£ì",
    "Φ»ò",
    "Θúƒ",
    "σàà",
    "σà╡",
    "µ║É",
    "σêñ",
    "µèñ",
    "σÅ╕",
    "Φ╢│",
    "µƒÉ",
    "τ╗â",
    "σ╖«",
    "Φç┤",
    "µ¥┐",
    "τö░",
    "ΘÖì",
    "Θ╗æ",
    "τè»",
    "Φ┤ƒ",
    "σç╗",
    "Φîâ",
    "τ╗º",
    "σà┤",
    "Σ╝╝",
    "Σ╜Ö",
    "σ¥Ü",
    "µ¢▓",
    "Φ╛ô",
    "Σ┐«",
    "µòà",
    "σƒÄ",
    "σñ½",
    "σñƒ",
    "ΘÇü",
    "τ¼ö",
    "Φê╣",
    "σìá",
    "σÅ│",
    "Φ┤ó",
    "σÉâ",
    "σ»î",
    "µÿÑ",
    "Φüî",
    "Φºë",
    "µ▒ë",
    "τö╗",
    "σèƒ",
    "σ╖┤",
    "Φ╖ƒ",
    "ΦÖ╜",
    "µ¥é",
    "Θú₧",
    "µúÇ",
    "σÉ╕",
    "σè⌐",
    "σìç",
    "Θÿ│",
    "Σ║Æ",
    "σê¥",
    "σê¢",
    "µèù",
    "ΦÇâ",
    "µèò",
    "σ¥Å",
    "τ¡û",
    "σÅñ",
    "σ╛ä",
    "µìó",
    "µ£¬",
    "Φ╖æ",
    "τòÖ",
    "ΘÆó",
    "µ¢╛",
    "τ½»",
    "Φ┤ú",
    "τ½Ö",
    "τ«Ç",
    "Φ┐░",
    "ΘÆ▒",
    "σë»",
    "σ░╜",
    "σ╕¥",
    "σ░ä",
    "Φìë",
    "σå▓",
    "µë┐",
    "τï¼",
    "Σ╗ñ",
    "ΘÖÉ",
    "Θÿ┐",
    "σ«ú",
    "τÄ»",
    "σÅî",
    "Φ»╖",
    "Φ╢à",
    "σ╛«",
    "Φ«⌐",
    "µÄº",
    "σ╖₧",
    "Φë»",
    "Φ╜┤",
    "µë╛",
    "σÉª",
    "τ║¬",
    "τ¢è",
    "Σ╛¥",
    "Σ╝ÿ",
    "Θí╢",
    "τíÇ",
    "Φ╜╜",
    "σÇÆ",
    "µê┐",
    "τ¬ü",
    "σ¥É",
    "τ▓ë",
    "µòî",
    "τòÑ",
    "σ«ó",
    "Φóü",
    "σå╖",
    "Φâ£",
    "τ╗¥",
    "µ₧É",
    "σ¥ù",
    "σëé",
    "µ╡ï",
    "Σ╕¥",
    "σìÅ",
    "Φ»ë",
    "σ┐╡",
    "ΘÖê",
    "Σ╗ì",
    "τ╜ù",
    "τ¢É",
    "σÅï",
    "µ┤ï",
    "ΘöÖ",
    "Φïª",
    "σñ£",
    "σêæ",
    "τº╗",
    "Θóæ",
    "ΘÇÉ",
    "Θ¥á",
    "µ╖╖",
    "µ»ì",
    "τƒ¡",
    "τÜ«",
    "τ╗ê",
    "ΦüÜ",
    "µ▒╜",
    "µ¥æ",
    "Σ║æ",
    "σô¬",
    "µùó",
    "Φ╖¥",
    "σì½",
    "σü£",
    "τâê",
    "σñ«",
    "σ»ƒ",
    "τâº",
    "Φ┐à",
    "σóâ",
    "ΦïÑ",
    "σì░",
    "µ┤▓",
    "σê╗",
    "µï¼",
    "µ┐Ç",
    "σ¡ö",
    "µÉ₧",
    "τöÜ",
    "σ«ñ",
    "σ╛à",
    "µá╕",
    "µáí",
    "µòú",
    "Σ╛╡",
    "σÉº",
    "τö▓",
    "µ╕╕",
    "Σ╣à",
    "ΦÅ£",
    "σæ│",
    "µùº",
    "µ¿í",
    "µ╣û",
    "Φ┤º",
    "µìƒ",
    "Θóä",
    "Θÿ╗",
    "µ»½",
    "µÖ«",
    "τ¿│",
    "Σ╣Ö",
    "σªê",
    "µñì",
    "µü»",
    "µë⌐",
    "Θô╢",
    "Φ»¡",
    "µîÑ",
    "ΘàÆ",
    "σ«ê",
    "µï┐",
    "σ║Å",
    "τ║╕",
    "σî╗",
    "τ╝║",
    "Θ¢¿",
    "σÉù",
    "ΘÆê",
    "σêÿ",
    "σòè",
    "µÇÑ",
    "σö▒",
    "Φ»»",
    "Φ«¡",
    "µä┐",
    "σ«í",
    "ΘÖä",
    "ΦÄ╖",
    "Φî╢",
    "Θ▓£",
    "τ▓«",
    "µûñ",
    "σ¡⌐",
    "Φä▒",
    "τí½",
    "ΦéÑ",
    "σûä",
    "Θ╛Ö",
    "µ╝ö",
    "τê╢",
    "µ╕É",
    "ΦíÇ",
    "µ¼ó",
    "µó░",
    "µÄî",
    "µ¡î",
    "µ▓Ö",
    "σêÜ",
    "µö╗",
    "Φ░ô",
    "τ¢╛",
    "Φ«¿",
    "µÖÜ",
    "τ▓Æ",
    "Σ╣▒",
    "τçâ",
    "τƒ¢",
    "Σ╣Ä",
    "µ¥Ç",
    "Φì»",
    "σ«ü",
    "Θ▓ü",
    "Φ┤╡",
    "ΘÆƒ",
    "τàñ",
    "Φ»╗",
    "τÅ¡",
    "Σ╝»",
    "ΘªÖ",
    "Σ╗ï",
    "Φ┐½",
    "σÅÑ",
    "Σ╕░",
    "σƒ╣",
    "µÅí",
    "σà░",
    "µïà",
    "σ╝ª",
    "Φ¢ï",
    "µ▓ë",
    "σüç",
    "τ⌐┐",
    "µëº",
    "τ¡ö",
    "Σ╣É",
    "Φ░ü",
    "Θí║",
    "τâƒ",
    "τ╝⌐",
    "σ╛ü",
    "Φä╕",
    "σû£",
    "µ¥╛",
    "ΦäÜ",
    "σ¢░",
    "σ╝é",
    "σàì",
    "Φâî",
    "µÿƒ",
    "τªÅ",
    "Σ╣░",
    "µƒô",
    "Σ║ò",
    "µªé",
    "µàó",
    "µÇò",
    "τúü",
    "σÇì",
    "τÑû",
    "τÜç",
    "Σ┐â",
    "Θ¥Ö",
    "ΦíÑ",
    "Φ»ä",
    "τ┐╗",
    "Φéë",
    "Φ╖╡",
    "σ░╝",
    "Φíú",
    "σ«╜",
    "µë¼",
    "µúë",
    "σ╕î",
    "Σ╝ñ",
    "µôì",
    "σ₧é",
    "τºï",
    "σ«£",
    "µ░ó",
    "σÑù",
    "τ¥ú",
    "µî»",
    "µ₧╢",
    "Σ║«",
    "µ£½",
    "σ«¬",
    "σ║å",
    "τ╝û",
    "τë¢",
    "Φºª",
    "µÿá",
    "Θ¢╖",
    "ΘöÇ",
    "Φ»ù",
    "σ║º",
    "σ▒à",
    "µèô",
    "Φúé",
    "Φâ₧",
    "σæ╝",
    "σ¿ÿ",
    "µÖ»",
    "σ¿ü",
    "τ╗┐",
    "µÖ╢",
    "σÄÜ",
    "τ¢ƒ",
    "Φíí",
    "Θ╕í",
    "σ¡Ö",
    "σ╗╢",
    "σì▒",
    "Φâ╢",
    "σ▒ï",
    "Σ╣í",
    "Σ╕┤",
    "ΘÖå",
    "Θí╛",
    "µÄë",
    "σæÇ",
    "τü»",
    "σ▓ü",
    "µÄ¬",
    "µ¥ƒ",
    "ΦÇÉ",
    "σëº",
    "τÄë",
    "Φ╡╡",
    "Φ╖│",
    "σôÑ",
    "σ¡ú",
    "Φ»╛",
    "σç»",
    "Φâí",
    "Θó¥",
    "µ¼╛",
    "τ╗ì",
    "σì╖",
    "Θ╜É",
    "Σ╝ƒ",
    "ΦÆ╕",
    "µ«û",
    "µ░╕",
    "σ«ù",
    "Φïù",
    "σ╖¥",
    "τéë",
    "σ▓⌐",
    "σ╝▒",
    "Θ¢╢",
    "µ¥¿",
    "σÑÅ",
    "µ▓┐",
    "Θ£▓",
    "µ¥å",
    "µÄó",
    "µ╗æ",
    "Θòç",
    "ΘÑ¡",
    "µ╡ô",
    "Φê¬",
    "µÇÇ",
    "Φ╡╢",
    "σ║ô",
    "σñ║",
    "Σ╝è",
    "τü╡",
    "τ¿Ä",
    "ΘÇö",
    "τü¡",
    "Φ╡¢",
    "σ╜Æ",
    "σÅ¼",
    "Θ╝ô",
    "µÆ¡",
    "τ¢ÿ",
    "Φúü",
    "ΘÖ⌐",
    "σ║╖",
    "σö»",
    "σ╜ò",
    "ΦÅî",
    "τ║»",
    "σÇƒ",
    "τ│û",
    "τ¢û",
    "µ¿¬",
    "τ¼ª",
    "τºü",
    "σè¬",
    "σáé",
    "σƒƒ",
    "µ₧¬",
    "µ╢ª",
    "σ╣à",
    "σôê",
    "τ½ƒ",
    "τåƒ",
    "ΦÖ½",
    "µ│╜",
    "Φäæ",
    "σúñ",
    "τó│",
    "µ¼º",
    "Θüì",
    "Σ╛º",
    "σ»¿",
    "µòó",
    "σ╜╗",
    "ΦÖæ",
    "µû£",
    "Φûä",
    "σ║¡",
    "τ║│",
    "σ╝╣",
    "ΘÑ▓",
    "Σ╝╕",
    "µèÿ",
    "Θ║ª",
    "µ╣┐",
    "µÜù",
    "Φì╖",
    "τôª",
    "σí₧",
    "σ║è",
    "τ¡æ",
    "µü╢",
    "µê╖",
    "Φ«┐",
    "σíö",
    "σÑç",
    "ΘÇÅ",
    "µóü",
    "σêÇ",
    "µùï",
    "Φ┐╣",
    "σìí",
    "µ░»",
    "Θüç",
    "Σ╗╜",
    "µ»Æ",
    "µ│Ñ",
    "ΘÇÇ",
    "µ┤ù",
    "µæå",
    "τü░",
    "σ╜⌐",
    "σìû",
    "ΦÇù",
    "σñÅ",
    "µï⌐",
    "σ┐Ö",
    "Θô£",
    "τî«",
    "τí¼",
    "Σ║ê",
    "τ╣ü",
    "σ£ê",
    "Θ¢¬",
    "σç╜",
    "Σ║ª",
    "µè╜",
    "τ»ç",
    "Θÿ╡",
    "Θÿ┤",
    "Σ╕ü",
    "σ░║",
    "Φ┐╜",
    "σáå",
    "Θ¢ä",
    "Φ┐Ä",
    "µ│¢",
    "τê╕",
    "µÑ╝",
    "Θü┐",
    "Φ░ï",
    "σÉ¿",
    "ΘçÄ",
    "τî¬",
    "µùù",
    "τ┤»",
    "σüÅ",
    "σà╕",
    "Θªå",
    "τ┤ó",
    "τºª",
    "Φäé",
    "µ╜«",
    "τê╖",
    "Φ▒å",
    "σ┐╜",
    "µëÿ",
    "µâè",
    "σíæ",
    "Θüù",
    "µäê",
    "µ£▒",
    "µ¢┐",
    "τ║ñ",
    "τ▓ù",
    "σÇ╛",
    "σ░Ü",
    "τù¢",
    "µÑÜ",
    "Φ░ó",
    "σÑï",
    "Φ┤¡",
    "τú¿",
    "σÉ¢",
    "µ▒á",
    "µùü",
    "τóÄ",
    "Θ¬¿",
    "τ¢æ",
    "µìò",
    "σ╝ƒ",
    "µÜ┤",
    "σë▓",
    "Φ┤»",
    "µ«è",
    "Θçè",
    "Φ»ì",
    "Σ║í",
    "σúü",
    "Θí┐",
    "σ«¥",
    "σìê",
    "σ░ÿ",
    "Θù╗",
    "µÅ¡",
    "τé«",
    "µ«ï",
    "σå¼",
    "µíÑ",
    "σªç",
    "Φ¡ª",
    "τ╗╝",
    "µï¢",
    "σÉ┤",
    "Σ╗ÿ",
    "µ╡«",
    "Θü¡",
    "σ╛É",
    "µé¿",
    "µæç",
    "Φ░╖",
    "Φ╡₧",
    "τ«▒",
    "ΘÜö",
    "Φ«ó",
    "τö╖",
    "σÉ╣",
    "σ¢¡",
    "τ║╖",
    "σöÉ",
    "Φ┤Ñ",
    "σ«ï",
    "τÄ╗",
    "σ╖¿",
    "ΦÇò",
    "σ¥ª",
    "Φìú",
    "Θù¡",
    "µ╣╛",
    "Θö«",
    "σçí",
    "Θ⌐╗",
    "Θöà",
    "µòæ",
    "µü⌐",
    "σëÑ",
    "σç¥",
    "τó▒",
    "Θ╜┐",
    "µê¬",
    "τé╝",
    "Θ║╗",
    "τ║║",
    "τªü",
    "σ║ƒ",
    "τ¢¢",
    "τëê",
    "τ╝ô",
    "σçÇ",
    "τ¥¢",
    "µÿî",
    "σ⌐Ü",
    "µ╢ë",
    "τ¡Æ",
    "σÿ┤",
    "µÅÆ",
    "σ▓╕",
    "µ£ù",
    "σ║ä",
    "Φíù",
    "ΦùÅ",
    "σºæ",
    "Φ┤╕",
    "ΦàÉ",
    "σÑ┤",
    "σòª",
    "µâ»",
    "Σ╣ÿ",
    "Σ╝Ö",
    "µüó",
    "σîÇ",
    "τ║▒",
    "µëÄ",
    "Φ╛⌐",
    "ΦÇ│",
    "σ╜¬",
    "Φçú",
    "Σ║┐",
    "τÆâ",
    "µè╡",
    "Φäë",
    "τºÇ",
    "ΦÉ¿",
    "Σ┐ä",
    "τ╜æ",
    "Φê₧",
    "σ║ù",
    "σû╖",
    "τ║╡",
    "σ»╕",
    "µ▒ù",
    "µîé",
    "µ┤¬",
    "Φ┤║",
    "Θù¬",
    "µƒ¼",
    "τêå",
    "τâ»",
    "µ┤Ñ",
    "τ¿╗",
    "σóÖ",
    "Φ╜»",
    "σïç",
    "σâÅ",
    "µ╗Ü",
    "σÄÿ",
    "ΦÆÖ",
    "Φè│",
    "Φé»",
    "σ¥í",
    "µƒ▒",
    "Φìí",
    "Φà┐",
    "Σ╗¬",
    "µùà",
    "σ░╛",
    "Φ╜º",
    "σå░",
    "Φ┤í",
    "τÖ╗",
    "Θ╗Ä",
    "σëè",
    "ΘÆ╗",
    "σïÆ",
    "ΘÇâ",
    "ΘÜ£",
    "µ░¿",
    "Θâ¡",
    "σ│░",
    "σ╕ü",
    "µ╕»",
    "Σ╝Å",
    "Φ╜¿",
    "Σ║⌐",
    "µ»ò",
    "µôª",
    "ΦÄ½",
    "σê║",
    "µ╡¬",
    "τºÿ",
    "µÅ┤",
    "µá¬",
    "σüÑ",
    "σö«",
    "Φéí",
    "σ▓¢",
    "τöÿ",
    "µ│í",
    "τ¥í",
    "τ½Ñ",
    "Θô╕",
    "µ▒ñ",
    "ΘÿÇ",
    "Σ╝æ",
    "µ▒ç",
    "Φêì",
    "τëº",
    "τ╗ò",
    "τé╕",
    "σô▓",
    "τú╖",
    "τ╗⌐",
    "µ£ï",
    "µ╖í",
    "σ░û",
    "σÉ»",
    "ΘÖ╖",
    "µƒ┤",
    "σæê",
    "σ╛Æ",
    "Θó£",
    "µ│¬",
    "τ¿ì",
    "σ┐ÿ",
    "µ│╡",
    "Φô¥",
    "µïû",
    "µ┤₧",
    "µÄê",
    "Θò£",
    "Φ╛¢",
    "σú«",
    "Θöï",
    "Φ┤½",
    "ΦÖÜ",
    "σ╝»",
    "µæ⌐",
    "µ│░",
    "σ╣╝",
    "σ╗╖",
    "σ░è",
    "τ¬ù",
    "τ║▓",
    "σ╝ä",
    "ΘÜ╢",
    "τûæ",
    "µ░Å",
    "σ«½",
    "σºÉ",
    "Θ£ç",
    "τæ₧",
    "µÇ¬",
    "σ░ñ",
    "τÉ┤",
    "σ╛¬",
    "µÅÅ",
    "Φå£",
    "Φ┐¥",
    "σñ╣",
    "Φà░",
    "τ╝ÿ",
    "τÅá",
    "τ⌐╖",
    "µú«",
    "µ₧¥",
    "τ½╣",
    "µ▓ƒ",
    "σé¼",
    "τ╗│",
    "σ┐å",
    "Θéª",
    "σë⌐",
    "σ╣╕",
    "µ╡å",
    "µáÅ",
    "µïÑ",
    "τëÖ",
    "Φ┤«",
    "τñ╝",
    "µ╗ñ",
    "ΘÆá",
    "τ║╣",
    "τ╜ó",
    "µïì",
    "σÆ▒",
    "σûè",
    "Φóû",
    "σƒâ",
    "σïñ",
    "τ╜Ü",
    "τäª",
    "µ╜£",
    "Σ╝ì",
    "σó¿",
    "µ¼▓",
    "τ╝¥",
    "σºô",
    "σêè",
    "ΘÑ▒",
    "Σ╗┐",
    "σÑû",
    "Θô¥",
    "Θ¼╝",
    "Σ╕╜",
    "Φ╖¿",
    "Θ╗ÿ",
    "µîû",
    "Θô╛",
    "µë½",
    "σû¥",
    "Φóï",
    "τé¡",
    "µ▒í",
    "σ╣ò",
    "Φ»╕",
    "σ╝º",
    "σè▒",
    "µóà",
    "σÑ╢",
    "µ┤ü",
    "τü╛",
    "Φêƒ",
    "Θë┤",
    "Φï»",
    "Φ«╝",
    "µè▒",
    "µ»ü",
    "µçé",
    "σ»Æ",
    "µÖ║",
    "σƒö",
    "σ»ä",
    "σ▒è",
    "Φ╖â",
    "µ╕í",
    "µîæ",
    "Σ╕╣",
    "Φë░",
    "Φ┤¥",
    "τó░",
    "µïö",
    "τê╣",
    "µê┤",
    "τáü",
    "µóª",
    "Φè╜",
    "τåö",
    "Φ╡ñ",
    "µ╕ö",
    "σô¡",
    "µò¼",
    "Θóù",
    "σÑö",
    "Θôà",
    "Σ╗▓",
    "ΦÖÄ",
    "τ¿Ç",
    "σª╣",
    "Σ╣Å",
    "τÅì",
    "τö│",
    "µíî",
    "Θü╡",
    "σàü",
    "ΘÜå",
    "Φ₧║",
    "Σ╗ô",
    "Θ¡Å",
    "ΘöÉ",
    "µÖô",
    "µ░«",
    "σà╝",
    "ΘÜÉ",
    "τóì",
    "Φ╡½",
    "µï¿",
    "σ┐á",
    "Φéâ",
    "τ╝╕",
    "τë╡",
    "µèó",
    "σìÜ",
    "σ╖º",
    "σú│",
    "σàä",
    "µ¥£",
    "Φ«»",
    "Φ»Ü",
    "τóº",
    "τÑÑ",
    "µƒ»",
    "Θí╡",
    "σ╖í",
    "τƒ⌐",
    "µé▓",
    "τüî",
    "Θ╛ä",
    "Σ╝ª",
    "τÑ¿",
    "σ»╗",
    "µíé",
    "Θô║",
    "σ£ú",
    "µüÉ",
    "µü░",
    "Θâæ",
    "Φ╢ú",
    "µè¼",
    "ΦìÆ",
    "Φà╛",
    "Φ┤┤",
    "µƒö",
    "µ╗┤",
    "τî¢",
    "Θÿö",
    "Φ╛å",
    "σª╗",
    "σí½",
    "µÆñ",
    "σé¿",
    "τ¡╛",
    "Θù╣",
    "µë░",
    "τ┤½",
    "τáé",
    "ΘÇÆ",
    "µêÅ",
    "σÉè",
    "ΘÖ╢",
    "Σ╝É",
    "σûé",
    "τûù",
    "τô╢",
    "σ⌐å",
    "µèÜ",
    "Φçé",
    "µæ╕",
    "σ┐ì",
    "ΦÖ╛",
    "Φ£í",
    "Θé╗",
    "Φâ╕",
    "σ╖⌐",
    "µîñ",
    "σü╢",
    "σ╝â",
    "µº╜",
    "σè▓",
    "Σ╣│",
    "Θéô",
    "σÉë",
    "Σ╗ü",
    "τâé",
    "τáû",
    "τºƒ",
    "Σ╣î",
    "Φê░",
    "Σ╝┤",
    "τô£",
    "µ╡à",
    "Σ╕Ö",
    "µÜé",
    "τçÑ",
    "µ⌐í",
    "µƒ│",
    "Φ┐╖",
    "µÜû",
    "τëî",
    "τºº",
    "Φâå",
    "Φ»ª",
    "τ░º",
    "Φ╕Å",
    "τô╖",
    "Φ░▒",
    "σæå",
    "σ«╛",
    "τ│è",
    "µ┤¢",
    "Φ╛ë",
    "µäñ",
    "τ½₧",
    "ΘÜÖ",
    "µÇÆ",
    "τ▓ÿ",
    "Σ╣â",
    "τ╗¬",
    "Φé⌐",
    "τ▒ì",
    "µòÅ",
    "µ╢é",
    "τåÖ",
    "τÜå",
    "Σ╛ª",
    "µé¼",
    "µÄÿ",
    "Σ║½",
    "τ║á",
    "ΘåÆ",
    "τïé",
    "Θöü",
    "µ╖Ç",
    "µü¿",
    "τë▓",
    "Θ£╕",
    "τê¼",
    "Φ╡Å",
    "ΘÇå",
    "τÄ⌐",
    "ΘÖ╡",
    "τÑ¥",
    "τºÆ",
    "µ╡Ö",
    "Φ▓î",
    "σ╜╣",
    "σ╜╝",
    "µéë",
    "Θ╕¡",
    "Φ╢ï",
    "σçñ",
    "µÖ¿",
    "τò£",
    "Φ╛ê",
    "τº⌐",
    "σì╡",
    "τ╜▓",
    "µó»",
    "τéÄ",
    "µ╗⌐",
    "µúï",
    "Θ⌐▒",
    "τ¡¢",
    "σ│í",
    "σåÆ",
    "σòÑ",
    "σ»┐",
    "Φ»æ",
    "µ╡╕",
    "µ│ë",
    "σ╕╜",
    "Φ┐ƒ",
    "τíà",
    "τûå",
    "Φ┤╖",
    "µ╝Å",
    "τ¿┐",
    "σåá",
    "σ½⌐",
    "Φâü",
    "Φè»",
    "τëó",
    "σÅ¢",
    "ΦÜÇ",
    "σÑÑ",
    "Θ╕ú",
    "σ▓¡",
    "τ╛è",
    "σç¡",
    "Σ╕▓",
    "σíÿ",
    "τ╗ÿ",
    "Θà╡",
    "Φ₧ì",
    "τ¢å",
    "Θöí",
    "σ║Ö",
    "τ¡╣",
    "σå╗",
    "Φ╛à",
    "µæä",
    "Φó¡",
    "τ¡ï",
    "µïÆ",
    "σâÜ",
    "µù▒",
    "ΘÆ╛",
    "Θ╕ƒ",
    "µ╝å",
    "µ▓ê",
    "τ£ë",
    "τûÅ",
    "µ╖╗",
    "µúÆ",
    "τ⌐ù",
    "τí¥",
    "Θƒ⌐",
    "ΘÇ╝",
    "µë¡",
    "Σ╛¿",
    "σçë",
    "µî║",
    "τóù",
    "µá╜",
    "τéÆ",
    "µ¥»",
    "µéú",
    "ΘªÅ",
    "σè¥",
    "Φ▒¬",
    "Φ╛╜",
    "σïâ",
    "Θ╕┐",
    "µùª",
    "σÉÅ",
    "µï£",
    "τïù",
    "σƒï",
    "Φ╛è",
    "µÄ⌐",
    "ΘÑ«",
    "µÉ¼",
    "Θ¬é",
    "Φ╛₧",
    "σï╛",
    "µëú",
    "Σ╝░",
    "ΦÆï",
    "τ╗Æ",
    "Θ¢╛",
    "Σ╕ê",
    "µ£╡",
    "σºå",
    "µïƒ",
    "σ«ç",
    "Φ╛æ",
    "ΘÖò",
    "Θ¢ò",
    "σü┐",
    "Φôä",
    "σ┤ç",
    "σë¬",
    "σÇí",
    "σÄà",
    "σÆ¼",
    "Θ⌐╢",
    "Φû»",
    "σê╖",
    "µûÑ",
    "τò¬",
    "Φ╡ï",
    "σÑë",
    "Σ╜¢",
    "µ╡ç",
    "µ╝½",
    "µ¢╝",
    "µëç",
    "ΘÆÖ",
    "µíâ",
    "µë╢",
    "Σ╗ö",
    "Φ┐ö",
    "Σ┐ù",
    "Σ║Å",
    "Φàö",
    "Θ₧ï",
    "µú▒",
    "Φªå",
    "µíå",
    "µéä",
    "σÅö",
    "µÆ₧",
    "Θ¬ù",
    "σïÿ",
    "µù║",
    "µ▓╕",
    "σ¡ñ",
    "σÉÉ",
    "σ¡ƒ",
    "µ╕á",
    "σ▒ê",
    "τû╛",
    "σªÖ",
    "µâ£",
    "Σ╗░",
    "τïá",
    "ΦâÇ",
    "Φ░É",
    "µè¢",
    "Θ£ë",
    "µíæ",
    "σ▓ù",
    "σÿ¢",
    "Φí░",
    "τ¢ù",
    "µ╕ù",
    "ΦäÅ",
    "Φ╡û",
    "µ╢î",
    "τö£",
    "µ¢╣",
    "Θÿà",
    "Φéî",
    "σô⌐",
    "σÄë",
    "τââ",
    "τ║¼",
    "µ»à",
    "µÿ¿",
    "Σ╝¬",
    "τùç",
    "τà«",
    "σÅ╣",
    "ΘÆë",
    "µÉ¡",
    "ΦîÄ",
    "τ¼╝",
    "Θà╖",
    "σü╖",
    "σ╝ô",
    "ΘöÑ",
    "µüÆ",
    "µ¥░",
    "σ¥æ",
    "Θ╝╗",
    "τ┐╝",
    "τ║╢",
    "σÅÖ",
    "τï▒",
    "ΘÇ«",
    "τ╜É",
    "τ╗£",
    "µúÜ",
    "µèæ",
    "Φå¿",
    "Φö¼",
    "σ»║",
    "Θ¬ñ",
    "τ⌐å",
    "σå╢",
    "µ₧»",
    "σåî",
    "σ░╕",
    "σç╕",
    "τ╗à",
    "σ¥»",
    "τë║",
    "τä░",
    "Φ╜░",
    "µ¼ú",
    "µÖï",
    "τÿª",
    "σ╛í",
    "Θö¡",
    "Θöª",
    "Σ╕º",
    "µù¼",
    "Θö╗",
    "σ₧ä",
    "µÉ£",
    "µëæ",
    "ΘéÇ",
    "Σ║¡",
    "Θà»",
    "Φ┐ê",
    "ΦêÆ",
    "Φäå",
    "Θà╢",
    "Θù▓",
    "σ┐º",
    "ΘàÜ",
    "Θí╜",
    "τ╛╜",
    "µ╢¿",
    "σì╕",
    "Σ╗ù",
    "ΘÖ¬",
    "Φ╛ƒ",
    "µâ⌐",
    "µ¥¡",
    "σºÜ",
    "ΦéÜ",
    "µìë",
    "Θúÿ",
    "µ╝é",
    "µÿå",
    "µ¼║",
    "σÉ╛",
    "ΘâÄ",
    "τâ╖",
    "µ▒ü",
    "σæ╡",
    "ΘÑ░",
    "ΦÉº",
    "Θ¢à",
    "Θé«",
    "Φ┐ü",
    "τçò",
    "µÆÆ",
    "σº╗",
    "Φ╡┤",
    "σ«┤",
    "τâª",
    "σÇ║",
    "σ╕É",
    "µûæ",
    "Θôâ",
    "µù¿",
    "Θåç",
    "Φæú",
    "ΘÑ╝",
    "Θ¢Å",
    "σº┐",
    "µïî",
    "σéà",
    "Φà╣",
    "σªÑ",
    "µÅë",
    "Φ┤ñ",
    "µïå",
    "µ¡¬",
    "Φæí",
    "Φâ║",
    "Σ╕ó",
    "µ╡⌐",
    "σ╛╜",
    "µÿé",
    "σ₧½",
    "µîí",
    "Φºê",
    "Φ┤¬",
    "µà░",
    "τ╝┤",
    "µ▒¬",
    "µàî",
    "σå»",
    "Φ»║",
    "σº£",
    "Φ░è",
    "σç╢",
    "σèú",
    "Φ»¼",
    "ΦÇÇ",
    "µÿÅ",
    "Φ║║",
    "τ¢ê",
    "Θ¬æ",
    "Σ╣ö",
    "µ║¬",
    "Σ╕¢",
    "σìó",
    "µè╣",
    "Θù╖",
    "σÆ¿",
    "σê«",
    "Θ⌐╛",
    "τ╝å",
    "µéƒ",
    "µæÿ",
    "ΘôÆ",
    "µÄ╖",
    "Θóç",
    "σ╣╗",
    "µƒä",
    "µâá",
    "µâ¿",
    "Σ╜│",
    "Σ╗ç",
    "Φàè",
    "τ¬¥",
    "µ╢ñ",
    "σëæ",
    "τ₧º",
    "σáí",
    "µ│╝",
    "Φæ▒",
    "τ╜⌐",
    "Θ£ì",
    "µì₧",
    "ΦâÄ",
    "Φïì",
    "µ╗¿",
    "Σ┐⌐",
    "µìà",
    "µ╣ÿ",
    "τáì",
    "Θ£₧",
    "Θé╡",
    "ΦÉä",
    "τû»",
    "µ╖«",
    "Θüé",
    "τåè",
    "τ▓¬",
    "τâÿ",
    "σ«┐",
    "µíú",
    "µêê",
    "Θ⌐│",
    "σ½é",
    "Φúò",
    "σ╛Ö",
    "τ«¡",
    "µìÉ",
    "Φéá",
    "µÆæ",
    "µÖÆ",
    "Φ╛¿",
    "µ«┐",
    "ΦÄ▓",
    "µæè",
    "µÉà",
    "Θà▒",
    "σ▒Å",
    "τû½",
    "σôÇ",
    "Φöí",
    "σá╡",
    "µ▓½",
    "τÜ▒",
    "τòà",
    "σÅá",
    "Θÿü",
    "ΦÄ▒",
    "µò▓",
    "Φ╛û",
    "ΘÆ⌐",
    "τùò",
    "σ¥¥",
    "σ╖╖",
    "ΘÑ┐",
    "τÑ╕",
    "Σ╕ÿ",
    "τÄä",
    "µ║£",
    "µ¢░",
    "ΘÇ╗",
    "σ╜¡",
    "σ░¥",
    "σì┐",
    "σª¿",
    "Φëç",
    "σÉ₧",
    "Θƒª",
    "µÇ¿",
    "τƒ«",
    "µ¡ç"
]

},{}],29:[function(require,module,exports){
module.exports=[
    "τÜä",
    "Σ╕Ç",
    "µÿ»",
    "σ£¿",
    "Σ╕ì",
    "Σ║å",
    "µ£ë",
    "σÆî",
    "Σ║║",
    "ΘÇÖ",
    "Σ╕¡",
    "σñº",
    "τé║",
    "Σ╕è",
    "σÇï",
    "σ£ï",
    "µêæ",
    "Σ╗Ñ",
    "Φªü",
    "Σ╗û",
    "µÖé",
    "Σ╛å",
    "τö¿",
    "σÇæ",
    "τöƒ",
    "σê░",
    "Σ╜£",
    "σ£░",
    "µû╝",
    "σç║",
    "σ░▒",
    "σêå",
    "σ░ì",
    "µêÉ",
    "µ£â",
    "σÅ»",
    "Σ╕╗",
    "τÖ╝",
    "σ╣┤",
    "σïò",
    "σÉî",
    "σ╖Ñ",
    "Σ╣ƒ",
    "Φâ╜",
    "Σ╕ï",
    "ΘüÄ",
    "σ¡É",
    "Φ¬¬",
    "τöó",
    "τ¿«",
    "Θ¥ó",
    "ΦÇî",
    "µû╣",
    "σ╛î",
    "σñÜ",
    "σ«Ü",
    "Φíî",
    "σ¡╕",
    "µ│ò",
    "µëÇ",
    "µ░æ",
    "σ╛ù",
    "τ╢ô",
    "σìü",
    "Σ╕ë",
    "Σ╣ï",
    "ΘÇ▓",
    "Φæù",
    "τ¡ë",
    "Θâ¿",
    "σ║ª",
    "σ«╢",
    "Θ¢╗",
    "σè¢",
    "Φúí",
    "σªé",
    "µ░┤",
    "σîû",
    "Θ½ÿ",
    "Φç¬",
    "Σ║î",
    "τÉå",
    "Φ╡╖",
    "σ░Å",
    "τë⌐",
    "τÅ╛",
    "σ»ª",
    "σèá",
    "ΘçÅ",
    "Θâ╜",
    "σà⌐",
    "Θ½ö",
    "σê╢",
    "µ⌐ƒ",
    "τò╢",
    "Σ╜┐",
    "Θ╗₧",
    "σ╛₧",
    "µÑ¡",
    "µ£¼",
    "σÄ╗",
    "µèè",
    "µÇº",
    "σÑ╜",
    "µçë",
    "Θûï",
    "σ«â",
    "σÉê",
    "Θéä",
    "σ¢á",
    "τö▒",
    "σà╢",
    "Σ║¢",
    "τä╢",
    "σëì",
    "σñû",
    "σñ⌐",
    "µö┐",
    "σ¢¢",
    "µùÑ",
    "Θéú",
    "τñ╛",
    "τ╛⌐",
    "Σ║ï",
    "σ╣│",
    "σ╜ó",
    "τ¢╕",
    "σà¿",
    "Φí¿",
    "Θûô",
    "µ¿ú",
    "Φêç",
    "Θù£",
    "σÉä",
    "Θçì",
    "µû░",
    "τ╖Ü",
    "σàº",
    "µò╕",
    "µ¡ú",
    "σ┐â",
    "σÅì",
    "Σ╜á",
    "µÿÄ",
    "τ£ï",
    "σÄƒ",
    "σÅê",
    "Θ║╝",
    "σê⌐",
    "µ»ö",
    "µêû",
    "Σ╜å",
    "Φ│¬",
    "µ░ú",
    "τ¼¼",
    "σÉæ",
    "Θüô",
    "σæ╜",
    "µ¡ñ",
    "Φ«è",
    "µó¥",
    "σÅ¬",
    "µ▓Æ",
    "τ╡É",
    "Φºú",
    "σòÅ",
    "µäÅ",
    "σ╗║",
    "µ£ê",
    "σà¼",
    "τäí",
    "τ│╗",
    "Φ╗ì",
    "σ╛ê",
    "µâà",
    "ΦÇà",
    "µ£Ç",
    "τ½ï",
    "Σ╗ú",
    "µâ│",
    "σ╖▓",
    "ΘÇÜ",
    "Σ╕ª",
    "µÅÉ",
    "τ¢┤",
    "Θíî",
    "Θ╗¿",
    "τ¿ï",
    "σ▒ò",
    "Σ║ö",
    "µ₧£",
    "µûÖ",
    "Φ▒í",
    "σôí",
    "Θ¥⌐",
    "Σ╜ì",
    "σàÑ",
    "σ╕╕",
    "µûç",
    "τ╕╜",
    "µ¼í",
    "σôü",
    "σ╝Å",
    "µ┤╗",
    "Φ¿¡",
    "σÅè",
    "τ«í",
    "τë╣",
    "Σ╗╢",
    "Θò╖",
    "µ▒é",
    "ΦÇü",
    "Θá¡",
    "σƒ║",
    "Φ│ç",
    "Θéè",
    "µ╡ü",
    "Φ╖»",
    "τ┤Ü",
    "σ░æ",
    "σ£û",
    "σ▒▒",
    "τ╡▒",
    "µÄÑ",
    "τƒÑ",
    "Φ╝â",
    "σ░ç",
    "τ╡ä",
    "Φªï",
    "Φ¿ê",
    "σêÑ",
    "σÑ╣",
    "µëï",
    "ΦºÆ",
    "µ£ƒ",
    "µá╣",
    "Φ½û",
    "Θüï",
    "Φ╛▓",
    "µîç",
    "σ╣╛",
    "Σ╣¥",
    "σìÇ",
    "σ╝╖",
    "µö╛",
    "µ▒║",
    "ΦÑ┐",
    "Φó½",
    "σ╣╣",
    "σüÜ",
    "σ┐à",
    "µê░",
    "σàê",
    "σ¢₧",
    "σëç",
    "Σ╗╗",
    "σÅû",
    "µôÜ",
    "ΦÖò",
    "ΘÜè",
    "σìù",
    "τ╡ª",
    "Φë▓",
    "σàë",
    "ΘûÇ",
    "σì│",
    "Σ┐¥",
    "µ▓╗",
    "σîù",
    "ΘÇá",
    "τÖ╛",
    "ΦªÅ",
    "τå▒",
    "Θáÿ",
    "Σ╕â",
    "µ╡╖",
    "σÅú",
    "µ¥▒",
    "σ░Ä",
    "σÖ¿",
    "σúô",
    "σ┐ù",
    "Σ╕û",
    "Θçæ",
    "σó₧",
    "τê¡",
    "µ┐ƒ",
    "ΘÜÄ",
    "µ▓╣",
    "µÇ¥",
    "Φíô",
    "µÑ╡",
    "Σ║ñ",
    "σÅù",
    "Φü»",
    "Σ╗Ç",
    "Φ¬ì",
    "σà¡",
    "σà▒",
    "µ¼è",
    "µö╢",
    "Φ¡ë",
    "µö╣",
    "µ╕à",
    "τ╛Ä",
    "σåì",
    "µÄí",
    "Φ╜ë",
    "µ¢┤",
    "σû«",
    "Θó¿",
    "σêç",
    "µëô",
    "τÖ╜",
    "µòÖ",
    "ΘÇƒ",
    "Φè▒",
    "σ╕╢",
    "σ«ë",
    "σá┤",
    "Φ║½",
    "Φ╗è",
    "Σ╛ï",
    "τ£ƒ",
    "σïÖ",
    "σà╖",
    "ΦÉ¼",
    "µ»Å",
    "τ¢«",
    "Φç│",
    "Θüö",
    "Φ╡░",
    "τ⌐ì",
    "τñ║",
    "Φ¡░",
    "Φü▓",
    "σá▒",
    "Θ¼Ñ",
    "σ«î",
    "Θí₧",
    "σà½",
    "Θ¢ó",
    "ΦÅ»",
    "σÉì",
    "τó║",
    "µëì",
    "τºæ",
    "σ╝╡",
    "Σ┐í",
    "Θª¼",
    "τ»Ç",
    "Φ⌐▒",
    "τ▒│",
    "µò┤",
    "τ⌐║",
    "σàâ",
    "µ│ü",
    "Σ╗è",
    "Θ¢å",
    "µ║½",
    "σé│",
    "σ£ƒ",
    "Φ¿▒",
    "µ¡Ñ",
    "τ╛ñ",
    "σ╗ú",
    "τƒ│",
    "Φ¿ÿ",
    "Θ£Ç",
    "µ«╡",
    "τáö",
    "τòî",
    "µïë",
    "µ₧ù",
    "σ╛ï",
    "σÅ½",
    "Σ╕ö",
    "τ⌐╢",
    "ΦºÇ",
    "Φ╢è",
    "τ╣ö",
    "Φú¥",
    "σ╜▒",
    "τ«ù",
    "Σ╜Ä",
    "µîü",
    "Θƒ│",
    "τ£╛",
    "µ¢╕",
    "σ╕â",
    "σñì",
    "σ«╣",
    "σàÆ",
    "Θáê",
    "ΘÜ¢",
    "σòå",
    "Θ¥₧",
    "Θ⌐ù",
    "ΘÇú",
    "µû╖",
    "µ╖▒",
    "Θ¢ú",
    "Φ┐æ",
    "τñª",
    "σìâ",
    "ΘÇ▒",
    "σºö",
    "τ┤á",
    "µèÇ",
    "σéÖ",
    "σìè",
    "Φ╛ª",
    "Θ¥Æ",
    "τ£ü",
    "σêù",
    "τ┐Æ",
    "Θƒ┐",
    "τ┤ä",
    "µö»",
    "Φê¼",
    "σÅ▓",
    "µäƒ",
    "σï₧",
    "Σ╛┐",
    "σ£ÿ",
    "σ╛Ç",
    "Θà╕",
    "µ¡╖",
    "σ╕é",
    "σàï",
    "Σ╜ò",
    "ΘÖñ",
    "µ╢ê",
    "µºï",
    "σ║£",
    "τ¿▒",
    "σñ¬",
    "µ║û",
    "τ▓╛",
    "σÇ╝",
    "ΦÖƒ",
    "τÄç",
    "µùÅ",
    "τ╢¡",
    "σèâ",
    "Θü╕",
    "µ¿Ö",
    "σ»½",
    "σ¡ÿ",
    "σÇÖ",
    "µ»¢",
    "Φª¬",
    "σ┐½",
    "µòê",
    "µû»",
    "ΘÖó",
    "µƒÑ",
    "µ▒ƒ",
    "σ₧ï",
    "τ£╝",
    "τÄï",
    "µîë",
    "µá╝",
    "Θñè",
    "µÿô",
    "τ╜«",
    "µ┤╛",
    "σ▒ñ",
    "τëç",
    "σºï",
    "σì╗",
    "σ░ê",
    "τïÇ",
    "Φé▓",
    "σ╗á",
    "Σ║¼",
    "Φ¡ÿ",
    "Θü⌐",
    "σ▒¼",
    "σ£ô",
    "σîà",
    "τü½",
    "Σ╜Å",
    "Φ¬┐",
    "µ╗┐",
    "τ╕ú",
    "σ▒Ç",
    "τàº",
    "σÅâ",
    "τ┤à",
    "τ┤░",
    "σ╝ò",
    "Φü╜",
    "Φ⌐▓",
    "ΘÉ╡",
    "σâ╣",
    "σÜ┤",
    "Θªû",
    "σ║ò",
    "µ╢▓",
    "σ«ÿ",
    "σ╛╖",
    "ΘÜ¿",
    "τùà",
    "Φÿç",
    "σñ▒",
    "τê╛",
    "µ¡╗",
    "Φ¼¢",
    "Θàì",
    "σÑ│",
    "Θ╗â",
    "µÄ¿",
    "Θí»",
    "Φ½ç",
    "τ╜¬",
    "τÑ₧",
    "Φù¥",
    "σæó",
    "σ╕¡",
    "σÉ½",
    "Σ╝ü",
    "µ£¢",
    "σ»å",
    "µë╣",
    "τçƒ",
    "Θáà",
    "Θÿ▓",
    "Φêë",
    "τÉâ",
    "Φï▒",
    "µ░º",
    "σïó",
    "σæè",
    "µ¥Ä",
    "σÅ░",
    "ΦÉ╜",
    "µ£¿",
    "σ╣½",
    "Φ╝¬",
    "τá┤",
    "Σ║₧",
    "σ╕½",
    "σ£ì",
    "µ│¿",
    "Θüá",
    "σ¡ù",
    "µ¥É",
    "µÄÆ",
    "Σ╛¢",
    "µ▓│",
    "µàï",
    "σ░ü",
    "σÅª",
    "µû╜",
    "µ╕¢",
    "µ¿╣",
    "µ║╢",
    "µÇÄ",
    "µ¡ó",
    "µíê",
    "Φ¿Ç",
    "σú½",
    "σ¥ç",
    "µ¡ª",
    "σ¢║",
    "Φæë",
    "Θ¡Ü",
    "µ│ó",
    "Φªû",
    "σâà",
    "Φ▓╗",
    "τ╖è",
    "µä¢",
    "σ╖ª",
    "τ½á",
    "µù⌐",
    "µ£¥",
    "σ«│",
    "τ║î",
    "Φ╝ò",
    "µ£ì",
    "Φ⌐ª",
    "Θúƒ",
    "σàà",
    "σà╡",
    "µ║É",
    "σêñ",
    "Φ¡╖",
    "σÅ╕",
    "Φ╢│",
    "µƒÉ",
    "τ╖┤",
    "σ╖«",
    "Φç┤",
    "µ¥┐",
    "τö░",
    "ΘÖì",
    "Θ╗æ",
    "τè»",
    "Φ▓á",
    "µôè",
    "Φîâ",
    "τ╣╝",
    "Φêê",
    "Σ╝╝",
    "Θñÿ",
    "σáà",
    "µ¢▓",
    "Φ╝╕",
    "Σ┐«",
    "µòà",
    "σƒÄ",
    "σñ½",
    "σñá",
    "ΘÇü",
    "τ¡å",
    "Φê╣",
    "Σ╜ö",
    "σÅ│",
    "Φ▓í",
    "σÉâ",
    "σ»î",
    "µÿÑ",
    "Φü╖",
    "Φª║",
    "µ╝ó",
    "τò½",
    "σèƒ",
    "σ╖┤",
    "Φ╖ƒ",
    "Θ¢û",
    "Θ¢£",
    "Θú¢",
    "µ¬ó",
    "σÉ╕",
    "σè⌐",
    "µÿç",
    "ΘÖ╜",
    "Σ║Æ",
    "σê¥",
    "σë╡",
    "µèù",
    "ΦÇâ",
    "µèò",
    "σú₧",
    "τ¡û",
    "σÅñ",
    "σ╛æ",
    "µÅ¢",
    "µ£¬",
    "Φ╖æ",
    "τòÖ",
    "Θï╝",
    "µ¢╛",
    "τ½»",
    "Φ▓¼",
    "τ½Ö",
    "τ░í",
    "Φ┐░",
    "Θîó",
    "σë»",
    "τ¢í",
    "σ╕¥",
    "σ░ä",
    "Φìë",
    "Φí¥",
    "µë┐",
    "τì¿",
    "Σ╗ñ",
    "ΘÖÉ",
    "Θÿ┐",
    "σ«ú",
    "τÆ░",
    "Θ¢Ö",
    "Φ½ï",
    "Φ╢à",
    "σ╛«",
    "Φ«ô",
    "µÄº",
    "σ╖₧",
    "Φë»",
    "Φ╗╕",
    "µë╛",
    "σÉª",
    "τ┤Ç",
    "τ¢è",
    "Σ╛¥",
    "σä¬",
    "Θáé",
    "τñÄ",
    "Φ╝ë",
    "σÇÆ",
    "µê┐",
    "τ¬ü",
    "σ¥É",
    "τ▓ë",
    "µò╡",
    "τòÑ",
    "σ«ó",
    "Φóü",
    "σå╖",
    "σï¥",
    "τ╡ò",
    "µ₧É",
    "σíè",
    "σèæ",
    "µ╕¼",
    "τ╡▓",
    "σìö",
    "Φ¿┤",
    "σ┐╡",
    "ΘÖ│",
    "Σ╗ì",
    "τ╛à",
    "Θ╣╜",
    "σÅï",
    "µ┤ï",
    "Θî»",
    "Φïª",
    "σñ£",
    "σêæ",
    "τº╗",
    "Θá╗",
    "ΘÇÉ",
    "Θ¥á",
    "µ╖╖",
    "µ»ì",
    "τƒ¡",
    "τÜ«",
    "τ╡é",
    "ΦüÜ",
    "µ▒╜",
    "µ¥æ",
    "Θ¢▓",
    "σô¬",
    "µùó",
    "Φ╖¥",
    "Φí¢",
    "σü£",
    "τâê",
    "σñ«",
    "σ»ƒ",
    "τçÆ",
    "Φ┐à",
    "σóâ",
    "ΦïÑ",
    "σì░",
    "µ┤▓",
    "σê╗",
    "µï¼",
    "µ┐Ç",
    "σ¡ö",
    "µÉ₧",
    "τöÜ",
    "σ«ñ",
    "σ╛à",
    "µá╕",
    "µáí",
    "µòú",
    "Σ╛╡",
    "σÉº",
    "τö▓",
    "Θüè",
    "Σ╣à",
    "ΦÅ£",
    "σæ│",
    "Φêè",
    "µ¿í",
    "µ╣û",
    "Φ▓¿",
    "µÉì",
    "ΘáÉ",
    "Θÿ╗",
    "µ»½",
    "µÖ«",
    "τ⌐⌐",
    "Σ╣Ö",
    "σ¬╜",
    "µñì",
    "µü»",
    "µô┤",
    "ΘèÇ",
    "Φ¬₧",
    "µÅ«",
    "ΘàÆ",
    "σ«ê",
    "µï┐",
    "σ║Å",
    "τ┤Ö",
    "Θå½",
    "τ╝║",
    "Θ¢¿",
    "σùÄ",
    "Θç¥",
    "σèë",
    "σòè",
    "µÇÑ",
    "σö▒",
    "Φ¬ñ",
    "Φ¿ô",
    "Θíÿ",
    "σ»⌐",
    "ΘÖä",
    "τì▓",
    "Φî╢",
    "Θ««",
    "τ│º",
    "µûñ",
    "σ¡⌐",
    "Φä½",
    "τí½",
    "ΦéÑ",
    "σûä",
    "Θ╛ì",
    "µ╝ö",
    "τê╢",
    "µ╝╕",
    "ΦíÇ",
    "µ¡í",
    "µó░",
    "µÄî",
    "µ¡î",
    "µ▓Ö",
    "σë¢",
    "µö╗",
    "Φ¼é",
    "τ¢╛",
    "Φ¿Ä",
    "µÖÜ",
    "τ▓Æ",
    "Σ║é",
    "τçâ",
    "τƒ¢",
    "Σ╣Ä",
    "µ«║",
    "ΦùÑ",
    "σ»º",
    "Θ¡»",
    "Φ▓┤",
    "ΘÉÿ",
    "τàñ",
    "Φ«Ç",
    "τÅ¡",
    "Σ╝»",
    "ΘªÖ",
    "Σ╗ï",
    "Φ┐½",
    "σÅÑ",
    "Φ▒É",
    "σƒ╣",
    "µÅí",
    "Φÿ¡",
    "µôö",
    "σ╝ª",
    "Φ¢ï",
    "µ▓ë",
    "σüç",
    "τ⌐┐",
    "σƒ╖",
    "τ¡ö",
    "µ¿é",
    "Φ¬░",
    "Θáå",
    "τàÖ",
    "τ╕«",
    "σ╛╡",
    "Φçë",
    "σû£",
    "µ¥╛",
    "Φà│",
    "σ¢░",
    "τò░",
    "σàì",
    "Φâî",
    "µÿƒ",
    "τªÅ",
    "Φ▓╖",
    "µƒô",
    "Σ║ò",
    "µªé",
    "µàó",
    "µÇò",
    "τúü",
    "σÇì",
    "τÑû",
    "τÜç",
    "Σ┐â",
    "Θ¥£",
    "Φú£",
    "Φ⌐ò",
    "τ┐╗",
    "Φéë",
    "Φ╕É",
    "σ░╝",
    "Φíú",
    "σ»¼",
    "µÅÜ",
    "µúë",
    "σ╕î",
    "σé╖",
    "µôì",
    "σ₧é",
    "τºï",
    "σ«£",
    "µ░½",
    "σÑù",
    "τ¥ú",
    "µî»",
    "µ₧╢",
    "Σ║«",
    "µ£½",
    "µå▓",
    "µà╢",
    "τ╖¿",
    "τë¢",
    "Φº╕",
    "µÿá",
    "Θ¢╖",
    "Θè╖",
    "Φ⌐⌐",
    "σ║º",
    "σ▒à",
    "µèô",
    "Φúé",
    "Φâ₧",
    "σæ╝",
    "σ¿ÿ",
    "µÖ»",
    "σ¿ü",
    "τ╢á",
    "µÖ╢",
    "σÄÜ",
    "τ¢ƒ",
    "Φíí",
    "Θ¢₧",
    "σ¡½",
    "σ╗╢",
    "σì▒",
    "Φåá",
    "σ▒ï",
    "Θäë",
    "Φç¿",
    "ΘÖ╕",
    "Θíº",
    "µÄë",
    "σæÇ",
    "τçê",
    "µ¡▓",
    "µÄ¬",
    "µ¥ƒ",
    "ΦÇÉ",
    "σèç",
    "τÄë",
    "Φ╢Ö",
    "Φ╖│",
    "σôÑ",
    "σ¡ú",
    "Φ¬▓",
    "σç▒",
    "Φâí",
    "Θíì",
    "µ¼╛",
    "τ┤╣",
    "σì╖",
    "Θ╜è",
    "σüë",
    "ΦÆ╕",
    "µ«û",
    "µ░╕",
    "σ«ù",
    "Φïù",
    "σ╖¥",
    "τêÉ",
    "σ▓⌐",
    "σ╝▒",
    "Θ¢╢",
    "µÑè",
    "σÑÅ",
    "µ▓┐",
    "Θ£▓",
    "µí┐",
    "µÄó",
    "µ╗æ",
    "ΘÄ«",
    "Θú»",
    "µ┐â",
    "Φê¬",
    "µç╖",
    "Φ╢ò",
    "σ║½",
    "σÑ¬",
    "Σ╝è",
    "Θ¥ê",
    "τ¿à",
    "ΘÇö",
    "µ╗à",
    "Φ│╜",
    "µ¡╕",
    "σÅ¼",
    "Θ╝ô",
    "µÆ¡",
    "τ¢ñ",
    "Φúü",
    "ΘÜ¬",
    "σ║╖",
    "σö»",
    "Θîä",
    "ΦÅî",
    "τ┤ö",
    "σÇƒ",
    "τ│û",
    "Φôï",
    "µ⌐½",
    "τ¼ª",
    "τºü",
    "σè¬",
    "σáé",
    "σƒƒ",
    "µºì",
    "µ╜ñ",
    "σ╣à",
    "σôê",
    "τ½ƒ",
    "τåƒ",
    "Φƒ▓",
    "µ╛ñ",
    "Φàª",
    "σúñ",
    "τó│",
    "µ¡É",
    "Θüì",
    "σü┤",
    "σ»¿",
    "µòó",
    "σ╛╣",
    "µà«",
    "µû£",
    "Φûä",
    "σ║¡",
    "τ┤ì",
    "σ╜ê",
    "Θú╝",
    "Σ╝╕",
    "µèÿ",
    "Θ║Ñ",
    "µ┐ò",
    "µÜù",
    "Φì╖",
    "τôª",
    "σí₧",
    "σ║è",
    "τ»ë",
    "µâí",
    "µê╢",
    "Φ¿¬",
    "σíö",
    "σÑç",
    "ΘÇÅ",
    "µóü",
    "σêÇ",
    "µùï",
    "Φ╖í",
    "σìí",
    "µ░»",
    "Θüç",
    "Σ╗╜",
    "µ»Æ",
    "µ│Ñ",
    "ΘÇÇ",
    "µ┤ù",
    "µô║",
    "τü░",
    "σ╜⌐",
    "Φ│ú",
    "ΦÇù",
    "σñÅ",
    "µôç",
    "σ┐Ö",
    "Θèà",
    "τì╗",
    "τí¼",
    "Σ║ê",
    "τ╣ü",
    "σ£ê",
    "Θ¢¬",
    "σç╜",
    "Σ║ª",
    "µè╜",
    "τ»ç",
    "ΘÖú",
    "ΘÖ░",
    "Σ╕ü",
    "σ░║",
    "Φ┐╜",
    "σáå",
    "Θ¢ä",
    "Φ┐Ä",
    "µ│¢",
    "τê╕",
    "µ¿ô",
    "Θü┐",
    "Φ¼Ç",
    "σÖ╕",
    "ΘçÄ",
    "Φ▒¼",
    "µùù",
    "τ┤»",
    "σüÅ",
    "σà╕",
    "Θñ¿",
    "τ┤ó",
    "τºª",
    "Φäé",
    "µ╜«",
    "τê║",
    "Φ▒å",
    "σ┐╜",
    "µëÿ",
    "Θ⌐Ü",
    "σíæ",
    "Θü║",
    "µäê",
    "µ£▒",
    "µ¢┐",
    "τ║û",
    "τ▓ù",
    "σé╛",
    "σ░Ü",
    "τù¢",
    "µÑÜ",
    "Φ¼¥",
    "σÑ«",
    "Φ│╝",
    "τú¿",
    "σÉ¢",
    "µ▒á",
    "µùü",
    "τóÄ",
    "Θ¬¿",
    "τ¢ú",
    "µìò",
    "σ╝ƒ",
    "µÜ┤",
    "σë▓",
    "Φ▓½",
    "µ«è",
    "Θçï",
    "Φ⌐₧",
    "Σ║í",
    "σúü",
    "Θáô",
    "σ»╢",
    "σìê",
    "σí╡",
    "Φü₧",
    "µÅ¡",
    "τé«",
    "µ«ÿ",
    "σå¼",
    "µ⌐ï",
    "σ⌐ª",
    "Φ¡ª",
    "τ╢£",
    "µï¢",
    "σÉ│",
    "Σ╗ÿ",
    "µ╡«",
    "Θü¡",
    "σ╛É",
    "µé¿",
    "µÉû",
    "Φ░╖",
    "Φ┤è",
    "τ«▒",
    "ΘÜö",
    "Φ¿é",
    "τö╖",
    "σÉ╣",
    "σ£Æ",
    "τ┤¢",
    "σöÉ",
    "µòù",
    "σ«ï",
    "τÄ╗",
    "σ╖¿",
    "ΦÇò",
    "σ¥ª",
    "µª«",
    "Θûë",
    "τüú",
    "Θì╡",
    "σçí",
    "ΘºÉ",
    "Θìï",
    "µòæ",
    "µü⌐",
    "σë¥",
    "σç¥",
    "Θ╣╝",
    "Θ╜Æ",
    "µê¬",
    "τàë",
    "Θ║╗",
    "τ┤í",
    "τªü",
    "σ╗ó",
    "τ¢¢",
    "τëê",
    "τ╖⌐",
    "µ╖¿",
    "τ¥¢",
    "µÿî",
    "σ⌐Ü",
    "µ╢ë",
    "τ¡Æ",
    "σÿ┤",
    "µÅÆ",
    "σ▓╕",
    "µ£ù",
    "ΦÄè",
    "Φíù",
    "ΦùÅ",
    "σºæ",
    "Φ▓┐",
    "ΦàÉ",
    "σÑ┤",
    "σòª",
    "µàú",
    "Σ╣ÿ",
    "σñÑ",
    "µüó",
    "σï╗",
    "τ┤ù",
    "µëÄ",
    "Φ╛»",
    "ΦÇ│",
    "σ╜¬",
    "Φçú",
    "σää",
    "τÆâ",
    "µè╡",
    "Φäê",
    "τºÇ",
    "Φû⌐",
    "Σ┐ä",
    "τ╢▓",
    "Φê₧",
    "σ║ù",
    "σÖ┤",
    "τ╕▒",
    "σ»╕",
    "µ▒ù",
    "µÄ¢",
    "µ┤¬",
    "Φ│Ç",
    "Θûâ",
    "µƒ¼",
    "τêå",
    "τâ»",
    "µ┤Ñ",
    "τ¿╗",
    "τëå",
    "Φ╗ƒ",
    "σïç",
    "σâÅ",
    "µ╗╛",
    "σÄÿ",
    "ΦÆÖ",
    "Φè│",
    "Φé»",
    "σ¥í",
    "µƒ▒",
    "τ¢¬",
    "Φà┐",
    "σäÇ",
    "µùà",
    "σ░╛",
    "Φ╗ï",
    "σå░",
    "Φ▓ó",
    "τÖ╗",
    "Θ╗Ä",
    "σëè",
    "Θæ╜",
    "σïÆ",
    "ΘÇâ",
    "ΘÜ£",
    "µ░¿",
    "Θâ¡",
    "σ│░",
    "σ╣ú",
    "µ╕»",
    "Σ╝Å",
    "Φ╗î",
    "τò¥",
    "τòó",
    "µôª",
    "ΦÄ½",
    "σê║",
    "µ╡¬",
    "τºÿ",
    "µÅ┤",
    "µá¬",
    "σüÑ",
    "σö«",
    "Φéí",
    "σ│╢",
    "τöÿ",
    "µ│í",
    "τ¥í",
    "τ½Ñ",
    "Θæä",
    "µ╣»",
    "ΘûÑ",
    "Σ╝æ",
    "σî»",
    "Φêì",
    "τëº",
    "τ╣₧",
    "τé╕",
    "σô▓",
    "τú╖",
    "τ╕╛",
    "µ£ï",
    "µ╖í",
    "σ░û",
    "σòƒ",
    "ΘÖ╖",
    "µƒ┤",
    "σæê",
    "σ╛Æ",
    "ΘíÅ",
    "µ╖Ü",
    "τ¿ì",
    "σ┐ÿ",
    "µ│╡",
    "Φùì",
    "µïû",
    "µ┤₧",
    "µÄê",
    "ΘÅí",
    "Φ╛¢",
    "σú»",
    "ΘïÆ",
    "Φ▓º",
    "ΦÖ¢",
    "σ╜Ä",
    "µæ⌐",
    "µ│░",
    "σ╣╝",
    "σ╗╖",
    "σ░è",
    "τ¬ù",
    "τ╢▒",
    "σ╝ä",
    "ΘÜ╕",
    "τûæ",
    "µ░Å",
    "σ««",
    "σºÉ",
    "Θ£ç",
    "τæ₧",
    "µÇ¬",
    "σ░ñ",
    "τÉ┤",
    "σ╛¬",
    "µÅÅ",
    "Φå£",
    "Θüò",
    "σñ╛",
    "Φà░",
    "τ╖ú",
    "τÅá",
    "τ¬«",
    "µú«",
    "µ₧¥",
    "τ½╣",
    "µ║¥",
    "σé¼",
    "τ╣⌐",
    "µå╢",
    "Θéª",
    "σë⌐",
    "σ╣╕",
    "µ╝┐",
    "µ¼ä",
    "µôü",
    "τëÖ",
    "Φ▓»",
    "τª«",
    "µ┐╛",
    "Θêë",
    "τ┤ï",
    "τ╜╖",
    "µïì",
    "σÆ▒",
    "σûè",
    "Φóû",
    "σƒâ",
    "σïñ",
    "τ╜░",
    "τäª",
    "µ╜¢",
    "Σ╝ì",
    "σó¿",
    "µ¼▓",
    "τ╕½",
    "σºô",
    "σêè",
    "Θú╜",
    "Σ╗┐",
    "τìÄ",
    "Θïü",
    "Θ¼╝",
    "Θ║ù",
    "Φ╖¿",
    "Θ╗ÿ",
    "µîû",
    "ΘÅê",
    "µÄâ",
    "σû¥",
    "Φóï",
    "τé¡",
    "µ▒í",
    "σ╣ò",
    "Φ½╕",
    "σ╝º",
    "σï╡",
    "µóà",
    "σÑ╢",
    "µ╜ö",
    "τü╜",
    "Φêƒ",
    "Θææ",
    "Φï»",
    "Φ¿ƒ",
    "µè▒",
    "µ»Ç",
    "µçé",
    "σ»Æ",
    "µÖ║",
    "σƒö",
    "σ»ä",
    "σ▒å",
    "Φ║ì",
    "µ╕í",
    "µîæ",
    "Σ╕╣",
    "Φë▒",
    "Φ▓¥",
    "τó░",
    "µïö",
    "τê╣",
    "µê┤",
    "τó╝",
    "σñó",
    "Φè╜",
    "τåö",
    "Φ╡ñ",
    "µ╝ü",
    "σô¡",
    "µò¼",
    "Θíå",
    "σÑö",
    "Θë¢",
    "Σ╗▓",
    "ΦÖÄ",
    "τ¿Ç",
    "σª╣",
    "Σ╣Å",
    "τÅì",
    "τö│",
    "µíî",
    "Θü╡",
    "σàü",
    "ΘÜå",
    "Φ₧║",
    "σÇë",
    "Θ¡Å",
    "Θè│",
    "µ¢ë",
    "µ░«",
    "σà╝",
    "ΘÜ▒",
    "τñÖ",
    "Φ╡½",
    "µÆÑ",
    "σ┐á",
    "Φéà",
    "τ╝╕",
    "τë╜",
    "µÉ╢",
    "σìÜ",
    "σ╖º",
    "µ«╝",
    "σàä",
    "µ¥£",
    "Φ¿è",
    "Φ¬á",
    "τóº",
    "τÑÑ",
    "µƒ»",
    "Θáü",
    "σ╖í",
    "τƒ⌐",
    "µé▓",
    "τüî",
    "Θ╜í",
    "σÇ½",
    "τÑ¿",
    "σ░ï",
    "µíé",
    "Θï¬",
    "Φüû",
    "µüÉ",
    "µü░",
    "Θä¡",
    "Φ╢ú",
    "µè¼",
    "ΦìÆ",
    "Θ¿░",
    "Φ▓╝",
    "µƒö",
    "µ╗┤",
    "τî¢",
    "Θùè",
    "Φ╝¢",
    "σª╗",
    "σí½",
    "µÆñ",
    "σä▓",
    "τ░╜",
    "Θ¼º",
    "µô╛",
    "τ┤½",
    "τáé",
    "Θü₧",
    "µê▓",
    "σÉè",
    "ΘÖ╢",
    "Σ╝É",
    "Θñ╡",
    "τÖé",
    "τô╢",
    "σ⌐å",
    "µÆ½",
    "Φçé",
    "µæ╕",
    "σ┐ì",
    "Φ¥ª",
    "Φáƒ",
    "Θä░",
    "Φâ╕",
    "Θ₧Å",
    "µôá",
    "σü╢",
    "µúä",
    "µº╜",
    "σïü",
    "Σ╣│",
    "Θäº",
    "σÉë",
    "Σ╗ü",
    "τê¢",
    "τúÜ",
    "τºƒ",
    "τâÅ",
    "Φëª",
    "Σ╝┤",
    "τô£",
    "µ╖║",
    "Σ╕Ö",
    "µÜ½",
    "τçÑ",
    "µ⌐í",
    "µƒ│",
    "Φ┐╖",
    "µÜû",
    "τëî",
    "τºº",
    "Φå╜",
    "Φ⌐│",
    "τ░º",
    "Φ╕Å",
    "τô╖",
    "Φ¡£",
    "σæå",
    "Φ│ô",
    "τ│è",
    "µ┤¢",
    "Φ╝¥",
    "µåñ",
    "τ½╢",
    "ΘÜÖ",
    "µÇÆ",
    "τ▓ÿ",
    "Σ╣â",
    "τ╖Æ",
    "Φé⌐",
    "τ▒ì",
    "µòÅ",
    "σíù",
    "τåÖ",
    "τÜå",
    "σü╡",
    "µç╕",
    "µÄÿ",
    "Σ║½",
    "τ│╛",
    "ΘåÆ",
    "τïé",
    "ΘÄû",
    "µ╖Ç",
    "µü¿",
    "τë▓",
    "Θ£╕",
    "τê¼",
    "Φ│₧",
    "ΘÇå",
    "τÄ⌐",
    "ΘÖ╡",
    "τÑ¥",
    "τºÆ",
    "µ╡Ö",
    "Φ▓î",
    "σ╜╣",
    "σ╜╝",
    "µéë",
    "Θ┤¿",
    "Φ╢¿",
    "Θ││",
    "µÖ¿",
    "τò£",
    "Φ╝⌐",
    "τº⌐",
    "σì╡",
    "τ╜▓",
    "µó»",
    "τéÄ",
    "τüÿ",
    "µúï",
    "Θ⌐à",
    "τ»⌐",
    "σ│╜",
    "σåÆ",
    "σòÑ",
    "σú╜",
    "Φ¡»",
    "µ╡╕",
    "µ│ë",
    "σ╕╜",
    "Θü▓",
    "τƒ╜",
    "τûå",
    "Φ▓╕",
    "µ╝Å",
    "τ¿┐",
    "σåá",
    "σ½⌐",
    "Φäà",
    "Φè»",
    "τëó",
    "σÅ¢",
    "Φ¥ò",
    "σÑº",
    "Θ│┤",
    "σ╢║",
    "τ╛è",
    "µåæ",
    "Σ╕▓",
    "σíÿ",
    "τ╣¬",
    "Θà╡",
    "Φ₧ì",
    "τ¢å",
    "Θî½",
    "σ╗ƒ",
    "τ▒î",
    "σçì",
    "Φ╝ö",
    "µö¥",
    "ΦÑ▓",
    "τ¡ï",
    "µïÆ",
    "σâÜ",
    "µù▒",
    "ΘëÇ",
    "Θ│Ñ",
    "µ╝å",
    "µ▓ê",
    "τ£ë",
    "τûÅ",
    "µ╖╗",
    "µúÆ",
    "τ⌐ù",
    "τí¥",
    "Θƒô",
    "ΘÇ╝",
    "µë¡",
    "σâæ",
    "µ╢╝",
    "µî║",
    "τóù",
    "µá╜",
    "τéÆ",
    "µ¥»",
    "µéú",
    "Θñ╛",
    "σï╕",
    "Φ▒¬",
    "Θü╝",
    "σïâ",
    "Θ┤╗",
    "µùª",
    "σÉÅ",
    "µï£",
    "τïù",
    "σƒï",
    "Φ╝Ñ",
    "µÄ⌐",
    "Θú▓",
    "µÉ¼",
    "τ╜╡",
    "Φ╛¡",
    "σï╛",
    "µëú",
    "Σ╝░",
    "Φöú",
    "τ╡¿",
    "Θ£º",
    "Σ╕ê",
    "µ£╡",
    "σºå",
    "µô¼",
    "σ«ç",
    "Φ╝»",
    "ΘÖ¥",
    "Θ¢ò",
    "σäƒ",
    "Φôä",
    "σ┤ç",
    "σë¬",
    "σÇí",
    "σ╗│",
    "σÆ¼",
    "Θº¢",
    "Φû»",
    "σê╖",
    "µûÑ",
    "τò¬",
    "Φ│ª",
    "σÑë",
    "Σ╜¢",
    "µ╛å",
    "µ╝½",
    "µ¢╝",
    "µëç",
    "Θêú",
    "µíâ",
    "µë╢",
    "Σ╗ö",
    "Φ┐ö",
    "Σ┐ù",
    "ΦÖº",
    "Φàö",
    "Θ₧ï",
    "µú▒",
    "Φªå",
    "µíå",
    "µéä",
    "σÅö",
    "µÆ₧",
    "Θ¿Ö",
    "σïÿ",
    "µù║",
    "µ▓╕",
    "σ¡ñ",
    "σÉÉ",
    "σ¡ƒ",
    "µ╕á",
    "σ▒ê",
    "τû╛",
    "σªÖ",
    "µâ£",
    "Σ╗░",
    "τïá",
    "Φä╣",
    "Φ½º",
    "µïï",
    "Θ╗┤",
    "µíæ",
    "σ┤ù",
    "σÿ¢",
    "Φí░",
    "τ¢£",
    "µ╗▓",
    "Φçƒ",
    "Φ│┤",
    "µ╣º",
    "τö£",
    "µ¢╣",
    "Θû▒",
    "Φéî",
    "σô⌐",
    "σÄ▓",
    "τâ┤",
    "τ╖»",
    "µ»à",
    "µÿ¿",
    "σü╜",
    "τùç",
    "τà«",
    "σÿå",
    "Θçÿ",
    "µÉ¡",
    "ΦÄû",
    "τ▒á",
    "Θà╖",
    "σü╖",
    "σ╝ô",
    "ΘîÉ",
    "µüå",
    "σéæ",
    "σ¥æ",
    "Θ╝╗",
    "τ┐╝",
    "τ╢╕",
    "µòÿ",
    "τìä",
    "ΘÇ«",
    "τ╜É",
    "τ╡í",
    "µúÜ",
    "µèæ",
    "Φå¿",
    "Φö¼",
    "σ»║",
    "Θ⌐ƒ",
    "τ⌐å",
    "σå╢",
    "µ₧»",
    "σåè",
    "σ▒ì",
    "σç╕",
    "τ┤│",
    "σ¥»",
    "τèº",
    "τä░",
    "Φ╜ƒ",
    "µ¼ú",
    "µÖë",
    "τÿª",
    "τªª",
    "Θîá",
    "Θîª",
    "σû¬",
    "µù¼",
    "Θì¢",
    "σúƒ",
    "µÉ£",
    "µÆ▓",
    "ΘéÇ",
    "Σ║¡",
    "Θà»",
    "Θéü",
    "ΦêÆ",
    "Φäå",
    "Θà╢",
    "ΘûÆ",
    "µåé",
    "ΘàÜ",
    "Θáæ",
    "τ╛╜",
    "µ╝▓",
    "σì╕",
    "Σ╗ù",
    "ΘÖ¬",
    "Θùó",
    "µç▓",
    "µ¥¡",
    "σºÜ",
    "ΦéÜ",
    "µìë",
    "Θúä",
    "µ╝é",
    "µÿå",
    "µ¼║",
    "σÉ╛",
    "ΘâÄ",
    "τâ╖",
    "µ▒ü",
    "σæ╡",
    "Θú╛",
    "Φò¡",
    "Θ¢à",
    "Θâ╡",
    "Θü╖",
    "τçò",
    "µÆÆ",
    "σº╗",
    "Φ╡┤",
    "σ«┤",
    "τà⌐",
    "σé╡",
    "σ╕│",
    "µûæ",
    "Θê┤",
    "µù¿",
    "Θåç",
    "Φæú",
    "Θñà",
    "Θ¢¢",
    "σº┐",
    "µïî",
    "σéà",
    "Φà╣",
    "σªÑ",
    "µÅë",
    "Φ│ó",
    "µïå",
    "µ¡¬",
    "Φæí",
    "Φâ║",
    "Σ╕ƒ",
    "µ╡⌐",
    "σ╛╜",
    "µÿé",
    "σóè",
    "µôï",
    "Φª╜",
    "Φ▓¬",
    "µà░",
    "τ╣│",
    "µ▒¬",
    "µàî",
    "Θª«",
    "Φ½╛",
    "σº£",
    "Φ¬╝",
    "σàç",
    "σèú",
    "Φ¬ú",
    "ΦÇÇ",
    "µÿÅ",
    "Φ║║",
    "τ¢ê",
    "Θ¿Ä",
    "σû¼",
    "µ║¬",
    "σÅó",
    "τ¢º",
    "µè╣",
    "µé╢",
    "Φ½«",
    "σê«",
    "Θºò",
    "τ║£",
    "µéƒ",
    "µæÿ",
    "Θë║",
    "µô▓",
    "Θáù",
    "σ╣╗",
    "µƒä",
    "µâá",
    "µàÿ",
    "Σ╜│",
    "Σ╗ç",
    "Φçÿ",
    "τ¬⌐",
    "µ╗î",
    "σèì",
    "τ₧º",
    "σáí",
    "µ╜æ",
    "ΦöÑ",
    "τ╜⌐",
    "Θ£ì",
    "µÆê",
    "ΦâÄ",
    "ΦÆ╝",
    "µ┐▒",
    "σÇå",
    "µìà",
    "µ╣ÿ",
    "τáì",
    "Θ£₧",
    "Θé╡",
    "ΦÉä",
    "τÿï",
    "µ╖«",
    "Θüé",
    "τåè",
    "τ│₧",
    "τâÿ",
    "σ«┐",
    "µ¬ö",
    "µêê",
    "Θºü",
    "σ½é",
    "Φúò",
    "σ╛Ö",
    "τ«¡",
    "µìÉ",
    "Φà╕",
    "µÆÉ",
    "µ¢¼",
    "Φ╛¿",
    "µ«┐",
    "Φô«",
    "µöñ",
    "µö¬",
    "Θå¼",
    "σ▒Å",
    "τû½",
    "σôÇ",
    "Φöí",
    "σá╡",
    "µ▓½",
    "τÜ║",
    "µÜó",
    "τûè",
    "Θûú",
    "ΦÉè",
    "µò▓",
    "Φ╜ä",
    "Θëñ",
    "τùò",
    "σú⌐",
    "σ╖╖",
    "Θñô",
    "τªì",
    "Σ╕ÿ",
    "τÄä",
    "µ║£",
    "µ¢░",
    "ΘéÅ",
    "σ╜¡",
    "σÿù",
    "σì┐",
    "σª¿",
    "Φëç",
    "σÉ₧",
    "Θƒï",
    "µÇ¿",
    "τƒ«",
    "µ¡ç"
]

},{}],30:[function(require,module,exports){
module.exports=[
    "abdikace",
    "abeceda",
    "adresa",
    "agrese",
    "akce",
    "aktovka",
    "alej",
    "alkohol",
    "amputace",
    "ananas",
    "andulka",
    "anekdota",
    "anketa",
    "antika",
    "anulovat",
    "archa",
    "arogance",
    "asfalt",
    "asistent",
    "aspirace",
    "astma",
    "astronom",
    "atlas",
    "atletika",
    "atol",
    "autobus",
    "azyl",
    "babka",
    "bachor",
    "bacil",
    "baculka",
    "badatel",
    "bageta",
    "bagr",
    "bahno",
    "bakterie",
    "balada",
    "baletka",
    "balkon",
    "balonek",
    "balvan",
    "balza",
    "bambus",
    "bankomat",
    "barbar",
    "baret",
    "barman",
    "baroko",
    "barva",
    "baterka",
    "batoh",
    "bavlna",
    "bazalka",
    "bazilika",
    "bazuka",
    "bedna",
    "beran",
    "beseda",
    "bestie",
    "beton",
    "bezinka",
    "bezmoc",
    "beztak",
    "bicykl",
    "bidlo",
    "biftek",
    "bikiny",
    "bilance",
    "biograf",
    "biolog",
    "bitva",
    "bizon",
    "blahobyt",
    "blatouch",
    "blecha",
    "bledule",
    "blesk",
    "blikat",
    "blizna",
    "blokovat",
    "bloudit",
    "blud",
    "bobek",
    "bobr",
    "bodlina",
    "bodnout",
    "bohatost",
    "bojkot",
    "bojovat",
    "bokorys",
    "bolest",
    "borec",
    "borovice",
    "bota",
    "boubel",
    "bouchat",
    "bouda",
    "boule",
    "bourat",
    "boxer",
    "bradavka",
    "brambora",
    "branka",
    "bratr",
    "brepta",
    "briketa",
    "brko",
    "brloh",
    "bronz",
    "broskev",
    "brunetka",
    "brusinka",
    "brzda",
    "brzy",
    "bublina",
    "bubnovat",
    "buchta",
    "buditel",
    "budka",
    "budova",
    "bufet",
    "bujarost",
    "bukvice",
    "buldok",
    "bulva",
    "bunda",
    "bunkr",
    "burza",
    "butik",
    "buvol",
    "buzola",
    "bydlet",
    "bylina",
    "bytovka",
    "bzukot",
    "capart",
    "carevna",
    "cedr",
    "cedule",
    "cejch",
    "cejn",
    "cela",
    "celer",
    "celkem",
    "celnice",
    "cenina",
    "cennost",
    "cenovka",
    "centrum",
    "cenzor",
    "cestopis",
    "cetka",
    "chalupa",
    "chapadlo",
    "charita",
    "chata",
    "chechtat",
    "chemie",
    "chichot",
    "chirurg",
    "chlad",
    "chleba",
    "chlubit",
    "chmel",
    "chmura",
    "chobot",
    "chochol",
    "chodba",
    "cholera",
    "chomout",
    "chopit",
    "choroba",
    "chov",
    "chrapot",
    "chrlit",
    "chrt",
    "chrup",
    "chtivost",
    "chudina",
    "chutnat",
    "chvat",
    "chvilka",
    "chvost",
    "chyba",
    "chystat",
    "chytit",
    "cibule",
    "cigareta",
    "cihelna",
    "cihla",
    "cinkot",
    "cirkus",
    "cisterna",
    "citace",
    "citrus",
    "cizinec",
    "cizost",
    "clona",
    "cokoliv",
    "couvat",
    "ctitel",
    "ctnost",
    "cudnost",
    "cuketa",
    "cukr",
    "cupot",
    "cvaknout",
    "cval",
    "cvik",
    "cvrkot",
    "cyklista",
    "daleko",
    "dareba",
    "datel",
    "datum",
    "dcera",
    "debata",
    "dechovka",
    "decibel",
    "deficit",
    "deflace",
    "dekl",
    "dekret",
    "demokrat",
    "deprese",
    "derby",
    "deska",
    "detektiv",
    "dikobraz",
    "diktovat",
    "dioda",
    "diplom",
    "disk",
    "displej",
    "divadlo",
    "divoch",
    "dlaha",
    "dlouho",
    "dluhopis",
    "dnes",
    "dobro",
    "dobytek",
    "docent",
    "dochutit",
    "dodnes",
    "dohled",
    "dohoda",
    "dohra",
    "dojem",
    "dojnice",
    "doklad",
    "dokola",
    "doktor",
    "dokument",
    "dolar",
    "doleva",
    "dolina",
    "doma",
    "dominant",
    "domluvit",
    "domov",
    "donutit",
    "dopad",
    "dopis",
    "doplnit",
    "doposud",
    "doprovod",
    "dopustit",
    "dorazit",
    "dorost",
    "dort",
    "dosah",
    "doslov",
    "dostatek",
    "dosud",
    "dosyta",
    "dotaz",
    "dotek",
    "dotknout",
    "doufat",
    "doutnat",
    "dovozce",
    "dozadu",
    "doznat",
    "dozorce",
    "drahota",
    "drak",
    "dramatik",
    "dravec",
    "draze",
    "drdol",
    "drobnost",
    "drogerie",
    "drozd",
    "drsnost",
    "drtit",
    "drzost",
    "duben",
    "duchovno",
    "dudek",
    "duha",
    "duhovka",
    "dusit",
    "dusno",
    "dutost",
    "dvojice",
    "dvorec",
    "dynamit",
    "ekolog",
    "ekonomie",
    "elektron",
    "elipsa",
    "email",
    "emise",
    "emoce",
    "empatie",
    "epizoda",
    "epocha",
    "epopej",
    "epos",
    "esej",
    "esence",
    "eskorta",
    "eskymo",
    "etiketa",
    "euforie",
    "evoluce",
    "exekuce",
    "exkurze",
    "expedice",
    "exploze",
    "export",
    "extrakt",
    "facka",
    "fajfka",
    "fakulta",
    "fanatik",
    "fantazie",
    "farmacie",
    "favorit",
    "fazole",
    "federace",
    "fejeton",
    "fenka",
    "fialka",
    "figurant",
    "filozof",
    "filtr",
    "finance",
    "finta",
    "fixace",
    "fjord",
    "flanel",
    "flirt",
    "flotila",
    "fond",
    "fosfor",
    "fotbal",
    "fotka",
    "foton",
    "frakce",
    "freska",
    "fronta",
    "fukar",
    "funkce",
    "fyzika",
    "galeje",
    "garant",
    "genetika",
    "geolog",
    "gilotina",
    "glazura",
    "glejt",
    "golem",
    "golfista",
    "gotika",
    "graf",
    "gramofon",
    "granule",
    "grep",
    "gril",
    "grog",
    "groteska",
    "guma",
    "hadice",
    "hadr",
    "hala",
    "halenka",
    "hanba",
    "hanopis",
    "harfa",
    "harpuna",
    "havran",
    "hebkost",
    "hejkal",
    "hejno",
    "hejtman",
    "hektar",
    "helma",
    "hematom",
    "herec",
    "herna",
    "heslo",
    "hezky",
    "historik",
    "hladovka",
    "hlasivky",
    "hlava",
    "hledat",
    "hlen",
    "hlodavec",
    "hloh",
    "hloupost",
    "hltat",
    "hlubina",
    "hluchota",
    "hmat",
    "hmota",
    "hmyz",
    "hnis",
    "hnojivo",
    "hnout",
    "hoblina",
    "hoboj",
    "hoch",
    "hodiny",
    "hodlat",
    "hodnota",
    "hodovat",
    "hojnost",
    "hokej",
    "holinka",
    "holka",
    "holub",
    "homole",
    "honitba",
    "honorace",
    "horal",
    "horda",
    "horizont",
    "horko",
    "horlivec",
    "hormon",
    "hornina",
    "horoskop",
    "horstvo",
    "hospoda",
    "hostina",
    "hotovost",
    "houba",
    "houf",
    "houpat",
    "houska",
    "hovor",
    "hradba",
    "hranice",
    "hravost",
    "hrazda",
    "hrbolek",
    "hrdina",
    "hrdlo",
    "hrdost",
    "hrnek",
    "hrobka",
    "hromada",
    "hrot",
    "hrouda",
    "hrozen",
    "hrstka",
    "hrubost",
    "hryzat",
    "hubenost",
    "hubnout",
    "hudba",
    "hukot",
    "humr",
    "husita",
    "hustota",
    "hvozd",
    "hybnost",
    "hydrant",
    "hygiena",
    "hymna",
    "hysterik",
    "idylka",
    "ihned",
    "ikona",
    "iluze",
    "imunita",
    "infekce",
    "inflace",
    "inkaso",
    "inovace",
    "inspekce",
    "internet",
    "invalida",
    "investor",
    "inzerce",
    "ironie",
    "jablko",
    "jachta",
    "jahoda",
    "jakmile",
    "jakost",
    "jalovec",
    "jantar",
    "jarmark",
    "jaro",
    "jasan",
    "jasno",
    "jatka",
    "javor",
    "jazyk",
    "jedinec",
    "jedle",
    "jednatel",
    "jehlan",
    "jekot",
    "jelen",
    "jelito",
    "jemnost",
    "jenom",
    "jepice",
    "jeseter",
    "jevit",
    "jezdec",
    "jezero",
    "jinak",
    "jindy",
    "jinoch",
    "jiskra",
    "jistota",
    "jitrnice",
    "jizva",
    "jmenovat",
    "jogurt",
    "jurta",
    "kabaret",
    "kabel",
    "kabinet",
    "kachna",
    "kadet",
    "kadidlo",
    "kahan",
    "kajak",
    "kajuta",
    "kakao",
    "kaktus",
    "kalamita",
    "kalhoty",
    "kalibr",
    "kalnost",
    "kamera",
    "kamkoliv",
    "kamna",
    "kanibal",
    "kanoe",
    "kantor",
    "kapalina",
    "kapela",
    "kapitola",
    "kapka",
    "kaple",
    "kapota",
    "kapr",
    "kapusta",
    "kapybara",
    "karamel",
    "karotka",
    "karton",
    "kasa",
    "katalog",
    "katedra",
    "kauce",
    "kauza",
    "kavalec",
    "kazajka",
    "kazeta",
    "kazivost",
    "kdekoliv",
    "kdesi",
    "kedluben",
    "kemp",
    "keramika",
    "kino",
    "klacek",
    "kladivo",
    "klam",
    "klapot",
    "klasika",
    "klaun",
    "klec",
    "klenba",
    "klepat",
    "klesnout",
    "klid",
    "klima",
    "klisna",
    "klobouk",
    "klokan",
    "klopa",
    "kloub",
    "klubovna",
    "klusat",
    "kluzkost",
    "kmen",
    "kmitat",
    "kmotr",
    "kniha",
    "knot",
    "koalice",
    "koberec",
    "kobka",
    "kobliha",
    "kobyla",
    "kocour",
    "kohout",
    "kojenec",
    "kokos",
    "koktejl",
    "kolaps",
    "koleda",
    "kolize",
    "kolo",
    "komando",
    "kometa",
    "komik",
    "komnata",
    "komora",
    "kompas",
    "komunita",
    "konat",
    "koncept",
    "kondice",
    "konec",
    "konfese",
    "kongres",
    "konina",
    "konkurs",
    "kontakt",
    "konzerva",
    "kopanec",
    "kopie",
    "kopnout",
    "koprovka",
    "korbel",
    "korektor",
    "kormidlo",
    "koroptev",
    "korpus",
    "koruna",
    "koryto",
    "korzet",
    "kosatec",
    "kostka",
    "kotel",
    "kotleta",
    "kotoul",
    "koukat",
    "koupelna",
    "kousek",
    "kouzlo",
    "kovboj",
    "koza",
    "kozoroh",
    "krabice",
    "krach",
    "krajina",
    "kralovat",
    "krasopis",
    "kravata",
    "kredit",
    "krejcar",
    "kresba",
    "kreveta",
    "kriket",
    "kritik",
    "krize",
    "krkavec",
    "krmelec",
    "krmivo",
    "krocan",
    "krok",
    "kronika",
    "kropit",
    "kroupa",
    "krovka",
    "krtek",
    "kruhadlo",
    "krupice",
    "krutost",
    "krvinka",
    "krychle",
    "krypta",
    "krystal",
    "kryt",
    "kudlanka",
    "kufr",
    "kujnost",
    "kukla",
    "kulajda",
    "kulich",
    "kulka",
    "kulomet",
    "kultura",
    "kuna",
    "kupodivu",
    "kurt",
    "kurzor",
    "kutil",
    "kvalita",
    "kvasinka",
    "kvestor",
    "kynolog",
    "kyselina",
    "kytara",
    "kytice",
    "kytka",
    "kytovec",
    "kyvadlo",
    "labrador",
    "lachtan",
    "ladnost",
    "laik",
    "lakomec",
    "lamela",
    "lampa",
    "lanovka",
    "lasice",
    "laso",
    "lastura",
    "latinka",
    "lavina",
    "lebka",
    "leckdy",
    "leden",
    "lednice",
    "ledovka",
    "ledvina",
    "legenda",
    "legie",
    "legrace",
    "lehce",
    "lehkost",
    "lehnout",
    "lektvar",
    "lenochod",
    "lentilka",
    "lepenka",
    "lepidlo",
    "letadlo",
    "letec",
    "letmo",
    "letokruh",
    "levhart",
    "levitace",
    "levobok",
    "libra",
    "lichotka",
    "lidojed",
    "lidskost",
    "lihovina",
    "lijavec",
    "lilek",
    "limetka",
    "linie",
    "linka",
    "linoleum",
    "listopad",
    "litina",
    "litovat",
    "lobista",
    "lodivod",
    "logika",
    "logoped",
    "lokalita",
    "loket",
    "lomcovat",
    "lopata",
    "lopuch",
    "lord",
    "losos",
    "lotr",
    "loudal",
    "louh",
    "louka",
    "louskat",
    "lovec",
    "lstivost",
    "lucerna",
    "lucifer",
    "lump",
    "lusk",
    "lustrace",
    "lvice",
    "lyra",
    "lyrika",
    "lysina",
    "madam",
    "madlo",
    "magistr",
    "mahagon",
    "majetek",
    "majitel",
    "majorita",
    "makak",
    "makovice",
    "makrela",
    "malba",
    "malina",
    "malovat",
    "malvice",
    "maminka",
    "mandle",
    "manko",
    "marnost",
    "masakr",
    "maskot",
    "masopust",
    "matice",
    "matrika",
    "maturita",
    "mazanec",
    "mazivo",
    "mazlit",
    "mazurka",
    "mdloba",
    "mechanik",
    "meditace",
    "medovina",
    "melasa",
    "meloun",
    "mentolka",
    "metla",
    "metoda",
    "metr",
    "mezera",
    "migrace",
    "mihnout",
    "mihule",
    "mikina",
    "mikrofon",
    "milenec",
    "milimetr",
    "milost",
    "mimika",
    "mincovna",
    "minibar",
    "minomet",
    "minulost",
    "miska",
    "mistr",
    "mixovat",
    "mladost",
    "mlha",
    "mlhovina",
    "mlok",
    "mlsat",
    "mluvit",
    "mnich",
    "mnohem",
    "mobil",
    "mocnost",
    "modelka",
    "modlitba",
    "mohyla",
    "mokro",
    "molekula",
    "momentka",
    "monarcha",
    "monokl",
    "monstrum",
    "montovat",
    "monzun",
    "mosaz",
    "moskyt",
    "most",
    "motivace",
    "motorka",
    "motyka",
    "moucha",
    "moudrost",
    "mozaika",
    "mozek",
    "mozol",
    "mramor",
    "mravenec",
    "mrkev",
    "mrtvola",
    "mrzet",
    "mrzutost",
    "mstitel",
    "mudrc",
    "muflon",
    "mulat",
    "mumie",
    "munice",
    "muset",
    "mutace",
    "muzeum",
    "muzikant",
    "myslivec",
    "mzda",
    "nabourat",
    "nachytat",
    "nadace",
    "nadbytek",
    "nadhoz",
    "nadobro",
    "nadpis",
    "nahlas",
    "nahnat",
    "nahodile",
    "nahradit",
    "naivita",
    "najednou",
    "najisto",
    "najmout",
    "naklonit",
    "nakonec",
    "nakrmit",
    "nalevo",
    "namazat",
    "namluvit",
    "nanometr",
    "naoko",
    "naopak",
    "naostro",
    "napadat",
    "napevno",
    "naplnit",
    "napnout",
    "naposled",
    "naprosto",
    "narodit",
    "naruby",
    "narychlo",
    "nasadit",
    "nasekat",
    "naslepo",
    "nastat",
    "natolik",
    "navenek",
    "navrch",
    "navzdory",
    "nazvat",
    "nebe",
    "nechat",
    "necky",
    "nedaleko",
    "nedbat",
    "neduh",
    "negace",
    "nehet",
    "nehoda",
    "nejen",
    "nejprve",
    "neklid",
    "nelibost",
    "nemilost",
    "nemoc",
    "neochota",
    "neonka",
    "nepokoj",
    "nerost",
    "nerv",
    "nesmysl",
    "nesoulad",
    "netvor",
    "neuron",
    "nevina",
    "nezvykle",
    "nicota",
    "nijak",
    "nikam",
    "nikdy",
    "nikl",
    "nikterak",
    "nitro",
    "nocleh",
    "nohavice",
    "nominace",
    "nora",
    "norek",
    "nositel",
    "nosnost",
    "nouze",
    "noviny",
    "novota",
    "nozdra",
    "nuda",
    "nudle",
    "nuget",
    "nutit",
    "nutnost",
    "nutrie",
    "nymfa",
    "obal",
    "obarvit",
    "obava",
    "obdiv",
    "obec",
    "obehnat",
    "obejmout",
    "obezita",
    "obhajoba",
    "obilnice",
    "objasnit",
    "objekt",
    "obklopit",
    "oblast",
    "oblek",
    "obliba",
    "obloha",
    "obluda",
    "obnos",
    "obohatit",
    "obojek",
    "obout",
    "obrazec",
    "obrna",
    "obruba",
    "obrys",
    "obsah",
    "obsluha",
    "obstarat",
    "obuv",
    "obvaz",
    "obvinit",
    "obvod",
    "obvykle",
    "obyvatel",
    "obzor",
    "ocas",
    "ocel",
    "ocenit",
    "ochladit",
    "ochota",
    "ochrana",
    "ocitnout",
    "odboj",
    "odbyt",
    "odchod",
    "odcizit",
    "odebrat",
    "odeslat",
    "odevzdat",
    "odezva",
    "odhadce",
    "odhodit",
    "odjet",
    "odjinud",
    "odkaz",
    "odkoupit",
    "odliv",
    "odluka",
    "odmlka",
    "odolnost",
    "odpad",
    "odpis",
    "odplout",
    "odpor",
    "odpustit",
    "odpykat",
    "odrazka",
    "odsoudit",
    "odstup",
    "odsun",
    "odtok",
    "odtud",
    "odvaha",
    "odveta",
    "odvolat",
    "odvracet",
    "odznak",
    "ofina",
    "ofsajd",
    "ohlas",
    "ohnisko",
    "ohrada",
    "ohrozit",
    "ohryzek",
    "okap",
    "okenice",
    "oklika",
    "okno",
    "okouzlit",
    "okovy",
    "okrasa",
    "okres",
    "okrsek",
    "okruh",
    "okupant",
    "okurka",
    "okusit",
    "olejnina",
    "olizovat",
    "omak",
    "omeleta",
    "omezit",
    "omladina",
    "omlouvat",
    "omluva",
    "omyl",
    "onehdy",
    "opakovat",
    "opasek",
    "operace",
    "opice",
    "opilost",
    "opisovat",
    "opora",
    "opozice",
    "opravdu",
    "oproti",
    "orbital",
    "orchestr",
    "orgie",
    "orlice",
    "orloj",
    "ortel",
    "osada",
    "oschnout",
    "osika",
    "osivo",
    "oslava",
    "oslepit",
    "oslnit",
    "oslovit",
    "osnova",
    "osoba",
    "osolit",
    "ospalec",
    "osten",
    "ostraha",
    "ostuda",
    "ostych",
    "osvojit",
    "oteplit",
    "otisk",
    "otop",
    "otrhat",
    "otrlost",
    "otrok",
    "otruby",
    "otvor",
    "ovanout",
    "ovar",
    "oves",
    "ovlivnit",
    "ovoce",
    "oxid",
    "ozdoba",
    "pachatel",
    "pacient",
    "padouch",
    "pahorek",
    "pakt",
    "palanda",
    "palec",
    "palivo",
    "paluba",
    "pamflet",
    "pamlsek",
    "panenka",
    "panika",
    "panna",
    "panovat",
    "panstvo",
    "pantofle",
    "paprika",
    "parketa",
    "parodie",
    "parta",
    "paruka",
    "paryba",
    "paseka",
    "pasivita",
    "pastelka",
    "patent",
    "patrona",
    "pavouk",
    "pazneht",
    "pazourek",
    "pecka",
    "pedagog",
    "pejsek",
    "peklo",
    "peloton",
    "penalta",
    "pendrek",
    "penze",
    "periskop",
    "pero",
    "pestrost",
    "petarda",
    "petice",
    "petrolej",
    "pevnina",
    "pexeso",
    "pianista",
    "piha",
    "pijavice",
    "pikle",
    "piknik",
    "pilina",
    "pilnost",
    "pilulka",
    "pinzeta",
    "pipeta",
    "pisatel",
    "pistole",
    "pitevna",
    "pivnice",
    "pivovar",
    "placenta",
    "plakat",
    "plamen",
    "planeta",
    "plastika",
    "platit",
    "plavidlo",
    "plaz",
    "plech",
    "plemeno",
    "plenta",
    "ples",
    "pletivo",
    "plevel",
    "plivat",
    "plnit",
    "plno",
    "plocha",
    "plodina",
    "plomba",
    "plout",
    "pluk",
    "plyn",
    "pobavit",
    "pobyt",
    "pochod",
    "pocit",
    "poctivec",
    "podat",
    "podcenit",
    "podepsat",
    "podhled",
    "podivit",
    "podklad",
    "podmanit",
    "podnik",
    "podoba",
    "podpora",
    "podraz",
    "podstata",
    "podvod",
    "podzim",
    "poezie",
    "pohanka",
    "pohnutka",
    "pohovor",
    "pohroma",
    "pohyb",
    "pointa",
    "pojistka",
    "pojmout",
    "pokazit",
    "pokles",
    "pokoj",
    "pokrok",
    "pokuta",
    "pokyn",
    "poledne",
    "polibek",
    "polknout",
    "poloha",
    "polynom",
    "pomalu",
    "pominout",
    "pomlka",
    "pomoc",
    "pomsta",
    "pomyslet",
    "ponechat",
    "ponorka",
    "ponurost",
    "popadat",
    "popel",
    "popisek",
    "poplach",
    "poprosit",
    "popsat",
    "popud",
    "poradce",
    "porce",
    "porod",
    "porucha",
    "poryv",
    "posadit",
    "posed",
    "posila",
    "poskok",
    "poslanec",
    "posoudit",
    "pospolu",
    "postava",
    "posudek",
    "posyp",
    "potah",
    "potkan",
    "potlesk",
    "potomek",
    "potrava",
    "potupa",
    "potvora",
    "poukaz",
    "pouto",
    "pouzdro",
    "povaha",
    "povidla",
    "povlak",
    "povoz",
    "povrch",
    "povstat",
    "povyk",
    "povzdech",
    "pozdrav",
    "pozemek",
    "poznatek",
    "pozor",
    "pozvat",
    "pracovat",
    "prahory",
    "praktika",
    "prales",
    "praotec",
    "praporek",
    "prase",
    "pravda",
    "princip",
    "prkno",
    "probudit",
    "procento",
    "prodej",
    "profese",
    "prohra",
    "projekt",
    "prolomit",
    "promile",
    "pronikat",
    "propad",
    "prorok",
    "prosba",
    "proton",
    "proutek",
    "provaz",
    "prskavka",
    "prsten",
    "prudkost",
    "prut",
    "prvek",
    "prvohory",
    "psanec",
    "psovod",
    "pstruh",
    "ptactvo",
    "puberta",
    "puch",
    "pudl",
    "pukavec",
    "puklina",
    "pukrle",
    "pult",
    "pumpa",
    "punc",
    "pupen",
    "pusa",
    "pusinka",
    "pustina",
    "putovat",
    "putyka",
    "pyramida",
    "pysk",
    "pytel",
    "racek",
    "rachot",
    "radiace",
    "radnice",
    "radon",
    "raft",
    "ragby",
    "raketa",
    "rakovina",
    "rameno",
    "rampouch",
    "rande",
    "rarach",
    "rarita",
    "rasovna",
    "rastr",
    "ratolest",
    "razance",
    "razidlo",
    "reagovat",
    "reakce",
    "recept",
    "redaktor",
    "referent",
    "reflex",
    "rejnok",
    "reklama",
    "rekord",
    "rekrut",
    "rektor",
    "reputace",
    "revize",
    "revma",
    "revolver",
    "rezerva",
    "riskovat",
    "riziko",
    "robotika",
    "rodokmen",
    "rohovka",
    "rokle",
    "rokoko",
    "romaneto",
    "ropovod",
    "ropucha",
    "rorejs",
    "rosol",
    "rostlina",
    "rotmistr",
    "rotoped",
    "rotunda",
    "roubenka",
    "roucho",
    "roup",
    "roura",
    "rovina",
    "rovnice",
    "rozbor",
    "rozchod",
    "rozdat",
    "rozeznat",
    "rozhodce",
    "rozinka",
    "rozjezd",
    "rozkaz",
    "rozloha",
    "rozmar",
    "rozpad",
    "rozruch",
    "rozsah",
    "roztok",
    "rozum",
    "rozvod",
    "rubrika",
    "ruchadlo",
    "rukavice",
    "rukopis",
    "ryba",
    "rybolov",
    "rychlost",
    "rydlo",
    "rypadlo",
    "rytina",
    "ryzost",
    "sadista",
    "sahat",
    "sako",
    "samec",
    "samizdat",
    "samota",
    "sanitka",
    "sardinka",
    "sasanka",
    "satelit",
    "sazba",
    "sazenice",
    "sbor",
    "schovat",
    "sebranka",
    "secese",
    "sedadlo",
    "sediment",
    "sedlo",
    "sehnat",
    "sejmout",
    "sekera",
    "sekta",
    "sekunda",
    "sekvoje",
    "semeno",
    "seno",
    "servis",
    "sesadit",
    "seshora",
    "seskok",
    "seslat",
    "sestra",
    "sesuv",
    "sesypat",
    "setba",
    "setina",
    "setkat",
    "setnout",
    "setrvat",
    "sever",
    "seznam",
    "shoda",
    "shrnout",
    "sifon",
    "silnice",
    "sirka",
    "sirotek",
    "sirup",
    "situace",
    "skafandr",
    "skalisko",
    "skanzen",
    "skaut",
    "skeptik",
    "skica",
    "skladba",
    "sklenice",
    "sklo",
    "skluz",
    "skoba",
    "skokan",
    "skoro",
    "skripta",
    "skrz",
    "skupina",
    "skvost",
    "skvrna",
    "slabika",
    "sladidlo",
    "slanina",
    "slast",
    "slavnost",
    "sledovat",
    "slepec",
    "sleva",
    "slezina",
    "slib",
    "slina",
    "sliznice",
    "slon",
    "sloupek",
    "slovo",
    "sluch",
    "sluha",
    "slunce",
    "slupka",
    "slza",
    "smaragd",
    "smetana",
    "smilstvo",
    "smlouva",
    "smog",
    "smrad",
    "smrk",
    "smrtka",
    "smutek",
    "smysl",
    "snad",
    "snaha",
    "snob",
    "sobota",
    "socha",
    "sodovka",
    "sokol",
    "sopka",
    "sotva",
    "souboj",
    "soucit",
    "soudce",
    "souhlas",
    "soulad",
    "soumrak",
    "souprava",
    "soused",
    "soutok",
    "souviset",
    "spalovna",
    "spasitel",
    "spis",
    "splav",
    "spodek",
    "spojenec",
    "spolu",
    "sponzor",
    "spornost",
    "spousta",
    "sprcha",
    "spustit",
    "sranda",
    "sraz",
    "srdce",
    "srna",
    "srnec",
    "srovnat",
    "srpen",
    "srst",
    "srub",
    "stanice",
    "starosta",
    "statika",
    "stavba",
    "stehno",
    "stezka",
    "stodola",
    "stolek",
    "stopa",
    "storno",
    "stoupat",
    "strach",
    "stres",
    "strhnout",
    "strom",
    "struna",
    "studna",
    "stupnice",
    "stvol",
    "styk",
    "subjekt",
    "subtropy",
    "suchar",
    "sudost",
    "sukno",
    "sundat",
    "sunout",
    "surikata",
    "surovina",
    "svah",
    "svalstvo",
    "svetr",
    "svatba",
    "svazek",
    "svisle",
    "svitek",
    "svoboda",
    "svodidlo",
    "svorka",
    "svrab",
    "sykavka",
    "sykot",
    "synek",
    "synovec",
    "sypat",
    "sypkost",
    "syrovost",
    "sysel",
    "sytost",
    "tabletka",
    "tabule",
    "tahoun",
    "tajemno",
    "tajfun",
    "tajga",
    "tajit",
    "tajnost",
    "taktika",
    "tamhle",
    "tampon",
    "tancovat",
    "tanec",
    "tanker",
    "tapeta",
    "tavenina",
    "tazatel",
    "technika",
    "tehdy",
    "tekutina",
    "telefon",
    "temnota",
    "tendence",
    "tenista",
    "tenor",
    "teplota",
    "tepna",
    "teprve",
    "terapie",
    "termoska",
    "textil",
    "ticho",
    "tiskopis",
    "titulek",
    "tkadlec",
    "tkanina",
    "tlapka",
    "tleskat",
    "tlukot",
    "tlupa",
    "tmel",
    "toaleta",
    "topinka",
    "topol",
    "torzo",
    "touha",
    "toulec",
    "tradice",
    "traktor",
    "tramp",
    "trasa",
    "traverza",
    "trefit",
    "trest",
    "trezor",
    "trhavina",
    "trhlina",
    "trochu",
    "trojice",
    "troska",
    "trouba",
    "trpce",
    "trpitel",
    "trpkost",
    "trubec",
    "truchlit",
    "truhlice",
    "trus",
    "trvat",
    "tudy",
    "tuhnout",
    "tuhost",
    "tundra",
    "turista",
    "turnaj",
    "tuzemsko",
    "tvaroh",
    "tvorba",
    "tvrdost",
    "tvrz",
    "tygr",
    "tykev",
    "ubohost",
    "uboze",
    "ubrat",
    "ubrousek",
    "ubrus",
    "ubytovna",
    "ucho",
    "uctivost",
    "udivit",
    "uhradit",
    "ujednat",
    "ujistit",
    "ujmout",
    "ukazatel",
    "uklidnit",
    "uklonit",
    "ukotvit",
    "ukrojit",
    "ulice",
    "ulita",
    "ulovit",
    "umyvadlo",
    "unavit",
    "uniforma",
    "uniknout",
    "upadnout",
    "uplatnit",
    "uplynout",
    "upoutat",
    "upravit",
    "uran",
    "urazit",
    "usednout",
    "usilovat",
    "usmrtit",
    "usnadnit",
    "usnout",
    "usoudit",
    "ustlat",
    "ustrnout",
    "utahovat",
    "utkat",
    "utlumit",
    "utonout",
    "utopenec",
    "utrousit",
    "uvalit",
    "uvolnit",
    "uvozovka",
    "uzdravit",
    "uzel",
    "uzenina",
    "uzlina",
    "uznat",
    "vagon",
    "valcha",
    "valoun",
    "vana",
    "vandal",
    "vanilka",
    "varan",
    "varhany",
    "varovat",
    "vcelku",
    "vchod",
    "vdova",
    "vedro",
    "vegetace",
    "vejce",
    "velbloud",
    "veletrh",
    "velitel",
    "velmoc",
    "velryba",
    "venkov",
    "veranda",
    "verze",
    "veselka",
    "veskrze",
    "vesnice",
    "vespodu",
    "vesta",
    "veterina",
    "veverka",
    "vibrace",
    "vichr",
    "videohra",
    "vidina",
    "vidle",
    "vila",
    "vinice",
    "viset",
    "vitalita",
    "vize",
    "vizitka",
    "vjezd",
    "vklad",
    "vkus",
    "vlajka",
    "vlak",
    "vlasec",
    "vlevo",
    "vlhkost",
    "vliv",
    "vlnovka",
    "vloupat",
    "vnucovat",
    "vnuk",
    "voda",
    "vodivost",
    "vodoznak",
    "vodstvo",
    "vojensky",
    "vojna",
    "vojsko",
    "volant",
    "volba",
    "volit",
    "volno",
    "voskovka",
    "vozidlo",
    "vozovna",
    "vpravo",
    "vrabec",
    "vracet",
    "vrah",
    "vrata",
    "vrba",
    "vrcholek",
    "vrhat",
    "vrstva",
    "vrtule",
    "vsadit",
    "vstoupit",
    "vstup",
    "vtip",
    "vybavit",
    "vybrat",
    "vychovat",
    "vydat",
    "vydra",
    "vyfotit",
    "vyhledat",
    "vyhnout",
    "vyhodit",
    "vyhradit",
    "vyhubit",
    "vyjasnit",
    "vyjet",
    "vyjmout",
    "vyklopit",
    "vykonat",
    "vylekat",
    "vymazat",
    "vymezit",
    "vymizet",
    "vymyslet",
    "vynechat",
    "vynikat",
    "vynutit",
    "vypadat",
    "vyplatit",
    "vypravit",
    "vypustit",
    "vyrazit",
    "vyrovnat",
    "vyrvat",
    "vyslovit",
    "vysoko",
    "vystavit",
    "vysunout",
    "vysypat",
    "vytasit",
    "vytesat",
    "vytratit",
    "vyvinout",
    "vyvolat",
    "vyvrhel",
    "vyzdobit",
    "vyznat",
    "vzadu",
    "vzbudit",
    "vzchopit",
    "vzdor",
    "vzduch",
    "vzdychat",
    "vzestup",
    "vzhledem",
    "vzkaz",
    "vzlykat",
    "vznik",
    "vzorek",
    "vzpoura",
    "vztah",
    "vztek",
    "xylofon",
    "zabrat",
    "zabydlet",
    "zachovat",
    "zadarmo",
    "zadusit",
    "zafoukat",
    "zahltit",
    "zahodit",
    "zahrada",
    "zahynout",
    "zajatec",
    "zajet",
    "zajistit",
    "zaklepat",
    "zakoupit",
    "zalepit",
    "zamezit",
    "zamotat",
    "zamyslet",
    "zanechat",
    "zanikat",
    "zaplatit",
    "zapojit",
    "zapsat",
    "zarazit",
    "zastavit",
    "zasunout",
    "zatajit",
    "zatemnit",
    "zatknout",
    "zaujmout",
    "zavalit",
    "zavelet",
    "zavinit",
    "zavolat",
    "zavrtat",
    "zazvonit",
    "zbavit",
    "zbrusu",
    "zbudovat",
    "zbytek",
    "zdaleka",
    "zdarma",
    "zdatnost",
    "zdivo",
    "zdobit",
    "zdroj",
    "zdvih",
    "zdymadlo",
    "zelenina",
    "zeman",
    "zemina",
    "zeptat",
    "zezadu",
    "zezdola",
    "zhatit",
    "zhltnout",
    "zhluboka",
    "zhotovit",
    "zhruba",
    "zima",
    "zimnice",
    "zjemnit",
    "zklamat",
    "zkoumat",
    "zkratka",
    "zkumavka",
    "zlato",
    "zlehka",
    "zloba",
    "zlom",
    "zlost",
    "zlozvyk",
    "zmapovat",
    "zmar",
    "zmatek",
    "zmije",
    "zmizet",
    "zmocnit",
    "zmodrat",
    "zmrzlina",
    "zmutovat",
    "znak",
    "znalost",
    "znamenat",
    "znovu",
    "zobrazit",
    "zotavit",
    "zoubek",
    "zoufale",
    "zplodit",
    "zpomalit",
    "zprava",
    "zprostit",
    "zprudka",
    "zprvu",
    "zrada",
    "zranit",
    "zrcadlo",
    "zrnitost",
    "zrno",
    "zrovna",
    "zrychlit",
    "zrzavost",
    "zticha",
    "ztratit",
    "zubovina",
    "zubr",
    "zvednout",
    "zvenku",
    "zvesela",
    "zvon",
    "zvrat",
    "zvukovod",
    "zvyk"
]

},{}],31:[function(require,module,exports){
module.exports=[
    "abandon",
    "ability",
    "able",
    "about",
    "above",
    "absent",
    "absorb",
    "abstract",
    "absurd",
    "abuse",
    "access",
    "accident",
    "account",
    "accuse",
    "achieve",
    "acid",
    "acoustic",
    "acquire",
    "across",
    "act",
    "action",
    "actor",
    "actress",
    "actual",
    "adapt",
    "add",
    "addict",
    "address",
    "adjust",
    "admit",
    "adult",
    "advance",
    "advice",
    "aerobic",
    "affair",
    "afford",
    "afraid",
    "again",
    "age",
    "agent",
    "agree",
    "ahead",
    "aim",
    "air",
    "airport",
    "aisle",
    "alarm",
    "album",
    "alcohol",
    "alert",
    "alien",
    "all",
    "alley",
    "allow",
    "almost",
    "alone",
    "alpha",
    "already",
    "also",
    "alter",
    "always",
    "amateur",
    "amazing",
    "among",
    "amount",
    "amused",
    "analyst",
    "anchor",
    "ancient",
    "anger",
    "angle",
    "angry",
    "animal",
    "ankle",
    "announce",
    "annual",
    "another",
    "answer",
    "antenna",
    "antique",
    "anxiety",
    "any",
    "apart",
    "apology",
    "appear",
    "apple",
    "approve",
    "april",
    "arch",
    "arctic",
    "area",
    "arena",
    "argue",
    "arm",
    "armed",
    "armor",
    "army",
    "around",
    "arrange",
    "arrest",
    "arrive",
    "arrow",
    "art",
    "artefact",
    "artist",
    "artwork",
    "ask",
    "aspect",
    "assault",
    "asset",
    "assist",
    "assume",
    "asthma",
    "athlete",
    "atom",
    "attack",
    "attend",
    "attitude",
    "attract",
    "auction",
    "audit",
    "august",
    "aunt",
    "author",
    "auto",
    "autumn",
    "average",
    "avocado",
    "avoid",
    "awake",
    "aware",
    "away",
    "awesome",
    "awful",
    "awkward",
    "axis",
    "baby",
    "bachelor",
    "bacon",
    "badge",
    "bag",
    "balance",
    "balcony",
    "ball",
    "bamboo",
    "banana",
    "banner",
    "bar",
    "barely",
    "bargain",
    "barrel",
    "base",
    "basic",
    "basket",
    "battle",
    "beach",
    "bean",
    "beauty",
    "because",
    "become",
    "beef",
    "before",
    "begin",
    "behave",
    "behind",
    "believe",
    "below",
    "belt",
    "bench",
    "benefit",
    "best",
    "betray",
    "better",
    "between",
    "beyond",
    "bicycle",
    "bid",
    "bike",
    "bind",
    "biology",
    "bird",
    "birth",
    "bitter",
    "black",
    "blade",
    "blame",
    "blanket",
    "blast",
    "bleak",
    "bless",
    "blind",
    "blood",
    "blossom",
    "blouse",
    "blue",
    "blur",
    "blush",
    "board",
    "boat",
    "body",
    "boil",
    "bomb",
    "bone",
    "bonus",
    "book",
    "boost",
    "border",
    "boring",
    "borrow",
    "boss",
    "bottom",
    "bounce",
    "box",
    "boy",
    "bracket",
    "brain",
    "brand",
    "brass",
    "brave",
    "bread",
    "breeze",
    "brick",
    "bridge",
    "brief",
    "bright",
    "bring",
    "brisk",
    "broccoli",
    "broken",
    "bronze",
    "broom",
    "brother",
    "brown",
    "brush",
    "bubble",
    "buddy",
    "budget",
    "buffalo",
    "build",
    "bulb",
    "bulk",
    "bullet",
    "bundle",
    "bunker",
    "burden",
    "burger",
    "burst",
    "bus",
    "business",
    "busy",
    "butter",
    "buyer",
    "buzz",
    "cabbage",
    "cabin",
    "cable",
    "cactus",
    "cage",
    "cake",
    "call",
    "calm",
    "camera",
    "camp",
    "can",
    "canal",
    "cancel",
    "candy",
    "cannon",
    "canoe",
    "canvas",
    "canyon",
    "capable",
    "capital",
    "captain",
    "car",
    "carbon",
    "card",
    "cargo",
    "carpet",
    "carry",
    "cart",
    "case",
    "cash",
    "casino",
    "castle",
    "casual",
    "cat",
    "catalog",
    "catch",
    "category",
    "cattle",
    "caught",
    "cause",
    "caution",
    "cave",
    "ceiling",
    "celery",
    "cement",
    "census",
    "century",
    "cereal",
    "certain",
    "chair",
    "chalk",
    "champion",
    "change",
    "chaos",
    "chapter",
    "charge",
    "chase",
    "chat",
    "cheap",
    "check",
    "cheese",
    "chef",
    "cherry",
    "chest",
    "chicken",
    "chief",
    "child",
    "chimney",
    "choice",
    "choose",
    "chronic",
    "chuckle",
    "chunk",
    "churn",
    "cigar",
    "cinnamon",
    "circle",
    "citizen",
    "city",
    "civil",
    "claim",
    "clap",
    "clarify",
    "claw",
    "clay",
    "clean",
    "clerk",
    "clever",
    "click",
    "client",
    "cliff",
    "climb",
    "clinic",
    "clip",
    "clock",
    "clog",
    "close",
    "cloth",
    "cloud",
    "clown",
    "club",
    "clump",
    "cluster",
    "clutch",
    "coach",
    "coast",
    "coconut",
    "code",
    "coffee",
    "coil",
    "coin",
    "collect",
    "color",
    "column",
    "combine",
    "come",
    "comfort",
    "comic",
    "common",
    "company",
    "concert",
    "conduct",
    "confirm",
    "congress",
    "connect",
    "consider",
    "control",
    "convince",
    "cook",
    "cool",
    "copper",
    "copy",
    "coral",
    "core",
    "corn",
    "correct",
    "cost",
    "cotton",
    "couch",
    "country",
    "couple",
    "course",
    "cousin",
    "cover",
    "coyote",
    "crack",
    "cradle",
    "craft",
    "cram",
    "crane",
    "crash",
    "crater",
    "crawl",
    "crazy",
    "cream",
    "credit",
    "creek",
    "crew",
    "cricket",
    "crime",
    "crisp",
    "critic",
    "crop",
    "cross",
    "crouch",
    "crowd",
    "crucial",
    "cruel",
    "cruise",
    "crumble",
    "crunch",
    "crush",
    "cry",
    "crystal",
    "cube",
    "culture",
    "cup",
    "cupboard",
    "curious",
    "current",
    "curtain",
    "curve",
    "cushion",
    "custom",
    "cute",
    "cycle",
    "dad",
    "damage",
    "damp",
    "dance",
    "danger",
    "daring",
    "dash",
    "daughter",
    "dawn",
    "day",
    "deal",
    "debate",
    "debris",
    "decade",
    "december",
    "decide",
    "decline",
    "decorate",
    "decrease",
    "deer",
    "defense",
    "define",
    "defy",
    "degree",
    "delay",
    "deliver",
    "demand",
    "demise",
    "denial",
    "dentist",
    "deny",
    "depart",
    "depend",
    "deposit",
    "depth",
    "deputy",
    "derive",
    "describe",
    "desert",
    "design",
    "desk",
    "despair",
    "destroy",
    "detail",
    "detect",
    "develop",
    "device",
    "devote",
    "diagram",
    "dial",
    "diamond",
    "diary",
    "dice",
    "diesel",
    "diet",
    "differ",
    "digital",
    "dignity",
    "dilemma",
    "dinner",
    "dinosaur",
    "direct",
    "dirt",
    "disagree",
    "discover",
    "disease",
    "dish",
    "dismiss",
    "disorder",
    "display",
    "distance",
    "divert",
    "divide",
    "divorce",
    "dizzy",
    "doctor",
    "document",
    "dog",
    "doll",
    "dolphin",
    "domain",
    "donate",
    "donkey",
    "donor",
    "door",
    "dose",
    "double",
    "dove",
    "draft",
    "dragon",
    "drama",
    "drastic",
    "draw",
    "dream",
    "dress",
    "drift",
    "drill",
    "drink",
    "drip",
    "drive",
    "drop",
    "drum",
    "dry",
    "duck",
    "dumb",
    "dune",
    "during",
    "dust",
    "dutch",
    "duty",
    "dwarf",
    "dynamic",
    "eager",
    "eagle",
    "early",
    "earn",
    "earth",
    "easily",
    "east",
    "easy",
    "echo",
    "ecology",
    "economy",
    "edge",
    "edit",
    "educate",
    "effort",
    "egg",
    "eight",
    "either",
    "elbow",
    "elder",
    "electric",
    "elegant",
    "element",
    "elephant",
    "elevator",
    "elite",
    "else",
    "embark",
    "embody",
    "embrace",
    "emerge",
    "emotion",
    "employ",
    "empower",
    "empty",
    "enable",
    "enact",
    "end",
    "endless",
    "endorse",
    "enemy",
    "energy",
    "enforce",
    "engage",
    "engine",
    "enhance",
    "enjoy",
    "enlist",
    "enough",
    "enrich",
    "enroll",
    "ensure",
    "enter",
    "entire",
    "entry",
    "envelope",
    "episode",
    "equal",
    "equip",
    "era",
    "erase",
    "erode",
    "erosion",
    "error",
    "erupt",
    "escape",
    "essay",
    "essence",
    "estate",
    "eternal",
    "ethics",
    "evidence",
    "evil",
    "evoke",
    "evolve",
    "exact",
    "example",
    "excess",
    "exchange",
    "excite",
    "exclude",
    "excuse",
    "execute",
    "exercise",
    "exhaust",
    "exhibit",
    "exile",
    "exist",
    "exit",
    "exotic",
    "expand",
    "expect",
    "expire",
    "explain",
    "expose",
    "express",
    "extend",
    "extra",
    "eye",
    "eyebrow",
    "fabric",
    "face",
    "faculty",
    "fade",
    "faint",
    "faith",
    "fall",
    "false",
    "fame",
    "family",
    "famous",
    "fan",
    "fancy",
    "fantasy",
    "farm",
    "fashion",
    "fat",
    "fatal",
    "father",
    "fatigue",
    "fault",
    "favorite",
    "feature",
    "february",
    "federal",
    "fee",
    "feed",
    "feel",
    "female",
    "fence",
    "festival",
    "fetch",
    "fever",
    "few",
    "fiber",
    "fiction",
    "field",
    "figure",
    "file",
    "film",
    "filter",
    "final",
    "find",
    "fine",
    "finger",
    "finish",
    "fire",
    "firm",
    "first",
    "fiscal",
    "fish",
    "fit",
    "fitness",
    "fix",
    "flag",
    "flame",
    "flash",
    "flat",
    "flavor",
    "flee",
    "flight",
    "flip",
    "float",
    "flock",
    "floor",
    "flower",
    "fluid",
    "flush",
    "fly",
    "foam",
    "focus",
    "fog",
    "foil",
    "fold",
    "follow",
    "food",
    "foot",
    "force",
    "forest",
    "forget",
    "fork",
    "fortune",
    "forum",
    "forward",
    "fossil",
    "foster",
    "found",
    "fox",
    "fragile",
    "frame",
    "frequent",
    "fresh",
    "friend",
    "fringe",
    "frog",
    "front",
    "frost",
    "frown",
    "frozen",
    "fruit",
    "fuel",
    "fun",
    "funny",
    "furnace",
    "fury",
    "future",
    "gadget",
    "gain",
    "galaxy",
    "gallery",
    "game",
    "gap",
    "garage",
    "garbage",
    "garden",
    "garlic",
    "garment",
    "gas",
    "gasp",
    "gate",
    "gather",
    "gauge",
    "gaze",
    "general",
    "genius",
    "genre",
    "gentle",
    "genuine",
    "gesture",
    "ghost",
    "giant",
    "gift",
    "giggle",
    "ginger",
    "giraffe",
    "girl",
    "give",
    "glad",
    "glance",
    "glare",
    "glass",
    "glide",
    "glimpse",
    "globe",
    "gloom",
    "glory",
    "glove",
    "glow",
    "glue",
    "goat",
    "goddess",
    "gold",
    "good",
    "goose",
    "gorilla",
    "gospel",
    "gossip",
    "govern",
    "gown",
    "grab",
    "grace",
    "grain",
    "grant",
    "grape",
    "grass",
    "gravity",
    "great",
    "green",
    "grid",
    "grief",
    "grit",
    "grocery",
    "group",
    "grow",
    "grunt",
    "guard",
    "guess",
    "guide",
    "guilt",
    "guitar",
    "gun",
    "gym",
    "habit",
    "hair",
    "half",
    "hammer",
    "hamster",
    "hand",
    "happy",
    "harbor",
    "hard",
    "harsh",
    "harvest",
    "hat",
    "have",
    "hawk",
    "hazard",
    "head",
    "health",
    "heart",
    "heavy",
    "hedgehog",
    "height",
    "hello",
    "helmet",
    "help",
    "hen",
    "hero",
    "hidden",
    "high",
    "hill",
    "hint",
    "hip",
    "hire",
    "history",
    "hobby",
    "hockey",
    "hold",
    "hole",
    "holiday",
    "hollow",
    "home",
    "honey",
    "hood",
    "hope",
    "horn",
    "horror",
    "horse",
    "hospital",
    "host",
    "hotel",
    "hour",
    "hover",
    "hub",
    "huge",
    "human",
    "humble",
    "humor",
    "hundred",
    "hungry",
    "hunt",
    "hurdle",
    "hurry",
    "hurt",
    "husband",
    "hybrid",
    "ice",
    "icon",
    "idea",
    "identify",
    "idle",
    "ignore",
    "ill",
    "illegal",
    "illness",
    "image",
    "imitate",
    "immense",
    "immune",
    "impact",
    "impose",
    "improve",
    "impulse",
    "inch",
    "include",
    "income",
    "increase",
    "index",
    "indicate",
    "indoor",
    "industry",
    "infant",
    "inflict",
    "inform",
    "inhale",
    "inherit",
    "initial",
    "inject",
    "injury",
    "inmate",
    "inner",
    "innocent",
    "input",
    "inquiry",
    "insane",
    "insect",
    "inside",
    "inspire",
    "install",
    "intact",
    "interest",
    "into",
    "invest",
    "invite",
    "involve",
    "iron",
    "island",
    "isolate",
    "issue",
    "item",
    "ivory",
    "jacket",
    "jaguar",
    "jar",
    "jazz",
    "jealous",
    "jeans",
    "jelly",
    "jewel",
    "job",
    "join",
    "joke",
    "journey",
    "joy",
    "judge",
    "juice",
    "jump",
    "jungle",
    "junior",
    "junk",
    "just",
    "kangaroo",
    "keen",
    "keep",
    "ketchup",
    "key",
    "kick",
    "kid",
    "kidney",
    "kind",
    "kingdom",
    "kiss",
    "kit",
    "kitchen",
    "kite",
    "kitten",
    "kiwi",
    "knee",
    "knife",
    "knock",
    "know",
    "lab",
    "label",
    "labor",
    "ladder",
    "lady",
    "lake",
    "lamp",
    "language",
    "laptop",
    "large",
    "later",
    "latin",
    "laugh",
    "laundry",
    "lava",
    "law",
    "lawn",
    "lawsuit",
    "layer",
    "lazy",
    "leader",
    "leaf",
    "learn",
    "leave",
    "lecture",
    "left",
    "leg",
    "legal",
    "legend",
    "leisure",
    "lemon",
    "lend",
    "length",
    "lens",
    "leopard",
    "lesson",
    "letter",
    "level",
    "liar",
    "liberty",
    "library",
    "license",
    "life",
    "lift",
    "light",
    "like",
    "limb",
    "limit",
    "link",
    "lion",
    "liquid",
    "list",
    "little",
    "live",
    "lizard",
    "load",
    "loan",
    "lobster",
    "local",
    "lock",
    "logic",
    "lonely",
    "long",
    "loop",
    "lottery",
    "loud",
    "lounge",
    "love",
    "loyal",
    "lucky",
    "luggage",
    "lumber",
    "lunar",
    "lunch",
    "luxury",
    "lyrics",
    "machine",
    "mad",
    "magic",
    "magnet",
    "maid",
    "mail",
    "main",
    "major",
    "make",
    "mammal",
    "man",
    "manage",
    "mandate",
    "mango",
    "mansion",
    "manual",
    "maple",
    "marble",
    "march",
    "margin",
    "marine",
    "market",
    "marriage",
    "mask",
    "mass",
    "master",
    "match",
    "material",
    "math",
    "matrix",
    "matter",
    "maximum",
    "maze",
    "meadow",
    "mean",
    "measure",
    "meat",
    "mechanic",
    "medal",
    "media",
    "melody",
    "melt",
    "member",
    "memory",
    "mention",
    "menu",
    "mercy",
    "merge",
    "merit",
    "merry",
    "mesh",
    "message",
    "metal",
    "method",
    "middle",
    "midnight",
    "milk",
    "million",
    "mimic",
    "mind",
    "minimum",
    "minor",
    "minute",
    "miracle",
    "mirror",
    "misery",
    "miss",
    "mistake",
    "mix",
    "mixed",
    "mixture",
    "mobile",
    "model",
    "modify",
    "mom",
    "moment",
    "monitor",
    "monkey",
    "monster",
    "month",
    "moon",
    "moral",
    "more",
    "morning",
    "mosquito",
    "mother",
    "motion",
    "motor",
    "mountain",
    "mouse",
    "move",
    "movie",
    "much",
    "muffin",
    "mule",
    "multiply",
    "muscle",
    "museum",
    "mushroom",
    "music",
    "must",
    "mutual",
    "myself",
    "mystery",
    "myth",
    "naive",
    "name",
    "napkin",
    "narrow",
    "nasty",
    "nation",
    "nature",
    "near",
    "neck",
    "need",
    "negative",
    "neglect",
    "neither",
    "nephew",
    "nerve",
    "nest",
    "net",
    "network",
    "neutral",
    "never",
    "news",
    "next",
    "nice",
    "night",
    "noble",
    "noise",
    "nominee",
    "noodle",
    "normal",
    "north",
    "nose",
    "notable",
    "note",
    "nothing",
    "notice",
    "novel",
    "now",
    "nuclear",
    "number",
    "nurse",
    "nut",
    "oak",
    "obey",
    "object",
    "oblige",
    "obscure",
    "observe",
    "obtain",
    "obvious",
    "occur",
    "ocean",
    "october",
    "odor",
    "off",
    "offer",
    "office",
    "often",
    "oil",
    "okay",
    "old",
    "olive",
    "olympic",
    "omit",
    "once",
    "one",
    "onion",
    "online",
    "only",
    "open",
    "opera",
    "opinion",
    "oppose",
    "option",
    "orange",
    "orbit",
    "orchard",
    "order",
    "ordinary",
    "organ",
    "orient",
    "original",
    "orphan",
    "ostrich",
    "other",
    "outdoor",
    "outer",
    "output",
    "outside",
    "oval",
    "oven",
    "over",
    "own",
    "owner",
    "oxygen",
    "oyster",
    "ozone",
    "pact",
    "paddle",
    "page",
    "pair",
    "palace",
    "palm",
    "panda",
    "panel",
    "panic",
    "panther",
    "paper",
    "parade",
    "parent",
    "park",
    "parrot",
    "party",
    "pass",
    "patch",
    "path",
    "patient",
    "patrol",
    "pattern",
    "pause",
    "pave",
    "payment",
    "peace",
    "peanut",
    "pear",
    "peasant",
    "pelican",
    "pen",
    "penalty",
    "pencil",
    "people",
    "pepper",
    "perfect",
    "permit",
    "person",
    "pet",
    "phone",
    "photo",
    "phrase",
    "physical",
    "piano",
    "picnic",
    "picture",
    "piece",
    "pig",
    "pigeon",
    "pill",
    "pilot",
    "pink",
    "pioneer",
    "pipe",
    "pistol",
    "pitch",
    "pizza",
    "place",
    "planet",
    "plastic",
    "plate",
    "play",
    "please",
    "pledge",
    "pluck",
    "plug",
    "plunge",
    "poem",
    "poet",
    "point",
    "polar",
    "pole",
    "police",
    "pond",
    "pony",
    "pool",
    "popular",
    "portion",
    "position",
    "possible",
    "post",
    "potato",
    "pottery",
    "poverty",
    "powder",
    "power",
    "practice",
    "praise",
    "predict",
    "prefer",
    "prepare",
    "present",
    "pretty",
    "prevent",
    "price",
    "pride",
    "primary",
    "print",
    "priority",
    "prison",
    "private",
    "prize",
    "problem",
    "process",
    "produce",
    "profit",
    "program",
    "project",
    "promote",
    "proof",
    "property",
    "prosper",
    "protect",
    "proud",
    "provide",
    "public",
    "pudding",
    "pull",
    "pulp",
    "pulse",
    "pumpkin",
    "punch",
    "pupil",
    "puppy",
    "purchase",
    "purity",
    "purpose",
    "purse",
    "push",
    "put",
    "puzzle",
    "pyramid",
    "quality",
    "quantum",
    "quarter",
    "question",
    "quick",
    "quit",
    "quiz",
    "quote",
    "rabbit",
    "raccoon",
    "race",
    "rack",
    "radar",
    "radio",
    "rail",
    "rain",
    "raise",
    "rally",
    "ramp",
    "ranch",
    "random",
    "range",
    "rapid",
    "rare",
    "rate",
    "rather",
    "raven",
    "raw",
    "razor",
    "ready",
    "real",
    "reason",
    "rebel",
    "rebuild",
    "recall",
    "receive",
    "recipe",
    "record",
    "recycle",
    "reduce",
    "reflect",
    "reform",
    "refuse",
    "region",
    "regret",
    "regular",
    "reject",
    "relax",
    "release",
    "relief",
    "rely",
    "remain",
    "remember",
    "remind",
    "remove",
    "render",
    "renew",
    "rent",
    "reopen",
    "repair",
    "repeat",
    "replace",
    "report",
    "require",
    "rescue",
    "resemble",
    "resist",
    "resource",
    "response",
    "result",
    "retire",
    "retreat",
    "return",
    "reunion",
    "reveal",
    "review",
    "reward",
    "rhythm",
    "rib",
    "ribbon",
    "rice",
    "rich",
    "ride",
    "ridge",
    "rifle",
    "right",
    "rigid",
    "ring",
    "riot",
    "ripple",
    "risk",
    "ritual",
    "rival",
    "river",
    "road",
    "roast",
    "robot",
    "robust",
    "rocket",
    "romance",
    "roof",
    "rookie",
    "room",
    "rose",
    "rotate",
    "rough",
    "round",
    "route",
    "royal",
    "rubber",
    "rude",
    "rug",
    "rule",
    "run",
    "runway",
    "rural",
    "sad",
    "saddle",
    "sadness",
    "safe",
    "sail",
    "salad",
    "salmon",
    "salon",
    "salt",
    "salute",
    "same",
    "sample",
    "sand",
    "satisfy",
    "satoshi",
    "sauce",
    "sausage",
    "save",
    "say",
    "scale",
    "scan",
    "scare",
    "scatter",
    "scene",
    "scheme",
    "school",
    "science",
    "scissors",
    "scorpion",
    "scout",
    "scrap",
    "screen",
    "script",
    "scrub",
    "sea",
    "search",
    "season",
    "seat",
    "second",
    "secret",
    "section",
    "security",
    "seed",
    "seek",
    "segment",
    "select",
    "sell",
    "seminar",
    "senior",
    "sense",
    "sentence",
    "series",
    "service",
    "session",
    "settle",
    "setup",
    "seven",
    "shadow",
    "shaft",
    "shallow",
    "share",
    "shed",
    "shell",
    "sheriff",
    "shield",
    "shift",
    "shine",
    "ship",
    "shiver",
    "shock",
    "shoe",
    "shoot",
    "shop",
    "short",
    "shoulder",
    "shove",
    "shrimp",
    "shrug",
    "shuffle",
    "shy",
    "sibling",
    "sick",
    "side",
    "siege",
    "sight",
    "sign",
    "silent",
    "silk",
    "silly",
    "silver",
    "similar",
    "simple",
    "since",
    "sing",
    "siren",
    "sister",
    "situate",
    "six",
    "size",
    "skate",
    "sketch",
    "ski",
    "skill",
    "skin",
    "skirt",
    "skull",
    "slab",
    "slam",
    "sleep",
    "slender",
    "slice",
    "slide",
    "slight",
    "slim",
    "slogan",
    "slot",
    "slow",
    "slush",
    "small",
    "smart",
    "smile",
    "smoke",
    "smooth",
    "snack",
    "snake",
    "snap",
    "sniff",
    "snow",
    "soap",
    "soccer",
    "social",
    "sock",
    "soda",
    "soft",
    "solar",
    "soldier",
    "solid",
    "solution",
    "solve",
    "someone",
    "song",
    "soon",
    "sorry",
    "sort",
    "soul",
    "sound",
    "soup",
    "source",
    "south",
    "space",
    "spare",
    "spatial",
    "spawn",
    "speak",
    "special",
    "speed",
    "spell",
    "spend",
    "sphere",
    "spice",
    "spider",
    "spike",
    "spin",
    "spirit",
    "split",
    "spoil",
    "sponsor",
    "spoon",
    "sport",
    "spot",
    "spray",
    "spread",
    "spring",
    "spy",
    "square",
    "squeeze",
    "squirrel",
    "stable",
    "stadium",
    "staff",
    "stage",
    "stairs",
    "stamp",
    "stand",
    "start",
    "state",
    "stay",
    "steak",
    "steel",
    "stem",
    "step",
    "stereo",
    "stick",
    "still",
    "sting",
    "stock",
    "stomach",
    "stone",
    "stool",
    "story",
    "stove",
    "strategy",
    "street",
    "strike",
    "strong",
    "struggle",
    "student",
    "stuff",
    "stumble",
    "style",
    "subject",
    "submit",
    "subway",
    "success",
    "such",
    "sudden",
    "suffer",
    "sugar",
    "suggest",
    "suit",
    "summer",
    "sun",
    "sunny",
    "sunset",
    "super",
    "supply",
    "supreme",
    "sure",
    "surface",
    "surge",
    "surprise",
    "surround",
    "survey",
    "suspect",
    "sustain",
    "swallow",
    "swamp",
    "swap",
    "swarm",
    "swear",
    "sweet",
    "swift",
    "swim",
    "swing",
    "switch",
    "sword",
    "symbol",
    "symptom",
    "syrup",
    "system",
    "table",
    "tackle",
    "tag",
    "tail",
    "talent",
    "talk",
    "tank",
    "tape",
    "target",
    "task",
    "taste",
    "tattoo",
    "taxi",
    "teach",
    "team",
    "tell",
    "ten",
    "tenant",
    "tennis",
    "tent",
    "term",
    "test",
    "text",
    "thank",
    "that",
    "theme",
    "then",
    "theory",
    "there",
    "they",
    "thing",
    "this",
    "thought",
    "three",
    "thrive",
    "throw",
    "thumb",
    "thunder",
    "ticket",
    "tide",
    "tiger",
    "tilt",
    "timber",
    "time",
    "tiny",
    "tip",
    "tired",
    "tissue",
    "title",
    "toast",
    "tobacco",
    "today",
    "toddler",
    "toe",
    "together",
    "toilet",
    "token",
    "tomato",
    "tomorrow",
    "tone",
    "tongue",
    "tonight",
    "tool",
    "tooth",
    "top",
    "topic",
    "topple",
    "torch",
    "tornado",
    "tortoise",
    "toss",
    "total",
    "tourist",
    "toward",
    "tower",
    "town",
    "toy",
    "track",
    "trade",
    "traffic",
    "tragic",
    "train",
    "transfer",
    "trap",
    "trash",
    "travel",
    "tray",
    "treat",
    "tree",
    "trend",
    "trial",
    "tribe",
    "trick",
    "trigger",
    "trim",
    "trip",
    "trophy",
    "trouble",
    "truck",
    "true",
    "truly",
    "trumpet",
    "trust",
    "truth",
    "try",
    "tube",
    "tuition",
    "tumble",
    "tuna",
    "tunnel",
    "turkey",
    "turn",
    "turtle",
    "twelve",
    "twenty",
    "twice",
    "twin",
    "twist",
    "two",
    "type",
    "typical",
    "ugly",
    "umbrella",
    "unable",
    "unaware",
    "uncle",
    "uncover",
    "under",
    "undo",
    "unfair",
    "unfold",
    "unhappy",
    "uniform",
    "unique",
    "unit",
    "universe",
    "unknown",
    "unlock",
    "until",
    "unusual",
    "unveil",
    "update",
    "upgrade",
    "uphold",
    "upon",
    "upper",
    "upset",
    "urban",
    "urge",
    "usage",
    "use",
    "used",
    "useful",
    "useless",
    "usual",
    "utility",
    "vacant",
    "vacuum",
    "vague",
    "valid",
    "valley",
    "valve",
    "van",
    "vanish",
    "vapor",
    "various",
    "vast",
    "vault",
    "vehicle",
    "velvet",
    "vendor",
    "venture",
    "venue",
    "verb",
    "verify",
    "version",
    "very",
    "vessel",
    "veteran",
    "viable",
    "vibrant",
    "vicious",
    "victory",
    "video",
    "view",
    "village",
    "vintage",
    "violin",
    "virtual",
    "virus",
    "visa",
    "visit",
    "visual",
    "vital",
    "vivid",
    "vocal",
    "voice",
    "void",
    "volcano",
    "volume",
    "vote",
    "voyage",
    "wage",
    "wagon",
    "wait",
    "walk",
    "wall",
    "walnut",
    "want",
    "warfare",
    "warm",
    "warrior",
    "wash",
    "wasp",
    "waste",
    "water",
    "wave",
    "way",
    "wealth",
    "weapon",
    "wear",
    "weasel",
    "weather",
    "web",
    "wedding",
    "weekend",
    "weird",
    "welcome",
    "west",
    "wet",
    "whale",
    "what",
    "wheat",
    "wheel",
    "when",
    "where",
    "whip",
    "whisper",
    "wide",
    "width",
    "wife",
    "wild",
    "will",
    "win",
    "window",
    "wine",
    "wing",
    "wink",
    "winner",
    "winter",
    "wire",
    "wisdom",
    "wise",
    "wish",
    "witness",
    "wolf",
    "woman",
    "wonder",
    "wood",
    "wool",
    "word",
    "work",
    "world",
    "worry",
    "worth",
    "wrap",
    "wreck",
    "wrestle",
    "wrist",
    "write",
    "wrong",
    "yard",
    "year",
    "yellow",
    "you",
    "young",
    "youth",
    "zebra",
    "zero",
    "zone",
    "zoo"
]

},{}],32:[function(require,module,exports){
module.exports=[
    "abaisser",
    "abandon",
    "abdiquer",
    "abeille",
    "abolir",
    "aborder",
    "aboutir",
    "aboyer",
    "abrasif",
    "abreuver",
    "abriter",
    "abroger",
    "abrupt",
    "absence",
    "absolu",
    "absurde",
    "abusif",
    "abyssal",
    "acade╠ümie",
    "acajou",
    "acarien",
    "accabler",
    "accepter",
    "acclamer",
    "accolade",
    "accroche",
    "accuser",
    "acerbe",
    "achat",
    "acheter",
    "aciduler",
    "acier",
    "acompte",
    "acque╠ürir",
    "acronyme",
    "acteur",
    "actif",
    "actuel",
    "adepte",
    "ade╠üquat",
    "adhe╠üsif",
    "adjectif",
    "adjuger",
    "admettre",
    "admirer",
    "adopter",
    "adorer",
    "adoucir",
    "adresse",
    "adroit",
    "adulte",
    "adverbe",
    "ae╠ürer",
    "ae╠üronef",
    "affaire",
    "affecter",
    "affiche",
    "affreux",
    "affubler",
    "agacer",
    "agencer",
    "agile",
    "agiter",
    "agrafer",
    "agre╠üable",
    "agrume",
    "aider",
    "aiguille",
    "ailier",
    "aimable",
    "aisance",
    "ajouter",
    "ajuster",
    "alarmer",
    "alchimie",
    "alerte",
    "alge╠Çbre",
    "algue",
    "alie╠üner",
    "aliment",
    "alle╠üger",
    "alliage",
    "allouer",
    "allumer",
    "alourdir",
    "alpaga",
    "altesse",
    "alve╠üole",
    "amateur",
    "ambigu",
    "ambre",
    "ame╠ünager",
    "amertume",
    "amidon",
    "amiral",
    "amorcer",
    "amour",
    "amovible",
    "amphibie",
    "ampleur",
    "amusant",
    "analyse",
    "anaphore",
    "anarchie",
    "anatomie",
    "ancien",
    "ane╠üantir",
    "angle",
    "angoisse",
    "anguleux",
    "animal",
    "annexer",
    "annonce",
    "annuel",
    "anodin",
    "anomalie",
    "anonyme",
    "anormal",
    "antenne",
    "antidote",
    "anxieux",
    "apaiser",
    "ape╠üritif",
    "aplanir",
    "apologie",
    "appareil",
    "appeler",
    "apporter",
    "appuyer",
    "aquarium",
    "aqueduc",
    "arbitre",
    "arbuste",
    "ardeur",
    "ardoise",
    "argent",
    "arlequin",
    "armature",
    "armement",
    "armoire",
    "armure",
    "arpenter",
    "arracher",
    "arriver",
    "arroser",
    "arsenic",
    "arte╠üriel",
    "article",
    "aspect",
    "asphalte",
    "aspirer",
    "assaut",
    "asservir",
    "assiette",
    "associer",
    "assurer",
    "asticot",
    "astre",
    "astuce",
    "atelier",
    "atome",
    "atrium",
    "atroce",
    "attaque",
    "attentif",
    "attirer",
    "attraper",
    "aubaine",
    "auberge",
    "audace",
    "audible",
    "augurer",
    "aurore",
    "automne",
    "autruche",
    "avaler",
    "avancer",
    "avarice",
    "avenir",
    "averse",
    "aveugle",
    "aviateur",
    "avide",
    "avion",
    "aviser",
    "avoine",
    "avouer",
    "avril",
    "axial",
    "axiome",
    "badge",
    "bafouer",
    "bagage",
    "baguette",
    "baignade",
    "balancer",
    "balcon",
    "baleine",
    "balisage",
    "bambin",
    "bancaire",
    "bandage",
    "banlieue",
    "bannie╠Çre",
    "banquier",
    "barbier",
    "baril",
    "baron",
    "barque",
    "barrage",
    "bassin",
    "bastion",
    "bataille",
    "bateau",
    "batterie",
    "baudrier",
    "bavarder",
    "belette",
    "be╠ülier",
    "belote",
    "be╠üne╠üfice",
    "berceau",
    "berger",
    "berline",
    "bermuda",
    "besace",
    "besogne",
    "be╠ütail",
    "beurre",
    "biberon",
    "bicycle",
    "bidule",
    "bijou",
    "bilan",
    "bilingue",
    "billard",
    "binaire",
    "biologie",
    "biopsie",
    "biotype",
    "biscuit",
    "bison",
    "bistouri",
    "bitume",
    "bizarre",
    "blafard",
    "blague",
    "blanchir",
    "blessant",
    "blinder",
    "blond",
    "bloquer",
    "blouson",
    "bobard",
    "bobine",
    "boire",
    "boiser",
    "bolide",
    "bonbon",
    "bondir",
    "bonheur",
    "bonifier",
    "bonus",
    "bordure",
    "borne",
    "botte",
    "boucle",
    "boueux",
    "bougie",
    "boulon",
    "bouquin",
    "bourse",
    "boussole",
    "boutique",
    "boxeur",
    "branche",
    "brasier",
    "brave",
    "brebis",
    "bre╠Çche",
    "breuvage",
    "bricoler",
    "brigade",
    "brillant",
    "brioche",
    "brique",
    "brochure",
    "broder",
    "bronzer",
    "brousse",
    "broyeur",
    "brume",
    "brusque",
    "brutal",
    "bruyant",
    "buffle",
    "buisson",
    "bulletin",
    "bureau",
    "burin",
    "bustier",
    "butiner",
    "butoir",
    "buvable",
    "buvette",
    "cabanon",
    "cabine",
    "cachette",
    "cadeau",
    "cadre",
    "cafe╠üine",
    "caillou",
    "caisson",
    "calculer",
    "calepin",
    "calibre",
    "calmer",
    "calomnie",
    "calvaire",
    "camarade",
    "came╠üra",
    "camion",
    "campagne",
    "canal",
    "caneton",
    "canon",
    "cantine",
    "canular",
    "capable",
    "caporal",
    "caprice",
    "capsule",
    "capter",
    "capuche",
    "carabine",
    "carbone",
    "caresser",
    "caribou",
    "carnage",
    "carotte",
    "carreau",
    "carton",
    "cascade",
    "casier",
    "casque",
    "cassure",
    "causer",
    "caution",
    "cavalier",
    "caverne",
    "caviar",
    "ce╠üdille",
    "ceinture",
    "ce╠üleste",
    "cellule",
    "cendrier",
    "censurer",
    "central",
    "cercle",
    "ce╠üre╠übral",
    "cerise",
    "cerner",
    "cerveau",
    "cesser",
    "chagrin",
    "chaise",
    "chaleur",
    "chambre",
    "chance",
    "chapitre",
    "charbon",
    "chasseur",
    "chaton",
    "chausson",
    "chavirer",
    "chemise",
    "chenille",
    "che╠üquier",
    "chercher",
    "cheval",
    "chien",
    "chiffre",
    "chignon",
    "chime╠Çre",
    "chiot",
    "chlorure",
    "chocolat",
    "choisir",
    "chose",
    "chouette",
    "chrome",
    "chute",
    "cigare",
    "cigogne",
    "cimenter",
    "cine╠üma",
    "cintrer",
    "circuler",
    "cirer",
    "cirque",
    "citerne",
    "citoyen",
    "citron",
    "civil",
    "clairon",
    "clameur",
    "claquer",
    "classe",
    "clavier",
    "client",
    "cligner",
    "climat",
    "clivage",
    "cloche",
    "clonage",
    "cloporte",
    "cobalt",
    "cobra",
    "cocasse",
    "cocotier",
    "coder",
    "codifier",
    "coffre",
    "cogner",
    "cohe╠üsion",
    "coiffer",
    "coincer",
    "cole╠Çre",
    "colibri",
    "colline",
    "colmater",
    "colonel",
    "combat",
    "come╠üdie",
    "commande",
    "compact",
    "concert",
    "conduire",
    "confier",
    "congeler",
    "connoter",
    "consonne",
    "contact",
    "convexe",
    "copain",
    "copie",
    "corail",
    "corbeau",
    "cordage",
    "corniche",
    "corpus",
    "correct",
    "corte╠Çge",
    "cosmique",
    "costume",
    "coton",
    "coude",
    "coupure",
    "courage",
    "couteau",
    "couvrir",
    "coyote",
    "crabe",
    "crainte",
    "cravate",
    "crayon",
    "cre╠üature",
    "cre╠üditer",
    "cre╠ümeux",
    "creuser",
    "crevette",
    "cribler",
    "crier",
    "cristal",
    "crite╠Çre",
    "croire",
    "croquer",
    "crotale",
    "crucial",
    "cruel",
    "crypter",
    "cubique",
    "cueillir",
    "cuille╠Çre",
    "cuisine",
    "cuivre",
    "culminer",
    "cultiver",
    "cumuler",
    "cupide",
    "curatif",
    "curseur",
    "cyanure",
    "cycle",
    "cylindre",
    "cynique",
    "daigner",
    "damier",
    "danger",
    "danseur",
    "dauphin",
    "de╠übattre",
    "de╠übiter",
    "de╠üborder",
    "de╠übrider",
    "de╠übutant",
    "de╠ücaler",
    "de╠ücembre",
    "de╠üchirer",
    "de╠ücider",
    "de╠üclarer",
    "de╠ücorer",
    "de╠ücrire",
    "de╠ücupler",
    "de╠üdale",
    "de╠üductif",
    "de╠üesse",
    "de╠üfensif",
    "de╠üfiler",
    "de╠üfrayer",
    "de╠ügager",
    "de╠ügivrer",
    "de╠üglutir",
    "de╠ügrafer",
    "de╠üjeuner",
    "de╠ülice",
    "de╠üloger",
    "demander",
    "demeurer",
    "de╠ümolir",
    "de╠ünicher",
    "de╠ünouer",
    "dentelle",
    "de╠ünuder",
    "de╠üpart",
    "de╠üpenser",
    "de╠üphaser",
    "de╠üplacer",
    "de╠üposer",
    "de╠üranger",
    "de╠ürober",
    "de╠üsastre",
    "descente",
    "de╠üsert",
    "de╠üsigner",
    "de╠üsobe╠üir",
    "dessiner",
    "destrier",
    "de╠ütacher",
    "de╠ütester",
    "de╠ütourer",
    "de╠ütresse",
    "devancer",
    "devenir",
    "deviner",
    "devoir",
    "diable",
    "dialogue",
    "diamant",
    "dicter",
    "diffe╠ürer",
    "dige╠ürer",
    "digital",
    "digne",
    "diluer",
    "dimanche",
    "diminuer",
    "dioxyde",
    "directif",
    "diriger",
    "discuter",
    "disposer",
    "dissiper",
    "distance",
    "divertir",
    "diviser",
    "docile",
    "docteur",
    "dogme",
    "doigt",
    "domaine",
    "domicile",
    "dompter",
    "donateur",
    "donjon",
    "donner",
    "dopamine",
    "dortoir",
    "dorure",
    "dosage",
    "doseur",
    "dossier",
    "dotation",
    "douanier",
    "double",
    "douceur",
    "douter",
    "doyen",
    "dragon",
    "draper",
    "dresser",
    "dribbler",
    "droiture",
    "duperie",
    "duplexe",
    "durable",
    "durcir",
    "dynastie",
    "e╠üblouir",
    "e╠ücarter",
    "e╠ücharpe",
    "e╠üchelle",
    "e╠üclairer",
    "e╠üclipse",
    "e╠üclore",
    "e╠ücluse",
    "e╠ücole",
    "e╠üconomie",
    "e╠ücorce",
    "e╠ücouter",
    "e╠ücraser",
    "e╠ücre╠ümer",
    "e╠ücrivain",
    "e╠ücrou",
    "e╠ücume",
    "e╠ücureuil",
    "e╠üdifier",
    "e╠üduquer",
    "effacer",
    "effectif",
    "effigie",
    "effort",
    "effrayer",
    "effusion",
    "e╠ügaliser",
    "e╠ügarer",
    "e╠üjecter",
    "e╠ülaborer",
    "e╠ülargir",
    "e╠ülectron",
    "e╠üle╠ügant",
    "e╠üle╠üphant",
    "e╠üle╠Çve",
    "e╠üligible",
    "e╠ülitisme",
    "e╠üloge",
    "e╠ülucider",
    "e╠üluder",
    "emballer",
    "embellir",
    "embryon",
    "e╠ümeraude",
    "e╠ümission",
    "emmener",
    "e╠ümotion",
    "e╠ümouvoir",
    "empereur",
    "employer",
    "emporter",
    "emprise",
    "e╠ümulsion",
    "encadrer",
    "enche╠Çre",
    "enclave",
    "encoche",
    "endiguer",
    "endosser",
    "endroit",
    "enduire",
    "e╠ünergie",
    "enfance",
    "enfermer",
    "enfouir",
    "engager",
    "engin",
    "englober",
    "e╠ünigme",
    "enjamber",
    "enjeu",
    "enlever",
    "ennemi",
    "ennuyeux",
    "enrichir",
    "enrobage",
    "enseigne",
    "entasser",
    "entendre",
    "entier",
    "entourer",
    "entraver",
    "e╠ünume╠ürer",
    "envahir",
    "enviable",
    "envoyer",
    "enzyme",
    "e╠üolien",
    "e╠üpaissir",
    "e╠üpargne",
    "e╠üpatant",
    "e╠üpaule",
    "e╠üpicerie",
    "e╠üpide╠ümie",
    "e╠üpier",
    "e╠üpilogue",
    "e╠üpine",
    "e╠üpisode",
    "e╠üpitaphe",
    "e╠üpoque",
    "e╠üpreuve",
    "e╠üprouver",
    "e╠üpuisant",
    "e╠üquerre",
    "e╠üquipe",
    "e╠üriger",
    "e╠ürosion",
    "erreur",
    "e╠üruption",
    "escalier",
    "espadon",
    "espe╠Çce",
    "espie╠Çgle",
    "espoir",
    "esprit",
    "esquiver",
    "essayer",
    "essence",
    "essieu",
    "essorer",
    "estime",
    "estomac",
    "estrade",
    "e╠ütage╠Çre",
    "e╠ütaler",
    "e╠ütanche",
    "e╠ütatique",
    "e╠üteindre",
    "e╠ütendoir",
    "e╠üternel",
    "e╠üthanol",
    "e╠üthique",
    "ethnie",
    "e╠ütirer",
    "e╠ütoffer",
    "e╠ütoile",
    "e╠ütonnant",
    "e╠ütourdir",
    "e╠ütrange",
    "e╠ütroit",
    "e╠ütude",
    "euphorie",
    "e╠üvaluer",
    "e╠üvasion",
    "e╠üventail",
    "e╠üvidence",
    "e╠üviter",
    "e╠üvolutif",
    "e╠üvoquer",
    "exact",
    "exage╠ürer",
    "exaucer",
    "exceller",
    "excitant",
    "exclusif",
    "excuse",
    "exe╠ücuter",
    "exemple",
    "exercer",
    "exhaler",
    "exhorter",
    "exigence",
    "exiler",
    "exister",
    "exotique",
    "expe╠üdier",
    "explorer",
    "exposer",
    "exprimer",
    "exquis",
    "extensif",
    "extraire",
    "exulter",
    "fable",
    "fabuleux",
    "facette",
    "facile",
    "facture",
    "faiblir",
    "falaise",
    "fameux",
    "famille",
    "farceur",
    "farfelu",
    "farine",
    "farouche",
    "fasciner",
    "fatal",
    "fatigue",
    "faucon",
    "fautif",
    "faveur",
    "favori",
    "fe╠übrile",
    "fe╠üconder",
    "fe╠üde╠ürer",
    "fe╠ülin",
    "femme",
    "fe╠ümur",
    "fendoir",
    "fe╠üodal",
    "fermer",
    "fe╠üroce",
    "ferveur",
    "festival",
    "feuille",
    "feutre",
    "fe╠üvrier",
    "fiasco",
    "ficeler",
    "fictif",
    "fide╠Çle",
    "figure",
    "filature",
    "filetage",
    "filie╠Çre",
    "filleul",
    "filmer",
    "filou",
    "filtrer",
    "financer",
    "finir",
    "fiole",
    "firme",
    "fissure",
    "fixer",
    "flairer",
    "flamme",
    "flasque",
    "flatteur",
    "fle╠üau",
    "fle╠Çche",
    "fleur",
    "flexion",
    "flocon",
    "flore",
    "fluctuer",
    "fluide",
    "fluvial",
    "folie",
    "fonderie",
    "fongible",
    "fontaine",
    "forcer",
    "forgeron",
    "formuler",
    "fortune",
    "fossile",
    "foudre",
    "fouge╠Çre",
    "fouiller",
    "foulure",
    "fourmi",
    "fragile",
    "fraise",
    "franchir",
    "frapper",
    "frayeur",
    "fre╠ügate",
    "freiner",
    "frelon",
    "fre╠ümir",
    "fre╠üne╠üsie",
    "fre╠Çre",
    "friable",
    "friction",
    "frisson",
    "frivole",
    "froid",
    "fromage",
    "frontal",
    "frotter",
    "fruit",
    "fugitif",
    "fuite",
    "fureur",
    "furieux",
    "furtif",
    "fusion",
    "futur",
    "gagner",
    "galaxie",
    "galerie",
    "gambader",
    "garantir",
    "gardien",
    "garnir",
    "garrigue",
    "gazelle",
    "gazon",
    "ge╠üant",
    "ge╠ülatine",
    "ge╠ülule",
    "gendarme",
    "ge╠üne╠üral",
    "ge╠ünie",
    "genou",
    "gentil",
    "ge╠üologie",
    "ge╠üome╠Çtre",
    "ge╠üranium",
    "germe",
    "gestuel",
    "geyser",
    "gibier",
    "gicler",
    "girafe",
    "givre",
    "glace",
    "glaive",
    "glisser",
    "globe",
    "gloire",
    "glorieux",
    "golfeur",
    "gomme",
    "gonfler",
    "gorge",
    "gorille",
    "goudron",
    "gouffre",
    "goulot",
    "goupille",
    "gourmand",
    "goutte",
    "graduel",
    "graffiti",
    "graine",
    "grand",
    "grappin",
    "gratuit",
    "gravir",
    "grenat",
    "griffure",
    "griller",
    "grimper",
    "grogner",
    "gronder",
    "grotte",
    "groupe",
    "gruger",
    "grutier",
    "gruye╠Çre",
    "gue╠üpard",
    "guerrier",
    "guide",
    "guimauve",
    "guitare",
    "gustatif",
    "gymnaste",
    "gyrostat",
    "habitude",
    "hachoir",
    "halte",
    "hameau",
    "hangar",
    "hanneton",
    "haricot",
    "harmonie",
    "harpon",
    "hasard",
    "he╠ülium",
    "he╠ümatome",
    "herbe",
    "he╠ürisson",
    "hermine",
    "he╠üron",
    "he╠üsiter",
    "heureux",
    "hiberner",
    "hibou",
    "hilarant",
    "histoire",
    "hiver",
    "homard",
    "hommage",
    "homoge╠Çne",
    "honneur",
    "honorer",
    "honteux",
    "horde",
    "horizon",
    "horloge",
    "hormone",
    "horrible",
    "houleux",
    "housse",
    "hublot",
    "huileux",
    "humain",
    "humble",
    "humide",
    "humour",
    "hurler",
    "hydromel",
    "hygie╠Çne",
    "hymne",
    "hypnose",
    "idylle",
    "ignorer",
    "iguane",
    "illicite",
    "illusion",
    "image",
    "imbiber",
    "imiter",
    "immense",
    "immobile",
    "immuable",
    "impact",
    "impe╠ürial",
    "implorer",
    "imposer",
    "imprimer",
    "imputer",
    "incarner",
    "incendie",
    "incident",
    "incliner",
    "incolore",
    "indexer",
    "indice",
    "inductif",
    "ine╠üdit",
    "ineptie",
    "inexact",
    "infini",
    "infliger",
    "informer",
    "infusion",
    "inge╠ürer",
    "inhaler",
    "inhiber",
    "injecter",
    "injure",
    "innocent",
    "inoculer",
    "inonder",
    "inscrire",
    "insecte",
    "insigne",
    "insolite",
    "inspirer",
    "instinct",
    "insulter",
    "intact",
    "intense",
    "intime",
    "intrigue",
    "intuitif",
    "inutile",
    "invasion",
    "inventer",
    "inviter",
    "invoquer",
    "ironique",
    "irradier",
    "irre╠üel",
    "irriter",
    "isoler",
    "ivoire",
    "ivresse",
    "jaguar",
    "jaillir",
    "jambe",
    "janvier",
    "jardin",
    "jauger",
    "jaune",
    "javelot",
    "jetable",
    "jeton",
    "jeudi",
    "jeunesse",
    "joindre",
    "joncher",
    "jongler",
    "joueur",
    "jouissif",
    "journal",
    "jovial",
    "joyau",
    "joyeux",
    "jubiler",
    "jugement",
    "junior",
    "jupon",
    "juriste",
    "justice",
    "juteux",
    "juve╠ünile",
    "kayak",
    "kimono",
    "kiosque",
    "label",
    "labial",
    "labourer",
    "lace╠ürer",
    "lactose",
    "lagune",
    "laine",
    "laisser",
    "laitier",
    "lambeau",
    "lamelle",
    "lampe",
    "lanceur",
    "langage",
    "lanterne",
    "lapin",
    "largeur",
    "larme",
    "laurier",
    "lavabo",
    "lavoir",
    "lecture",
    "le╠ügal",
    "le╠üger",
    "le╠ügume",
    "lessive",
    "lettre",
    "levier",
    "lexique",
    "le╠üzard",
    "liasse",
    "libe╠ürer",
    "libre",
    "licence",
    "licorne",
    "lie╠Çge",
    "lie╠Çvre",
    "ligature",
    "ligoter",
    "ligue",
    "limer",
    "limite",
    "limonade",
    "limpide",
    "line╠üaire",
    "lingot",
    "lionceau",
    "liquide",
    "lisie╠Çre",
    "lister",
    "lithium",
    "litige",
    "littoral",
    "livreur",
    "logique",
    "lointain",
    "loisir",
    "lombric",
    "loterie",
    "louer",
    "lourd",
    "loutre",
    "louve",
    "loyal",
    "lubie",
    "lucide",
    "lucratif",
    "lueur",
    "lugubre",
    "luisant",
    "lumie╠Çre",
    "lunaire",
    "lundi",
    "luron",
    "lutter",
    "luxueux",
    "machine",
    "magasin",
    "magenta",
    "magique",
    "maigre",
    "maillon",
    "maintien",
    "mairie",
    "maison",
    "majorer",
    "malaxer",
    "male╠üfice",
    "malheur",
    "malice",
    "mallette",
    "mammouth",
    "mandater",
    "maniable",
    "manquant",
    "manteau",
    "manuel",
    "marathon",
    "marbre",
    "marchand",
    "mardi",
    "maritime",
    "marqueur",
    "marron",
    "marteler",
    "mascotte",
    "massif",
    "mate╠üriel",
    "matie╠Çre",
    "matraque",
    "maudire",
    "maussade",
    "mauve",
    "maximal",
    "me╠üchant",
    "me╠üconnu",
    "me╠üdaille",
    "me╠üdecin",
    "me╠üditer",
    "me╠üduse",
    "meilleur",
    "me╠ülange",
    "me╠ülodie",
    "membre",
    "me╠ümoire",
    "menacer",
    "mener",
    "menhir",
    "mensonge",
    "mentor",
    "mercredi",
    "me╠ürite",
    "merle",
    "messager",
    "mesure",
    "me╠ütal",
    "me╠üte╠üore",
    "me╠üthode",
    "me╠ütier",
    "meuble",
    "miauler",
    "microbe",
    "miette",
    "mignon",
    "migrer",
    "milieu",
    "million",
    "mimique",
    "mince",
    "mine╠üral",
    "minimal",
    "minorer",
    "minute",
    "miracle",
    "miroiter",
    "missile",
    "mixte",
    "mobile",
    "moderne",
    "moelleux",
    "mondial",
    "moniteur",
    "monnaie",
    "monotone",
    "monstre",
    "montagne",
    "monument",
    "moqueur",
    "morceau",
    "morsure",
    "mortier",
    "moteur",
    "motif",
    "mouche",
    "moufle",
    "moulin",
    "mousson",
    "mouton",
    "mouvant",
    "multiple",
    "munition",
    "muraille",
    "mure╠Çne",
    "murmure",
    "muscle",
    "muse╠üum",
    "musicien",
    "mutation",
    "muter",
    "mutuel",
    "myriade",
    "myrtille",
    "myste╠Çre",
    "mythique",
    "nageur",
    "nappe",
    "narquois",
    "narrer",
    "natation",
    "nation",
    "nature",
    "naufrage",
    "nautique",
    "navire",
    "ne╠übuleux",
    "nectar",
    "ne╠üfaste",
    "ne╠ügation",
    "ne╠ügliger",
    "ne╠ügocier",
    "neige",
    "nerveux",
    "nettoyer",
    "neurone",
    "neutron",
    "neveu",
    "niche",
    "nickel",
    "nitrate",
    "niveau",
    "noble",
    "nocif",
    "nocturne",
    "noirceur",
    "noisette",
    "nomade",
    "nombreux",
    "nommer",
    "normatif",
    "notable",
    "notifier",
    "notoire",
    "nourrir",
    "nouveau",
    "novateur",
    "novembre",
    "novice",
    "nuage",
    "nuancer",
    "nuire",
    "nuisible",
    "nume╠üro",
    "nuptial",
    "nuque",
    "nutritif",
    "obe╠üir",
    "objectif",
    "obliger",
    "obscur",
    "observer",
    "obstacle",
    "obtenir",
    "obturer",
    "occasion",
    "occuper",
    "oce╠üan",
    "octobre",
    "octroyer",
    "octupler",
    "oculaire",
    "odeur",
    "odorant",
    "offenser",
    "officier",
    "offrir",
    "ogive",
    "oiseau",
    "oisillon",
    "olfactif",
    "olivier",
    "ombrage",
    "omettre",
    "onctueux",
    "onduler",
    "one╠üreux",
    "onirique",
    "opale",
    "opaque",
    "ope╠ürer",
    "opinion",
    "opportun",
    "opprimer",
    "opter",
    "optique",
    "orageux",
    "orange",
    "orbite",
    "ordonner",
    "oreille",
    "organe",
    "orgueil",
    "orifice",
    "ornement",
    "orque",
    "ortie",
    "osciller",
    "osmose",
    "ossature",
    "otarie",
    "ouragan",
    "ourson",
    "outil",
    "outrager",
    "ouvrage",
    "ovation",
    "oxyde",
    "oxyge╠Çne",
    "ozone",
    "paisible",
    "palace",
    "palmare╠Çs",
    "palourde",
    "palper",
    "panache",
    "panda",
    "pangolin",
    "paniquer",
    "panneau",
    "panorama",
    "pantalon",
    "papaye",
    "papier",
    "papoter",
    "papyrus",
    "paradoxe",
    "parcelle",
    "paresse",
    "parfumer",
    "parler",
    "parole",
    "parrain",
    "parsemer",
    "partager",
    "parure",
    "parvenir",
    "passion",
    "paste╠Çque",
    "paternel",
    "patience",
    "patron",
    "pavillon",
    "pavoiser",
    "payer",
    "paysage",
    "peigne",
    "peintre",
    "pelage",
    "pe╠ülican",
    "pelle",
    "pelouse",
    "peluche",
    "pendule",
    "pe╠üne╠ütrer",
    "pe╠ünible",
    "pensif",
    "pe╠ünurie",
    "pe╠üpite",
    "pe╠üplum",
    "perdrix",
    "perforer",
    "pe╠üriode",
    "permuter",
    "perplexe",
    "persil",
    "perte",
    "peser",
    "pe╠ütale",
    "petit",
    "pe╠ütrir",
    "peuple",
    "pharaon",
    "phobie",
    "phoque",
    "photon",
    "phrase",
    "physique",
    "piano",
    "pictural",
    "pie╠Çce",
    "pierre",
    "pieuvre",
    "pilote",
    "pinceau",
    "pipette",
    "piquer",
    "pirogue",
    "piscine",
    "piston",
    "pivoter",
    "pixel",
    "pizza",
    "placard",
    "plafond",
    "plaisir",
    "planer",
    "plaque",
    "plastron",
    "plateau",
    "pleurer",
    "plexus",
    "pliage",
    "plomb",
    "plonger",
    "pluie",
    "plumage",
    "pochette",
    "poe╠üsie",
    "poe╠Çte",
    "pointe",
    "poirier",
    "poisson",
    "poivre",
    "polaire",
    "policier",
    "pollen",
    "polygone",
    "pommade",
    "pompier",
    "ponctuel",
    "ponde╠ürer",
    "poney",
    "portique",
    "position",
    "posse╠üder",
    "posture",
    "potager",
    "poteau",
    "potion",
    "pouce",
    "poulain",
    "poumon",
    "pourpre",
    "poussin",
    "pouvoir",
    "prairie",
    "pratique",
    "pre╠ücieux",
    "pre╠üdire",
    "pre╠üfixe",
    "pre╠ülude",
    "pre╠ünom",
    "pre╠üsence",
    "pre╠ütexte",
    "pre╠üvoir",
    "primitif",
    "prince",
    "prison",
    "priver",
    "proble╠Çme",
    "proce╠üder",
    "prodige",
    "profond",
    "progre╠Çs",
    "proie",
    "projeter",
    "prologue",
    "promener",
    "propre",
    "prospe╠Çre",
    "prote╠üger",
    "prouesse",
    "proverbe",
    "prudence",
    "pruneau",
    "psychose",
    "public",
    "puceron",
    "puiser",
    "pulpe",
    "pulsar",
    "punaise",
    "punitif",
    "pupitre",
    "purifier",
    "puzzle",
    "pyramide",
    "quasar",
    "querelle",
    "question",
    "quie╠ütude",
    "quitter",
    "quotient",
    "racine",
    "raconter",
    "radieux",
    "ragondin",
    "raideur",
    "raisin",
    "ralentir",
    "rallonge",
    "ramasser",
    "rapide",
    "rasage",
    "ratisser",
    "ravager",
    "ravin",
    "rayonner",
    "re╠üactif",
    "re╠üagir",
    "re╠üaliser",
    "re╠üanimer",
    "recevoir",
    "re╠üciter",
    "re╠üclamer",
    "re╠ücolter",
    "recruter",
    "reculer",
    "recycler",
    "re╠üdiger",
    "redouter",
    "refaire",
    "re╠üflexe",
    "re╠üformer",
    "refrain",
    "refuge",
    "re╠ügalien",
    "re╠ügion",
    "re╠üglage",
    "re╠ügulier",
    "re╠üite╠ürer",
    "rejeter",
    "rejouer",
    "relatif",
    "relever",
    "relief",
    "remarque",
    "reme╠Çde",
    "remise",
    "remonter",
    "remplir",
    "remuer",
    "renard",
    "renfort",
    "renifler",
    "renoncer",
    "rentrer",
    "renvoi",
    "replier",
    "reporter",
    "reprise",
    "reptile",
    "requin",
    "re╠üserve",
    "re╠üsineux",
    "re╠üsoudre",
    "respect",
    "rester",
    "re╠üsultat",
    "re╠ütablir",
    "retenir",
    "re╠üticule",
    "retomber",
    "retracer",
    "re╠üunion",
    "re╠üussir",
    "revanche",
    "revivre",
    "re╠üvolte",
    "re╠üvulsif",
    "richesse",
    "rideau",
    "rieur",
    "rigide",
    "rigoler",
    "rincer",
    "riposter",
    "risible",
    "risque",
    "rituel",
    "rival",
    "rivie╠Çre",
    "rocheux",
    "romance",
    "rompre",
    "ronce",
    "rondin",
    "roseau",
    "rosier",
    "rotatif",
    "rotor",
    "rotule",
    "rouge",
    "rouille",
    "rouleau",
    "routine",
    "royaume",
    "ruban",
    "rubis",
    "ruche",
    "ruelle",
    "rugueux",
    "ruiner",
    "ruisseau",
    "ruser",
    "rustique",
    "rythme",
    "sabler",
    "saboter",
    "sabre",
    "sacoche",
    "safari",
    "sagesse",
    "saisir",
    "salade",
    "salive",
    "salon",
    "saluer",
    "samedi",
    "sanction",
    "sanglier",
    "sarcasme",
    "sardine",
    "saturer",
    "saugrenu",
    "saumon",
    "sauter",
    "sauvage",
    "savant",
    "savonner",
    "scalpel",
    "scandale",
    "sce╠üle╠ürat",
    "sce╠ünario",
    "sceptre",
    "sche╠üma",
    "science",
    "scinder",
    "score",
    "scrutin",
    "sculpter",
    "se╠üance",
    "se╠ücable",
    "se╠ücher",
    "secouer",
    "se╠ücre╠üter",
    "se╠üdatif",
    "se╠üduire",
    "seigneur",
    "se╠üjour",
    "se╠ülectif",
    "semaine",
    "sembler",
    "semence",
    "se╠üminal",
    "se╠ünateur",
    "sensible",
    "sentence",
    "se╠üparer",
    "se╠üquence",
    "serein",
    "sergent",
    "se╠ürieux",
    "serrure",
    "se╠ürum",
    "service",
    "se╠üsame",
    "se╠üvir",
    "sevrage",
    "sextuple",
    "side╠üral",
    "sie╠Çcle",
    "sie╠üger",
    "siffler",
    "sigle",
    "signal",
    "silence",
    "silicium",
    "simple",
    "since╠Çre",
    "sinistre",
    "siphon",
    "sirop",
    "sismique",
    "situer",
    "skier",
    "social",
    "socle",
    "sodium",
    "soigneux",
    "soldat",
    "soleil",
    "solitude",
    "soluble",
    "sombre",
    "sommeil",
    "somnoler",
    "sonde",
    "songeur",
    "sonnette",
    "sonore",
    "sorcier",
    "sortir",
    "sosie",
    "sottise",
    "soucieux",
    "soudure",
    "souffle",
    "soulever",
    "soupape",
    "source",
    "soutirer",
    "souvenir",
    "spacieux",
    "spatial",
    "spe╠ücial",
    "sphe╠Çre",
    "spiral",
    "stable",
    "station",
    "sternum",
    "stimulus",
    "stipuler",
    "strict",
    "studieux",
    "stupeur",
    "styliste",
    "sublime",
    "substrat",
    "subtil",
    "subvenir",
    "succe╠Çs",
    "sucre",
    "suffixe",
    "sugge╠ürer",
    "suiveur",
    "sulfate",
    "superbe",
    "supplier",
    "surface",
    "suricate",
    "surmener",
    "surprise",
    "sursaut",
    "survie",
    "suspect",
    "syllabe",
    "symbole",
    "syme╠ütrie",
    "synapse",
    "syntaxe",
    "syste╠Çme",
    "tabac",
    "tablier",
    "tactile",
    "tailler",
    "talent",
    "talisman",
    "talonner",
    "tambour",
    "tamiser",
    "tangible",
    "tapis",
    "taquiner",
    "tarder",
    "tarif",
    "tartine",
    "tasse",
    "tatami",
    "tatouage",
    "taupe",
    "taureau",
    "taxer",
    "te╠ümoin",
    "temporel",
    "tenaille",
    "tendre",
    "teneur",
    "tenir",
    "tension",
    "terminer",
    "terne",
    "terrible",
    "te╠ütine",
    "texte",
    "the╠Çme",
    "the╠üorie",
    "the╠ürapie",
    "thorax",
    "tibia",
    "tie╠Çde",
    "timide",
    "tirelire",
    "tiroir",
    "tissu",
    "titane",
    "titre",
    "tituber",
    "toboggan",
    "tole╠ürant",
    "tomate",
    "tonique",
    "tonneau",
    "toponyme",
    "torche",
    "tordre",
    "tornade",
    "torpille",
    "torrent",
    "torse",
    "tortue",
    "totem",
    "toucher",
    "tournage",
    "tousser",
    "toxine",
    "traction",
    "trafic",
    "tragique",
    "trahir",
    "train",
    "trancher",
    "travail",
    "tre╠Çfle",
    "tremper",
    "tre╠üsor",
    "treuil",
    "triage",
    "tribunal",
    "tricoter",
    "trilogie",
    "triomphe",
    "tripler",
    "triturer",
    "trivial",
    "trombone",
    "tronc",
    "tropical",
    "troupeau",
    "tuile",
    "tulipe",
    "tumulte",
    "tunnel",
    "turbine",
    "tuteur",
    "tutoyer",
    "tuyau",
    "tympan",
    "typhon",
    "typique",
    "tyran",
    "ubuesque",
    "ultime",
    "ultrason",
    "unanime",
    "unifier",
    "union",
    "unique",
    "unitaire",
    "univers",
    "uranium",
    "urbain",
    "urticant",
    "usage",
    "usine",
    "usuel",
    "usure",
    "utile",
    "utopie",
    "vacarme",
    "vaccin",
    "vagabond",
    "vague",
    "vaillant",
    "vaincre",
    "vaisseau",
    "valable",
    "valise",
    "vallon",
    "valve",
    "vampire",
    "vanille",
    "vapeur",
    "varier",
    "vaseux",
    "vassal",
    "vaste",
    "vecteur",
    "vedette",
    "ve╠üge╠ütal",
    "ve╠ühicule",
    "veinard",
    "ve╠üloce",
    "vendredi",
    "ve╠üne╠ürer",
    "venger",
    "venimeux",
    "ventouse",
    "verdure",
    "ve╠ürin",
    "vernir",
    "verrou",
    "verser",
    "vertu",
    "veston",
    "ve╠üte╠üran",
    "ve╠ütuste",
    "vexant",
    "vexer",
    "viaduc",
    "viande",
    "victoire",
    "vidange",
    "vide╠üo",
    "vignette",
    "vigueur",
    "vilain",
    "village",
    "vinaigre",
    "violon",
    "vipe╠Çre",
    "virement",
    "virtuose",
    "virus",
    "visage",
    "viseur",
    "vision",
    "visqueux",
    "visuel",
    "vital",
    "vitesse",
    "viticole",
    "vitrine",
    "vivace",
    "vivipare",
    "vocation",
    "voguer",
    "voile",
    "voisin",
    "voiture",
    "volaille",
    "volcan",
    "voltiger",
    "volume",
    "vorace",
    "vortex",
    "voter",
    "vouloir",
    "voyage",
    "voyelle",
    "wagon",
    "xe╠ünon",
    "yacht",
    "ze╠Çbre",
    "ze╠ünith",
    "zeste",
    "zoologie"
]

},{}],33:[function(require,module,exports){
module.exports=[
    "abaco",
    "abbaglio",
    "abbinato",
    "abete",
    "abisso",
    "abolire",
    "abrasivo",
    "abrogato",
    "accadere",
    "accenno",
    "accusato",
    "acetone",
    "achille",
    "acido",
    "acqua",
    "acre",
    "acrilico",
    "acrobata",
    "acuto",
    "adagio",
    "addebito",
    "addome",
    "adeguato",
    "aderire",
    "adipe",
    "adottare",
    "adulare",
    "affabile",
    "affetto",
    "affisso",
    "affranto",
    "aforisma",
    "afoso",
    "africano",
    "agave",
    "agente",
    "agevole",
    "aggancio",
    "agire",
    "agitare",
    "agonismo",
    "agricolo",
    "agrumeto",
    "aguzzo",
    "alabarda",
    "alato",
    "albatro",
    "alberato",
    "albo",
    "albume",
    "alce",
    "alcolico",
    "alettone",
    "alfa",
    "algebra",
    "aliante",
    "alibi",
    "alimento",
    "allagato",
    "allegro",
    "allievo",
    "allodola",
    "allusivo",
    "almeno",
    "alogeno",
    "alpaca",
    "alpestre",
    "altalena",
    "alterno",
    "alticcio",
    "altrove",
    "alunno",
    "alveolo",
    "alzare",
    "amalgama",
    "amanita",
    "amarena",
    "ambito",
    "ambrato",
    "ameba",
    "america",
    "ametista",
    "amico",
    "ammasso",
    "ammenda",
    "ammirare",
    "ammonito",
    "amore",
    "ampio",
    "ampliare",
    "amuleto",
    "anacardo",
    "anagrafe",
    "analista",
    "anarchia",
    "anatra",
    "anca",
    "ancella",
    "ancora",
    "andare",
    "andrea",
    "anello",
    "angelo",
    "angolare",
    "angusto",
    "anima",
    "annegare",
    "annidato",
    "anno",
    "annuncio",
    "anonimo",
    "anticipo",
    "anzi",
    "apatico",
    "apertura",
    "apode",
    "apparire",
    "appetito",
    "appoggio",
    "approdo",
    "appunto",
    "aprile",
    "arabica",
    "arachide",
    "aragosta",
    "araldica",
    "arancio",
    "aratura",
    "arazzo",
    "arbitro",
    "archivio",
    "ardito",
    "arenile",
    "argento",
    "argine",
    "arguto",
    "aria",
    "armonia",
    "arnese",
    "arredato",
    "arringa",
    "arrosto",
    "arsenico",
    "arso",
    "artefice",
    "arzillo",
    "asciutto",
    "ascolto",
    "asepsi",
    "asettico",
    "asfalto",
    "asino",
    "asola",
    "aspirato",
    "aspro",
    "assaggio",
    "asse",
    "assoluto",
    "assurdo",
    "asta",
    "astenuto",
    "astice",
    "astratto",
    "atavico",
    "ateismo",
    "atomico",
    "atono",
    "attesa",
    "attivare",
    "attorno",
    "attrito",
    "attuale",
    "ausilio",
    "austria",
    "autista",
    "autonomo",
    "autunno",
    "avanzato",
    "avere",
    "avvenire",
    "avviso",
    "avvolgere",
    "azione",
    "azoto",
    "azzimo",
    "azzurro",
    "babele",
    "baccano",
    "bacino",
    "baco",
    "badessa",
    "badilata",
    "bagnato",
    "baita",
    "balcone",
    "baldo",
    "balena",
    "ballata",
    "balzano",
    "bambino",
    "bandire",
    "baraonda",
    "barbaro",
    "barca",
    "baritono",
    "barlume",
    "barocco",
    "basilico",
    "basso",
    "batosta",
    "battuto",
    "baule",
    "bava",
    "bavosa",
    "becco",
    "beffa",
    "belgio",
    "belva",
    "benda",
    "benevole",
    "benigno",
    "benzina",
    "bere",
    "berlina",
    "beta",
    "bibita",
    "bici",
    "bidone",
    "bifido",
    "biga",
    "bilancia",
    "bimbo",
    "binocolo",
    "biologo",
    "bipede",
    "bipolare",
    "birbante",
    "birra",
    "biscotto",
    "bisesto",
    "bisnonno",
    "bisonte",
    "bisturi",
    "bizzarro",
    "blando",
    "blatta",
    "bollito",
    "bonifico",
    "bordo",
    "bosco",
    "botanico",
    "bottino",
    "bozzolo",
    "braccio",
    "bradipo",
    "brama",
    "branca",
    "bravura",
    "bretella",
    "brevetto",
    "brezza",
    "briglia",
    "brillante",
    "brindare",
    "broccolo",
    "brodo",
    "bronzina",
    "brullo",
    "bruno",
    "bubbone",
    "buca",
    "budino",
    "buffone",
    "buio",
    "bulbo",
    "buono",
    "burlone",
    "burrasca",
    "bussola",
    "busta",
    "cadetto",
    "caduco",
    "calamaro",
    "calcolo",
    "calesse",
    "calibro",
    "calmo",
    "caloria",
    "cambusa",
    "camerata",
    "camicia",
    "cammino",
    "camola",
    "campale",
    "canapa",
    "candela",
    "cane",
    "canino",
    "canotto",
    "cantina",
    "capace",
    "capello",
    "capitolo",
    "capogiro",
    "cappero",
    "capra",
    "capsula",
    "carapace",
    "carcassa",
    "cardo",
    "carisma",
    "carovana",
    "carretto",
    "cartolina",
    "casaccio",
    "cascata",
    "caserma",
    "caso",
    "cassone",
    "castello",
    "casuale",
    "catasta",
    "catena",
    "catrame",
    "cauto",
    "cavillo",
    "cedibile",
    "cedrata",
    "cefalo",
    "celebre",
    "cellulare",
    "cena",
    "cenone",
    "centesimo",
    "ceramica",
    "cercare",
    "certo",
    "cerume",
    "cervello",
    "cesoia",
    "cespo",
    "ceto",
    "chela",
    "chiaro",
    "chicca",
    "chiedere",
    "chimera",
    "china",
    "chirurgo",
    "chitarra",
    "ciao",
    "ciclismo",
    "cifrare",
    "cigno",
    "cilindro",
    "ciottolo",
    "circa",
    "cirrosi",
    "citrico",
    "cittadino",
    "ciuffo",
    "civetta",
    "civile",
    "classico",
    "clinica",
    "cloro",
    "cocco",
    "codardo",
    "codice",
    "coerente",
    "cognome",
    "collare",
    "colmato",
    "colore",
    "colposo",
    "coltivato",
    "colza",
    "coma",
    "cometa",
    "commando",
    "comodo",
    "computer",
    "comune",
    "conciso",
    "condurre",
    "conferma",
    "congelare",
    "coniuge",
    "connesso",
    "conoscere",
    "consumo",
    "continuo",
    "convegno",
    "coperto",
    "copione",
    "coppia",
    "copricapo",
    "corazza",
    "cordata",
    "coricato",
    "cornice",
    "corolla",
    "corpo",
    "corredo",
    "corsia",
    "cortese",
    "cosmico",
    "costante",
    "cottura",
    "covato",
    "cratere",
    "cravatta",
    "creato",
    "credere",
    "cremoso",
    "crescita",
    "creta",
    "criceto",
    "crinale",
    "crisi",
    "critico",
    "croce",
    "cronaca",
    "crostata",
    "cruciale",
    "crusca",
    "cucire",
    "cuculo",
    "cugino",
    "cullato",
    "cupola",
    "curatore",
    "cursore",
    "curvo",
    "cuscino",
    "custode",
    "dado",
    "daino",
    "dalmata",
    "damerino",
    "daniela",
    "dannoso",
    "danzare",
    "datato",
    "davanti",
    "davvero",
    "debutto",
    "decennio",
    "deciso",
    "declino",
    "decollo",
    "decreto",
    "dedicato",
    "definito",
    "deforme",
    "degno",
    "delegare",
    "delfino",
    "delirio",
    "delta",
    "demenza",
    "denotato",
    "dentro",
    "deposito",
    "derapata",
    "derivare",
    "deroga",
    "descritto",
    "deserto",
    "desiderio",
    "desumere",
    "detersivo",
    "devoto",
    "diametro",
    "dicembre",
    "diedro",
    "difeso",
    "diffuso",
    "digerire",
    "digitale",
    "diluvio",
    "dinamico",
    "dinnanzi",
    "dipinto",
    "diploma",
    "dipolo",
    "diradare",
    "dire",
    "dirotto",
    "dirupo",
    "disagio",
    "discreto",
    "disfare",
    "disgelo",
    "disposto",
    "distanza",
    "disumano",
    "dito",
    "divano",
    "divelto",
    "dividere",
    "divorato",
    "doblone",
    "docente",
    "doganale",
    "dogma",
    "dolce",
    "domato",
    "domenica",
    "dominare",
    "dondolo",
    "dono",
    "dormire",
    "dote",
    "dottore",
    "dovuto",
    "dozzina",
    "drago",
    "druido",
    "dubbio",
    "dubitare",
    "ducale",
    "duna",
    "duomo",
    "duplice",
    "duraturo",
    "ebano",
    "eccesso",
    "ecco",
    "eclissi",
    "economia",
    "edera",
    "edicola",
    "edile",
    "editoria",
    "educare",
    "egemonia",
    "egli",
    "egoismo",
    "egregio",
    "elaborato",
    "elargire",
    "elegante",
    "elencato",
    "eletto",
    "elevare",
    "elfico",
    "elica",
    "elmo",
    "elsa",
    "eluso",
    "emanato",
    "emblema",
    "emesso",
    "emiro",
    "emotivo",
    "emozione",
    "empirico",
    "emulo",
    "endemico",
    "enduro",
    "energia",
    "enfasi",
    "enoteca",
    "entrare",
    "enzima",
    "epatite",
    "epilogo",
    "episodio",
    "epocale",
    "eppure",
    "equatore",
    "erario",
    "erba",
    "erboso",
    "erede",
    "eremita",
    "erigere",
    "ermetico",
    "eroe",
    "erosivo",
    "errante",
    "esagono",
    "esame",
    "esanime",
    "esaudire",
    "esca",
    "esempio",
    "esercito",
    "esibito",
    "esigente",
    "esistere",
    "esito",
    "esofago",
    "esortato",
    "esoso",
    "espanso",
    "espresso",
    "essenza",
    "esso",
    "esteso",
    "estimare",
    "estonia",
    "estroso",
    "esultare",
    "etilico",
    "etnico",
    "etrusco",
    "etto",
    "euclideo",
    "europa",
    "evaso",
    "evidenza",
    "evitato",
    "evoluto",
    "evviva",
    "fabbrica",
    "faccenda",
    "fachiro",
    "falco",
    "famiglia",
    "fanale",
    "fanfara",
    "fango",
    "fantasma",
    "fare",
    "farfalla",
    "farinoso",
    "farmaco",
    "fascia",
    "fastoso",
    "fasullo",
    "faticare",
    "fato",
    "favoloso",
    "febbre",
    "fecola",
    "fede",
    "fegato",
    "felpa",
    "feltro",
    "femmina",
    "fendere",
    "fenomeno",
    "fermento",
    "ferro",
    "fertile",
    "fessura",
    "festivo",
    "fetta",
    "feudo",
    "fiaba",
    "fiducia",
    "fifa",
    "figurato",
    "filo",
    "finanza",
    "finestra",
    "finire",
    "fiore",
    "fiscale",
    "fisico",
    "fiume",
    "flacone",
    "flamenco",
    "flebo",
    "flemma",
    "florido",
    "fluente",
    "fluoro",
    "fobico",
    "focaccia",
    "focoso",
    "foderato",
    "foglio",
    "folata",
    "folclore",
    "folgore",
    "fondente",
    "fonetico",
    "fonia",
    "fontana",
    "forbito",
    "forchetta",
    "foresta",
    "formica",
    "fornaio",
    "foro",
    "fortezza",
    "forzare",
    "fosfato",
    "fosso",
    "fracasso",
    "frana",
    "frassino",
    "fratello",
    "freccetta",
    "frenata",
    "fresco",
    "frigo",
    "frollino",
    "fronde",
    "frugale",
    "frutta",
    "fucilata",
    "fucsia",
    "fuggente",
    "fulmine",
    "fulvo",
    "fumante",
    "fumetto",
    "fumoso",
    "fune",
    "funzione",
    "fuoco",
    "furbo",
    "furgone",
    "furore",
    "fuso",
    "futile",
    "gabbiano",
    "gaffe",
    "galateo",
    "gallina",
    "galoppo",
    "gambero",
    "gamma",
    "garanzia",
    "garbo",
    "garofano",
    "garzone",
    "gasdotto",
    "gasolio",
    "gastrico",
    "gatto",
    "gaudio",
    "gazebo",
    "gazzella",
    "geco",
    "gelatina",
    "gelso",
    "gemello",
    "gemmato",
    "gene",
    "genitore",
    "gennaio",
    "genotipo",
    "gergo",
    "ghepardo",
    "ghiaccio",
    "ghisa",
    "giallo",
    "gilda",
    "ginepro",
    "giocare",
    "gioiello",
    "giorno",
    "giove",
    "girato",
    "girone",
    "gittata",
    "giudizio",
    "giurato",
    "giusto",
    "globulo",
    "glutine",
    "gnomo",
    "gobba",
    "golf",
    "gomito",
    "gommone",
    "gonfio",
    "gonna",
    "governo",
    "gracile",
    "grado",
    "grafico",
    "grammo",
    "grande",
    "grattare",
    "gravoso",
    "grazia",
    "greca",
    "gregge",
    "grifone",
    "grigio",
    "grinza",
    "grotta",
    "gruppo",
    "guadagno",
    "guaio",
    "guanto",
    "guardare",
    "gufo",
    "guidare",
    "ibernato",
    "icona",
    "identico",
    "idillio",
    "idolo",
    "idra",
    "idrico",
    "idrogeno",
    "igiene",
    "ignaro",
    "ignorato",
    "ilare",
    "illeso",
    "illogico",
    "illudere",
    "imballo",
    "imbevuto",
    "imbocco",
    "imbuto",
    "immane",
    "immerso",
    "immolato",
    "impacco",
    "impeto",
    "impiego",
    "importo",
    "impronta",
    "inalare",
    "inarcare",
    "inattivo",
    "incanto",
    "incendio",
    "inchino",
    "incisivo",
    "incluso",
    "incontro",
    "incrocio",
    "incubo",
    "indagine",
    "india",
    "indole",
    "inedito",
    "infatti",
    "infilare",
    "inflitto",
    "ingaggio",
    "ingegno",
    "inglese",
    "ingordo",
    "ingrosso",
    "innesco",
    "inodore",
    "inoltrare",
    "inondato",
    "insano",
    "insetto",
    "insieme",
    "insonnia",
    "insulina",
    "intasato",
    "intero",
    "intonaco",
    "intuito",
    "inumidire",
    "invalido",
    "invece",
    "invito",
    "iperbole",
    "ipnotico",
    "ipotesi",
    "ippica",
    "iride",
    "irlanda",
    "ironico",
    "irrigato",
    "irrorare",
    "isolato",
    "isotopo",
    "isterico",
    "istituto",
    "istrice",
    "italia",
    "iterare",
    "labbro",
    "labirinto",
    "lacca",
    "lacerato",
    "lacrima",
    "lacuna",
    "laddove",
    "lago",
    "lampo",
    "lancetta",
    "lanterna",
    "lardoso",
    "larga",
    "laringe",
    "lastra",
    "latenza",
    "latino",
    "lattuga",
    "lavagna",
    "lavoro",
    "legale",
    "leggero",
    "lembo",
    "lentezza",
    "lenza",
    "leone",
    "lepre",
    "lesivo",
    "lessato",
    "lesto",
    "letterale",
    "leva",
    "levigato",
    "libero",
    "lido",
    "lievito",
    "lilla",
    "limatura",
    "limitare",
    "limpido",
    "lineare",
    "lingua",
    "liquido",
    "lira",
    "lirica",
    "lisca",
    "lite",
    "litigio",
    "livrea",
    "locanda",
    "lode",
    "logica",
    "lombare",
    "londra",
    "longevo",
    "loquace",
    "lorenzo",
    "loto",
    "lotteria",
    "luce",
    "lucidato",
    "lumaca",
    "luminoso",
    "lungo",
    "lupo",
    "luppolo",
    "lusinga",
    "lusso",
    "lutto",
    "macabro",
    "macchina",
    "macero",
    "macinato",
    "madama",
    "magico",
    "maglia",
    "magnete",
    "magro",
    "maiolica",
    "malafede",
    "malgrado",
    "malinteso",
    "malsano",
    "malto",
    "malumore",
    "mana",
    "mancia",
    "mandorla",
    "mangiare",
    "manifesto",
    "mannaro",
    "manovra",
    "mansarda",
    "mantide",
    "manubrio",
    "mappa",
    "maratona",
    "marcire",
    "maretta",
    "marmo",
    "marsupio",
    "maschera",
    "massaia",
    "mastino",
    "materasso",
    "matricola",
    "mattone",
    "maturo",
    "mazurca",
    "meandro",
    "meccanico",
    "mecenate",
    "medesimo",
    "meditare",
    "mega",
    "melassa",
    "melis",
    "melodia",
    "meninge",
    "meno",
    "mensola",
    "mercurio",
    "merenda",
    "merlo",
    "meschino",
    "mese",
    "messere",
    "mestolo",
    "metallo",
    "metodo",
    "mettere",
    "miagolare",
    "mica",
    "micelio",
    "michele",
    "microbo",
    "midollo",
    "miele",
    "migliore",
    "milano",
    "milite",
    "mimosa",
    "minerale",
    "mini",
    "minore",
    "mirino",
    "mirtillo",
    "miscela",
    "missiva",
    "misto",
    "misurare",
    "mitezza",
    "mitigare",
    "mitra",
    "mittente",
    "mnemonico",
    "modello",
    "modifica",
    "modulo",
    "mogano",
    "mogio",
    "mole",
    "molosso",
    "monastero",
    "monco",
    "mondina",
    "monetario",
    "monile",
    "monotono",
    "monsone",
    "montato",
    "monviso",
    "mora",
    "mordere",
    "morsicato",
    "mostro",
    "motivato",
    "motosega",
    "motto",
    "movenza",
    "movimento",
    "mozzo",
    "mucca",
    "mucosa",
    "muffa",
    "mughetto",
    "mugnaio",
    "mulatto",
    "mulinello",
    "multiplo",
    "mummia",
    "munto",
    "muovere",
    "murale",
    "musa",
    "muscolo",
    "musica",
    "mutevole",
    "muto",
    "nababbo",
    "nafta",
    "nanometro",
    "narciso",
    "narice",
    "narrato",
    "nascere",
    "nastrare",
    "naturale",
    "nautica",
    "naviglio",
    "nebulosa",
    "necrosi",
    "negativo",
    "negozio",
    "nemmeno",
    "neofita",
    "neretto",
    "nervo",
    "nessuno",
    "nettuno",
    "neutrale",
    "neve",
    "nevrotico",
    "nicchia",
    "ninfa",
    "nitido",
    "nobile",
    "nocivo",
    "nodo",
    "nome",
    "nomina",
    "nordico",
    "normale",
    "norvegese",
    "nostrano",
    "notare",
    "notizia",
    "notturno",
    "novella",
    "nucleo",
    "nulla",
    "numero",
    "nuovo",
    "nutrire",
    "nuvola",
    "nuziale",
    "oasi",
    "obbedire",
    "obbligo",
    "obelisco",
    "oblio",
    "obolo",
    "obsoleto",
    "occasione",
    "occhio",
    "occidente",
    "occorrere",
    "occultare",
    "ocra",
    "oculato",
    "odierno",
    "odorare",
    "offerta",
    "offrire",
    "offuscato",
    "oggetto",
    "oggi",
    "ognuno",
    "olandese",
    "olfatto",
    "oliato",
    "oliva",
    "ologramma",
    "oltre",
    "omaggio",
    "ombelico",
    "ombra",
    "omega",
    "omissione",
    "ondoso",
    "onere",
    "onice",
    "onnivoro",
    "onorevole",
    "onta",
    "operato",
    "opinione",
    "opposto",
    "oracolo",
    "orafo",
    "ordine",
    "orecchino",
    "orefice",
    "orfano",
    "organico",
    "origine",
    "orizzonte",
    "orma",
    "ormeggio",
    "ornativo",
    "orologio",
    "orrendo",
    "orribile",
    "ortensia",
    "ortica",
    "orzata",
    "orzo",
    "osare",
    "oscurare",
    "osmosi",
    "ospedale",
    "ospite",
    "ossa",
    "ossidare",
    "ostacolo",
    "oste",
    "otite",
    "otre",
    "ottagono",
    "ottimo",
    "ottobre",
    "ovale",
    "ovest",
    "ovino",
    "oviparo",
    "ovocito",
    "ovunque",
    "ovviare",
    "ozio",
    "pacchetto",
    "pace",
    "pacifico",
    "padella",
    "padrone",
    "paese",
    "paga",
    "pagina",
    "palazzina",
    "palesare",
    "pallido",
    "palo",
    "palude",
    "pandoro",
    "pannello",
    "paolo",
    "paonazzo",
    "paprica",
    "parabola",
    "parcella",
    "parere",
    "pargolo",
    "pari",
    "parlato",
    "parola",
    "partire",
    "parvenza",
    "parziale",
    "passivo",
    "pasticca",
    "patacca",
    "patologia",
    "pattume",
    "pavone",
    "peccato",
    "pedalare",
    "pedonale",
    "peggio",
    "peloso",
    "penare",
    "pendice",
    "penisola",
    "pennuto",
    "penombra",
    "pensare",
    "pentola",
    "pepe",
    "pepita",
    "perbene",
    "percorso",
    "perdonato",
    "perforare",
    "pergamena",
    "periodo",
    "permesso",
    "perno",
    "perplesso",
    "persuaso",
    "pertugio",
    "pervaso",
    "pesatore",
    "pesista",
    "peso",
    "pestifero",
    "petalo",
    "pettine",
    "petulante",
    "pezzo",
    "piacere",
    "pianta",
    "piattino",
    "piccino",
    "picozza",
    "piega",
    "pietra",
    "piffero",
    "pigiama",
    "pigolio",
    "pigro",
    "pila",
    "pilifero",
    "pillola",
    "pilota",
    "pimpante",
    "pineta",
    "pinna",
    "pinolo",
    "pioggia",
    "piombo",
    "piramide",
    "piretico",
    "pirite",
    "pirolisi",
    "pitone",
    "pizzico",
    "placebo",
    "planare",
    "plasma",
    "platano",
    "plenario",
    "pochezza",
    "poderoso",
    "podismo",
    "poesia",
    "poggiare",
    "polenta",
    "poligono",
    "pollice",
    "polmonite",
    "polpetta",
    "polso",
    "poltrona",
    "polvere",
    "pomice",
    "pomodoro",
    "ponte",
    "popoloso",
    "porfido",
    "poroso",
    "porpora",
    "porre",
    "portata",
    "posa",
    "positivo",
    "possesso",
    "postulato",
    "potassio",
    "potere",
    "pranzo",
    "prassi",
    "pratica",
    "precluso",
    "predica",
    "prefisso",
    "pregiato",
    "prelievo",
    "premere",
    "prenotare",
    "preparato",
    "presenza",
    "pretesto",
    "prevalso",
    "prima",
    "principe",
    "privato",
    "problema",
    "procura",
    "produrre",
    "profumo",
    "progetto",
    "prolunga",
    "promessa",
    "pronome",
    "proposta",
    "proroga",
    "proteso",
    "prova",
    "prudente",
    "prugna",
    "prurito",
    "psiche",
    "pubblico",
    "pudica",
    "pugilato",
    "pugno",
    "pulce",
    "pulito",
    "pulsante",
    "puntare",
    "pupazzo",
    "pupilla",
    "puro",
    "quadro",
    "qualcosa",
    "quasi",
    "querela",
    "quota",
    "raccolto",
    "raddoppio",
    "radicale",
    "radunato",
    "raffica",
    "ragazzo",
    "ragione",
    "ragno",
    "ramarro",
    "ramingo",
    "ramo",
    "randagio",
    "rantolare",
    "rapato",
    "rapina",
    "rappreso",
    "rasatura",
    "raschiato",
    "rasente",
    "rassegna",
    "rastrello",
    "rata",
    "ravveduto",
    "reale",
    "recepire",
    "recinto",
    "recluta",
    "recondito",
    "recupero",
    "reddito",
    "redimere",
    "regalato",
    "registro",
    "regola",
    "regresso",
    "relazione",
    "remare",
    "remoto",
    "renna",
    "replica",
    "reprimere",
    "reputare",
    "resa",
    "residente",
    "responso",
    "restauro",
    "rete",
    "retina",
    "retorica",
    "rettifica",
    "revocato",
    "riassunto",
    "ribadire",
    "ribelle",
    "ribrezzo",
    "ricarica",
    "ricco",
    "ricevere",
    "riciclato",
    "ricordo",
    "ricreduto",
    "ridicolo",
    "ridurre",
    "rifasare",
    "riflesso",
    "riforma",
    "rifugio",
    "rigare",
    "rigettato",
    "righello",
    "rilassato",
    "rilevato",
    "rimanere",
    "rimbalzo",
    "rimedio",
    "rimorchio",
    "rinascita",
    "rincaro",
    "rinforzo",
    "rinnovo",
    "rinomato",
    "rinsavito",
    "rintocco",
    "rinuncia",
    "rinvenire",
    "riparato",
    "ripetuto",
    "ripieno",
    "riportare",
    "ripresa",
    "ripulire",
    "risata",
    "rischio",
    "riserva",
    "risibile",
    "riso",
    "rispetto",
    "ristoro",
    "risultato",
    "risvolto",
    "ritardo",
    "ritegno",
    "ritmico",
    "ritrovo",
    "riunione",
    "riva",
    "riverso",
    "rivincita",
    "rivolto",
    "rizoma",
    "roba",
    "robotico",
    "robusto",
    "roccia",
    "roco",
    "rodaggio",
    "rodere",
    "roditore",
    "rogito",
    "rollio",
    "romantico",
    "rompere",
    "ronzio",
    "rosolare",
    "rospo",
    "rotante",
    "rotondo",
    "rotula",
    "rovescio",
    "rubizzo",
    "rubrica",
    "ruga",
    "rullino",
    "rumine",
    "rumoroso",
    "ruolo",
    "rupe",
    "russare",
    "rustico",
    "sabato",
    "sabbiare",
    "sabotato",
    "sagoma",
    "salasso",
    "saldatura",
    "salgemma",
    "salivare",
    "salmone",
    "salone",
    "saltare",
    "saluto",
    "salvo",
    "sapere",
    "sapido",
    "saporito",
    "saraceno",
    "sarcasmo",
    "sarto",
    "sassoso",
    "satellite",
    "satira",
    "satollo",
    "saturno",
    "savana",
    "savio",
    "saziato",
    "sbadiglio",
    "sbalzo",
    "sbancato",
    "sbarra",
    "sbattere",
    "sbavare",
    "sbendare",
    "sbirciare",
    "sbloccato",
    "sbocciato",
    "sbrinare",
    "sbruffone",
    "sbuffare",
    "scabroso",
    "scadenza",
    "scala",
    "scambiare",
    "scandalo",
    "scapola",
    "scarso",
    "scatenare",
    "scavato",
    "scelto",
    "scenico",
    "scettro",
    "scheda",
    "schiena",
    "sciarpa",
    "scienza",
    "scindere",
    "scippo",
    "sciroppo",
    "scivolo",
    "sclerare",
    "scodella",
    "scolpito",
    "scomparto",
    "sconforto",
    "scoprire",
    "scorta",
    "scossone",
    "scozzese",
    "scriba",
    "scrollare",
    "scrutinio",
    "scuderia",
    "scultore",
    "scuola",
    "scuro",
    "scusare",
    "sdebitare",
    "sdoganare",
    "seccatura",
    "secondo",
    "sedano",
    "seggiola",
    "segnalato",
    "segregato",
    "seguito",
    "selciato",
    "selettivo",
    "sella",
    "selvaggio",
    "semaforo",
    "sembrare",
    "seme",
    "seminato",
    "sempre",
    "senso",
    "sentire",
    "sepolto",
    "sequenza",
    "serata",
    "serbato",
    "sereno",
    "serio",
    "serpente",
    "serraglio",
    "servire",
    "sestina",
    "setola",
    "settimana",
    "sfacelo",
    "sfaldare",
    "sfamato",
    "sfarzoso",
    "sfaticato",
    "sfera",
    "sfida",
    "sfilato",
    "sfinge",
    "sfocato",
    "sfoderare",
    "sfogo",
    "sfoltire",
    "sforzato",
    "sfratto",
    "sfruttato",
    "sfuggito",
    "sfumare",
    "sfuso",
    "sgabello",
    "sgarbato",
    "sgonfiare",
    "sgorbio",
    "sgrassato",
    "sguardo",
    "sibilo",
    "siccome",
    "sierra",
    "sigla",
    "signore",
    "silenzio",
    "sillaba",
    "simbolo",
    "simpatico",
    "simulato",
    "sinfonia",
    "singolo",
    "sinistro",
    "sino",
    "sintesi",
    "sinusoide",
    "sipario",
    "sisma",
    "sistole",
    "situato",
    "slitta",
    "slogatura",
    "sloveno",
    "smarrito",
    "smemorato",
    "smentito",
    "smeraldo",
    "smilzo",
    "smontare",
    "smottato",
    "smussato",
    "snellire",
    "snervato",
    "snodo",
    "sobbalzo",
    "sobrio",
    "soccorso",
    "sociale",
    "sodale",
    "soffitto",
    "sogno",
    "soldato",
    "solenne",
    "solido",
    "sollazzo",
    "solo",
    "solubile",
    "solvente",
    "somatico",
    "somma",
    "sonda",
    "sonetto",
    "sonnifero",
    "sopire",
    "soppeso",
    "sopra",
    "sorgere",
    "sorpasso",
    "sorriso",
    "sorso",
    "sorteggio",
    "sorvolato",
    "sospiro",
    "sosta",
    "sottile",
    "spada",
    "spalla",
    "spargere",
    "spatola",
    "spavento",
    "spazzola",
    "specie",
    "spedire",
    "spegnere",
    "spelatura",
    "speranza",
    "spessore",
    "spettrale",
    "spezzato",
    "spia",
    "spigoloso",
    "spillato",
    "spinoso",
    "spirale",
    "splendido",
    "sportivo",
    "sposo",
    "spranga",
    "sprecare",
    "spronato",
    "spruzzo",
    "spuntino",
    "squillo",
    "sradicare",
    "srotolato",
    "stabile",
    "stacco",
    "staffa",
    "stagnare",
    "stampato",
    "stantio",
    "starnuto",
    "stasera",
    "statuto",
    "stelo",
    "steppa",
    "sterzo",
    "stiletto",
    "stima",
    "stirpe",
    "stivale",
    "stizzoso",
    "stonato",
    "storico",
    "strappo",
    "stregato",
    "stridulo",
    "strozzare",
    "strutto",
    "stuccare",
    "stufo",
    "stupendo",
    "subentro",
    "succoso",
    "sudore",
    "suggerito",
    "sugo",
    "sultano",
    "suonare",
    "superbo",
    "supporto",
    "surgelato",
    "surrogato",
    "sussurro",
    "sutura",
    "svagare",
    "svedese",
    "sveglio",
    "svelare",
    "svenuto",
    "svezia",
    "sviluppo",
    "svista",
    "svizzera",
    "svolta",
    "svuotare",
    "tabacco",
    "tabulato",
    "tacciare",
    "taciturno",
    "tale",
    "talismano",
    "tampone",
    "tannino",
    "tara",
    "tardivo",
    "targato",
    "tariffa",
    "tarpare",
    "tartaruga",
    "tasto",
    "tattico",
    "taverna",
    "tavolata",
    "tazza",
    "teca",
    "tecnico",
    "telefono",
    "temerario",
    "tempo",
    "temuto",
    "tendone",
    "tenero",
    "tensione",
    "tentacolo",
    "teorema",
    "terme",
    "terrazzo",
    "terzetto",
    "tesi",
    "tesserato",
    "testato",
    "tetro",
    "tettoia",
    "tifare",
    "tigella",
    "timbro",
    "tinto",
    "tipico",
    "tipografo",
    "tiraggio",
    "tiro",
    "titanio",
    "titolo",
    "titubante",
    "tizio",
    "tizzone",
    "toccare",
    "tollerare",
    "tolto",
    "tombola",
    "tomo",
    "tonfo",
    "tonsilla",
    "topazio",
    "topologia",
    "toppa",
    "torba",
    "tornare",
    "torrone",
    "tortora",
    "toscano",
    "tossire",
    "tostatura",
    "totano",
    "trabocco",
    "trachea",
    "trafila",
    "tragedia",
    "tralcio",
    "tramonto",
    "transito",
    "trapano",
    "trarre",
    "trasloco",
    "trattato",
    "trave",
    "treccia",
    "tremolio",
    "trespolo",
    "tributo",
    "tricheco",
    "trifoglio",
    "trillo",
    "trincea",
    "trio",
    "tristezza",
    "triturato",
    "trivella",
    "tromba",
    "trono",
    "troppo",
    "trottola",
    "trovare",
    "truccato",
    "tubatura",
    "tuffato",
    "tulipano",
    "tumulto",
    "tunisia",
    "turbare",
    "turchino",
    "tuta",
    "tutela",
    "ubicato",
    "uccello",
    "uccisore",
    "udire",
    "uditivo",
    "uffa",
    "ufficio",
    "uguale",
    "ulisse",
    "ultimato",
    "umano",
    "umile",
    "umorismo",
    "uncinetto",
    "ungere",
    "ungherese",
    "unicorno",
    "unificato",
    "unisono",
    "unitario",
    "unte",
    "uovo",
    "upupa",
    "uragano",
    "urgenza",
    "urlo",
    "usanza",
    "usato",
    "uscito",
    "usignolo",
    "usuraio",
    "utensile",
    "utilizzo",
    "utopia",
    "vacante",
    "vaccinato",
    "vagabondo",
    "vagliato",
    "valanga",
    "valgo",
    "valico",
    "valletta",
    "valoroso",
    "valutare",
    "valvola",
    "vampata",
    "vangare",
    "vanitoso",
    "vano",
    "vantaggio",
    "vanvera",
    "vapore",
    "varano",
    "varcato",
    "variante",
    "vasca",
    "vedetta",
    "vedova",
    "veduto",
    "vegetale",
    "veicolo",
    "velcro",
    "velina",
    "velluto",
    "veloce",
    "venato",
    "vendemmia",
    "vento",
    "verace",
    "verbale",
    "vergogna",
    "verifica",
    "vero",
    "verruca",
    "verticale",
    "vescica",
    "vessillo",
    "vestale",
    "veterano",
    "vetrina",
    "vetusto",
    "viandante",
    "vibrante",
    "vicenda",
    "vichingo",
    "vicinanza",
    "vidimare",
    "vigilia",
    "vigneto",
    "vigore",
    "vile",
    "villano",
    "vimini",
    "vincitore",
    "viola",
    "vipera",
    "virgola",
    "virologo",
    "virulento",
    "viscoso",
    "visione",
    "vispo",
    "vissuto",
    "visura",
    "vita",
    "vitello",
    "vittima",
    "vivanda",
    "vivido",
    "viziare",
    "voce",
    "voga",
    "volatile",
    "volere",
    "volpe",
    "voragine",
    "vulcano",
    "zampogna",
    "zanna",
    "zappato",
    "zattera",
    "zavorra",
    "zefiro",
    "zelante",
    "zelo",
    "zenzero",
    "zerbino",
    "zibetto",
    "zinco",
    "zircone",
    "zitto",
    "zolla",
    "zotico",
    "zucchero",
    "zufolo",
    "zulu",
    "zuppa"
]

},{}],34:[function(require,module,exports){
module.exports=[
    "πüéπüäπüôπüÅπüùπéô",
    "πüéπüäπüòπüñ",
    "πüéπüäπüƒπéÖ",
    "πüéπüèπü¥πéÖπéë",
    "πüéπüïπüíπéâπéô",
    "πüéπüìπéï",
    "πüéπüæπüïπéÖπüƒ",
    "πüéπüæπéï",
    "πüéπüôπüïπéÖπéîπéï",
    "πüéπüòπüä",
    "πüéπüòπü▓",
    "πüéπüùπüéπü¿",
    "πüéπüùπéÖπéÅπüå",
    "πüéπüÖπéÖπüïπéï",
    "πüéπüÖπéÖπüì",
    "πüéπü¥πü╡πéÖ",
    "πüéπüƒπüêπéï",
    "πüéπüƒπüƒπéüπéï",
    "πüéπüƒπéèπü╛πüê",
    "πüéπüƒπéï",
    "πüéπüñπüä",
    "πüéπüñπüïπüå",
    "πüéπüúπüùπéàπüÅ",
    "πüéπüñπü╛πéè",
    "πüéπüñπéüπéï",
    "πüéπüªπü¬",
    "πüéπüªπü»πü╛πéï",
    "πüéπü▓πéï",
    "πüéπü╡πéÖπéë",
    "πüéπü╡πéÖπéï",
    "πüéπü╡πéîπéï",
    "πüéπü╛πüä",
    "πüéπü╛πü¿πéÖ",
    "πüéπü╛πéäπüïπüÖ",
    "πüéπü╛πéè",
    "πüéπü┐πééπü«",
    "πüéπéüπéèπüï",
    "πüéπéäπü╛πéï",
    "πüéπéåπéÇ",
    "πüéπéëπüäπüÅπéÖπü╛",
    "πüéπéëπüù",
    "πüéπéëπüÖπüùπéÖ",
    "πüéπéëπüƒπéüπéï",
    "πüéπéëπéåπéï",
    "πüéπéëπéÅπüÖ",
    "πüéπéèπüïπéÖπü¿πüå",
    "πüéπéÅπü¢πéï",
    "πüéπéÅπüªπéï",
    "πüéπéôπüä",
    "πüéπéôπüïπéÖπüä",
    "πüéπéôπüô",
    "πüéπéôπü¢πéÖπéô",
    "πüéπéôπüªπüä",
    "πüéπéôπü¬πüä",
    "πüéπéôπü╛πéè",
    "πüäπüäπüƒπéÖπüÖ",
    "πüäπüèπéô",
    "πüäπüïπéÖπüä",
    "πüäπüïπéÖπüÅ",
    "πüäπüìπüèπüä",
    "πüäπüìπü¬πéè",
    "πüäπüìπééπü«",
    "πüäπüìπéï",
    "πüäπüÅπüùπéÖ",
    "πüäπüÅπü╡πéÖπéô",
    "πüäπüæπü»πéÖπü¬",
    "πüäπüæπéô",
    "πüäπüôπüå",
    "πüäπüôπüÅ",
    "πüäπüôπüñ",
    "πüäπüòπü╛πüùπüä",
    "πüäπüòπéô",
    "πüäπüùπüì",
    "πüäπüùπéÖπéàπüå",
    "πüäπüùπéÖπéçπüå",
    "πüäπüùπéÖπéÅπéï",
    "πüäπüÖπéÖπü┐",
    "πüäπüÖπéÖπéî",
    "πüäπü¢πüä",
    "πüäπü¢πüêπü▓πéÖ",
    "πüäπü¢πüïπüä",
    "πüäπü¢πüì",
    "πüäπü¢πéÖπéô",
    "πüäπü¥πüåπéìπüå",
    "πüäπü¥πüïπéÖπüùπüä",
    "πüäπüƒπéÖπüä",
    "πüäπüƒπéÖπüÅ",
    "πüäπüƒπüÖπéÖπéë",
    "πüäπüƒπü┐",
    "πüäπüƒπéèπüé",
    "πüäπüíπüèπüå",
    "πüäπüíπüùπéÖ",
    "πüäπüíπü¿πéÖ",
    "πüäπüíπü»πéÖ",
    "πüäπüíπü╡πéÖ",
    "πüäπüíπéèπéàπüå",
    "πüäπüñπüï",
    "πüäπüúπüùπéàπéô",
    "πüäπüúπü¢πüä",
    "πüäπüúπü¥πüå",
    "πüäπüúπüƒπéô",
    "πüäπüúπüí",
    "πüäπüúπüªπüä",
    "πüäπüúπü╗πéÜπüå",
    "πüäπüªπüòπéÖ",
    "πüäπüªπéô",
    "πüäπü¿πéÖπüå",
    "πüäπü¿πüô",
    "πüäπü¬πüä",
    "πüäπü¬πüï",
    "πüäπü¡πéÇπéè",
    "πüäπü«πüí",
    "πüäπü«πéï",
    "πüäπü»πüñ",
    "πüäπü»πéÖπéï",
    "πüäπü»πéô",
    "πüäπü▓πéÖπüì",
    "πüäπü▓πéô",
    "πüäπü╡πüÅ",
    "πüäπü╕πéô",
    "πüäπü╗πüå",
    "πüäπü┐πéô",
    "πüäπééπüåπü¿",
    "πüäπééπüƒπéî",
    "πüäπééπéè",
    "πüäπéäπüïπéÖπéï",
    "πüäπéäπüÖ",
    "πüäπéêπüïπéô",
    "πüäπéêπüÅ",
    "πüäπéëπüä",
    "πüäπéëπüÖπü¿",
    "πüäπéèπüÅπéÖπüí",
    "πüäπéèπéçπüå",
    "πüäπéîπüä",
    "πüäπéîπééπü«",
    "πüäπéîπéï",
    "πüäπéìπüêπéôπü▓πéÜπüñ",
    "πüäπéÅπüä",
    "πüäπéÅπüå",
    "πüäπéÅπüïπéô",
    "πüäπéÅπü»πéÖ",
    "πüäπéÅπéåπéï",
    "πüäπéôπüæπéÖπéôπü╛πéü",
    "πüäπéôπüòπüñ",
    "πüäπéôπüùπéçπüå",
    "πüäπéôπéêπüå",
    "πüåπüêπüì",
    "πüåπüêπéï",
    "πüåπüèπüòπéÖ",
    "πüåπüïπéÖπüä",
    "πüåπüïπü╡πéÖ",
    "πüåπüïπü╕πéÖπéï",
    "πüåπüìπéÅ",
    "πüåπüÅπéëπüäπü¬",
    "πüåπüÅπéîπéî",
    "πüåπüæπüƒπü╛πéÅπéï",
    "πüåπüæπüñπüæ",
    "πüåπüæπü¿πéï",
    "πüåπüæπééπüñ",
    "πüåπüæπéï",
    "πüåπüôπéÖπüïπüÖ",
    "πüåπüôπéÖπüÅ",
    "πüåπüôπéô",
    "πüåπüòπüìπéÖ",
    "πüåπüùπü¬πüå",
    "πüåπüùπéìπüïπéÖπü┐",
    "πüåπüÖπüä",
    "πüåπüÖπüìπéÖ",
    "πüåπüÖπüÅπéÖπéëπüä",
    "πüåπüÖπéüπéï",
    "πüåπü¢πüñ",
    "πüåπüíπüéπéÅπü¢",
    "πüåπüíπüïπéÖπéÅ",
    "πüåπüíπüì",
    "πüåπüíπéàπüå",
    "πüåπüúπüïπéè",
    "πüåπüñπüÅπüùπüä",
    "πüåπüúπüƒπüêπéï",
    "πüåπüñπéï",
    "πüåπü¿πéÖπéô",
    "πüåπü¬πüìπéÖ",
    "πüåπü¬πüùπéÖ",
    "πüåπü¬πüÖπéÖπüÅ",
    "πüåπü¬πéï",
    "πüåπü¡πéï",
    "πüåπü«πüå",
    "πüåπü╡πéÖπüæπéÖ",
    "πüåπü╡πéÖπüôπéÖπüê",
    "πüåπü╛πéîπéï",
    "πüåπéüπéï",
    "πüåπééπüå",
    "πüåπéäπü╛πüå",
    "πüåπéêπüÅ",
    "πüåπéëπüïπéÖπüêπüÖ",
    "πüåπéëπüÅπéÖπüí",
    "πüåπéëπü¬πüä",
    "πüåπéèπüéπüæπéÖ",
    "πüåπéèπüìπéî",
    "πüåπéïπüòπüä",
    "πüåπéîπüùπüä",
    "πüåπéîπéåπüì",
    "πüåπéîπéï",
    "πüåπéìπüô",
    "πüåπéÅπüì",
    "πüåπéÅπüò",
    "πüåπéôπüôπüå",
    "πüåπéôπüíπéô",
    "πüåπéôπüªπéô",
    "πüåπéôπü¿πéÖπüå",
    "πüêπüäπüêπéô",
    "πüêπüäπüïπéÖ",
    "πüêπüäπüìπéçπüå",
    "πüêπüäπüôπéÖ",
    "πüêπüäπü¢πüä",
    "πüêπüäπü╡πéÖπéô",
    "πüêπüäπéêπüå",
    "πüêπüäπéÅ",
    "πüêπüèπéè",
    "πüêπüïπéÖπüè",
    "πüêπüïπéÖπüÅ",
    "πüêπüìπüƒπüä",
    "πüêπüÅπü¢πéï",
    "πüêπüùπéâπüÅ",
    "πüêπüÖπüª",
    "πüêπüñπéëπéô",
    "πüêπü«πüÅπéÖ",
    "πüêπü╗πüåπü╛πüì",
    "πüêπü╗πéô",
    "πüêπü╛πüì",
    "πüêπééπüùπéÖ",
    "πüêπééπü«",
    "πüêπéëπüä",
    "πüêπéëπü╡πéÖ",
    "πüêπéèπüé",
    "πüêπéôπüêπéô",
    "πüêπéôπüïπüä",
    "πüêπéôπüìπéÖ",
    "πüêπéôπüæπéÖπüì",
    "πüêπéôπüùπéàπüå",
    "πüêπéôπü¢πéÖπüñ",
    "πüêπéôπü¥πüÅ",
    "πüêπéôπüíπéçπüå",
    "πüêπéôπü¿πüñ",
    "πüèπüäπüïπüæπéï",
    "πüèπüäπüôπüÖ",
    "πüèπüäπüùπüä",
    "πüèπüäπüñπüÅ",
    "πüèπüåπüêπéô",
    "πüèπüåπüòπü╛",
    "πüèπüåπüùπéÖ",
    "πüèπüåπü¢πüñ",
    "πüèπüåπüƒπüä",
    "πüèπüåπü╡πüÅ",
    "πüèπüåπü╕πéÖπüä",
    "πüèπüåπéêπüå",
    "πüèπüêπéï",
    "πüèπüèπüä",
    "πüèπüèπüå",
    "πüèπüèπü¿πéÖπüèπéè",
    "πüèπüèπéä",
    "πüèπüèπéêπü¥",
    "πüèπüïπüêπéè",
    "πüèπüïπüÖπéÖ",
    "πüèπüïπéÖπéÇ",
    "πüèπüïπéÅπéè",
    "πüèπüìπéÖπü¬πüå",
    "πüèπüìπéï",
    "πüèπüÅπüòπü╛",
    "πüèπüÅπüùπéÖπéçπüå",
    "πüèπüÅπéèπüïπéÖπü¬",
    "πüèπüÅπéï",
    "πüèπüÅπéîπéï",
    "πüèπüôπüÖ",
    "πüèπüôπü¬πüå",
    "πüèπüôπéï",
    "πüèπüòπüêπéï",
    "πüèπüòπü¬πüä",
    "πüèπüòπéüπéï",
    "πüèπüùπüäπéî",
    "πüèπüùπüêπéï",
    "πüèπüùπéÖπüìπéÖ",
    "πüèπüùπéÖπüòπéô",
    "πüèπüùπéâπéî",
    "πüèπü¥πéëπüÅ",
    "πüèπü¥πéÅπéï",
    "πüèπüƒπüïπéÖπüä",
    "πüèπüƒπüÅ",
    "πüèπüƒπéÖπéäπüï",
    "πüèπüíπüñπüÅ",
    "πüèπüúπü¿",
    "πüèπüñπéè",
    "πüèπüªπéÖπüïπüæ",
    "πüèπü¿πüùπééπü«",
    "πüèπü¿πü¬πüùπüä",
    "πüèπü¿πéÖπéè",
    "πüèπü¿πéÖπéìπüïπüÖ",
    "πüèπü»πéÖπüòπéô",
    "πüèπü╛πüäπéè",
    "πüèπéüπüªπéÖπü¿πüå",
    "πüèπééπüäπüªπéÖ",
    "πüèπééπüå",
    "πüèπééπüƒπüä",
    "πüèπééπüíπéâ",
    "πüèπéäπüñ",
    "πüèπéäπéåπü▓πéÖ",
    "πüèπéêπü╗πéÖπüÖ",
    "πüèπéëπéôπüƒπéÖ",
    "πüèπéìπüÖ",
    "πüèπéôπüïπéÖπüÅ",
    "πüèπéôπüæπüä",
    "πüèπéôπüùπéâ",
    "πüèπéôπü¢πéô",
    "πüèπéôπüƒπéÖπéô",
    "πüèπéôπüíπéàπüå",
    "πüèπéôπü¿πéÖπüæπüä",
    "πüïπüéπüñ",
    "πüïπüäπüïπéÖ",
    "πüïπéÖπüäπüì",
    "πüïπéÖπüäπüæπéô",
    "πüïπéÖπüäπüôπüå",
    "πüïπüäπüòπüñ",
    "πüïπüäπüùπéâ",
    "πüïπüäπüÖπüäπéêπüÅ",
    "πüïπüäπü¢πéÖπéô",
    "πüïπüäπü¥πéÖπüåπü¿πéÖ",
    "πüïπüäπüñπüå",
    "πüïπüäπüªπéô",
    "πüïπüäπü¿πüå",
    "πüïπüäπü╡πüÅ",
    "πüïπéÖπüäπü╕πüì",
    "πüïπüäπü╗πüå",
    "πüïπüäπéêπüå",
    "πüïπéÖπüäπéëπüä",
    "πüïπüäπéÅ",
    "πüïπüêπéï",
    "πüïπüèπéè",
    "πüïπüïπüêπéï",
    "πüïπüïπéÖπüÅ",
    "πüïπüïπéÖπüù",
    "πüïπüïπéÖπü┐",
    "πüïπüÅπüôπéÖ",
    "πüïπüÅπü¿πüÅ",
    "πüïπüòπéÖπéï",
    "πüïπéÖπü¥πéÖπüå",
    "πüïπüƒπüä",
    "πüïπüƒπüí",
    "πüïπéÖπüíπéçπüå",
    "πüïπéÖπüúπüìπéàπüå",
    "πüïπéÖπüúπüôπüå",
    "πüïπéÖπüúπüòπéô",
    "πüïπéÖπüúπüùπéçπüå",
    "πüïπü¬πüòπéÖπéÅπüù",
    "πüïπü«πüå",
    "πüïπéÖπü»πüÅ",
    "πüïπü╡πéÖπüï",
    "πüïπü╗πüå",
    "πüïπü╗πüôπéÖ",
    "πüïπü╛πüå",
    "πüïπü╛πü╗πéÖπüô",
    "πüïπéüπéîπüèπéô",
    "πüïπéåπüä",
    "πüïπéêπüåπü▓πéÖ",
    "πüïπéëπüä",
    "πüïπéïπüä",
    "πüïπéìπüå",
    "πüïπéÅπüÅ",
    "πüïπéÅπéë",
    "πüïπéÖπéôπüï",
    "πüïπéôπüæπüä",
    "πüïπéôπüôπüå",
    "πüïπéôπüùπéâ",
    "πüïπéôπü¥πüå",
    "πüïπéôπüƒπéô",
    "πüïπéôπüí",
    "πüïπéÖπéôπü»πéÖπéï",
    "πüìπüéπüä",
    "πüìπüéπüñ",
    "πüìπüäπéì",
    "πüìπéÖπüäπéô",
    "πüìπüåπüä",
    "πüìπüåπéô",
    "πüìπüêπéï",
    "πüìπüèπüå",
    "πüìπüèπüÅ",
    "πüìπüèπüí",
    "πüìπüèπéô",
    "πüìπüïπüä",
    "πüìπüïπüÅ",
    "πüìπüïπéôπüùπéâ",
    "πüìπüìπüª",
    "πüìπüÅπü»πéÖπéè",
    "πüìπüÅπéëπüæπéÖ",
    "πüìπüæπéôπü¢πüä",
    "πüìπüôπüå",
    "πüìπüôπüêπéï",
    "πüìπüôπüÅ",
    "πüìπüòπüä",
    "πüìπüòπüÅ",
    "πüìπüòπü╛",
    "πüìπüòπéëπüìπéÖ",
    "πüìπéÖπüùπéÖπüïπüïπéÖπüÅ",
    "πüìπéÖπüùπüì",
    "πüìπéÖπüùπéÖπüƒπüäπüæπéô",
    "πüìπéÖπüùπéÖπü½πüúπüªπüä",
    "πüìπéÖπüùπéÖπéàπüñπüùπéâ",
    "πüìπüÖπüå",
    "πüìπü¢πüä",
    "πüìπü¢πüì",
    "πüìπü¢πüñ",
    "πüìπü¥πüå",
    "πüìπü¥πéÖπüÅ",
    "πüìπü¥πéÖπéô",
    "πüìπüƒπüêπéï",
    "πüìπüíπéçπüå",
    "πüìπüñπüêπéô",
    "πüìπéÖπüúπüíπéè",
    "πüìπüñπüñπüì",
    "πüìπüñπü¡",
    "πüìπüªπüä",
    "πüìπü¿πéÖπüå",
    "πüìπü¿πéÖπüÅ",
    "πüìπü¬πüä",
    "πüìπü¬πüïπéÖ",
    "πüìπü¬πüô",
    "πüìπü¼πüôπéÖπüù",
    "πüìπü¡πéô",
    "πüìπü«πüå",
    "πüìπü«πüùπüƒ",
    "πüìπü»πüÅ",
    "πüìπü▓πéÖπüùπüä",
    "πüìπü▓πéô",
    "πüìπü╡πüÅ",
    "πüìπü╡πéÖπéô",
    "πüìπü╗πéÖπüå",
    "πüìπü╗πéô",
    "πüìπü╛πéï",
    "πüìπü┐πüñ",
    "πüìπéÇπüÖπéÖπüïπüùπüä",
    "πüìπéüπéï",
    "πüìπééπüƒπéÖπéüπüù",
    "πüìπééπüí",
    "πüìπééπü«",
    "πüìπéâπüÅ",
    "πüìπéäπüÅ",
    "πüìπéÖπéàπüåπü½πüÅ",
    "πüìπéêπüå",
    "πüìπéçπüåπéèπéàπüå",
    "πüìπéëπüä",
    "πüìπéëπüÅ",
    "πüìπéèπéô",
    "πüìπéîπüä",
    "πüìπéîπüñ",
    "πüìπéìπüÅ",
    "πüìπéÖπéìπéô",
    "πüìπéÅπéüπéï",
    "πüìπéÖπéôπüäπéì",
    "πüìπéôπüïπüÅπüùπéÖ",
    "πüìπéôπüùπéÖπéç",
    "πüìπéôπéêπüåπü▓πéÖ",
    "πüÅπéÖπüéπüä",
    "πüÅπüäπüÖπéÖ",
    "πüÅπüåπüïπéô",
    "πüÅπüåπüì",
    "πüÅπüåπüÅπéÖπéô",
    "πüÅπüåπüôπüå",
    "πüÅπéÖπüåπü¢πüä",
    "πüÅπüåπü¥πüå",
    "πüÅπéÖπüåπüƒπéë",
    "πüÅπüåπü╡πüÅ",
    "πüÅπüåπü╗πéÖ",
    "πüÅπüïπéô",
    "πüÅπüìπéçπüå",
    "πüÅπüæπéÖπéô",
    "πüÅπéÖπüôπüå",
    "πüÅπüòπüä",
    "πüÅπüòπüì",
    "πüÅπüòπü»πéÖπü¬",
    "πüÅπüòπéï",
    "πüÅπüùπéâπü┐",
    "πüÅπüùπéçπüå",
    "πüÅπüÖπü«πüì",
    "πüÅπüÖπéèπéåπü▓πéÖ",
    "πüÅπü¢πüæπéÖ",
    "πüÅπü¢πéô",
    "πüÅπéÖπüƒπüäπüªπüì",
    "πüÅπüƒπéÖπüòπéï",
    "πüÅπüƒπü▓πéÖπéîπéï",
    "πüÅπüíπüôπü┐",
    "πüÅπüíπüòπüì",
    "πüÅπüñπüùπüƒ",
    "πüÅπéÖπüúπüÖπéè",
    "πüÅπüñπéìπüÅπéÖ",
    "πüÅπü¿πüåπüªπéô",
    "πüÅπü¿πéÖπüÅ",
    "πüÅπü¬πéô",
    "πüÅπü¡πüÅπü¡",
    "πüÅπü«πüå",
    "πüÅπü╡πüå",
    "πüÅπü┐πüéπéÅπü¢",
    "πüÅπü┐πüƒπüªπéï",
    "πüÅπéüπéï",
    "πüÅπéäπüÅπüùπéç",
    "πüÅπéëπüÖ",
    "πüÅπéëπü╕πéÖπéï",
    "πüÅπéïπü╛",
    "πüÅπéîπéï",
    "πüÅπéìπüå",
    "πüÅπéÅπüùπüä",
    "πüÅπéÖπéôπüïπéô",
    "πüÅπéÖπéôπüùπéçπüÅ",
    "πüÅπéÖπéôπüƒπüä",
    "πüÅπéÖπéôπüª",
    "πüæπüéπü¬",
    "πüæπüäπüïπüÅ",
    "πüæπüäπüæπéô",
    "πüæπüäπüô",
    "πüæπüäπüòπüñ",
    "πüæπéÖπüäπüùπéÖπéàπüñ",
    "πüæπüäπüƒπüä",
    "πüæπéÖπüäπü«πüåπüùπéÖπéô",
    "πüæπüäπéîπüì",
    "πüæπüäπéì",
    "πüæπüèπü¿πüÖ",
    "πüæπüèπéèπééπü«",
    "πüæπéÖπüìπüï",
    "πüæπéÖπüìπüæπéÖπéô",
    "πüæπéÖπüìπüƒπéÖπéô",
    "πüæπéÖπüìπüíπéô",
    "πüæπéÖπüìπü¿πüñ",
    "πüæπéÖπüìπü»",
    "πüæπéÖπüìπéäπüÅ",
    "πüæπéÖπüôπüå",
    "πüæπéÖπüôπüÅπüùπéÖπéçπüå",
    "πüæπéÖπüòπéÖπüä",
    "πüæπüòπüì",
    "πüæπéÖπüòπéÖπéô",
    "πüæπüùπüì",
    "πüæπüùπüôπéÖπéÇ",
    "πüæπüùπéçπüå",
    "πüæπéÖπüÖπü¿",
    "πüæπüƒπü»πéÖ",
    "πüæπüíπéâπüúπü╡πéÜ",
    "πüæπüíπéëπüÖ",
    "πüæπüñπüéπüñ",
    "πüæπüñπüä",
    "πüæπüñπüêπüì",
    "πüæπüúπüôπéô",
    "πüæπüñπüùπéÖπéç",
    "πüæπüúπü¢πüì",
    "πüæπüúπüªπüä",
    "πüæπüñπü╛πüñ",
    "πüæπéÖπüñπéêπüåπü▓πéÖ",
    "πüæπéÖπüñπéîπüä",
    "πüæπüñπéìπéô",
    "πüæπéÖπü¿πéÖπüÅ",
    "πüæπü¿πü»πéÖπüÖ",
    "πüæπü¿πéï",
    "πüæπü¬πüæπéÖ",
    "πüæπü¬πüÖ",
    "πüæπü¬πü┐",
    "πüæπü¼πüì",
    "πüæπéÖπü¡πüñ",
    "πüæπü¡πéô",
    "πüæπü»πüä",
    "πüæπéÖπü▓πéô",
    "πüæπü╡πéÖπüïπüä",
    "πüæπéÖπü╗πéÖπüÅ",
    "πüæπü╛πéè",
    "πüæπü┐πüïπéï",
    "πüæπéÇπüù",
    "πüæπéÇπéè",
    "πüæπééπü«",
    "πüæπéëπüä",
    "πüæπéìπüæπéì",
    "πüæπéÅπüùπüä",
    "πüæπéôπüä",
    "πüæπéôπüêπüñ",
    "πüæπéôπüè",
    "πüæπéôπüï",
    "πüæπéÖπéôπüì",
    "πüæπéôπüæπéÖπéô",
    "πüæπéôπüôπüå",
    "πüæπéôπüòπüÅ",
    "πüæπéôπüùπéàπüå",
    "πüæπéôπüÖπüå",
    "πüæπéÖπéôπü¥πüå",
    "πüæπéôπüíπüÅ",
    "πüæπéôπüªπüä",
    "πüæπéôπü¿πüå",
    "πüæπéôπü¬πüä",
    "πüæπéôπü½πéô",
    "πüæπéÖπéôπü╡πéÖπüñ",
    "πüæπéôπü╛",
    "πüæπéôπü┐πéô",
    "πüæπéôπéüπüä",
    "πüæπéôπéëπéô",
    "πüæπéôπéè",
    "πüôπüéπüÅπü╛",
    "πüôπüäπü¼",
    "πüôπüäπü▓πéÖπü¿",
    "πüôπéÖπüåπüä",
    "πüôπüåπüêπéô",
    "πüôπüåπüèπéô",
    "πüôπüåπüïπéô",
    "πüôπéÖπüåπüìπéàπüå",
    "πüôπéÖπüåπüæπüä",
    "πüôπüåπüôπüå",
    "πüôπüåπüòπüä",
    "πüôπüåπüùπéÖ",
    "πüôπüåπüÖπüä",
    "πüôπéÖπüåπü¢πüä",
    "πüôπüåπü¥πüÅ",
    "πüôπüåπüƒπüä",
    "πüôπüåπüíπéâ",
    "πüôπüåπüñπüå",
    "πüôπüåπüªπüä",
    "πüôπüåπü¿πéÖπüå",
    "πüôπüåπü¬πüä",
    "πüôπüåπü»πüä",
    "πüôπéÖπüåπü╗πüå",
    "πüôπéÖπüåπü╛πéô",
    "πüôπüåπééπüÅ",
    "πüôπüåπéèπüñ",
    "πüôπüêπéï",
    "πüôπüèπéè",
    "πüôπéÖπüïπüä",
    "πüôπéÖπüïπéÖπüñ",
    "πüôπéÖπüïπéô",
    "πüôπüÅπüôπéÖ",
    "πüôπüÅπüòπüä",
    "πüôπüÅπü¿πüå",
    "πüôπüÅπü¬πüä",
    "πüôπüÅπü»πüÅ",
    "πüôπüÅπéÖπü╛",
    "πüôπüæπüä",
    "πüôπüæπéï",
    "πüôπüôπü«πüï",
    "πüôπüôπéì",
    "πüôπüòπéü",
    "πüôπüùπüñ",
    "πüôπüÖπüå",
    "πüôπü¢πüä",
    "πüôπü¢πüì",
    "πüôπü¢πéÖπéô",
    "πüôπü¥πüƒπéÖπüª",
    "πüôπüƒπüä",
    "πüôπüƒπüêπéï",
    "πüôπüƒπüñ",
    "πüôπüíπéçπüå",
    "πüôπüúπüï",
    "πüôπüñπüôπüñ",
    "πüôπüñπü»πéÖπéô",
    "πüôπüñπü╡πéÖ",
    "πüôπüªπüä",
    "πüôπüªπéô",
    "πüôπü¿πüïπéÖπéë",
    "πüôπü¿πüù",
    "πüôπü¿πü»πéÖ",
    "πüôπü¿πéè",
    "πüôπü¬πüôπéÖπü¬",
    "πüôπü¡πüôπü¡",
    "πüôπü«πü╛πü╛",
    "πüôπü«πü┐",
    "πüôπü«πéê",
    "πüôπéÖπü»πéô",
    "πüôπü▓πüñπüùπéÖ",
    "πüôπü╡πüå",
    "πüôπü╡πéô",
    "πüôπü╗πéÖπéîπéï",
    "πüôπéÖπü╛πüéπü╡πéÖπéë",
    "πüôπü╛πüïπüä",
    "πüôπéÖπü╛πüÖπéè",
    "πüôπü╛πüñπü¬",
    "πüôπü╛πéï",
    "πüôπéÇπüìπéÖπüô",
    "πüôπééπüùπéÖ",
    "πüôπééπüí",
    "πüôπééπü«",
    "πüôπééπéô",
    "πüôπéäπüÅ",
    "πüôπéäπü╛",
    "πüôπéåπüå",
    "πüôπéåπü▓πéÖ",
    "πüôπéêπüä",
    "πüôπéêπüå",
    "πüôπéèπéï",
    "πüôπéîπüÅπüùπéçπéô",
    "πüôπéìπüúπüæ",
    "πüôπéÅπééπüª",
    "πüôπéÅπéîπéï",
    "πüôπéôπüäπéô",
    "πüôπéôπüïπüä",
    "πüôπéôπüì",
    "πüôπéôπüùπéàπüå",
    "πüôπéôπüÖπüä",
    "πüôπéôπüƒπéÖπüª",
    "πüôπéôπü¿πéô",
    "πüôπéôπü¬πéô",
    "πüôπéôπü▓πéÖπü½",
    "πüôπéôπü╗πéÜπéô",
    "πüôπéôπü╛πüæ",
    "πüôπéôπéä",
    "πüôπéôπéîπüä",
    "πüôπéôπéÅπüÅ",
    "πüòπéÖπüäπüêπüì",
    "πüòπüäπüïπüä",
    "πüòπüäπüìπéô",
    "πüòπéÖπüäπüæπéÖπéô",
    "πüòπéÖπüäπüô",
    "πüòπüäπüùπéç",
    "πüòπüäπü¢πüä",
    "πüòπéÖπüäπüƒπüÅ",
    "πüòπéÖπüäπüíπéàπüå",
    "πüòπüäπüªπüì",
    "πüòπéÖπüäπéèπéçπüå",
    "πüòπüåπü¬",
    "πüòπüïπüäπüù",
    "πüòπüïπéÖπüÖ",
    "πüòπüïπü¬",
    "πüòπüïπü┐πüí",
    "πüòπüïπéÖπéï",
    "πüòπüìπéÖπéçπüå",
    "πüòπüÅπüù",
    "πüòπüÅπü▓πéô",
    "πüòπüÅπéë",
    "πüòπüôπüÅ",
    "πüòπüôπüñ",
    "πüòπüÖπéÖπüïπéï",
    "πüòπéÖπü¢πüì",
    "πüòπüƒπéô",
    "πüòπüñπüêπüä",
    "πüòπéÖπüñπüèπéô",
    "πüòπéÖπüúπüï",
    "πüòπéÖπüñπüïπéÖπüÅ",
    "πüòπüúπüìπéçπüÅ",
    "πüòπéÖπüúπüù",
    "πüòπüñπüùπéÖπéô",
    "πüòπéÖπüúπü¥πüå",
    "πüòπüñπüƒπü»πéÖ",
    "πüòπüñπü╛πüäπéé",
    "πüòπüªπüä",
    "πüòπü¿πüäπéé",
    "πüòπü¿πüå",
    "πüòπü¿πüèπéä",
    "πüòπü¿πüù",
    "πüòπü¿πéï",
    "πüòπü«πüå",
    "πüòπü»πéÖπüÅ",
    "πüòπü▓πéÖπüùπüä",
    "πüòπü╕πéÖπüñ",
    "πüòπü╗πüå",
    "πüòπü╗πü¿πéÖ",
    "πüòπü╛πüÖ",
    "πüòπü┐πüùπüä",
    "πüòπü┐πüƒπéÖπéî",
    "πüòπéÇπüæ",
    "πüòπéüπéï",
    "πüòπéäπüêπéôπü¿πéÖπüå",
    "πüòπéåπüå",
    "πüòπéêπüå",
    "πüòπéêπüÅ",
    "πüòπéëπüƒπéÖ",
    "πüòπéÖπéïπü¥πü»πéÖ",
    "πüòπéÅπéäπüï",
    "πüòπéÅπéï",
    "πüòπéôπüäπéô",
    "πüòπéôπüï",
    "πüòπéôπüìπéâπüÅ",
    "πüòπéôπüôπüå",
    "πüòπéôπüòπüä",
    "πüòπéÖπéôπüùπéç",
    "πüòπéôπüÖπüå",
    "πüòπéôπü¢πüä",
    "πüòπéôπü¥",
    "πüòπéôπüí",
    "πüòπéôπü╛",
    "πüòπéôπü┐",
    "πüòπéôπéëπéô",
    "πüùπüéπüä",
    "πüùπüéπüæπéÖ",
    "πüùπüéπüòπüúπüª",
    "πüùπüéπéÅπü¢",
    "πüùπüäπüÅ",
    "πüùπüäπéô",
    "πüùπüåπüí",
    "πüùπüêπüä",
    "πüùπüèπüæ",
    "πüùπüïπüä",
    "πüùπüïπüÅ",
    "πüùπéÖπüïπéô",
    "πüùπüôπéÖπü¿",
    "πüùπüÖπüå",
    "πüùπéÖπüƒπéÖπüä",
    "πüùπüƒπüåπüæ",
    "πüùπüƒπüìπéÖ",
    "πüùπüƒπüª",
    "πüùπüƒπü┐",
    "πüùπüíπéçπüå",
    "πüùπüíπéèπéô",
    "πüùπüúπüïπéè",
    "πüùπüñπüùπéÖ",
    "πüùπüñπééπéô",
    "πüùπüªπüä",
    "πüùπüªπüì",
    "πüùπüªπüñ",
    "πüùπéÖπüªπéô",
    "πüùπéÖπü¿πéÖπüå",
    "πüùπü¬πüìπéÖπéî",
    "πüùπü¬πééπü«",
    "πüùπü¬πéô",
    "πüùπü¡πü╛",
    "πüùπü¡πéô",
    "πüùπü«πüÅπéÖ",
    "πüùπü«πü╡πéÖ",
    "πüùπü»πüä",
    "πüùπü»πéÖπüïπéè",
    "πüùπü»πüñ",
    "πüùπü»πéëπüä",
    "πüùπü»πéô",
    "πüùπü▓πéçπüå",
    "πüùπü╡πüÅ",
    "πüùπéÖπü╡πéÖπéô",
    "πüùπü╕πüä",
    "πüùπü╗πüå",
    "πüùπü╗πéô",
    "πüùπü╛πüå",
    "πüùπü╛πéï",
    "πüùπü┐πéô",
    "πüùπéÇπüæπéï",
    "πüùπéÖπéÇπüùπéç",
    "πüùπéüπüä",
    "πüùπéüπéï",
    "πüùπééπéô",
    "πüùπéâπüäπéô",
    "πüùπéâπüåπéô",
    "πüùπéâπüèπéô",
    "πüùπéÖπéâπüïπéÖπüäπéé",
    "πüùπéäπüÅπüùπéç",
    "πüùπéâπüÅπü╗πüå",
    "πüùπéâπüæπéô",
    "πüùπéâπüô",
    "πüùπéâπüòπéÖπüä",
    "πüùπéâπüùπéô",
    "πüùπéâπü¢πéô",
    "πüùπéâπü¥πüå",
    "πüùπéâπüƒπüä",
    "πüùπéâπüíπéçπüå",
    "πüùπéâπüúπüìπéô",
    "πüùπéÖπéâπü╛",
    "πüùπéâπéèπéô",
    "πüùπéâπéîπüä",
    "πüùπéÖπéåπüå",
    "πüùπéÖπéàπüåπüùπéç",
    "πüùπéàπüÅπü»πüÅ",
    "πüùπéÖπéàπüùπéô",
    "πüùπéàπüúπü¢πüì",
    "πüùπéàπü┐",
    "πüùπéàπéëπü»πéÖ",
    "πüùπéÖπéàπéôπü»πéÖπéô",
    "πüùπéçπüåπüïπüä",
    "πüùπéçπüÅπüƒπüÅ",
    "πüùπéçπüúπüæπéô",
    "πüùπéçπü¿πéÖπüå",
    "πüùπéçπééπüñ",
    "πüùπéëπü¢πéï",
    "πüùπéëπü╕πéÖπéï",
    "πüùπéôπüï",
    "πüùπéôπüôπüå",
    "πüùπéÖπéôπüùπéÖπéâ",
    "πüùπéôπü¢πüäπüùπéÖ",
    "πüùπéôπüíπüÅ",
    "πüùπéôπéèπéô",
    "πüÖπüéπüæπéÖ",
    "πüÖπüéπüù",
    "πüÖπüéπü¬",
    "πüÖπéÖπüéπéô",
    "πüÖπüäπüêπüä",
    "πüÖπüäπüï",
    "πüÖπüäπü¿πüå",
    "πüÖπéÖπüäπü╡πéÖπéô",
    "πüÖπüäπéêπüåπü▓πéÖ",
    "πüÖπüåπüïπéÖπüÅ",
    "πüÖπüåπüùπéÖπüñ",
    "πüÖπüåπü¢πéô",
    "πüÖπüèπü¿πéÖπéè",
    "πüÖπüìπü╛",
    "πüÖπüÅπüå",
    "πüÖπüÅπü¬πüä",
    "πüÖπüæπéï",
    "πüÖπüôπéÖπüä",
    "πüÖπüôπüù",
    "πüÖπéÖπüòπéô",
    "πüÖπüÖπéÖπüùπüä",
    "πüÖπüÖπéÇ",
    "πüÖπüÖπéüπéï",
    "πüÖπüúπüïπéè",
    "πüÖπéÖπüúπüùπéè",
    "πüÖπéÖπüúπü¿",
    "πüÖπüªπüì",
    "πüÖπüªπéï",
    "πüÖπü¡πéï",
    "πüÖπü«πüô",
    "πüÖπü»πüƒπéÖ",
    "πüÖπü»πéÖπéëπüùπüä",
    "πüÖπéÖπü▓πéçπüå",
    "πüÖπéÖπü╡πéÖπü¼πéî",
    "πüÖπü╡πéÖπéè",
    "πüÖπü╡πéî",
    "πüÖπü╕πéÖπüª",
    "πüÖπü╕πéÖπéï",
    "πüÖπéÖπü╗πüå",
    "πüÖπü╗πéÖπéô",
    "πüÖπü╛πüä",
    "πüÖπéüπüù",
    "πüÖπééπüå",
    "πüÖπéäπüì",
    "πüÖπéëπüÖπéë",
    "πüÖπéïπéü",
    "πüÖπéîπüíπüïπéÖπüå",
    "πüÖπéìπüúπü¿",
    "πüÖπéÅπéï",
    "πüÖπéôπü¢πéÖπéô",
    "πüÖπéôπü╗πéÜπüå",
    "πü¢πüéπü╡πéÖπéë",
    "πü¢πüäπüïπüñ",
    "πü¢πüäπüæπéÖπéô",
    "πü¢πüäπüùπéÖ",
    "πü¢πüäπéêπüå",
    "πü¢πüèπüå",
    "πü¢πüïπüäπüïπéô",
    "πü¢πüìπü½πéô",
    "πü¢πüìπéÇ",
    "πü¢πüìπéå",
    "πü¢πüìπéëπéôπüåπéô",
    "πü¢πüæπéô",
    "πü¢πüôπüå",
    "πü¢πüÖπüùπéÖ",
    "πü¢πüƒπüä",
    "πü¢πüƒπüæ",
    "πü¢πüúπüïπüÅ",
    "πü¢πüúπüìπéâπüÅ",
    "πü¢πéÖπüúπüÅ",
    "πü¢πüúπüæπéô",
    "πü¢πüúπüôπüñ",
    "πü¢πüúπüòπüƒπüÅπü╛",
    "πü¢πüñπü¥πéÖπüÅ",
    "πü¢πüñπüƒπéÖπéô",
    "πü¢πüñπüªπéÖπéô",
    "πü¢πüúπü»πéÜπéô",
    "πü¢πüñπü▓πéÖ",
    "πü¢πüñπü╡πéÖπéô",
    "πü¢πüñπéüπüä",
    "πü¢πüñπéèπüñ",
    "πü¢πü¬πüï",
    "πü¢πü«πü▓πéÖ",
    "πü¢πü»πü»πéÖ",
    "πü¢πü▓πéÖπéì",
    "πü¢πü╗πéÖπü¡",
    "πü¢πü╛πüä",
    "πü¢πü╛πéï",
    "πü¢πéüπéï",
    "πü¢πééπüƒπéî",
    "πü¢πéèπü╡",
    "πü¢πéÖπéôπüéπüÅ",
    "πü¢πéôπüä",
    "πü¢πéôπüêπüä",
    "πü¢πéôπüï",
    "πü¢πéôπüìπéç",
    "πü¢πéôπüÅ",
    "πü¢πéôπüæπéÖπéô",
    "πü¢πéÖπéôπüôπéÖ",
    "πü¢πéôπüòπüä",
    "πü¢πéôπüùπéà",
    "πü¢πéôπüÖπüä",
    "πü¢πéôπü¢πüä",
    "πü¢πéôπü¥πéÖ",
    "πü¢πéôπüƒπüÅ",
    "πü¢πéôπüíπéçπüå",
    "πü¢πéôπüªπüä",
    "πü¢πéôπü¿πüå",
    "πü¢πéôπü¼πüì",
    "πü¢πéôπü¡πéô",
    "πü¢πéôπü»πéÜπüä",
    "πü¢πéÖπéôπü╡πéÖ",
    "πü¢πéÖπéôπü╗πéÜπüå",
    "πü¢πéôπéÇ",
    "πü¢πéôπéüπéôπüùπéÖπéç",
    "πü¢πéôπééπéô",
    "πü¢πéôπéäπüÅ",
    "πü¢πéôπéåπüå",
    "πü¢πéôπéêπüå",
    "πü¢πéÖπéôπéë",
    "πü¢πéÖπéôπéèπéâπüÅ",
    "πü¢πéôπéîπüä",
    "πü¢πéôπéì",
    "πü¥πüéπüÅ",
    "πü¥πüäπü¿πüæπéÖπéï",
    "πü¥πüäπü¡",
    "πü¥πüåπüïπéÖπéôπüìπéçπüå",
    "πü¥πüåπüì",
    "πü¥πüåπüôπéÖ",
    "πü¥πüåπüùπéô",
    "πü¥πüåπüƒπéÖπéô",
    "πü¥πüåπü¬πéô",
    "πü¥πüåπü▓πéÖ",
    "πü¥πüåπéüπéô",
    "πü¥πüåπéè",
    "πü¥πüêπééπü«",
    "πü¥πüêπéô",
    "πü¥πüïπéÖπüä",
    "πü¥πüæπéÖπüì",
    "πü¥πüôπüå",
    "πü¥πüôπü¥πüô",
    "πü¥πüòπéÖπüä",
    "πü¥πüùπü¬",
    "πü¥πü¢πüä",
    "πü¥πü¢πéô",
    "πü¥πü¥πüÅπéÖ",
    "πü¥πüƒπéÖπüªπéï",
    "πü¥πüñπüå",
    "πü¥πüñπüêπéô",
    "πü¥πüúπüïπéô",
    "πü¥πüñπüìπéÖπéçπüå",
    "πü¥πüúπüæπüñ",
    "πü¥πüúπüôπüå",
    "πü¥πüúπü¢πéô",
    "πü¥πüúπü¿",
    "πü¥πü¿πüïπéÖπéÅ",
    "πü¥πü¿πüñπéÖπéë",
    "πü¥πü¬πüêπéï",
    "πü¥πü¬πüƒ",
    "πü¥πü╡πü╗πéÖ",
    "πü¥πü╗πéÖπüÅ",
    "πü¥πü╗πéÖπéì",
    "πü¥πü╛πüñ",
    "πü¥πü╛πéï",
    "πü¥πéÇπüÅ",
    "πü¥πéÇπéèπüê",
    "πü¥πéüπéï",
    "πü¥πééπü¥πéé",
    "πü¥πéêπüïπü¢πéÖ",
    "πü¥πéëπü╛πéü",
    "πü¥πéìπüå",
    "πü¥πéôπüïπüä",
    "πü¥πéôπüæπüä",
    "πü¥πéôπüòπéÖπüä",
    "πü¥πéôπüùπüñ",
    "πü¥πéôπü¥πéÖπüÅ",
    "πü¥πéôπüíπéçπüå",
    "πü¥πéÖπéôπü▓πéÖ",
    "πü¥πéÖπéôπü╡πéÖπéô",
    "πü¥πéôπü┐πéô",
    "πüƒπüéπüä",
    "πüƒπüäπüäπéô",
    "πüƒπüäπüåπéô",
    "πüƒπüäπüêπüì",
    "πüƒπüäπüèπüå",
    "πüƒπéÖπüäπüïπéÖπüÅ",
    "πüƒπüäπüì",
    "πüƒπüäπüÅπéÖπüå",
    "πüƒπüäπüæπéô",
    "πüƒπüäπüô",
    "πüƒπüäπüòπéÖπüä",
    "πüƒπéÖπüäπüùπéÖπéçπüåπü╡πéÖ",
    "πüƒπéÖπüäπüÖπüì",
    "πüƒπüäπü¢πüñ",
    "πüƒπüäπü¥πüå",
    "πüƒπéÖπüäπüƒπüä",
    "πüƒπüäπüíπéçπüå",
    "πüƒπüäπüªπüä",
    "πüƒπéÖπüäπü¿πéÖπüôπéì",
    "πüƒπüäπü¬πüä",
    "πüƒπüäπü¡πüñ",
    "πüƒπüäπü«πüå",
    "πüƒπüäπü»πéô",
    "πüƒπéÖπüäπü▓πéçπüå",
    "πüƒπüäπü╡πüå",
    "πüƒπüäπü╕πéô",
    "πüƒπüäπü╗",
    "πüƒπüäπü╛πüñπü»πéÖπü¬",
    "πüƒπüäπü┐πéôπüÅπéÖ",
    "πüƒπüäπéÇ",
    "πüƒπüäπéüπéô",
    "πüƒπüäπéäπüì",
    "πüƒπüäπéêπüå",
    "πüƒπüäπéë",
    "πüƒπüäπéèπéçπüÅ",
    "πüƒπüäπéï",
    "πüƒπüäπéÅπéô",
    "πüƒπüåπüê",
    "πüƒπüêπéï",
    "πüƒπüèπüÖ",
    "πüƒπüèπéï",
    "πüƒπüèπéîπéï",
    "πüƒπüïπüä",
    "πüƒπüïπü¡",
    "πüƒπüìπü▓πéÖ",
    "πüƒπüÅπüòπéô",
    "πüƒπüôπüÅ",
    "πüƒπüôπéäπüì",
    "πüƒπüòπüä",
    "πüƒπüùπüòπéÖπéô",
    "πüƒπéÖπüùπéÖπéâπéî",
    "πüƒπüÖπüæπéï",
    "πüƒπüÖπéÖπüòπéÅπéï",
    "πüƒπü¥πüïπéÖπéî",
    "πüƒπüƒπüïπüå",
    "πüƒπüƒπüÅ",
    "πüƒπüƒπéÖπüùπüä",
    "πüƒπüƒπü┐",
    "πüƒπüíπü»πéÖπü¬",
    "πüƒπéÖπüúπüïπüä",
    "πüƒπéÖπüúπüìπéâπüÅ",
    "πüƒπéÖπüúπüô",
    "πüƒπéÖπüúπüùπéàπüñ",
    "πüƒπéÖπüúπüƒπüä",
    "πüƒπüªπéï",
    "πüƒπü¿πüêπéï",
    "πüƒπü¬πü»πéÖπüƒ",
    "πüƒπü½πéô",
    "πüƒπü¼πüì",
    "πüƒπü«πüùπü┐",
    "πüƒπü»πüñ",
    "πüƒπü╡πéÖπéô",
    "πüƒπü╕πéÖπéï",
    "πüƒπü╗πéÖπüå",
    "πüƒπü╛πüôπéÖ",
    "πüƒπü╛πéï",
    "πüƒπéÖπéÇπéï",
    "πüƒπéüπüäπüì",
    "πüƒπéüπüÖ",
    "πüƒπéüπéï",
    "πüƒπééπüñ",
    "πüƒπéäπüÖπüä",
    "πüƒπéêπéï",
    "πüƒπéëπüÖ",
    "πüƒπéèπüìπü╗πéôπüïπéÖπéô",
    "πüƒπéèπéçπüå",
    "πüƒπéèπéï",
    "πüƒπéïπü¿",
    "πüƒπéîπéï",
    "πüƒπéîπéôπü¿",
    "πüƒπéìπüúπü¿",
    "πüƒπéÅπéÇπéîπéï",
    "πüƒπéÖπéôπüéπüñ",
    "πüƒπéôπüä",
    "πüƒπéôπüèπéô",
    "πüƒπéôπüï",
    "πüƒπéôπüì",
    "πüƒπéôπüæπéô",
    "πüƒπéôπüôπéÖ",
    "πüƒπéôπüòπéô",
    "πüƒπéôπüùπéÖπéçπüåπü▓πéÖ",
    "πüƒπéÖπéôπü¢πüä",
    "πüƒπéôπü¥πüÅ",
    "πüƒπéôπüƒπüä",
    "πüƒπéÖπéôπüí",
    "πüƒπéôπüªπüä",
    "πüƒπéôπü¿πüå",
    "πüƒπéÖπéôπü¬",
    "πüƒπéôπü½πéô",
    "πüƒπéÖπéôπü¡πüñ",
    "πüƒπéôπü«πüå",
    "πüƒπéôπü▓πéÜπéô",
    "πüƒπéÖπéôπü╗πéÖπüå",
    "πüƒπéôπü╛πüñ",
    "πüƒπéôπéüπüä",
    "πüƒπéÖπéôπéîπüñ",
    "πüƒπéÖπéôπéì",
    "πüƒπéÖπéôπéÅ",
    "πüíπüéπüä",
    "πüíπüéπéô",
    "πüíπüäπüì",
    "πüíπüäπüòπüä",
    "πüíπüêπéô",
    "πüíπüïπüä",
    "πüíπüïπéë",
    "πüíπüìπéàπüå",
    "πüíπüìπéô",
    "πüíπüæπüäπüÖπéÖ",
    "πüíπüæπéô",
    "πüíπüôπüÅ",
    "πüíπüòπüä",
    "πüíπüùπüì",
    "πüíπüùπéèπéçπüå",
    "πüíπü¢πüä",
    "πüíπü¥πüå",
    "πüíπüƒπüä",
    "πüíπüƒπéô",
    "πüíπüíπüèπéä",
    "πüíπüñπüùπéÖπéç",
    "πüíπüªπüì",
    "πüíπüªπéô",
    "πüíπü¼πüì",
    "πüíπü¼πéè",
    "πüíπü«πüå",
    "πüíπü▓πéçπüå",
    "πüíπü╕πüäπü¢πéô",
    "πüíπü╗πüå",
    "πüíπü╛πüƒ",
    "πüíπü┐πüñ",
    "πüíπü┐πü¿πéÖπéì",
    "πüíπéüπüäπü¿πéÖ",
    "πüíπéâπéôπüôπü¬πü╕πéÖ",
    "πüíπéàπüåπüä",
    "πüíπéåπéèπéçπüÅ",
    "πüíπéçπüåπüù",
    "πüíπéçπüòπüÅπüæπéô",
    "πüíπéëπüù",
    "πüíπéëπü┐",
    "πüíπéèπüïπéÖπü┐",
    "πüíπéèπéçπüå",
    "πüíπéïπü¿πéÖ",
    "πüíπéÅπéÅ",
    "πüíπéôπüƒπüä",
    "πüíπéôπééπüÅ",
    "πüñπüäπüï",
    "πüñπüäπüƒπüí",
    "πüñπüåπüï",
    "πüñπüåπüùπéÖπéçπüå",
    "πüñπüåπü»πéô",
    "πüñπüåπéÅ",
    "πüñπüïπüå",
    "πüñπüïπéîπéï",
    "πüñπüÅπü¡",
    "πüñπüÅπéï",
    "πüñπüæπü¡",
    "πüñπüæπéï",
    "πüñπüôπéÖπüå",
    "πüñπüƒπüêπéï",
    "πüñπüñπéÖπüÅ",
    "πüñπüñπüùπéÖ",
    "πüñπüñπéÇ",
    "πüñπü¿πéüπéï",
    "πüñπü¬πüïπéÖπéï",
    "πüñπü¬πü┐",
    "πüñπü¡πüñπéÖπü¡",
    "πüñπü«πéï",
    "πüñπü╡πéÖπüÖ",
    "πüñπü╛πéëπü¬πüä",
    "πüñπü╛πéï",
    "πüñπü┐πüì",
    "πüñπéüπüƒπüä",
    "πüñπééπéè",
    "πüñπééπéï",
    "πüñπéêπüä",
    "πüñπéïπü╗πéÖ",
    "πüñπéïπü┐πüÅ",
    "πüñπéÅπééπü«",
    "πüñπéÅπéè",
    "πüªπüéπüù",
    "πüªπüéπüª",
    "πüªπüéπü┐",
    "πüªπüäπüèπéô",
    "πüªπüäπüï",
    "πüªπüäπüì",
    "πüªπüäπüæπüä",
    "πüªπüäπüôπüÅ",
    "πüªπüäπüòπüñ",
    "πüªπüäπüù",
    "πüªπüäπü¢πüä",
    "πüªπüäπüƒπüä",
    "πüªπüäπü¿πéÖ",
    "πüªπüäπü¡πüä",
    "πüªπüäπü▓πéçπüå",
    "πüªπüäπü╕πéô",
    "πüªπüäπü╗πéÖπüå",
    "πüªπüåπüí",
    "πüªπüèπüÅπéî",
    "πüªπüìπü¿πüå",
    "πüªπüÅπü▓πéÖ",
    "πüªπéÖπüôπü╗πéÖπüô",
    "πüªπüòπüìπéÖπéçπüå",
    "πüªπüòπüæπéÖ",
    "πüªπüÖπéè",
    "πüªπü¥πüå",
    "πüªπüíπüïπéÖπüä",
    "πüªπüíπéçπüå",
    "πüªπüñπüïπéÖπüÅ",
    "πüªπüñπüñπéÖπüì",
    "πüªπéÖπüúπü»πéÜ",
    "πüªπüñπü╗πéÖπüå",
    "πüªπüñπéä",
    "πüªπéÖπü¼πüïπüê",
    "πüªπü¼πüì",
    "πüªπü¼πüÅπéÖπüä",
    "πüªπü«πü▓πéë",
    "πüªπü»πüä",
    "πüªπü╡πéÖπüÅπéì",
    "πüªπü╡πüƒπéÖ",
    "πüªπü╗πü¿πéÖπüì",
    "πüªπü╗πéô",
    "πüªπü╛πüê",
    "πüªπü╛πüìπüÖπéÖπüù",
    "πüªπü┐πüùπéÖπüï",
    "πüªπü┐πéäπüæπéÖ",
    "πüªπéëπüÖ",
    "πüªπéîπü▓πéÖ",
    "πüªπéÅπüæ",
    "πüªπéÅπüƒπüù",
    "πüªπéÖπéôπüéπüñ",
    "πüªπéôπüäπéô",
    "πüªπéôπüïπüä",
    "πüªπéôπüì",
    "πüªπéôπüÅπéÖ",
    "πüªπéôπüæπéô",
    "πüªπéôπüôπéÖπüÅ",
    "πüªπéôπüòπüä",
    "πüªπéôπüù",
    "πüªπéôπüÖπüå",
    "πüªπéÖπéôπüí",
    "πüªπéôπüªπüì",
    "πüªπéôπü¿πüå",
    "πüªπéôπü¬πüä",
    "πüªπéôπü╡πéÜπéë",
    "πüªπéôπü╗πéÖπüåπüƒπéÖπüä",
    "πüªπéôπéüπüñ",
    "πüªπéôπéëπéôπüïπüä",
    "πüªπéÖπéôπéèπéçπüÅ",
    "πüªπéÖπéôπéÅ",
    "πü¿πéÖπüéπüä",
    "πü¿πüäπéî",
    "πü¿πéÖπüåπüïπéô",
    "πü¿πüåπüìπéàπüå",
    "πü¿πéÖπüåπüÅπéÖ",
    "πü¿πüåπüù",
    "πü¿πüåπéÇπüìπéÖ",
    "πü¿πüèπüä",
    "πü¿πüèπüï",
    "πü¿πüèπüÅ",
    "πü¿πüèπüÖ",
    "πü¿πüèπéï",
    "πü¿πüïπüä",
    "πü¿πüïπüÖ",
    "πü¿πüìπüèπéè",
    "πü¿πüìπü¿πéÖπüì",
    "πü¿πüÅπüä",
    "πü¿πüÅπüùπéàπüå",
    "πü¿πüÅπüªπéô",
    "πü¿πüÅπü½",
    "πü¿πüÅπü╕πéÖπüñ",
    "πü¿πüæπüä",
    "πü¿πüæπéï",
    "πü¿πüôπéä",
    "πü¿πüòπüï",
    "πü¿πüùπéçπüïπéô",
    "πü¿πü¥πüå",
    "πü¿πüƒπéô",
    "πü¿πüíπéàπüå",
    "πü¿πüúπüìπéàπüå",
    "πü¿πüúπüÅπéô",
    "πü¿πüñπü¢πéÖπéô",
    "πü¿πüñπü½πéàπüå",
    "πü¿πü¿πéÖπüæπéï",
    "πü¿πü¿πü«πüêπéï",
    "πü¿πü¬πüä",
    "πü¿πü¬πüêπéï",
    "πü¿πü¬πéè",
    "πü¿πü«πüòπü╛",
    "πü¿πü»πéÖπüÖ",
    "πü¿πéÖπü╡πéÖπüïπéÖπéÅ",
    "πü¿πü╗πüå",
    "πü¿πü╛πéï",
    "πü¿πéüπéï",
    "πü¿πééπüƒπéÖπüí",
    "πü¿πééπéï",
    "πü¿πéÖπéêπüåπü▓πéÖ",
    "πü¿πéëπüêπéï",
    "πü¿πéôπüïπüñ",
    "πü¿πéÖπéôπü╡πéÖπéè",
    "πü¬πüäπüïπüÅ",
    "πü¬πüäπüôπüå",
    "πü¬πüäπüùπéç",
    "πü¬πüäπüÖ",
    "πü¬πüäπü¢πéô",
    "πü¬πüäπü¥πüå",
    "πü¬πüèπüÖ",
    "πü¬πüïπéÖπüä",
    "πü¬πüÅπüÖ",
    "πü¬πüæπéÖπéï",
    "πü¬πüôπüåπü¿πéÖ",
    "πü¬πüòπüæ",
    "πü¬πüƒπüªπéÖπüôπüô",
    "πü¬πüúπü¿πüå",
    "πü¬πüñπéäπüÖπü┐",
    "πü¬πü¬πüèπüù",
    "πü¬πü½πüôπéÖπü¿",
    "πü¬πü½πééπü«",
    "πü¬πü½πéÅ",
    "πü¬πü«πüï",
    "πü¬πü╡πüƒπéÖ",
    "πü¬πü╛πüäπüì",
    "πü¬πü╛πüê",
    "πü¬πü╛πü┐",
    "πü¬πü┐πüƒπéÖ",
    "πü¬πéüπéëπüï",
    "πü¬πéüπéï",
    "πü¬πéäπéÇ",
    "πü¬πéëπüå",
    "πü¬πéëπü▓πéÖ",
    "πü¬πéëπü╡πéÖ",
    "πü¬πéîπéï",
    "πü¬πéÅπü¿πü▓πéÖ",
    "πü¬πéÅπü»πéÖπéè",
    "πü½πüéπüå",
    "πü½πüäπüïπéÖπüƒ",
    "πü½πüåπüæ",
    "πü½πüèπüä",
    "πü½πüïπüä",
    "πü½πüïπéÖπüª",
    "πü½πüìπü▓πéÖ",
    "πü½πüÅπüùπü┐",
    "πü½πüÅπü╛πéô",
    "πü½πüæπéÖπéï",
    "πü½πüòπéôπüïπüƒπéôπü¥",
    "πü½πüùπüì",
    "πü½πü¢πééπü«",
    "πü½πüíπüùπéÖπéçπüå",
    "πü½πüíπéêπüåπü▓πéÖ",
    "πü½πüúπüï",
    "πü½πüúπüì",
    "πü½πüúπüæπüä",
    "πü½πüúπüôπüå",
    "πü½πüúπüòπéô",
    "πü½πüúπüùπéçπüÅ",
    "πü½πüúπüÖπüå",
    "πü½πüúπü¢πüì",
    "πü½πüúπüªπüä",
    "πü½πü¬πüå",
    "πü½πü╗πéô",
    "πü½πü╛πéü",
    "πü½πééπüñ",
    "πü½πéäπéè",
    "πü½πéàπüåπüäπéô",
    "πü½πéèπéôπüùπéâ",
    "πü½πéÅπü¿πéè",
    "πü½πéôπüä",
    "πü½πéôπüï",
    "πü½πéôπüì",
    "πü½πéôπüæπéÖπéô",
    "πü½πéôπüùπüì",
    "πü½πéôπüÖπéÖπüå",
    "πü½πéôπü¥πüå",
    "πü½πéôπüƒπüä",
    "πü½πéôπüí",
    "πü½πéôπüªπüä",
    "πü½πéôπü½πüÅ",
    "πü½πéôπü╡πéÜ",
    "πü½πéôπü╛πéè",
    "πü½πéôπéÇ",
    "πü½πéôπéüπüä",
    "πü½πéôπéêπüå",
    "πü¼πüäπüÅπüìπéÖ",
    "πü¼πüïπüÖ",
    "πü¼πüÅπéÖπüäπü¿πéï",
    "πü¼πüÅπéÖπüå",
    "πü¼πüÅπééπéè",
    "πü¼πüÖπéÇ",
    "πü¼πü╛πüêπü▓πéÖ",
    "πü¼πéüπéè",
    "πü¼πéëπüÖ",
    "πü¼πéôπüíπéâπüÅ",
    "πü¡πüéπüæπéÖ",
    "πü¡πüäπüì",
    "πü¡πüäπéï",
    "πü¡πüäπéì",
    "πü¡πüÅπéÖπü¢",
    "πü¡πüÅπüƒπüä",
    "πü¡πüÅπéë",
    "πü¡πüôπü¢πéÖ",
    "πü¡πüôπéÇ",
    "πü¡πüòπüæπéÖ",
    "πü¡πüÖπüôπéÖπüÖ",
    "πü¡πü¥πü╕πéÖπéï",
    "πü¡πüƒπéÖπéô",
    "πü¡πüñπüä",
    "πü¡πüúπüùπéô",
    "πü¡πüñπü¥πéÖπüå",
    "πü¡πüúπüƒπüäπüìπéÖπéç",
    "πü¡πü╡πéÖπü¥πüÅ",
    "πü¡πü╡πüƒπéÖ",
    "πü¡πü╗πéÖπüå",
    "πü¡πü╗πéèπü»πü╗πéè",
    "πü¡πü╛πüì",
    "πü¡πü╛πéÅπüù",
    "πü¡πü┐πü┐",
    "πü¡πéÇπüä",
    "πü¡πéÇπüƒπüä",
    "πü¡πééπü¿",
    "πü¡πéëπüå",
    "πü¡πéÅπüòπéÖ",
    "πü¡πéôπüäπéè",
    "πü¡πéôπüèπüù",
    "πü¡πéôπüïπéô",
    "πü¡πéôπüìπéô",
    "πü¡πéôπüÅπéÖ",
    "πü¡πéôπüòπéÖ",
    "πü¡πéôπüù",
    "πü¡πéôπüíπéâπüÅ",
    "πü¡πéôπü¿πéÖ",
    "πü¡πéôπü▓πéÜ",
    "πü¡πéôπü╡πéÖπüñ",
    "πü¡πéôπü╛πüñ",
    "πü¡πéôπéèπéçπüå",
    "πü¡πéôπéîπüä",
    "πü«πüäπüÖπéÖ",
    "πü«πüèπüñπéÖπü╛",
    "πü«πüïπéÖπüÖ",
    "πü«πüìπü¬πü┐",
    "πü«πüôπüìπéÖπéè",
    "πü«πüôπüÖ",
    "πü«πüôπéï",
    "πü«πü¢πéï",
    "πü«πü¥πéÖπüÅ",
    "πü«πü¥πéÖπéÇ",
    "πü«πüƒπü╛πüå",
    "πü«πüíπü╗πü¿πéÖ",
    "πü«πüúπüÅ",
    "πü«πü»πéÖπüÖ",
    "πü«πü»πéë",
    "πü«πü╕πéÖπéï",
    "πü«πü╗πéÖπéï",
    "πü«πü┐πééπü«",
    "πü«πéäπü╛",
    "πü«πéëπüäπü¼",
    "πü«πéëπü¡πüô",
    "πü«πéèπééπü«",
    "πü«πéèπéåπüì",
    "πü«πéîπéô",
    "πü«πéôπüì",
    "πü»πéÖπüéπüä",
    "πü»πüéπüÅ",
    "πü»πéÖπüéπüòπéô",
    "πü»πéÖπüäπüï",
    "πü»πéÖπüäπüÅ",
    "πü»πüäπüæπéô",
    "πü»πüäπüôπéÖ",
    "πü»πüäπüùπéô",
    "πü»πüäπüÖπüä",
    "πü»πüäπü¢πéô",
    "πü»πüäπü¥πüå",
    "πü»πüäπüí",
    "πü»πéÖπüäπü»πéÖπüä",
    "πü»πüäπéîπüñ",
    "πü»πüêπéï",
    "πü»πüèπéï",
    "πü»πüïπüä",
    "πü»πéÖπüïπéè",
    "πü»πüïπéï",
    "πü»πüÅπüùπéà",
    "πü»πüæπéô",
    "πü»πüôπü╡πéÖ",
    "πü»πüòπü┐",
    "πü»πüòπéô",
    "πü»πüùπüôπéÖ",
    "πü»πéÖπüùπéç",
    "πü»πüùπéï",
    "πü»πü¢πéï",
    "πü»πéÜπü¥πüôπéô",
    "πü»πü¥πéô",
    "πü»πüƒπéô",
    "πü»πüíπü┐πüñ",
    "πü»πüñπüèπéô",
    "πü»πüúπüïπüÅ",
    "πü»πüñπéÖπüì",
    "πü»πüúπüìπéè",
    "πü»πüúπüÅπüñ",
    "πü»πüúπüæπéô",
    "πü»πüúπüôπüå",
    "πü»πüúπüòπéô",
    "πü»πüúπüùπéô",
    "πü»πüúπüƒπüñ",
    "πü»πüúπüíπéàπüå",
    "πü»πüúπüªπéô",
    "πü»πüúπü▓πéÜπéçπüå",
    "πü»πüúπü╗πéÜπüå",
    "πü»πü¬πüÖ",
    "πü»πü¬πü▓πéÖ",
    "πü»πü½πüïπéÇ",
    "πü»πü╡πéÖπéëπüù",
    "πü»πü┐πüïπéÖπüì",
    "πü»πéÇπüïπüå",
    "πü»πéüπüñ",
    "πü»πéäπüä",
    "πü»πéäπüù",
    "πü»πéëπüå",
    "πü»πéìπüåπüâπéô",
    "πü»πéÅπüä",
    "πü»πéôπüä",
    "πü»πéôπüêπüä",
    "πü»πéôπüèπéô",
    "πü»πéôπüïπüÅ",
    "πü»πéôπüìπéçπüå",
    "πü»πéÖπéôπüÅπéÖπü┐",
    "πü»πéôπüô",
    "πü»πéôπüùπéâ",
    "πü»πéôπüÖπüå",
    "πü»πéôπüƒπéÖπéô",
    "πü»πéÜπéôπüí",
    "πü»πéÜπéôπüñ",
    "πü»πéôπüªπüä",
    "πü»πéôπü¿πüù",
    "πü»πéôπü«πüå",
    "πü»πéôπü»πéÜ",
    "πü»πéôπü╡πéÖπéô",
    "πü»πéôπü╕πéÜπéô",
    "πü»πéôπü╗πéÖπüåπüì",
    "πü»πéôπéüπüä",
    "πü»πéôπéëπéô",
    "πü»πéôπéìπéô",
    "πü▓πüäπüì",
    "πü▓πüåπéô",
    "πü▓πüêπéï",
    "πü▓πüïπüÅ",
    "πü▓πüïπéè",
    "πü▓πüïπéï",
    "πü▓πüïπéô",
    "πü▓πüÅπüä",
    "πü▓πüæπüñ",
    "πü▓πüôπüåπüì",
    "πü▓πüôπüÅ",
    "πü▓πüòπüä",
    "πü▓πüòπüùπü╡πéÖπéè",
    "πü▓πüòπéô",
    "πü▓πéÖπüùπéÖπéàπüñπüïπéô",
    "πü▓πüùπéç",
    "πü▓πü¥πüï",
    "πü▓πü¥πéÇ",
    "πü▓πüƒπéÇπüì",
    "πü▓πüƒπéÖπéè",
    "πü▓πüƒπéï",
    "πü▓πüñπüìπéÖ",
    "πü▓πüúπüôπüù",
    "πü▓πüúπüù",
    "πü▓πüñπüùπéÖπéàπü▓πéô",
    "πü▓πüúπüÖ",
    "πü▓πüñπü¢πéÖπéô",
    "πü▓πéÜπüúπüƒπéè",
    "πü▓πéÜπüúπüíπéè",
    "πü▓πüñπéêπüå",
    "πü▓πüªπüä",
    "πü▓πü¿πüôπéÖπü┐",
    "πü▓πü¬πü╛πüñπéè",
    "πü▓πü¬πéô",
    "πü▓πü¡πéï",
    "πü▓πü»πéô",
    "πü▓πü▓πéÖπüÅ",
    "πü▓πü▓πéçπüå",
    "πü▓πü╗πüå",
    "πü▓πü╛πéÅπéè",
    "πü▓πü╛πéô",
    "πü▓πü┐πüñ",
    "πü▓πéüπüä",
    "πü▓πéüπüùπéÖπüù",
    "πü▓πéäπüæ",
    "πü▓πéäπüÖ",
    "πü▓πéêπüå",
    "πü▓πéÖπéçπüåπüì",
    "πü▓πéëπüïπéÖπü¬",
    "πü▓πéëπüÅ",
    "πü▓πéèπüñ",
    "πü▓πéèπéçπüå",
    "πü▓πéïπü╛",
    "πü▓πéïπéäπüÖπü┐",
    "πü▓πéîπüä",
    "πü▓πéìπüä",
    "πü▓πéìπüå",
    "πü▓πéìπüì",
    "πü▓πéìπéåπüì",
    "πü▓πéôπüïπüÅ",
    "πü▓πéôπüæπüñ",
    "πü▓πéôπüôπéô",
    "πü▓πéôπüùπéà",
    "πü▓πéôπü¥πüå",
    "πü▓πéÜπéôπüí",
    "πü▓πéôπü»πéÜπéô",
    "πü▓πéÖπéôπü╗πéÖπüå",
    "πü╡πüéπéô",
    "πü╡πüäπüåπüí",
    "πü╡πüåπüæπüä",
    "πü╡πüåπü¢πéô",
    "πü╡πéÜπüåπüƒπéìπüå",
    "πü╡πüåπü¿πüå",
    "πü╡πüåπü╡",
    "πü╡πüêπéï",
    "πü╡πüèπéô",
    "πü╡πüïπüä",
    "πü╡πüìπéô",
    "πü╡πüÅπüòπéÖπüñ",
    "πü╡πüÅπü╡πéÖπüÅπéì",
    "πü╡πüôπüå",
    "πü╡πüòπüä",
    "πü╡πüùπüìπéÖ",
    "πü╡πüùπéÖπü┐",
    "πü╡πüÖπü╛",
    "πü╡πü¢πüä",
    "πü╡πü¢πüÅπéÖ",
    "πü╡πü¥πüÅ",
    "πü╡πéÖπüƒπü½πüÅ",
    "πü╡πüƒπéô",
    "πü╡πüíπéçπüå",
    "πü╡πüñπüå",
    "πü╡πüñπüï",
    "πü╡πüúπüïπüñ",
    "πü╡πüúπüì",
    "πü╡πüúπüôπüÅ",
    "πü╡πéÖπü¿πéÖπüå",
    "πü╡πü¿πéï",
    "πü╡πü¿πéô",
    "πü╡πü«πüå",
    "πü╡πü»πüä",
    "πü╡πü▓πéçπüå",
    "πü╡πü╕πéô",
    "πü╡πü╛πéô",
    "πü╡πü┐πéô",
    "πü╡πéüπüñ",
    "πü╡πéüπéô",
    "πü╡πéêπüå",
    "πü╡πéèπüô",
    "πü╡πéèπéï",
    "πü╡πéïπüä",
    "πü╡πéôπüäπüì",
    "πü╡πéÖπéôπüïπéÖπüÅ",
    "πü╡πéÖπéôπüÅπéÖ",
    "πü╡πéôπüùπüñ",
    "πü╡πéÖπéôπü¢πüì",
    "πü╡πéôπü¥πüå",
    "πü╡πéÖπéôπü╗πéÜπüå",
    "πü╕πüäπüéπéô",
    "πü╕πüäπüèπéô",
    "πü╕πüäπüïπéÖπüä",
    "πü╕πüäπüì",
    "πü╕πüäπüæπéÖπéô",
    "πü╕πüäπüôπüå",
    "πü╕πüäπüò",
    "πü╕πüäπüùπéâ",
    "πü╕πüäπü¢πüñ",
    "πü╕πüäπü¥",
    "πü╕πüäπüƒπüÅ",
    "πü╕πüäπüªπéô",
    "πü╕πüäπü¡πüñ",
    "πü╕πüäπéÅ",
    "πü╕πüìπüïπéÖ",
    "πü╕πüôπéÇ",
    "πü╕πéÖπü½πüäπéì",
    "πü╕πéÖπü½πüùπéçπüåπüïπéÖ",
    "πü╕πéëπüÖ",
    "πü╕πéôπüïπéô",
    "πü╕πéÖπéôπüìπéçπüå",
    "πü╕πéÖπéôπüôπéÖπüù",
    "πü╕πéôπüòπüä",
    "πü╕πéôπüƒπüä",
    "πü╕πéÖπéôπéè",
    "πü╗πüéπéô",
    "πü╗πüäπüÅ",
    "πü╗πéÖπüåπüìπéÖπéç",
    "πü╗πüåπüôπüÅ",
    "πü╗πüåπü¥πüå",
    "πü╗πüåπü╗πüå",
    "πü╗πüåπééπéô",
    "πü╗πüåπéèπüñ",
    "πü╗πüêπéï",
    "πü╗πüèπéô",
    "πü╗πüïπéô",
    "πü╗πüìπéçπüå",
    "πü╗πéÖπüìπéô",
    "πü╗πüÅπéì",
    "πü╗πüæπüñ",
    "πü╗πüæπéô",
    "πü╗πüôπüå",
    "πü╗πüôπéï",
    "πü╗πüùπüä",
    "πü╗πüùπüñ",
    "πü╗πüùπéà",
    "πü╗πüùπéçπüå",
    "πü╗πü¢πüä",
    "πü╗πü¥πüä",
    "πü╗πü¥πüÅ",
    "πü╗πüƒπüª",
    "πü╗πüƒπéï",
    "πü╗πéÜπüíπü╡πéÖπüÅπéì",
    "πü╗πüúπüìπéçπüÅ",
    "πü╗πüúπüò",
    "πü╗πüúπüƒπéô",
    "πü╗πü¿πéôπü¿πéÖ",
    "πü╗πéüπéï",
    "πü╗πéôπüä",
    "πü╗πéôπüì",
    "πü╗πéôπüæ",
    "πü╗πéôπüùπüñ",
    "πü╗πéôπéäπüÅ",
    "πü╛πüäπü½πüí",
    "πü╛πüïπüä",
    "πü╛πüïπü¢πéï",
    "πü╛πüïπéÖπéï",
    "πü╛πüæπéï",
    "πü╛πüôπü¿",
    "πü╛πüòπüñ",
    "πü╛πüùπéÖπéü",
    "πü╛πüÖπüÅ",
    "πü╛πü¢πéÖπéï",
    "πü╛πüñπéè",
    "πü╛πü¿πéü",
    "πü╛πü¬πü╡πéÖ",
    "πü╛πü¼πüæ",
    "πü╛πü¡πüÅ",
    "πü╛πü╗πüå",
    "πü╛πééπéï",
    "πü╛πéåπüæπéÖ",
    "πü╛πéêπüå",
    "πü╛πéìπéäπüï",
    "πü╛πéÅπüÖ",
    "πü╛πéÅπéè",
    "πü╛πéÅπéï",
    "πü╛πéôπüïπéÖ",
    "πü╛πéôπüìπüñ",
    "πü╛πéôπü¥πéÖπüÅ",
    "πü╛πéôπü¬πüï",
    "πü┐πüäπéë",
    "πü┐πüåπüí",
    "πü┐πüêπéï",
    "πü┐πüïπéÖπüÅ",
    "πü┐πüïπüƒ",
    "πü┐πüïπéô",
    "πü┐πüæπéô",
    "πü┐πüôπéô",
    "πü┐πüùπéÖπüïπüä",
    "πü┐πüÖπüä",
    "πü┐πüÖπüêπéï",
    "πü┐πü¢πéï",
    "πü┐πüúπüï",
    "πü┐πüñπüïπéï",
    "πü┐πüñπüæπéï",
    "πü┐πüªπüä",
    "πü┐πü¿πéüπéï",
    "πü┐πü¬πü¿",
    "πü┐πü¬πü┐πüïπüòπüä",
    "πü┐πü¡πéëπéï",
    "πü┐πü«πüå",
    "πü┐πü«πüïπéÖπüÖ",
    "πü┐πü╗πéô",
    "πü┐πééπü¿",
    "πü┐πéäπüæπéÖ",
    "πü┐πéëπüä",
    "πü┐πéèπéçπüÅ",
    "πü┐πéÅπüÅ",
    "πü┐πéôπüï",
    "πü┐πéôπü¥πéÖπüÅ",
    "πéÇπüäπüï",
    "πéÇπüêπüì",
    "πéÇπüêπéô",
    "πéÇπüïπüä",
    "πéÇπüïπüå",
    "πéÇπüïπüê",
    "πéÇπüïπüù",
    "πéÇπüìπéÖπüíπéâ",
    "πéÇπüæπéï",
    "πéÇπüæπéÖπéô",
    "πéÇπüòπü╗πéÖπéï",
    "πéÇπüùπüéπüñπüä",
    "πéÇπüùπü»πéÖ",
    "πéÇπüùπéÖπéàπéô",
    "πéÇπüùπéì",
    "πéÇπüÖπüå",
    "πéÇπüÖπüô",
    "πéÇπüÖπü╡πéÖ",
    "πéÇπüÖπéü",
    "πéÇπü¢πéï",
    "πéÇπü¢πéô",
    "πéÇπüíπéàπüå",
    "πéÇπü¬πüùπüä",
    "πéÇπü«πüå",
    "πéÇπéäπü┐",
    "πéÇπéêπüå",
    "πéÇπéëπüòπüì",
    "πéÇπéèπéçπüå",
    "πéÇπéìπéô",
    "πéüπüäπüéπéô",
    "πéüπüäπüåπéô",
    "πéüπüäπüêπéô",
    "πéüπüäπüïπüÅ",
    "πéüπüäπüìπéçπüÅ",
    "πéüπüäπüòπüä",
    "πéüπüäπüù",
    "πéüπüäπü¥πüå",
    "πéüπüäπü╡πéÖπüñ",
    "πéüπüäπéîπüä",
    "πéüπüäπéÅπüÅ",
    "πéüπüÅπéÖπü╛πéîπéï",
    "πéüπüòπéÖπüÖ",
    "πéüπüùπüƒ",
    "πéüπüÖπéÖπéëπüùπüä",
    "πéüπüƒπéÖπüñ",
    "πéüπü╛πüä",
    "πéüπéäπüÖ",
    "πéüπéôπüìπéç",
    "πéüπéôπü¢πüì",
    "πéüπéôπü¿πéÖπüå",
    "πééπüåπüùπüéπüæπéÖπéï",
    "πééπüåπü¿πéÖπüåπüæπéô",
    "πééπüêπéï",
    "πééπüÅπüù",
    "πééπüÅπüªπüì",
    "πééπüÅπéêπüåπü▓πéÖ",
    "πééπüíπéìπéô",
    "πééπü¿πéÖπéï",
    "πééπéëπüå",
    "πééπéôπüÅ",
    "πééπéôπüƒπéÖπüä",
    "πéäπüèπéä",
    "πéäπüæπéï",
    "πéäπüòπüä",
    "πéäπüòπüùπüä",
    "πéäπüÖπüä",
    "πéäπüÖπüƒπéìπüå",
    "πéäπüÖπü┐",
    "πéäπü¢πéï",
    "πéäπü¥πüå",
    "πéäπüƒπüä",
    "πéäπüíπéô",
    "πéäπüúπü¿",
    "πéäπüúπü»πéÜπéè",
    "πéäπü╡πéÖπéï",
    "πéäπéüπéï",
    "πéäπéäπüôπüùπüä",
    "πéäπéêπüä",
    "πéäπéÅπéëπüïπüä",
    "πéåπüåπüì",
    "πéåπüåπü▓πéÖπéôπüìπéçπüÅ",
    "πéåπüåπü╕πéÖ",
    "πéåπüåπéüπüä",
    "πéåπüæπüñ",
    "πéåπüùπéàπüñ",
    "πéåπü¢πéô",
    "πéåπü¥πüå",
    "πéåπüƒπüï",
    "πéåπüíπéâπüÅ",
    "πéåπüªπéÖπéï",
    "πéåπü½πéàπüå",
    "πéåπü▓πéÖπéÅ",
    "πéåπéëπüä",
    "πéåπéîπéï",
    "πéêπüåπüä",
    "πéêπüåπüï",
    "πéêπüåπüìπéàπüå",
    "πéêπüåπüùπéÖ",
    "πéêπüåπüÖ",
    "πéêπüåπüíπüêπéô",
    "πéêπüïπü¢πéÖ",
    "πéêπüïπéô",
    "πéêπüìπéô",
    "πéêπüÅπü¢πüä",
    "πéêπüÅπü╗πéÖπüå",
    "πéêπüæπüä",
    "πéêπüôπéÖπéîπéï",
    "πéêπüòπéô",
    "πéêπüùπéàπüå",
    "πéêπü¥πüå",
    "πéêπü¥πüÅ",
    "πéêπüúπüï",
    "πéêπüªπüä",
    "πéêπü¿πéÖπüïπéÖπéÅπüÅ",
    "πéêπü¡πüñ",
    "πéêπéäπüÅ",
    "πéêπéåπüå",
    "πéêπéìπüôπü╡πéÖ",
    "πéêπéìπüùπüä",
    "πéëπüäπüå",
    "πéëπüÅπüïπéÖπüì",
    "πéëπüÅπüôπéÖ",
    "πéëπüÅπüòπüñ",
    "πéëπüÅπüƒπéÖ",
    "πéëπüùπéôπü»πéÖπéô",
    "πéëπü¢πéô",
    "πéëπü¥πéÖπüÅ",
    "πéëπüƒπüä",
    "πéëπüúπüï",
    "πéëπéîπüñ",
    "πéèπüêπüì",
    "πéèπüïπüä",
    "πéèπüìπüòπüÅ",
    "πéèπüìπü¢πüñ",
    "πéèπüÅπüÅπéÖπéô",
    "πéèπüÅπüñ",
    "πéèπüæπéô",
    "πéèπüôπüå",
    "πéèπü¢πüä",
    "πéèπü¥πüå",
    "πéèπü¥πüÅ",
    "πéèπüªπéô",
    "πéèπü¡πéô",
    "πéèπéåπüå",
    "πéèπéàπüåπüïπéÖπüÅ",
    "πéèπéêπüå",
    "πéèπéçπüåπéè",
    "πéèπéçπüïπéô",
    "πéèπéçπüÅπüíπéâ",
    "πéèπéçπüôπüå",
    "πéèπéèπüÅ",
    "πéèπéîπüì",
    "πéèπéìπéô",
    "πéèπéôπüôπéÖ",
    "πéïπüäπüæπüä",
    "πéïπüäπüòπüä",
    "πéïπüäπüùπéÖ",
    "πéïπüäπü¢πüì",
    "πéïπüÖπü»πéÖπéô",
    "πéïπéèπüïπéÖπéÅπéë",
    "πéîπüäπüïπéô",
    "πéîπüäπüìπéÖ",
    "πéîπüäπü¢πüä",
    "πéîπüäπü¥πéÖπüåπüô",
    "πéîπüäπü¿πüå",
    "πéîπüäπü╗πéÖπüå",
    "πéîπüìπüù",
    "πéîπüìπüƒπéÖπüä",
    "πéîπéôπüéπüä",
    "πéîπéôπüæπüä",
    "πéîπéôπüôπéô",
    "πéîπéôπüòπüä",
    "πéîπéôπüùπéàπüå",
    "πéîπéôπü¥πéÖπüÅ",
    "πéîπéôπéëπüÅ",
    "πéìπüåπüï",
    "πéìπüåπüôπéÖ",
    "πéìπüåπüùπéÖπéô",
    "πéìπüåπü¥πüÅ",
    "πéìπüÅπüïπéÖ",
    "πéìπüôπüñ",
    "πéìπüùπéÖπüåπéë",
    "πéìπüùπéàπüñ",
    "πéìπü¢πéô",
    "πéìπüªπéô",
    "πéìπéüπéô",
    "πéìπéîπüñ",
    "πéìπéôπüìπéÖ",
    "πéìπéôπü»πéÜ",
    "πéìπéôπü╡πéÖπéô",
    "πéìπéôπéè",
    "πéÅπüïπüÖ",
    "πéÅπüïπéü",
    "πéÅπüïπéäπü╛",
    "πéÅπüïπéîπéï",
    "πéÅπüùπüñ",
    "πéÅπüùπéÖπü╛πüù",
    "πéÅπüÖπéîπééπü«",
    "πéÅπéëπüå",
    "πéÅπéîπéï"
]

},{}],35:[function(require,module,exports){
module.exports=[
    "ßäÇßàíßäÇßàºßå¿",
    "ßäÇßàíßäüßà│ßå╖",
    "ßäÇßàíßäéßàíßå½",
    "ßäÇßàíßäéßà│ßå╝",
    "ßäÇßàíßäâßà│ßå¿",
    "ßäÇßàíßäàßà│ßäÄßà╡ßå╖",
    "ßäÇßàíßäåßà«ßå╖",
    "ßäÇßàíßäçßàíßå╝",
    "ßäÇßàíßäëßàíßå╝",
    "ßäÇßàíßäëßà│ßå╖",
    "ßäÇßàíßäïßà«ßå½ßäâßàª",
    "ßäÇßàíßäïßà│ßå»",
    "ßäÇßàíßäïßà╡ßäâßà│",
    "ßäÇßàíßäïßà╡ßå╕",
    "ßäÇßàíßäîßàíßå╝",
    "ßäÇßàíßäîßàÑßå╝",
    "ßäÇßàíßäîßà⌐ßå¿",
    "ßäÇßàíßäîßà«ßå¿",
    "ßäÇßàíßå¿ßäïßà⌐",
    "ßäÇßàíßå¿ßäîßàí",
    "ßäÇßàíßå½ßäÇßàºßå¿",
    "ßäÇßàíßå½ßäçßà«",
    "ßäÇßàíßå½ßäëßàÑßå╕",
    "ßäÇßàíßå½ßäîßàíßå╝",
    "ßäÇßàíßå½ßäîßàÑßå╕",
    "ßäÇßàíßå½ßäæßàíßå½",
    "ßäÇßàíßå»ßäâßà│ßå╝",
    "ßäÇßàíßå»ßäçßà╡",
    "ßäÇßàíßå»ßäëßàóßå¿",
    "ßäÇßàíßå»ßäîßà│ßå╝",
    "ßäÇßàíßå╖ßäÇßàíßå¿",
    "ßäÇßàíßå╖ßäÇßà╡",
    "ßäÇßàíßå╖ßäëßà⌐",
    "ßäÇßàíßå╖ßäëßà«ßäëßàÑßå╝",
    "ßäÇßàíßå╖ßäîßàí",
    "ßäÇßàíßå╖ßäîßàÑßå╝",
    "ßäÇßàíßå╕ßäîßàíßäÇßà╡",
    "ßäÇßàíßå╝ßäéßàíßå╖",
    "ßäÇßàíßå╝ßäâßàíßå╝",
    "ßäÇßàíßå╝ßäâßà⌐",
    "ßäÇßàíßå╝ßäàßàºßå¿ßäÆßà╡",
    "ßäÇßàíßå╝ßäçßàºßå½",
    "ßäÇßàíßå╝ßäçßà«ßå¿",
    "ßäÇßàíßå╝ßäëßàí",
    "ßäÇßàíßå╝ßäëßà«ßäàßàúßå╝",
    "ßäÇßàíßå╝ßäïßàíßäîßà╡",
    "ßäÇßàíßå╝ßäïßà»ßå½ßäâßà⌐",
    "ßäÇßàíßå╝ßäïßà┤",
    "ßäÇßàíßå╝ßäîßàª",
    "ßäÇßàíßå╝ßäîßà⌐",
    "ßäÇßàíßçÇßäïßà╡",
    "ßäÇßàóßäÇßà«ßäàßà╡",
    "ßäÇßàóßäéßàíßäàßà╡",
    "ßäÇßàóßäçßàíßå╝",
    "ßäÇßàóßäçßàºßå»",
    "ßäÇßàóßäëßàÑßå½",
    "ßäÇßàóßäëßàÑßå╝",
    "ßäÇßàóßäïßà╡ßå½",
    "ßäÇßàóßå¿ßäÇßà¬ßå½ßäîßàÑßå¿",
    "ßäÇßàÑßäëßà╡ßå»",
    "ßäÇßàÑßäïßàóßå¿",
    "ßäÇßàÑßäïßà«ßå»",
    "ßäÇßàÑßäîßà╡ßå║",
    "ßäÇßàÑßäæßà«ßå╖",
    "ßäÇßàÑßå¿ßäîßàÑßå╝",
    "ßäÇßàÑßå½ßäÇßàíßå╝",
    "ßäÇßàÑßå½ßäåßà«ßå»",
    "ßäÇßàÑßå½ßäëßàÑßå»",
    "ßäÇßàÑßå½ßäîßà⌐",
    "ßäÇßàÑßå½ßäÄßà«ßå¿",
    "ßäÇßàÑßå»ßäïßà│ßå╖",
    "ßäÇßàÑßå╖ßäëßàí",
    "ßäÇßàÑßå╖ßäÉßà⌐",
    "ßäÇßàªßäëßà╡ßäæßàíßå½",
    "ßäÇßàªßäïßà╡ßå╖",
    "ßäÇßàºßäïßà«ßå»",
    "ßäÇßàºßå½ßäÆßàó",
    "ßäÇßàºßå»ßäÇßà¬",
    "ßäÇßàºßå»ßäÇßà«ßå¿",
    "ßäÇßàºßå»ßäàßà⌐ßå½",
    "ßäÇßàºßå»ßäëßàÑßå¿",
    "ßäÇßàºßå»ßäëßà│ßå╝",
    "ßäÇßàºßå»ßäëßà╡ßå╖",
    "ßäÇßàºßå»ßäîßàÑßå╝",
    "ßäÇßàºßå»ßäÆßà⌐ßå½",
    "ßäÇßàºßå╝ßäÇßà¿",
    "ßäÇßàºßå╝ßäÇßà⌐",
    "ßäÇßàºßå╝ßäÇßà╡",
    "ßäÇßàºßå╝ßäàßàºßå¿",
    "ßäÇßàºßå╝ßäçßà⌐ßå¿ßäÇßà«ßå╝",
    "ßäÇßàºßå╝ßäçßà╡",
    "ßäÇßàºßå╝ßäëßàíßå╝ßäâßà⌐",
    "ßäÇßàºßå╝ßäïßàºßå╝",
    "ßäÇßàºßå╝ßäïßà«",
    "ßäÇßàºßå╝ßäîßàóßå╝",
    "ßäÇßàºßå╝ßäîßàª",
    "ßäÇßàºßå╝ßäîßà«",
    "ßäÇßàºßå╝ßäÄßàíßå»",
    "ßäÇßàºßå╝ßäÄßà╡",
    "ßäÇßàºßå╝ßäÆßàúßå╝",
    "ßäÇßàºßå╝ßäÆßàÑßå╖",
    "ßäÇßà¿ßäÇßà⌐ßå¿",
    "ßäÇßà¿ßäâßàíßå½",
    "ßäÇßà¿ßäàßàíßå½",
    "ßäÇßà¿ßäëßàíßå½",
    "ßäÇßà¿ßäëßà⌐ßå¿",
    "ßäÇßà¿ßäïßàúßå¿",
    "ßäÇßà¿ßäîßàÑßå»",
    "ßäÇßà¿ßäÄßà│ßå╝",
    "ßäÇßà¿ßäÆßà¼ßå¿",
    "ßäÇßà⌐ßäÇßàóßå¿",
    "ßäÇßà⌐ßäÇßà«ßäàßàº",
    "ßäÇßà⌐ßäÇßà«ßå╝",
    "ßäÇßà⌐ßäÇßà│ßå╕",
    "ßäÇßà⌐ßäâßà│ßå╝ßäÆßàíßå¿ßäëßàóßå╝",
    "ßäÇßà⌐ßäåßà«ßäëßà╡ßå½",
    "ßäÇßà⌐ßäåßà╡ßå½",
    "ßäÇßà⌐ßäïßàúßå╝ßäïßà╡",
    "ßäÇßà⌐ßäîßàíßå╝",
    "ßäÇßà⌐ßäîßàÑßå½",
    "ßäÇßà⌐ßäîßà╡ßå╕",
    "ßäÇßà⌐ßäÄßà«ßå║ßäÇßàíßäàßà«",
    "ßäÇßà⌐ßäÉßà⌐ßå╝",
    "ßäÇßà⌐ßäÆßàúßå╝",
    "ßäÇßà⌐ßå¿ßäëßà╡ßå¿",
    "ßäÇßà⌐ßå»ßäåßà⌐ßå¿",
    "ßäÇßà⌐ßå»ßäìßàíßäÇßà╡",
    "ßäÇßà⌐ßå»ßäæßà│",
    "ßäÇßà⌐ßå╝ßäÇßàíßå½",
    "ßäÇßà⌐ßå╝ßäÇßàó",
    "ßäÇßà⌐ßå╝ßäÇßàºßå¿",
    "ßäÇßà⌐ßå╝ßäÇßà«ßå½",
    "ßäÇßà⌐ßå╝ßäÇßà│ßå╕",
    "ßäÇßà⌐ßå╝ßäÇßà╡",
    "ßäÇßà⌐ßå╝ßäâßà⌐ßå╝",
    "ßäÇßà⌐ßå╝ßäåßà«ßäïßà»ßå½",
    "ßäÇßà⌐ßå╝ßäçßà«",
    "ßäÇßà⌐ßå╝ßäëßàí",
    "ßäÇßà⌐ßå╝ßäëßà╡ßå¿",
    "ßäÇßà⌐ßå╝ßäïßàÑßå╕",
    "ßäÇßà⌐ßå╝ßäïßàºßå½",
    "ßäÇßà⌐ßå╝ßäïßà»ßå½",
    "ßäÇßà⌐ßå╝ßäîßàíßå╝",
    "ßäÇßà⌐ßå╝ßäìßàí",
    "ßäÇßà⌐ßå╝ßäÄßàóßå¿",
    "ßäÇßà⌐ßå╝ßäÉßà⌐ßå╝",
    "ßäÇßà⌐ßå╝ßäæßà⌐",
    "ßäÇßà⌐ßå╝ßäÆßàíßå╝",
    "ßäÇßà⌐ßå╝ßäÆßà▓ßäïßà╡ßå»",
    "ßäÇßà¬ßäåßà⌐ßå¿",
    "ßäÇßà¬ßäïßà╡ßå»",
    "ßäÇßà¬ßäîßàíßå╝",
    "ßäÇßà¬ßäîßàÑßå╝",
    "ßäÇßà¬ßäÆßàíßå¿",
    "ßäÇßà¬ßå½ßäÇßàóßå¿",
    "ßäÇßà¬ßå½ßäÇßà¿",
    "ßäÇßà¬ßå½ßäÇßà¬ßå╝",
    "ßäÇßà¬ßå½ßäéßàºßå╖",
    "ßäÇßà¬ßå½ßäàßàíßå╖",
    "ßäÇßà¬ßå½ßäàßàºßå½",
    "ßäÇßà¬ßå½ßäàßà╡",
    "ßäÇßà¬ßå½ßäëßà│ßå╕",
    "ßäÇßà¬ßå½ßäëßà╡ßå╖",
    "ßäÇßà¬ßå½ßäîßàÑßå╖",
    "ßäÇßà¬ßå½ßäÄßàíßå»",
    "ßäÇßà¬ßå╝ßäÇßàºßå╝",
    "ßäÇßà¬ßå╝ßäÇßà⌐",
    "ßäÇßà¬ßå╝ßäîßàíßå╝",
    "ßäÇßà¬ßå╝ßäîßà«",
    "ßäÇßà¼ßäàßà⌐ßäïßà«ßå╖",
    "ßäÇßà¼ßå╝ßäîßàíßå╝ßäÆßà╡",
    "ßäÇßà¡ßäÇßà¬ßäëßàÑ",
    "ßäÇßà¡ßäåßà«ßå½",
    "ßäÇßà¡ßäçßà⌐ßå¿",
    "ßäÇßà¡ßäëßà╡ßå»",
    "ßäÇßà¡ßäïßàúßå╝",
    "ßäÇßà¡ßäïßà▓ßå¿",
    "ßäÇßà¡ßäîßàíßå╝",
    "ßäÇßà¡ßäîßà╡ßå¿",
    "ßäÇßà¡ßäÉßà⌐ßå╝",
    "ßäÇßà¡ßäÆßà¬ßå½",
    "ßäÇßà¡ßäÆßà«ßå½",
    "ßäÇßà«ßäÇßàºßå╝",
    "ßäÇßà«ßäàßà│ßå╖",
    "ßäÇßà«ßäåßàÑßå╝",
    "ßäÇßà«ßäçßàºßå»",
    "ßäÇßà«ßäçßà«ßå½",
    "ßäÇßà«ßäëßàÑßå¿",
    "ßäÇßà«ßäëßàÑßå╝",
    "ßäÇßà«ßäëßà⌐ßå¿",
    "ßäÇßà«ßäïßàºßå¿",
    "ßäÇßà«ßäïßà╡ßå╕",
    "ßäÇßà«ßäÄßàÑßå╝",
    "ßäÇßà«ßäÄßàªßäîßàÑßå¿",
    "ßäÇßà«ßå¿ßäÇßàí",
    "ßäÇßà«ßå¿ßäÇßà╡",
    "ßäÇßà«ßå¿ßäéßàó",
    "ßäÇßà«ßå¿ßäàßà╡ßå╕",
    "ßäÇßà«ßå¿ßäåßà«ßå»",
    "ßäÇßà«ßå¿ßäåßà╡ßå½",
    "ßäÇßà«ßå¿ßäëßà«",
    "ßäÇßà«ßå¿ßäïßàÑ",
    "ßäÇßà«ßå¿ßäïßà¬ßå╝",
    "ßäÇßà«ßå¿ßäîßàÑßå¿",
    "ßäÇßà«ßå¿ßäîßàª",
    "ßäÇßà«ßå¿ßäÆßà¼",
    "ßäÇßà«ßå½ßäâßàó",
    "ßäÇßà«ßå½ßäëßàí",
    "ßäÇßà«ßå½ßäïßà╡ßå½",
    "ßäÇßà«ßå╝ßäÇßà│ßå¿ßäîßàÑßå¿",
    "ßäÇßà»ßå½ßäàßà╡",
    "ßäÇßà»ßå½ßäïßà▒",
    "ßäÇßà»ßå½ßäÉßà«",
    "ßäÇßà▒ßäÇßà«ßå¿",
    "ßäÇßà▒ßäëßà╡ßå½",
    "ßäÇßà▓ßäîßàÑßå╝",
    "ßäÇßà▓ßäÄßà╡ßå¿",
    "ßäÇßà▓ßå½ßäÆßàºßå╝",
    "ßäÇßà│ßäéßàíßå»",
    "ßäÇßà│ßäéßàúßå╝",
    "ßäÇßà│ßäéßà│ßå»",
    "ßäÇßà│ßäàßàÑßäéßàí",
    "ßäÇßà│ßäàßà«ßå╕",
    "ßäÇßà│ßäàßà│ßå║",
    "ßäÇßà│ßäàßà╡ßå╖",
    "ßäÇßà│ßäîßàªßäëßàÑßäïßàú",
    "ßäÇßà│ßäÉßà⌐ßäàßà⌐ßå¿",
    "ßäÇßà│ßå¿ßäçßà⌐ßå¿",
    "ßäÇßà│ßå¿ßäÆßà╡",
    "ßäÇßà│ßå½ßäÇßàÑ",
    "ßäÇßà│ßå½ßäÇßà¡",
    "ßäÇßà│ßå½ßäàßàó",
    "ßäÇßà│ßå½ßäàßà⌐",
    "ßäÇßà│ßå½ßäåßà«",
    "ßäÇßà│ßå½ßäçßà⌐ßå½",
    "ßäÇßà│ßå½ßäïßà»ßå½",
    "ßäÇßà│ßå½ßäïßà▓ßå¿",
    "ßäÇßà│ßå½ßäÄßàÑ",
    "ßäÇßà│ßå»ßäèßà╡",
    "ßäÇßà│ßå»ßäîßàí",
    "ßäÇßà│ßå╖ßäÇßàíßå╝ßäëßàíßå½",
    "ßäÇßà│ßå╖ßäÇßà⌐",
    "ßäÇßà│ßå╖ßäéßàºßå½",
    "ßäÇßà│ßå╖ßäåßàªßäâßàíßå»",
    "ßäÇßà│ßå╖ßäïßàóßå¿",
    "ßäÇßà│ßå╖ßäïßàºßå½",
    "ßäÇßà│ßå╖ßäïßà¡ßäïßà╡ßå»",
    "ßäÇßà│ßå╖ßäîßà╡",
    "ßäÇßà│ßå╝ßäîßàÑßå╝ßäîßàÑßå¿",
    "ßäÇßà╡ßäÇßàíßå½",
    "ßäÇßà╡ßäÇßà¬ßå½",
    "ßäÇßà╡ßäéßàºßå╖",
    "ßäÇßà╡ßäéßà│ßå╝",
    "ßäÇßà╡ßäâßà⌐ßå¿ßäÇßà¡",
    "ßäÇßà╡ßäâßà«ßå╝",
    "ßäÇßà╡ßäàßà⌐ßå¿",
    "ßäÇßà╡ßäàßà│ßå╖",
    "ßäÇßà╡ßäçßàÑßå╕",
    "ßäÇßà╡ßäçßà⌐ßå½",
    "ßäÇßà╡ßäçßà«ßå½",
    "ßäÇßà╡ßäêßà│ßå╖",
    "ßäÇßà╡ßäëßà«ßå¿ßäëßàí",
    "ßäÇßà╡ßäëßà«ßå»",
    "ßäÇßà╡ßäïßàÑßå¿",
    "ßäÇßà╡ßäïßàÑßå╕",
    "ßäÇßà╡ßäïßà⌐ßå½",
    "ßäÇßà╡ßäïßà«ßå½",
    "ßäÇßà╡ßäïßà»ßå½",
    "ßäÇßà╡ßäîßàÑßå¿",
    "ßäÇßà╡ßäîßà«ßå½",
    "ßäÇßà╡ßäÄßà╡ßå╖",
    "ßäÇßà╡ßäÆßà⌐ßå½",
    "ßäÇßà╡ßäÆßà¼ßå¿",
    "ßäÇßà╡ßå½ßäÇßà│ßå╕",
    "ßäÇßà╡ßå½ßäîßàíßå╝",
    "ßäÇßà╡ßå»ßäïßà╡",
    "ßäÇßà╡ßå╖ßäçßàíßå╕",
    "ßäÇßà╡ßå╖ßäÄßà╡",
    "ßäÇßà╡ßå╖ßäæßà⌐ßäÇßà⌐ßå╝ßäÆßàíßå╝",
    "ßäüßàíßå¿ßäâßà«ßäÇßà╡",
    "ßäüßàíßå╖ßäêßàíßå¿",
    "ßäüßàóßäâßàíßå»ßäïßà│ßå╖",
    "ßäüßàóßäëßà⌐ßäÇßà│ßå╖",
    "ßäüßàÑßå╕ßäîßà╡ßå»",
    "ßäüßà⌐ßå¿ßäâßàóßäÇßà╡",
    "ßäüßà⌐ßå╛ßäïßà╡ßçü",
    "ßäéßàíßäâßà│ßå»ßäïßà╡",
    "ßäéßàíßäàßàíßå½ßäÆßà╡",
    "ßäéßàíßäåßàÑßäîßà╡",
    "ßäéßàíßäåßà«ßå»",
    "ßäéßàíßäÄßà╡ßå╖ßäçßàíßå½",
    "ßäéßàíßäÆßà│ßå»",
    "ßäéßàíßå¿ßäïßàºßå╕",
    "ßäéßàíßå½ßäçßàíßå╝",
    "ßäéßàíßå»ßäÇßàó",
    "ßäéßàíßå»ßäèßà╡",
    "ßäéßàíßå»ßäìßàí",
    "ßäéßàíßå╖ßäéßàº",
    "ßäéßàíßå╖ßäâßàóßäåßà«ßå½",
    "ßäéßàíßå╖ßäåßàó",
    "ßäéßàíßå╖ßäëßàíßå½",
    "ßäéßàíßå╖ßäîßàí",
    "ßäéßàíßå╖ßäæßàºßå½",
    "ßäéßàíßå╖ßäÆßàíßå¿ßäëßàóßå╝",
    "ßäéßàíßå╝ßäçßà╡",
    "ßäéßàíßçÇßäåßàíßå»",
    "ßäéßàóßäéßàºßå½",
    "ßäéßàóßäïßà¡ßå╝",
    "ßäéßàóßäïßà╡ßå»",
    "ßäéßàóßå╖ßäçßà╡",
    "ßäéßàóßå╖ßäëßàó",
    "ßäéßàóßå║ßäåßà«ßå»",
    "ßäéßàóßå╝ßäâßà⌐ßå╝",
    "ßäéßàóßå╝ßäåßàºßå½",
    "ßäéßàóßå╝ßäçßàíßå╝",
    "ßäéßàóßå╝ßäîßàíßå╝ßäÇßà⌐",
    "ßäéßàªßå¿ßäÉßàíßäïßà╡",
    "ßäéßàªßå║ßäìßàó",
    "ßäéßà⌐ßäâßà⌐ßå╝",
    "ßäéßà⌐ßäàßàíßå½ßäëßàóßå¿",
    "ßäéßà⌐ßäàßàºßå¿",
    "ßäéßà⌐ßäïßà╡ßå½",
    "ßäéßà⌐ßå¿ßäïßà│ßå╖",
    "ßäéßà⌐ßå¿ßäÄßàí",
    "ßäéßà⌐ßå¿ßäÆßà¬",
    "ßäéßà⌐ßå½ßäàßà╡",
    "ßäéßà⌐ßå½ßäåßà«ßå½",
    "ßäéßà⌐ßå½ßäîßàóßå╝",
    "ßäéßà⌐ßå»ßäïßà╡",
    "ßäéßà⌐ßå╝ßäÇßà«",
    "ßäéßà⌐ßå╝ßäâßàíßå╖",
    "ßäéßà⌐ßå╝ßäåßà╡ßå½",
    "ßäéßà⌐ßå╝ßäçßà«",
    "ßäéßà⌐ßå╝ßäïßàÑßå╕",
    "ßäéßà⌐ßå╝ßäîßàíßå╝",
    "ßäéßà⌐ßå╝ßäÄßà⌐ßå½",
    "ßäéßà⌐ßçüßäïßà╡",
    "ßäéßà«ßå½ßäâßà⌐ßå╝ßäîßàí",
    "ßäéßà«ßå½ßäåßà«ßå»",
    "ßäéßà«ßå½ßäèßàÑßå╕",
    "ßäéßà▓ßäïßà¡ßå¿",
    "ßäéßà│ßäüßà╡ßå╖",
    "ßäéßà│ßå¿ßäâßàó",
    "ßäéßà│ßå╝ßäâßà⌐ßå╝ßäîßàÑßå¿",
    "ßäéßà│ßå╝ßäàßàºßå¿",
    "ßäâßàíßäçßàíßå╝",
    "ßäâßàíßäïßàúßå╝ßäëßàÑßå╝",
    "ßäâßàíßäïßà│ßå╖",
    "ßäâßàíßäïßà╡ßäïßàÑßäÉßà│",
    "ßäâßàíßäÆßàóßå╝",
    "ßäâßàíßå½ßäÇßà¿",
    "ßäâßàíßå½ßäÇßà⌐ßå»",
    "ßäâßàíßå½ßäâßà⌐ßå¿",
    "ßäâßàíßå½ßäåßàíßå║",
    "ßäâßàíßå½ßäëßà«ßå½",
    "ßäâßàíßå½ßäïßàÑ",
    "ßäâßàíßå½ßäïßà▒",
    "ßäâßàíßå½ßäîßàÑßå╖",
    "ßäâßàíßå½ßäÄßàª",
    "ßäâßàíßå½ßäÄßà«",
    "ßäâßàíßå½ßäæßàºßå½",
    "ßäâßàíßå½ßäæßà«ßå╝",
    "ßäâßàíßå»ßäÇßàúßå»",
    "ßäâßàíßå»ßäàßàÑ",
    "ßäâßàíßå»ßäàßàºßå¿",
    "ßäâßàíßå»ßäàßà╡",
    "ßäâßàíßå░ßäÇßà⌐ßäÇßà╡",
    "ßäâßàíßå╖ßäâßàíßå╝",
    "ßäâßàíßå╖ßäçßàó",
    "ßäâßàíßå╖ßäïßà¡",
    "ßäâßàíßå╖ßäïßà╡ßå╖",
    "ßäâßàíßå╕ßäçßàºßå½",
    "ßäâßàíßå╕ßäîßàíßå╝",
    "ßäâßàíßå╝ßäÇßà│ßå½",
    "ßäâßàíßå╝ßäçßà«ßå½ßäÇßàíßå½",
    "ßäâßàíßå╝ßäïßàºßå½ßäÆßà╡",
    "ßäâßàíßå╝ßäîßàíßå╝",
    "ßäâßàóßäÇßà▓ßäåßà⌐",
    "ßäâßàóßäéßàíßå╜",
    "ßäâßàóßäâßàíßå½ßäÆßà╡",
    "ßäâßàóßäâßàíßå╕",
    "ßäâßàóßäâßà⌐ßäëßà╡",
    "ßäâßàóßäàßàúßå¿",
    "ßäâßàóßäàßàúßå╝",
    "ßäâßàóßäàßà▓ßå¿",
    "ßäâßàóßäåßà«ßå½",
    "ßäâßàóßäçßà«ßäçßà«ßå½",
    "ßäâßàóßäëßà╡ßå½",
    "ßäâßàóßäïßà│ßå╝",
    "ßäâßàóßäîßàíßå╝",
    "ßäâßàóßäîßàÑßå½",
    "ßäâßàóßäîßàÑßå╕",
    "ßäâßàóßäîßà«ßå╝",
    "ßäâßàóßäÄßàóßå¿",
    "ßäâßàóßäÄßà«ßå»",
    "ßäâßàóßäÄßà«ßå╝",
    "ßäâßàóßäÉßà⌐ßå╝ßäàßàºßå╝",
    "ßäâßàóßäÆßàíßå¿",
    "ßäâßàóßäÆßàíßå½ßäåßà╡ßå½ßäÇßà«ßå¿",
    "ßäâßàóßäÆßàíßå╕ßäëßà╡ßå»",
    "ßäâßàóßäÆßàºßå╝",
    "ßäâßàÑßå╝ßäïßàÑßäàßà╡",
    "ßäâßàªßäïßà╡ßäÉßà│",
    "ßäâßà⌐ßäâßàóßäÄßàª",
    "ßäâßà⌐ßäâßàÑßå¿",
    "ßäâßà⌐ßäâßà«ßå¿",
    "ßäâßà⌐ßäåßàíßå╝",
    "ßäâßà⌐ßäëßàÑßäÇßà¬ßå½",
    "ßäâßà⌐ßäëßà╡ßå╖",
    "ßäâßà⌐ßäïßà«ßå╖",
    "ßäâßà⌐ßäïßà╡ßå╕",
    "ßäâßà⌐ßäîßàíßäÇßà╡",
    "ßäâßà⌐ßäîßàÑßäÆßà╡",
    "ßäâßà⌐ßäîßàÑßå½",
    "ßäâßà⌐ßäîßà«ßå╝",
    "ßäâßà⌐ßäÄßàíßå¿",
    "ßäâßà⌐ßå¿ßäÇßàíßå╖",
    "ßäâßà⌐ßå¿ßäàßà╡ßå╕",
    "ßäâßà⌐ßå¿ßäëßàÑ",
    "ßäâßà⌐ßå¿ßäïßà╡ßå»",
    "ßäâßà⌐ßå¿ßäÄßàíßå╝ßäîßàÑßå¿",
    "ßäâßà⌐ßå╝ßäÆßà¬ßäÄßàóßå¿",
    "ßäâßà▒ßå║ßäåßà⌐ßäëßà│ßå╕",
    "ßäâßà▒ßå║ßäëßàíßå½",
    "ßääßàíßå»ßäïßàíßäïßà╡",
    "ßäåßàíßäéßà«ßäàßàí",
    "ßäåßàíßäéßà│ßå»",
    "ßäåßàíßäâßàíßå╝",
    "ßäåßàíßäàßàíßäÉßà⌐ßå½",
    "ßäåßàíßäàßàºßå½",
    "ßäåßàíßäåßà«ßäàßà╡",
    "ßäåßàíßäëßàíßäîßà╡",
    "ßäåßàíßäïßàúßå¿",
    "ßäåßàíßäïßà¡ßäéßàªßäîßà│",
    "ßäåßàíßäïßà│ßå»",
    "ßäåßàíßäïßà│ßå╖",
    "ßäåßàíßäïßà╡ßäÅßà│",
    "ßäåßàíßäîßà«ßå╝",
    "ßäåßàíßäîßà╡ßäåßàíßå¿",
    "ßäåßàíßäÄßàíßå½ßäÇßàíßäîßà╡",
    "ßäåßàíßäÄßàíßå»",
    "ßäåßàíßäÆßà│ßå½",
    "ßäåßàíßå¿ßäÇßàÑßå»ßäàßà╡",
    "ßäåßàíßå¿ßäéßàó",
    "ßäåßàíßå¿ßäëßàíßå╝",
    "ßäåßàíßå½ßäéßàíßå╖",
    "ßäåßàíßå½ßäâßà«",
    "ßäåßàíßå½ßäëßàª",
    "ßäåßàíßå½ßäïßàúßå¿",
    "ßäåßàíßå½ßäïßà╡ßå»",
    "ßäåßàíßå½ßäîßàÑßå╖",
    "ßäåßàíßå½ßäîßà⌐ßå¿",
    "ßäåßàíßå½ßäÆßà¬",
    "ßäåßàíßå¡ßäïßà╡",
    "ßäåßàíßå»ßäÇßà╡",
    "ßäåßàíßå»ßäèßà│ßå╖",
    "ßäåßàíßå»ßäÉßà«",
    "ßäåßàíßå╖ßäâßàóßäàßà⌐",
    "ßäåßàíßå╝ßäïßà»ßå½ßäÇßàºßå╝",
    "ßäåßàóßäéßàºßå½",
    "ßäåßàóßäâßàíßå»",
    "ßäåßàóßäàßàºßå¿",
    "ßäåßàóßäçßàÑßå½",
    "ßäåßàóßäëßà│ßäÅßàÑßå╖",
    "ßäåßàóßäïßà╡ßå»",
    "ßäåßàóßäîßàíßå╝",
    "ßäåßàóßå¿ßäîßà«",
    "ßäåßàÑßå¿ßäïßà╡",
    "ßäåßàÑßå½ßäîßàÑ",
    "ßäåßàÑßå½ßäîßà╡",
    "ßäåßàÑßå»ßäàßà╡",
    "ßäåßàªßäïßà╡ßå»",
    "ßäåßàºßäéßà│ßäàßà╡",
    "ßäåßàºßäÄßà╡ßå»",
    "ßäåßàºßå½ßäâßàíßå╖",
    "ßäåßàºßå»ßäÄßà╡",
    "ßäåßàºßå╝ßäâßàíßå½",
    "ßäåßàºßå╝ßäàßàºßå╝",
    "ßäåßàºßå╝ßäïßà¿",
    "ßäåßàºßå╝ßäïßà┤",
    "ßäåßàºßå╝ßäîßàÑßå»",
    "ßäåßàºßå╝ßäÄßà╡ßå╝",
    "ßäåßàºßå╝ßäÆßàíßå╖",
    "ßäåßà⌐ßäÇßà│ßå╖",
    "ßäåßà⌐ßäéßà╡ßäÉßàÑ",
    "ßäåßà⌐ßäâßàªßå»",
    "ßäåßà⌐ßäâßà│ßå½",
    "ßäåßà⌐ßäçßàÑßå╖",
    "ßäåßà⌐ßäëßà│ßå╕",
    "ßäåßà⌐ßäïßàúßå╝",
    "ßäåßà⌐ßäïßà╡ßå╖",
    "ßäåßà⌐ßäîßà⌐ßäàßà╡",
    "ßäåßà⌐ßäîßà╡ßå╕",
    "ßäåßà⌐ßäÉßà«ßå╝ßäïßà╡",
    "ßäåßà⌐ßå¿ßäÇßàÑßå»ßäïßà╡",
    "ßäåßà⌐ßå¿ßäàßà⌐ßå¿",
    "ßäåßà⌐ßå¿ßäëßàí",
    "ßäåßà⌐ßå¿ßäëßà⌐ßäàßà╡",
    "ßäåßà⌐ßå¿ßäëßà«ßå╖",
    "ßäåßà⌐ßå¿ßäîßàÑßå¿",
    "ßäåßà⌐ßå¿ßäæßà¡",
    "ßäåßà⌐ßå»ßäàßàó",
    "ßäåßà⌐ßå╖ßäåßàó",
    "ßäåßà⌐ßå╖ßäåßà«ßäÇßàª",
    "ßäåßà⌐ßå╖ßäëßàíßå»",
    "ßäåßà⌐ßå╖ßäëßà⌐ßå¿",
    "ßäåßà⌐ßå╖ßäîßà╡ßå║",
    "ßäåßà⌐ßå╖ßäÉßà⌐ßå╝",
    "ßäåßà⌐ßå╕ßäëßà╡",
    "ßäåßà«ßäÇßà¬ßå½ßäëßà╡ßå╖",
    "ßäåßà«ßäÇßà«ßå╝ßäÆßà¬",
    "ßäåßà«ßäâßàÑßäïßà▒",
    "ßäåßà«ßäâßàÑßå╖",
    "ßäåßà«ßäàßà│ßçü",
    "ßäåßà«ßäëßà│ßå½",
    "ßäåßà«ßäïßàÑßå║",
    "ßäåßà«ßäïßàºßå¿",
    "ßäåßà«ßäïßà¡ßå╝",
    "ßäåßà«ßäîßà⌐ßäÇßàÑßå½",
    "ßäåßà«ßäîßà╡ßäÇßàó",
    "ßäåßà«ßäÄßàÑßå¿",
    "ßäåßà«ßå½ßäÇßà«",
    "ßäåßà«ßå½ßäâßà│ßå¿",
    "ßäåßà«ßå½ßäçßàÑßå╕",
    "ßäåßà«ßå½ßäëßàÑ",
    "ßäåßà«ßå½ßäîßàª",
    "ßäåßà«ßå½ßäÆßàíßå¿",
    "ßäåßà«ßå½ßäÆßà¬",
    "ßäåßà«ßå»ßäÇßàí",
    "ßäåßà«ßå»ßäÇßàÑßå½",
    "ßäåßà«ßå»ßäÇßàºßå»",
    "ßäåßà«ßå»ßäÇßà⌐ßäÇßà╡",
    "ßäåßà«ßå»ßäàßà⌐ßå½",
    "ßäåßà«ßå»ßäàßà╡ßäÆßàíßå¿",
    "ßäåßà«ßå»ßäïßà│ßå╖",
    "ßäåßà«ßå»ßäîßà╡ßå»",
    "ßäåßà«ßå»ßäÄßàª",
    "ßäåßà╡ßäÇßà«ßå¿",
    "ßäåßà╡ßäâßà╡ßäïßàÑ",
    "ßäåßà╡ßäëßàíßäïßà╡ßå»",
    "ßäåßà╡ßäëßà«ßå»",
    "ßäåßà╡ßäïßàºßå¿",
    "ßäåßà╡ßäïßà¡ßå╝ßäëßà╡ßå»",
    "ßäåßà╡ßäïßà«ßå╖",
    "ßäåßà╡ßäïßà╡ßå½",
    "ßäåßà╡ßäÉßà╡ßå╝",
    "ßäåßà╡ßäÆßà⌐ßå½",
    "ßäåßà╡ßå½ßäÇßàíßå½",
    "ßäåßà╡ßå½ßäîßà⌐ßå¿",
    "ßäåßà╡ßå½ßäîßà«",
    "ßäåßà╡ßå«ßäïßà│ßå╖",
    "ßäåßà╡ßå»ßäÇßàíßäàßà«",
    "ßäåßà╡ßå»ßäàßà╡ßäåßà╡ßäÉßàÑ",
    "ßäåßà╡ßçÇßäçßàíßäâßàíßå¿",
    "ßäçßàíßäÇßàíßäîßà╡",
    "ßäçßàíßäÇßà«ßäéßà╡",
    "ßäçßàíßäéßàíßäéßàí",
    "ßäçßàíßäéßà│ßå»",
    "ßäçßàíßäâßàíßå¿",
    "ßäçßàíßäâßàíßå║ßäÇßàí",
    "ßäçßàíßäàßàíßå╖",
    "ßäçßàíßäïßà╡ßäàßàÑßäëßà│",
    "ßäçßàíßäÉßàíßå╝",
    "ßäçßàíßå¿ßäåßà«ßå»ßäÇßà¬ßå½",
    "ßäçßàíßå¿ßäëßàí",
    "ßäçßàíßå¿ßäëßà«",
    "ßäçßàíßå½ßäâßàó",
    "ßäçßàíßå½ßäâßà│ßäëßà╡",
    "ßäçßàíßå½ßäåßàíßå»",
    "ßäçßàíßå½ßäçßàíßå»",
    "ßäçßàíßå½ßäëßàÑßå╝",
    "ßäçßàíßå½ßäïßà│ßå╝",
    "ßäçßàíßå½ßäîßàíßå╝",
    "ßäçßàíßå½ßäîßà«ßå¿",
    "ßäçßàíßå½ßäîßà╡",
    "ßäçßàíßå½ßäÄßàíßå½",
    "ßäçßàíßå«ßäÄßà╡ßå╖",
    "ßäçßàíßå»ßäÇßàíßäàßàíßå¿",
    "ßäçßàíßå»ßäÇßàÑßå»ßäïßà│ßå╖",
    "ßäçßàíßå»ßäÇßàºßå½",
    "ßäçßàíßå»ßäâßàíßå»",
    "ßäçßàíßå»ßäàßàª",
    "ßäçßàíßå»ßäåßà⌐ßå¿",
    "ßäçßàíßå»ßäçßàíßäâßàíßå¿",
    "ßäçßàíßå»ßäëßàóßå╝",
    "ßäçßàíßå»ßäïßà│ßå╖",
    "ßäçßàíßå»ßäîßàíßäÇßà«ßå¿",
    "ßäçßàíßå»ßäîßàÑßå½",
    "ßäçßàíßå»ßäÉßà⌐ßå╕",
    "ßäçßàíßå»ßäæßà¡",
    "ßäçßàíßå╖ßäÆßàíßäéßà│ßå»",
    "ßäçßàíßå╕ßäÇßà│ßäàßà│ßå║",
    "ßäçßàíßå╕ßäåßàíßå║",
    "ßäçßàíßå╕ßäëßàíßå╝",
    "ßäçßàíßå╕ßäëßà⌐ßçÇ",
    "ßäçßàíßå╝ßäÇßà│ßå╖",
    "ßäçßàíßå╝ßäåßàºßå½",
    "ßäçßàíßå╝ßäåßà«ßå½",
    "ßäçßàíßå╝ßäçßàíßäâßàíßå¿",
    "ßäçßàíßå╝ßäçßàÑßå╕",
    "ßäçßàíßå╝ßäëßà⌐ßå╝",
    "ßäçßàíßå╝ßäëßà╡ßå¿",
    "ßäçßàíßå╝ßäïßàíßå½",
    "ßäçßàíßå╝ßäïßà«ßå»",
    "ßäçßàíßå╝ßäîßà╡",
    "ßäçßàíßå╝ßäÆßàíßå¿",
    "ßäçßàíßå╝ßäÆßàó",
    "ßäçßàíßå╝ßäÆßàúßå╝",
    "ßäçßàóßäÇßàºßå╝",
    "ßäçßàóßäüßà⌐ßå╕",
    "ßäçßàóßäâßàíßå»",
    "ßäçßàóßäâßà│ßäåßà╡ßå½ßäÉßàÑßå½",
    "ßäçßàóßå¿ßäâßà«ßäëßàíßå½",
    "ßäçßàóßå¿ßäëßàóßå¿",
    "ßäçßàóßå¿ßäëßàÑßå╝",
    "ßäçßàóßå¿ßäïßà╡ßå½",
    "ßäçßàóßå¿ßäîßàª",
    "ßäçßàóßå¿ßäÆßà¬ßäîßàÑßå╖",
    "ßäçßàÑßäàßà│ßå║",
    "ßäçßàÑßäëßàÑßå║",
    "ßäçßàÑßäÉßà│ßå½",
    "ßäçßàÑßå½ßäÇßàó",
    "ßäçßàÑßå½ßäïßàºßå¿",
    "ßäçßàÑßå½ßäîßà╡",
    "ßäçßàÑßå½ßäÆßà⌐",
    "ßäçßàÑßå»ßäÇßà│ßå╖",
    "ßäçßàÑßå»ßäàßàª",
    "ßäçßàÑßå»ßäèßàÑ",
    "ßäçßàÑßå╖ßäïßà▒",
    "ßäçßàÑßå╖ßäïßà╡ßå½",
    "ßäçßàÑßå╖ßäîßà¼",
    "ßäçßàÑßå╕ßäàßà▓ßå»",
    "ßäçßàÑßå╕ßäïßà»ßå½",
    "ßäçßàÑßå╕ßäîßàÑßå¿",
    "ßäçßàÑßå╕ßäÄßà╡ßå¿",
    "ßäçßàªßäïßà╡ßäîßà╡ßå╝",
    "ßäçßàªßå»ßäÉßà│",
    "ßäçßàºßå½ßäÇßàºßå╝",
    "ßäçßàºßå½ßäâßà⌐ßå╝",
    "ßäçßàºßå½ßäåßàºßå╝",
    "ßäçßàºßå½ßäëßà╡ßå½",
    "ßäçßàºßå½ßäÆßà⌐ßäëßàí",
    "ßäçßàºßå½ßäÆßà¬",
    "ßäçßàºßå»ßäâßà⌐",
    "ßäçßàºßå»ßäåßàºßå╝",
    "ßäçßàºßå»ßäïßà╡ßå»",
    "ßäçßàºßå╝ßäëßà╡ßå»",
    "ßäçßàºßå╝ßäïßàíßäàßà╡",
    "ßäçßàºßå╝ßäïßà»ßå½",
    "ßäçßà⌐ßäÇßà¬ßå½",
    "ßäçßà⌐ßäéßàÑßäëßà│",
    "ßäçßà⌐ßäàßàíßäëßàóßå¿",
    "ßäçßà⌐ßäàßàíßå╖",
    "ßäçßà⌐ßäàßà│ßå╖",
    "ßäçßà⌐ßäëßàíßå╝",
    "ßäçßà⌐ßäïßàíßå½",
    "ßäçßà⌐ßäîßàíßäÇßà╡",
    "ßäçßà⌐ßäîßàíßå╝",
    "ßäçßà⌐ßäîßàÑßå½",
    "ßäçßà⌐ßäîßà⌐ßå½",
    "ßäçßà⌐ßäÉßà⌐ßå╝",
    "ßäçßà⌐ßäæßàºßå½ßäîßàÑßå¿",
    "ßäçßà⌐ßäÆßàÑßå╖",
    "ßäçßà⌐ßå¿ßäâßà⌐",
    "ßäçßà⌐ßå¿ßäëßàí",
    "ßäçßà⌐ßå¿ßäëßà«ßå╝ßäïßàí",
    "ßäçßà⌐ßå¿ßäëßà│ßå╕",
    "ßäçßà⌐ßå⌐ßäïßà│ßå╖",
    "ßäçßà⌐ßå½ßäÇßàºßå¿ßäîßàÑßå¿",
    "ßäçßà⌐ßå½ßäàßàó",
    "ßäçßà⌐ßå½ßäçßà«",
    "ßäçßà⌐ßå½ßäëßàí",
    "ßäçßà⌐ßå½ßäëßàÑßå╝",
    "ßäçßà⌐ßå½ßäïßà╡ßå½",
    "ßäçßà⌐ßå½ßäîßà╡ßå»",
    "ßäçßà⌐ßå»ßäæßàªßå½",
    "ßäçßà⌐ßå╝ßäëßàí",
    "ßäçßà⌐ßå╝ßäîßà╡",
    "ßäçßà⌐ßå╝ßäÉßà«",
    "ßäçßà«ßäÇßà│ßå½",
    "ßäçßà«ßäüßà│ßäàßàÑßäïßà«ßå╖",
    "ßäçßà«ßäâßàíßå╖",
    "ßäçßà«ßäâßà⌐ßå╝ßäëßàíßå½",
    "ßäçßà«ßäåßà«ßå½",
    "ßäçßà«ßäçßà«ßå½",
    "ßäçßà«ßäëßàíßå½",
    "ßäçßà«ßäëßàíßå╝",
    "ßäçßà«ßäïßàÑßå┐",
    "ßäçßà«ßäïßà╡ßå½",
    "ßäçßà«ßäîßàíßå¿ßäïßà¡ßå╝",
    "ßäçßà«ßäîßàíßå╝",
    "ßäçßà«ßäîßàÑßå╝",
    "ßäçßà«ßäîßà⌐ßå¿",
    "ßäçßà«ßäîßà╡ßäàßàÑßå½ßäÆßà╡",
    "ßäçßà«ßäÄßà╡ßå½",
    "ßäçßà«ßäÉßàíßå¿",
    "ßäçßà«ßäæßà«ßå╖",
    "ßäçßà«ßäÆßà¼ßäîßàíßå╝",
    "ßäçßà«ßå¿ßäçßà«",
    "ßäçßà«ßå¿ßäÆßàíßå½",
    "ßäçßà«ßå½ßäéßà⌐",
    "ßäçßà«ßå½ßäàßàúßå╝",
    "ßäçßà«ßå½ßäàßà╡",
    "ßäçßà«ßå½ßäåßàºßå╝",
    "ßäçßà«ßå½ßäëßàÑßå¿",
    "ßäçßà«ßå½ßäïßàú",
    "ßäçßà«ßå½ßäïßà▒ßäÇßà╡",
    "ßäçßà«ßå½ßäæßà╡ßå»",
    "ßäçßà«ßå½ßäÆßà⌐ßå╝ßäëßàóßå¿",
    "ßäçßà«ßå»ßäÇßà⌐ßäÇßà╡",
    "ßäçßà«ßå»ßäÇßà¬",
    "ßäçßà«ßå»ßäÇßà¡",
    "ßäçßà«ßå»ßäüßà⌐ßå╛",
    "ßäçßà«ßå»ßäåßàíßå½",
    "ßäçßà«ßå»ßäçßàÑßå╕",
    "ßäçßà«ßå»ßäçßà╡ßå╛",
    "ßäçßà«ßå»ßäïßàíßå½",
    "ßäçßà«ßå»ßäïßà╡ßäïßà╡ßå¿",
    "ßäçßà«ßå»ßäÆßàóßå╝",
    "ßäçßà│ßäàßàóßå½ßäâßà│",
    "ßäçßà╡ßäÇßà│ßå¿",
    "ßäçßà╡ßäéßàíßå½",
    "ßäçßà╡ßäéßà╡ßå»",
    "ßäçßà╡ßäâßà«ßå»ßäÇßà╡",
    "ßäçßà╡ßäâßà╡ßäïßà⌐",
    "ßäçßà╡ßäàßà⌐ßäëßà⌐",
    "ßäçßà╡ßäåßàíßå½",
    "ßäçßà╡ßäåßàºßå╝",
    "ßäçßà╡ßäåßà╡ßå»",
    "ßäçßà╡ßäçßàíßäàßàíßå╖",
    "ßäçßà╡ßäçßà╡ßå╖ßäçßàíßå╕",
    "ßäçßà╡ßäëßàíßå╝",
    "ßäçßà╡ßäïßà¡ßå╝",
    "ßäçßà╡ßäïßà▓ßå»",
    "ßäçßà╡ßäîßà«ßå╝",
    "ßäçßà╡ßäÉßàíßäåßà╡ßå½",
    "ßäçßà╡ßäæßàíßå½",
    "ßäçßà╡ßå»ßäâßà╡ßå╝",
    "ßäçßà╡ßå║ßäåßà«ßå»",
    "ßäçßà╡ßå║ßäçßàíßå╝ßäïßà«ßå»",
    "ßäçßà╡ßå║ßäîßà«ßå»ßäÇßà╡",
    "ßäçßà╡ßå╛ßäüßàíßå»",
    "ßäêßàíßå»ßäÇßàíßå½ßäëßàóßå¿",
    "ßäêßàíßå»ßäàßàó",
    "ßäêßàíßå»ßäàßà╡",
    "ßäëßàíßäÇßàÑßå½",
    "ßäëßàíßäÇßà¿ßäîßàÑßå»",
    "ßäëßàíßäéßàíßäïßà╡",
    "ßäëßàíßäéßàúßå╝",
    "ßäëßàíßäàßàíßå╖",
    "ßäëßàíßäàßàíßå╝",
    "ßäëßàíßäàßà╡ßå╕",
    "ßäëßàíßäåßà⌐ßäéßà╡ßå╖",
    "ßäëßàíßäåßà«ßå»",
    "ßäëßàíßäçßàíßå╝",
    "ßäëßàíßäëßàíßå╝",
    "ßäëßàíßäëßàóßå╝ßäÆßà¬ßå»",
    "ßäëßàíßäëßàÑßå»",
    "ßäëßàíßäëßà│ßå╖",
    "ßäëßàíßäëßà╡ßå»",
    "ßäëßàíßäïßàÑßå╕",
    "ßäëßàíßäïßà¡ßå╝",
    "ßäëßàíßäïßà»ßå»",
    "ßäëßàíßäîßàíßå╝",
    "ßäëßàíßäîßàÑßå½",
    "ßäëßàíßäîßà╡ßå½",
    "ßäëßàíßäÄßà⌐ßå½",
    "ßäëßàíßäÄßà«ßå½ßäÇßà╡",
    "ßäëßàíßäÉßàíßå╝",
    "ßäëßàíßäÉßà«ßäàßà╡",
    "ßäëßàíßäÆßà│ßå»",
    "ßäëßàíßå½ßäÇßà╡ßå»",
    "ßäëßàíßå½ßäçßà«ßäïßà╡ßå½ßäÇßà¬",
    "ßäëßàíßå½ßäïßàÑßå╕",
    "ßäëßàíßå½ßäÄßàóßå¿",
    "ßäëßàíßå»ßäàßà╡ßå╖",
    "ßäëßàíßå»ßäïßà╡ßå½",
    "ßäëßàíßå»ßäìßàíßå¿",
    "ßäëßàíßå╖ßäÇßà¿ßäÉßàíßå╝",
    "ßäëßàíßå╖ßäÇßà«ßå¿",
    "ßäëßàíßå╖ßäëßà╡ßå╕",
    "ßäëßàíßå╖ßäïßà»ßå»",
    "ßäëßàíßå╖ßäÄßà⌐ßå½",
    "ßäëßàíßå╝ßäÇßà¬ßå½",
    "ßäëßàíßå╝ßäÇßà│ßå╖",
    "ßäëßàíßå╝ßäâßàó",
    "ßäëßàíßå╝ßäàßà▓",
    "ßäëßàíßå╝ßäçßàíßå½ßäÇßà╡",
    "ßäëßàíßå╝ßäëßàíßå╝",
    "ßäëßàíßå╝ßäëßà╡ßå¿",
    "ßäëßàíßå╝ßäïßàÑßå╕",
    "ßäëßàíßå╝ßäïßà╡ßå½",
    "ßäëßàíßå╝ßäîßàí",
    "ßäëßàíßå╝ßäîßàÑßå╖",
    "ßäëßàíßå╝ßäÄßàÑ",
    "ßäëßàíßå╝ßäÄßà«",
    "ßäëßàíßå╝ßäÉßàó",
    "ßäëßàíßå╝ßäæßà¡",
    "ßäëßàíßå╝ßäæßà«ßå╖",
    "ßäëßàíßå╝ßäÆßà¬ßå╝",
    "ßäëßàóßäçßàºßå¿",
    "ßäëßàóßå¿ßäüßàíßå»",
    "ßäëßàóßå¿ßäïßàºßå½ßäæßà╡ßå»",
    "ßäëßàóßå╝ßäÇßàíßå¿",
    "ßäëßàóßå╝ßäåßàºßå╝",
    "ßäëßàóßå╝ßäåßà«ßå»",
    "ßäëßàóßå╝ßäçßàíßå╝ßäëßà⌐ßå╝",
    "ßäëßàóßå╝ßäëßàíßå½",
    "ßäëßàóßå╝ßäëßàÑßå½",
    "ßäëßàóßå╝ßäëßà╡ßå½",
    "ßäëßàóßå╝ßäïßà╡ßå»",
    "ßäëßàóßå╝ßäÆßà¬ßå»",
    "ßäëßàÑßäàßàíßå╕",
    "ßäëßàÑßäàßà│ßå½",
    "ßäëßàÑßäåßàºßå╝",
    "ßäëßàÑßäåßà╡ßå½",
    "ßäëßàÑßäçßà╡ßäëßà│",
    "ßäëßàÑßäïßàúßå╝",
    "ßäëßàÑßäïßà«ßå»",
    "ßäëßàÑßäîßàÑßå¿",
    "ßäëßàÑßäîßàÑßå╖",
    "ßäëßàÑßäìßà⌐ßå¿",
    "ßäëßàÑßäÅßà│ßå»",
    "ßäëßàÑßå¿ßäëßàí",
    "ßäëßàÑßå¿ßäïßà▓",
    "ßäëßàÑßå½ßäÇßàÑ",
    "ßäëßàÑßå½ßäåßà«ßå»",
    "ßäëßàÑßå½ßäçßàó",
    "ßäëßàÑßå½ßäëßàóßå╝",
    "ßäëßàÑßå½ßäëßà«",
    "ßäëßàÑßå½ßäïßà»ßå½",
    "ßäëßàÑßå½ßäîßàíßå╝",
    "ßäëßàÑßå½ßäîßàÑßå½",
    "ßäëßàÑßå½ßäÉßàóßå¿",
    "ßäëßàÑßå½ßäæßà«ßå╝ßäÇßà╡",
    "ßäëßàÑßå»ßäÇßàÑßäîßà╡",
    "ßäëßàÑßå»ßäéßàíßå»",
    "ßäëßàÑßå»ßäàßàÑßå╝ßäÉßàíßå╝",
    "ßäëßàÑßå»ßäåßàºßå╝",
    "ßäëßàÑßå»ßäåßà«ßå½",
    "ßäëßàÑßå»ßäëßàí",
    "ßäëßàÑßå»ßäïßàíßå¿ßäëßàíßå½",
    "ßäëßàÑßå»ßäÄßà╡",
    "ßäëßàÑßå»ßäÉßàíßå╝",
    "ßäëßàÑßå╕ßäèßà╡",
    "ßäëßàÑßå╝ßäÇßà⌐ßå╝",
    "ßäëßàÑßå╝ßäâßàíßå╝",
    "ßäëßàÑßå╝ßäåßàºßå╝",
    "ßäëßàÑßå╝ßäçßàºßå»",
    "ßäëßàÑßå╝ßäïßà╡ßå½",
    "ßäëßàÑßå╝ßäîßàíßå╝",
    "ßäëßàÑßå╝ßäîßàÑßå¿",
    "ßäëßàÑßå╝ßäîßà╡ßå»",
    "ßäëßàÑßå╝ßäÆßàíßå╖",
    "ßäëßàªßäÇßà│ßå╖",
    "ßäëßàªßäåßà╡ßäéßàí",
    "ßäëßàªßäëßàíßå╝",
    "ßäëßàªßäïßà»ßå»",
    "ßäëßàªßäîßà⌐ßå╝ßäâßàóßäïßà¬ßå╝",
    "ßäëßàªßäÉßàíßå¿",
    "ßäëßàªßå½ßäÉßàÑ",
    "ßäëßàªßå½ßäÉßà╡ßäåßà╡ßäÉßàÑ",
    "ßäëßàªßå║ßäìßàó",
    "ßäëßà⌐ßäÇßà▓ßäåßà⌐",
    "ßäëßà⌐ßäÇßà│ßå¿ßäîßàÑßå¿",
    "ßäëßà⌐ßäÇßà│ßå╖",
    "ßäëßà⌐ßäéßàíßäÇßà╡",
    "ßäëßà⌐ßäéßàºßå½",
    "ßäëßà⌐ßäâßà│ßå¿",
    "ßäëßà⌐ßäåßàíßå╝",
    "ßäëßà⌐ßäåßà«ßå½",
    "ßäëßà⌐ßäëßàÑßå»",
    "ßäëßà⌐ßäëßà⌐ßå¿",
    "ßäëßà⌐ßäïßàíßäÇßà¬",
    "ßäëßà⌐ßäïßà¡ßå╝",
    "ßäëßà⌐ßäïßà»ßå½",
    "ßäëßà⌐ßäïßà│ßå╖",
    "ßäëßà⌐ßäîßà«ßå╝ßäÆßà╡",
    "ßäëßà⌐ßäîßà╡ßäæßà«ßå╖",
    "ßäëßà⌐ßäîßà╡ßå»",
    "ßäëßà⌐ßäæßà«ßå╝",
    "ßäëßà⌐ßäÆßàºßå╝",
    "ßäëßà⌐ßå¿ßäâßàíßå╖",
    "ßäëßà⌐ßå¿ßäâßà⌐",
    "ßäëßà⌐ßå¿ßäïßà⌐ßå║",
    "ßäëßà⌐ßå½ßäÇßàíßäàßàíßå¿",
    "ßäëßà⌐ßå½ßäÇßà╡ßå»",
    "ßäëßà⌐ßå½ßäéßàº",
    "ßäëßà⌐ßå½ßäéßà╡ßå╖",
    "ßäëßà⌐ßå½ßäâßà│ßå╝",
    "ßäëßà⌐ßå½ßäåßà⌐ßå¿",
    "ßäëßà⌐ßå½ßäêßàºßå¿",
    "ßäëßà⌐ßå½ßäëßà╡ßå»",
    "ßäëßà⌐ßå½ßäîßà╡ßå»",
    "ßäëßà⌐ßå½ßäÉßà⌐ßå╕",
    "ßäëßà⌐ßå½ßäÆßàó",
    "ßäëßà⌐ßå»ßäîßà╡ßå¿ßäÆßà╡",
    "ßäëßà⌐ßå╖ßäèßà╡",
    "ßäëßà⌐ßå╝ßäïßàíßäîßà╡",
    "ßäëßà⌐ßå╝ßäïßà╡",
    "ßäëßà⌐ßå╝ßäæßàºßå½",
    "ßäëßà¼ßäÇßà⌐ßäÇßà╡",
    "ßäëßà¡ßäæßà╡ßå╝",
    "ßäëßà«ßäÇßàÑßå½",
    "ßäëßà«ßäéßàºßå½",
    "ßäëßà«ßäâßàíßå½",
    "ßäëßà«ßäâßà⌐ßå║ßäåßà«ßå»",
    "ßäëßà«ßäâßà⌐ßå╝ßäîßàÑßå¿",
    "ßäëßà«ßäåßàºßå½",
    "ßäëßà«ßäåßàºßå╝",
    "ßäëßà«ßäçßàíßå¿",
    "ßäëßà«ßäëßàíßå╝",
    "ßäëßà«ßäëßàÑßå¿",
    "ßäëßà«ßäëßà«ßå»",
    "ßäëßà«ßäëßà╡ßäàßà⌐",
    "ßäëßà«ßäïßàÑßå╕",
    "ßäëßà«ßäïßàºßå╖",
    "ßäëßà«ßäïßàºßå╝",
    "ßäëßà«ßäïßà╡ßå╕",
    "ßäëßà«ßäîßà«ßå½",
    "ßäëßà«ßäîßà╡ßå╕",
    "ßäëßà«ßäÄßà«ßå»",
    "ßäëßà«ßäÅßàÑßå║",
    "ßäëßà«ßäæßà╡ßå»",
    "ßäëßà«ßäÆßàíßå¿",
    "ßäëßà«ßäÆßàÑßå╖ßäëßàóßå╝",
    "ßäëßà«ßäÆßà¬ßäÇßà╡",
    "ßäëßà«ßå¿ßäéßàº",
    "ßäëßà«ßå¿ßäëßà⌐",
    "ßäëßà«ßå¿ßäîßàª",
    "ßäëßà«ßå½ßäÇßàíßå½",
    "ßäëßà«ßå½ßäëßàÑ",
    "ßäëßà«ßå½ßäëßà«",
    "ßäëßà«ßå½ßäëßà╡ßå¿ßäÇßàíßå½",
    "ßäëßà«ßå½ßäïßà▒",
    "ßäëßà«ßå«ßäÇßàíßäàßàíßå¿",
    "ßäëßà«ßå»ßäçßàºßå╝",
    "ßäëßà«ßå»ßäîßà╡ßå╕",
    "ßäëßà«ßå║ßäîßàí",
    "ßäëßà│ßäéßà╡ßå╖",
    "ßäëßà│ßäåßà«ßå»",
    "ßäëßà│ßäëßà│ßäàßà⌐",
    "ßäëßà│ßäëßà│ßå╝",
    "ßäëßà│ßäïßà░ßäÉßàÑ",
    "ßäëßà│ßäïßà▒ßäÄßà╡",
    "ßäëßà│ßäÅßàªßäïßà╡ßäÉßà│",
    "ßäëßà│ßäÉßà▓ßäâßà╡ßäïßà⌐",
    "ßäëßà│ßäÉßà│ßäàßàªßäëßà│",
    "ßäëßà│ßäæßà⌐ßäÄßà│",
    "ßäëßà│ßå»ßäìßàÑßå¿",
    "ßäëßà│ßå»ßäæßà│ßå╖",
    "ßäëßà│ßå╕ßäÇßà¬ßå½",
    "ßäëßà│ßå╕ßäÇßà╡",
    "ßäëßà│ßå╝ßäÇßàóßå¿",
    "ßäëßà│ßå╝ßäàßà╡",
    "ßäëßà│ßå╝ßäçßà«",
    "ßäëßà│ßå╝ßäïßà¡ßå╝ßäÄßàí",
    "ßäëßà│ßå╝ßäîßà╡ßå½",
    "ßäëßà╡ßäÇßàíßå¿",
    "ßäëßà╡ßäÇßàíßå½",
    "ßäëßà╡ßäÇßà⌐ßå»",
    "ßäëßà╡ßäÇßà│ßå╖ßäÄßà╡",
    "ßäëßà╡ßäéßàíßäàßà╡ßäïßà⌐",
    "ßäëßà╡ßäâßàóßå¿",
    "ßäëßà╡ßäàßà╡ßäîßà│",
    "ßäëßà╡ßäåßàªßå½ßäÉßà│",
    "ßäëßà╡ßäåßà╡ßå½",
    "ßäëßà╡ßäçßà«ßäåßà⌐",
    "ßäëßà╡ßäëßàÑßå½",
    "ßäëßà╡ßäëßàÑßå»",
    "ßäëßà╡ßäëßà│ßäÉßàªßå╖",
    "ßäëßà╡ßäïßàíßäçßàÑßäîßà╡",
    "ßäëßà╡ßäïßàÑßäåßàÑßäéßà╡",
    "ßäëßà╡ßäïßà»ßå»",
    "ßäëßà╡ßäïßà╡ßå½",
    "ßäëßà╡ßäïßà╡ßå»",
    "ßäëßà╡ßäîßàíßå¿",
    "ßäëßà╡ßäîßàíßå╝",
    "ßäëßà╡ßäîßàÑßå»",
    "ßäëßà╡ßäîßàÑßå╖",
    "ßäëßà╡ßäîßà«ßå╝",
    "ßäëßà╡ßäîßà│ßå½",
    "ßäëßà╡ßäîßà╡ßå╕",
    "ßäëßà╡ßäÄßàÑßå╝",
    "ßäëßà╡ßäÆßàíßå╕",
    "ßäëßà╡ßäÆßàÑßå╖",
    "ßäëßà╡ßå¿ßäÇßà«",
    "ßäëßà╡ßå¿ßäÇßà╡",
    "ßäëßà╡ßå¿ßäâßàíßå╝",
    "ßäëßà╡ßå¿ßäàßàúßå╝",
    "ßäëßà╡ßå¿ßäàßà¡ßäæßà«ßå╖",
    "ßäëßà╡ßå¿ßäåßà«ßå»",
    "ßäëßà╡ßå¿ßäêßàíßå╝",
    "ßäëßà╡ßå¿ßäëßàí",
    "ßäëßà╡ßå¿ßäëßàóßå╝ßäÆßà¬ßå»",
    "ßäëßà╡ßå¿ßäÄßà⌐",
    "ßäëßà╡ßå¿ßäÉßàíßå¿",
    "ßäëßà╡ßå¿ßäæßà«ßå╖",
    "ßäëßà╡ßå½ßäÇßà⌐",
    "ßäëßà╡ßå½ßäÇßà▓",
    "ßäëßà╡ßå½ßäéßàºßå╖",
    "ßäëßà╡ßå½ßäåßà«ßå½",
    "ßäëßà╡ßå½ßäçßàíßå»",
    "ßäëßà╡ßå½ßäçßà╡",
    "ßäëßà╡ßå½ßäëßàí",
    "ßäëßà╡ßå½ßäëßàª",
    "ßäëßà╡ßå½ßäïßà¡ßå╝",
    "ßäëßà╡ßå½ßäîßàªßäæßà«ßå╖",
    "ßäëßà╡ßå½ßäÄßàÑßå╝",
    "ßäëßà╡ßå½ßäÄßàª",
    "ßäëßà╡ßå½ßäÆßà¬",
    "ßäëßà╡ßå»ßäÇßàíßå╖",
    "ßäëßà╡ßå»ßäéßàó",
    "ßäëßà╡ßå»ßäàßàºßå¿",
    "ßäëßà╡ßå»ßäàßà¿",
    "ßäëßà╡ßå»ßäåßàíßå╝",
    "ßäëßà╡ßå»ßäëßà«",
    "ßäëßà╡ßå»ßäëßà│ßå╕",
    "ßäëßà╡ßå»ßäëßà╡",
    "ßäëßà╡ßå»ßäîßàíßå╝",
    "ßäëßà╡ßå»ßäîßàÑßå╝",
    "ßäëßà╡ßå»ßäîßà╡ßå»ßäîßàÑßå¿",
    "ßäëßà╡ßå»ßäÄßàÑßå½",
    "ßäëßà╡ßå»ßäÄßàª",
    "ßäëßà╡ßå»ßäÅßàÑßå║",
    "ßäëßà╡ßå»ßäÉßàó",
    "ßäëßà╡ßå»ßäæßàó",
    "ßäëßà╡ßå»ßäÆßàÑßå╖",
    "ßäëßà╡ßå»ßäÆßàºßå½",
    "ßäëßà╡ßå╖ßäàßà╡",
    "ßäëßà╡ßå╖ßäçßà«ßäàßà│ßå╖",
    "ßäëßà╡ßå╖ßäëßàí",
    "ßäëßà╡ßå╖ßäîßàíßå╝",
    "ßäëßà╡ßå╖ßäîßàÑßå╝",
    "ßäëßà╡ßå╖ßäæßàíßå½",
    "ßäèßàíßå╝ßäâßà«ßå╝ßäïßà╡",
    "ßäèßà╡ßäàßà│ßå╖",
    "ßäèßà╡ßäïßàíßå║",
    "ßäïßàíßäÇßàíßäèßà╡",
    "ßäïßàíßäéßàíßäïßà«ßå½ßäëßàÑ",
    "ßäïßàíßäâßà│ßäéßà╡ßå╖",
    "ßäïßàíßäâßà│ßå»",
    "ßäïßàíßäëßà▒ßäïßà«ßå╖",
    "ßäïßàíßäëßà│ßäæßàíßå»ßäÉßà│",
    "ßäïßàíßäëßà╡ßäïßàí",
    "ßäïßàíßäïßà«ßå»ßäàßàÑ",
    "ßäïßàíßäîßàÑßäèßà╡",
    "ßäïßàíßäîßà«ßå╖ßäåßàí",
    "ßäïßàíßäîßà╡ßå¿",
    "ßäïßàíßäÄßà╡ßå╖",
    "ßäïßàíßäæßàíßäÉßà│",
    "ßäïßàíßäæßà│ßäàßà╡ßäÅßàí",
    "ßäïßàíßäæßà│ßå╖",
    "ßäïßàíßäÆßà⌐ßå╕",
    "ßäïßàíßäÆßà│ßå½",
    "ßäïßàíßå¿ßäÇßà╡",
    "ßäïßàíßå¿ßäåßà⌐ßå╝",
    "ßäïßàíßå¿ßäëßà«",
    "ßäïßàíßå½ßäÇßàó",
    "ßäïßàíßå½ßäÇßàºßå╝",
    "ßäïßàíßå½ßäÇßà¬",
    "ßäïßàíßå½ßäéßàó",
    "ßäïßàíßå½ßäéßàºßå╝",
    "ßäïßàíßå½ßäâßà⌐ßå╝",
    "ßäïßàíßå½ßäçßàíßå╝",
    "ßäïßàíßå½ßäçßà«",
    "ßäïßàíßå½ßäîßà«",
    "ßäïßàíßå»ßäàßà«ßäåßà╡ßäéßà▓ßå╖",
    "ßäïßàíßå»ßäÅßà⌐ßäïßà⌐ßå»",
    "ßäïßàíßå╖ßäëßà╡",
    "ßäïßàíßå╖ßäÅßàÑßå║",
    "ßäïßàíßå╕ßäàßàºßå¿",
    "ßäïßàíßçüßäéßàíßå»",
    "ßäïßàíßçüßäåßà«ßå½",
    "ßäïßàóßäïßà╡ßå½",
    "ßäïßàóßäîßàÑßå╝",
    "ßäïßàóßå¿ßäëßà«",
    "ßäïßàóßå»ßäçßàÑßå╖",
    "ßäïßàúßäÇßàíßå½",
    "ßäïßàúßäâßàíßå½",
    "ßäïßàúßäïßà⌐ßå╝",
    "ßäïßàúßå¿ßäÇßàíßå½",
    "ßäïßàúßå¿ßäÇßà«ßå¿",
    "ßäïßàúßå¿ßäëßà⌐ßå¿",
    "ßäïßàúßå¿ßäëßà«",
    "ßäïßàúßå¿ßäîßàÑßå╖",
    "ßäïßàúßå¿ßäæßà«ßå╖",
    "ßäïßàúßå¿ßäÆßà⌐ßå½ßäéßàº",
    "ßäïßàúßå╝ßäéßàºßå╖",
    "ßäïßàúßå╝ßäàßàºßå¿",
    "ßäïßàúßå╝ßäåßàíßå»",
    "ßäïßàúßå╝ßäçßàóßäÄßà«",
    "ßäïßàúßå╝ßäîßà«",
    "ßäïßàúßå╝ßäæßàí",
    "ßäïßàÑßäâßà«ßå╖",
    "ßäïßàÑßäàßàºßäïßà«ßå╖",
    "ßäïßàÑßäàßà│ßå½",
    "ßäïßàÑßäîßàªßå║ßäçßàíßå╖",
    "ßäïßàÑßäìßàóßå╗ßäâßà│ßå½",
    "ßäïßàÑßäìßàÑßäâßàíßäÇßàí",
    "ßäïßàÑßäìßàÑßå½ßäîßà╡",
    "ßäïßàÑßå½ßäéßà╡",
    "ßäïßàÑßå½ßäâßàÑßå¿",
    "ßäïßàÑßå½ßäàßà⌐ßå½",
    "ßäïßàÑßå½ßäïßàÑ",
    "ßäïßàÑßå»ßäÇßà«ßå»",
    "ßäïßàÑßå»ßäàßà│ßå½",
    "ßäïßàÑßå»ßäïßà│ßå╖",
    "ßäïßàÑßå»ßäæßà╡ßå║",
    "ßäïßàÑßå╖ßäåßàí",
    "ßäïßàÑßå╕ßäåßà«",
    "ßäïßàÑßå╕ßäîßà⌐ßå╝",
    "ßäïßàÑßå╕ßäÄßàª",
    "ßäïßàÑßå╝ßäâßàÑßå╝ßäïßà╡",
    "ßäïßàÑßå╝ßäåßàíßå╝",
    "ßäïßàÑßå╝ßäÉßàÑßäàßà╡",
    "ßäïßàÑßå╜ßäÇßà│ßäîßàª",
    "ßäïßàªßäéßàÑßäîßà╡",
    "ßäïßàªßäïßàÑßäÅßàÑßå½",
    "ßäïßàªßå½ßäîßà╡ßå½",
    "ßäïßàºßäÇßàÑßå½",
    "ßäïßàºßäÇßà⌐ßäëßàóßå╝",
    "ßäïßàºßäÇßà¬ßå½",
    "ßäïßàºßäÇßà«ßå½",
    "ßäïßàºßäÇßà»ßå½",
    "ßäïßàºßäâßàóßäëßàóßå╝",
    "ßäïßàºßäâßàÑßå▓",
    "ßäïßàºßäâßà⌐ßå╝ßäëßàóßå╝",
    "ßäïßàºßäâßà│ßå½",
    "ßäïßàºßäàßà⌐ßå½",
    "ßäïßàºßäàßà│ßå╖",
    "ßäïßàºßäëßàÑßå║",
    "ßäïßàºßäëßàÑßå╝",
    "ßäïßàºßäïßà¬ßå╝",
    "ßäïßàºßäïßà╡ßå½",
    "ßäïßàºßäîßàÑßå½ßäÆßà╡",
    "ßäïßàºßäîßà╡ßå¿ßäïßà»ßå½",
    "ßäïßàºßäÆßàíßå¿ßäëßàóßå╝",
    "ßäïßàºßäÆßàóßå╝",
    "ßäïßàºßå¿ßäëßàí",
    "ßäïßàºßå¿ßäëßà╡",
    "ßäïßàºßå¿ßäÆßàíßå»",
    "ßäïßàºßå½ßäÇßàºßå»",
    "ßäïßàºßå½ßäÇßà«",
    "ßäïßàºßå½ßäÇßà│ßå¿",
    "ßäïßàºßå½ßäÇßà╡",
    "ßäïßàºßå½ßäàßàíßå¿",
    "ßäïßàºßå½ßäëßàÑßå»",
    "ßäïßàºßå½ßäëßàª",
    "ßäïßàºßå½ßäëßà⌐ßå¿",
    "ßäïßàºßå½ßäëßà│ßå╕",
    "ßäïßàºßå½ßäïßàó",
    "ßäïßàºßå½ßäïßà¿ßäïßà╡ßå½",
    "ßäïßàºßå½ßäïßà╡ßå½",
    "ßäïßàºßå½ßäîßàíßå╝",
    "ßäïßàºßå½ßäîßà«",
    "ßäïßàºßå½ßäÄßà«ßå»",
    "ßäïßàºßå½ßäæßà╡ßå»",
    "ßäïßàºßå½ßäÆßàíßå╕",
    "ßäïßàºßå½ßäÆßà▓",
    "ßäïßàºßå»ßäÇßà╡",
    "ßäïßàºßå»ßäåßàó",
    "ßäïßàºßå»ßäëßà¼",
    "ßäïßàºßå»ßäëßà╡ßå╖ßäÆßà╡",
    "ßäïßàºßå»ßäîßàÑßå╝",
    "ßäïßàºßå»ßäÄßàí",
    "ßäïßàºßå»ßäÆßà│ßå»",
    "ßäïßàºßå╖ßäàßàº",
    "ßäïßàºßå╕ßäëßàÑ",
    "ßäïßàºßå╝ßäÇßà«ßå¿",
    "ßäïßàºßå╝ßäéßàíßå╖",
    "ßäïßàºßå╝ßäëßàíßå╝",
    "ßäïßàºßå╝ßäïßàúßå╝",
    "ßäïßàºßå╝ßäïßàºßå¿",
    "ßäïßàºßå╝ßäïßà«ßå╝",
    "ßäïßàºßå╝ßäïßà»ßå½ßäÆßà╡",
    "ßäïßàºßå╝ßäÆßàí",
    "ßäïßàºßå╝ßäÆßàúßå╝",
    "ßäïßàºßå╝ßäÆßà⌐ßå½",
    "ßäïßàºßå╝ßäÆßà¬",
    "ßäïßàºßçüßäÇßà«ßäàßà╡",
    "ßäïßàºßçüßäçßàíßå╝",
    "ßäïßàºßçüßäîßà╡ßå╕",
    "ßäïßà¿ßäÇßàíßå╖",
    "ßäïßà¿ßäÇßà│ßå╖",
    "ßäïßà¿ßäçßàíßå╝",
    "ßäïßà¿ßäëßàíßå½",
    "ßäïßà¿ßäëßàíßå╝",
    "ßäïßà¿ßäëßàÑßå½",
    "ßäïßà¿ßäëßà«ßå»",
    "ßäïßà¿ßäëßà│ßå╕",
    "ßäïßà¿ßäëßà╡ßå¿ßäîßàíßå╝",
    "ßäïßà¿ßäïßàúßå¿",
    "ßäïßà¿ßäîßàÑßå½",
    "ßäïßà¿ßäîßàÑßå»",
    "ßäïßà¿ßäîßàÑßå╝",
    "ßäïßà¿ßäÅßàÑßå½ßäâßàó",
    "ßäïßà¿ßå║ßäéßàíßå»",
    "ßäïßà⌐ßäéßà│ßå»",
    "ßäïßà⌐ßäàßàíßå¿",
    "ßäïßà⌐ßäàßàóßå║ßäâßà⌐ßå╝ßäïßàíßå½",
    "ßäïßà⌐ßäàßàªßå½ßäîßà╡",
    "ßäïßà⌐ßäàßà⌐ßäîßà╡",
    "ßäïßà⌐ßäàßà│ßå½ßäçßàíßå»",
    "ßäïßà⌐ßäçßà│ßå½",
    "ßäïßà⌐ßäëßà╡ßå╕",
    "ßäïßà⌐ßäïßàºßå╖",
    "ßäïßà⌐ßäïßà»ßå»",
    "ßäïßà⌐ßäîßàÑßå½",
    "ßäïßà⌐ßäîßà╡ßå¿",
    "ßäïßà⌐ßäîßà╡ßå╝ßäïßàÑ",
    "ßäïßà⌐ßäæßàªßäàßàí",
    "ßäïßà⌐ßäæßà╡ßäëßà│ßäÉßàªßå»",
    "ßäïßà⌐ßäÆßà╡ßäàßàº",
    "ßäïßà⌐ßå¿ßäëßàíßå╝",
    "ßäïßà⌐ßå¿ßäëßà«ßäëßà«",
    "ßäïßà⌐ßå½ßäÇßàíßå╜",
    "ßäïßà⌐ßå½ßäàßàíßäïßà╡ßå½",
    "ßäïßà⌐ßå½ßäåßà⌐ßå╖",
    "ßäïßà⌐ßå½ßäîßà⌐ßå╝ßäïßà╡ßå»",
    "ßäïßà⌐ßå½ßäÉßà⌐ßå╝",
    "ßäïßà⌐ßå»ßäÇßàíßäïßà│ßå»",
    "ßäïßà⌐ßå»ßäàßà╡ßå╖ßäæßà╡ßå¿",
    "ßäïßà⌐ßå»ßäÆßàó",
    "ßäïßà⌐ßå║ßäÄßàíßäàßà╡ßå╖",
    "ßäïßà¬ßäïßà╡ßäëßàºßäÄßà│",
    "ßäïßà¬ßäïßà╡ßå½",
    "ßäïßà¬ßå½ßäëßàÑßå╝",
    "ßäïßà¬ßå½ßäîßàÑßå½",
    "ßäïßà¬ßå╝ßäçßà╡",
    "ßäïßà¬ßå╝ßäîßàí",
    "ßäïßà½ßäéßàúßäÆßàíßäåßàºßå½",
    "ßäïßà½ßå½ßäîßà╡",
    "ßäïßà¼ßäÇßàíßå║ßäîßà╡ßå╕",
    "ßäïßà¼ßäÇßà«ßå¿",
    "ßäïßà¼ßäàßà⌐ßäïßà«ßå╖",
    "ßäïßà¼ßäëßàíßå╖ßäÄßà⌐ßå½",
    "ßäïßà¼ßäÄßà«ßå»",
    "ßäïßà¼ßäÄßà╡ßå╖",
    "ßäïßà¼ßäÆßàíßå»ßäåßàÑßäéßà╡",
    "ßäïßà¼ßå½ßäçßàíßå»",
    "ßäïßà¼ßå½ßäëßà⌐ßå½",
    "ßäïßà¼ßå½ßäìßà⌐ßå¿",
    "ßäïßà¡ßäÇßà│ßå╖",
    "ßäïßà¡ßäïßà╡ßå»",
    "ßäïßà¡ßäîßà│ßå╖",
    "ßäïßà¡ßäÄßàÑßå╝",
    "ßäïßà¡ßå╝ßäÇßà╡",
    "ßäïßà¡ßå╝ßäëßàÑ",
    "ßäïßà¡ßå╝ßäïßàÑ",
    "ßäïßà«ßäëßàíßå½",
    "ßäïßà«ßäëßàÑßå½",
    "ßäïßà«ßäëßà│ßå╝",
    "ßäïßà«ßäïßàºßå½ßäÆßà╡",
    "ßäïßà«ßäîßàÑßå╝",
    "ßäïßà«ßäÄßàªßäÇßà«ßå¿",
    "ßäïßà«ßäæßàºßå½",
    "ßäïßà«ßå½ßäâßà⌐ßå╝",
    "ßäïßà«ßå½ßäåßàºßå╝",
    "ßäïßà«ßå½ßäçßàíßå½",
    "ßäïßà«ßå½ßäîßàÑßå½",
    "ßäïßà«ßå½ßäÆßàóßå╝",
    "ßäïßà«ßå»ßäëßàíßå½",
    "ßäïßà«ßå»ßäïßà│ßå╖",
    "ßäïßà«ßå╖ßäîßà╡ßå¿ßäïßà╡ßå╖",
    "ßäïßà«ßå║ßäïßàÑßäàßà│ßå½",
    "ßäïßà«ßå║ßäïßà│ßå╖",
    "ßäïßà»ßäéßàíßå¿",
    "ßäïßà»ßå½ßäÇßà⌐",
    "ßäïßà»ßå½ßäàßàó",
    "ßäïßà»ßå½ßäëßàÑ",
    "ßäïßà»ßå½ßäëßà«ßå╝ßäïßà╡",
    "ßäïßà»ßå½ßäïßà╡ßå½",
    "ßäïßà»ßå½ßäîßàíßå╝",
    "ßäïßà»ßå½ßäæßà╡ßäëßà│",
    "ßäïßà»ßå»ßäÇßà│ßå╕",
    "ßäïßà»ßå»ßäâßà│ßäÅßàÑßå╕",
    "ßäïßà»ßå»ßäëßàª",
    "ßäïßà»ßå»ßäïßà¡ßäïßà╡ßå»",
    "ßäïßà░ßäïßà╡ßäÉßàÑ",
    "ßäïßà▒ßäçßàíßå½",
    "ßäïßà▒ßäçßàÑßå╕",
    "ßäïßà▒ßäëßàÑßå╝",
    "ßäïßà▒ßäïßà»ßå½",
    "ßäïßà▒ßäÆßàÑßå╖",
    "ßäïßà▒ßäÆßàºßå╕",
    "ßäïßà▒ßå║ßäëßàíßäàßàíßå╖",
    "ßäïßà▓ßäéßàíßå½ßäÆßà╡",
    "ßäïßà▓ßäàßàÑßå╕",
    "ßäïßà▓ßäåßàºßå╝",
    "ßäïßà▓ßäåßà«ßå»",
    "ßäïßà▓ßäëßàíßå½",
    "ßäïßà▓ßäîßàÑßå¿",
    "ßäïßà▓ßäÄßà╡ßäïßà»ßå½",
    "ßäïßà▓ßäÆßàíßå¿",
    "ßäïßà▓ßäÆßàóßå╝",
    "ßäïßà▓ßäÆßàºßå╝",
    "ßäïßà▓ßå¿ßäÇßà«ßå½",
    "ßäïßà▓ßå¿ßäëßàíßå╝",
    "ßäïßà▓ßå¿ßäëßà╡ßå╕",
    "ßäïßà▓ßå¿ßäÄßàª",
    "ßäïßà│ßå½ßäÆßàóßå╝",
    "ßäïßà│ßå╖ßäàßàºßå¿",
    "ßäïßà│ßå╖ßäàßà¡",
    "ßäïßà│ßå╖ßäçßàíßå½",
    "ßäïßà│ßå╖ßäëßàÑßå╝",
    "ßäïßà│ßå╖ßäëßà╡ßå¿",
    "ßäïßà│ßå╖ßäïßàíßå¿",
    "ßäïßà│ßå╖ßäîßà«",
    "ßäïßà┤ßäÇßàºßå½",
    "ßäïßà┤ßäéßà⌐ßå½",
    "ßäïßà┤ßäåßà«ßå½",
    "ßäïßà┤ßäçßà⌐ßå¿",
    "ßäïßà┤ßäëßà╡ßå¿",
    "ßäïßà┤ßäëßà╡ßå╖",
    "ßäïßà┤ßäïßà¼ßäàßà⌐",
    "ßäïßà┤ßäïßà¡ßå¿",
    "ßäïßà┤ßäïßà»ßå½",
    "ßäïßà┤ßäÆßàíßå¿",
    "ßäïßà╡ßäÇßàÑßå║",
    "ßäïßà╡ßäÇßà⌐ßå║",
    "ßäïßà╡ßäéßàºßå╖",
    "ßäïßà╡ßäéßà⌐ßå╖",
    "ßäïßà╡ßäâßàíßå»",
    "ßäïßà╡ßäâßàóßäàßà⌐",
    "ßäïßà╡ßäâßà⌐ßå╝",
    "ßäïßà╡ßäàßàÑßçéßäÇßàª",
    "ßäïßà╡ßäàßàºßå¿ßäëßàÑ",
    "ßäïßà╡ßäàßà⌐ßå½ßäîßàÑßå¿",
    "ßäïßà╡ßäàßà│ßå╖",
    "ßäïßà╡ßäåßà╡ßå½",
    "ßäïßà╡ßäçßàíßå»ßäëßà⌐",
    "ßäïßà╡ßäçßàºßå»",
    "ßäïßà╡ßäçßà«ßå»",
    "ßäïßà╡ßäêßàíßå»",
    "ßäïßà╡ßäëßàíßå╝",
    "ßäïßà╡ßäëßàÑßå╝",
    "ßäïßà╡ßäëßà│ßå»",
    "ßäïßà╡ßäïßàúßäÇßà╡",
    "ßäïßà╡ßäïßà¡ßå╝",
    "ßäïßà╡ßäïßà«ßå║",
    "ßäïßà╡ßäïßà»ßå»",
    "ßäïßà╡ßäïßà│ßå¿ßäÇßà⌐",
    "ßäïßà╡ßäïßà╡ßå¿",
    "ßäïßà╡ßäîßàÑßå½",
    "ßäïßà╡ßäîßà«ßå╝",
    "ßäïßà╡ßäÉßà│ßå«ßäéßàíßå»",
    "ßäïßà╡ßäÉßà│ßå»",
    "ßäïßà╡ßäÆßà⌐ßå½",
    "ßäïßà╡ßå½ßäÇßàíßå½",
    "ßäïßà╡ßå½ßäÇßàºßå¿",
    "ßäïßà╡ßå½ßäÇßà⌐ßå╝",
    "ßäïßà╡ßå½ßäÇßà«",
    "ßäïßà╡ßå½ßäÇßà│ßå½",
    "ßäïßà╡ßå½ßäÇßà╡",
    "ßäïßà╡ßå½ßäâßà⌐",
    "ßäïßà╡ßå½ßäàßà▓",
    "ßäïßà╡ßå½ßäåßà«ßå»",
    "ßäïßà╡ßå½ßäëßàóßå╝",
    "ßäïßà╡ßå½ßäëßà½",
    "ßäïßà╡ßå½ßäïßàºßå½",
    "ßäïßà╡ßå½ßäïßà»ßå½",
    "ßäïßà╡ßå½ßäîßàó",
    "ßäïßà╡ßå½ßäîßà⌐ßå╝",
    "ßäïßà╡ßå½ßäÄßàÑßå½",
    "ßäïßà╡ßå½ßäÄßàª",
    "ßäïßà╡ßå½ßäÉßàÑßäéßàªßå║",
    "ßäïßà╡ßå½ßäÆßàí",
    "ßäïßà╡ßå½ßäÆßàºßå╝",
    "ßäïßà╡ßå»ßäÇßà⌐ßå╕",
    "ßäïßà╡ßå»ßäÇßà╡",
    "ßäïßà╡ßå»ßäâßàíßå½",
    "ßäïßà╡ßå»ßäâßàó",
    "ßäïßà╡ßå»ßäâßà│ßå╝",
    "ßäïßà╡ßå»ßäçßàíßå½",
    "ßäïßà╡ßå»ßäçßà⌐ßå½",
    "ßäïßà╡ßå»ßäçßà«",
    "ßäïßà╡ßå»ßäëßàíßå╝",
    "ßäïßà╡ßå»ßäëßàóßå╝",
    "ßäïßà╡ßå»ßäëßà⌐ßå½",
    "ßäïßà╡ßå»ßäïßà¡ßäïßà╡ßå»",
    "ßäïßà╡ßå»ßäïßà»ßå»",
    "ßäïßà╡ßå»ßäîßàÑßå╝",
    "ßäïßà╡ßå»ßäîßà⌐ßå╝",
    "ßäïßà╡ßå»ßäîßà«ßäïßà╡ßå»",
    "ßäïßà╡ßå»ßäìßà╡ßå¿",
    "ßäïßà╡ßå»ßäÄßàª",
    "ßäïßà╡ßå»ßäÄßà╡",
    "ßäïßà╡ßå»ßäÆßàóßå╝",
    "ßäïßà╡ßå»ßäÆßà¼ßäïßà¡ßå╝",
    "ßäïßà╡ßå╖ßäÇßà│ßå╖",
    "ßäïßà╡ßå╖ßäåßà«",
    "ßäïßà╡ßå╕ßäâßàó",
    "ßäïßà╡ßå╕ßäàßàºßå¿",
    "ßäïßà╡ßå╕ßäåßàíßå║",
    "ßäïßà╡ßå╕ßäëßàí",
    "ßäïßà╡ßå╕ßäëßà«ßå»",
    "ßäïßà╡ßå╕ßäëßà╡",
    "ßäïßà╡ßå╕ßäïßà»ßå½",
    "ßäïßà╡ßå╕ßäîßàíßå╝",
    "ßäïßà╡ßå╕ßäÆßàíßå¿",
    "ßäîßàíßäÇßàíßäïßà¡ßå╝",
    "ßäîßàíßäÇßàºßå¿",
    "ßäîßàíßäÇßà│ßå¿",
    "ßäîßàíßäâßà⌐ßå╝",
    "ßäîßàíßäàßàíßå╝",
    "ßäîßàíßäçßà«ßäëßà╡ßå╖",
    "ßäîßàíßäëßà╡ßå¿",
    "ßäîßàíßäëßà╡ßå½",
    "ßäîßàíßäïßàºßå½",
    "ßäîßàíßäïßà»ßå½",
    "ßäîßàíßäïßà▓ßå»",
    "ßäîßàíßäîßàÑßå½ßäÇßàÑ",
    "ßäîßàíßäîßàÑßå╝",
    "ßäîßàíßäîßà⌐ßå½ßäëßà╡ßå╖",
    "ßäîßàíßäæßàíßå½",
    "ßäîßàíßå¿ßäÇßàí",
    "ßäîßàíßå¿ßäéßàºßå½",
    "ßäîßàíßå¿ßäëßàÑßå╝",
    "ßäîßàíßå¿ßäïßàÑßå╕",
    "ßäîßàíßå¿ßäïßà¡ßå╝",
    "ßäîßàíßå¿ßäïßà│ßå½ßääßàíßå»",
    "ßäîßàíßå¿ßäæßà«ßå╖",
    "ßäîßàíßå½ßäâßà╡",
    "ßäîßàíßå½ßääßà│ßå¿",
    "ßäîßàíßå½ßäÄßà╡",
    "ßäîßàíßå»ßäåßà⌐ßå║",
    "ßäîßàíßå╖ßäüßàíßå½",
    "ßäîßàíßå╖ßäëßà«ßäÆßàíßå╖",
    "ßäîßàíßå╖ßäëßà╡",
    "ßäîßàíßå╖ßäïßà⌐ßå║",
    "ßäîßàíßå╖ßäîßàíßäàßà╡",
    "ßäîßàíßå╕ßäîßà╡",
    "ßäîßàíßå╝ßäÇßà¬ßå½",
    "ßäîßàíßå╝ßäÇßà«ßå½",
    "ßäîßàíßå╝ßäÇßà╡ßäÇßàíßå½",
    "ßäîßàíßå╝ßäàßàó",
    "ßäîßàíßå╝ßäàßà¿",
    "ßäîßàíßå╝ßäàßà│",
    "ßäîßàíßå╝ßäåßàí",
    "ßäîßàíßå╝ßäåßàºßå½",
    "ßäîßàíßå╝ßäåßà⌐",
    "ßäîßàíßå╝ßäåßà╡",
    "ßäîßàíßå╝ßäçßà╡",
    "ßäîßàíßå╝ßäëßàí",
    "ßäîßàíßå╝ßäëßà⌐",
    "ßäîßàíßå╝ßäëßà╡ßå¿",
    "ßäîßàíßå╝ßäïßàóßäïßà╡ßå½",
    "ßäîßàíßå╝ßäïßà╡ßå½",
    "ßäîßàíßå╝ßäîßàÑßå╖",
    "ßäîßàíßå╝ßäÄßàí",
    "ßäîßàíßå╝ßäÆßàíßå¿ßäÇßà│ßå╖",
    "ßäîßàóßäéßà│ßå╝",
    "ßäîßàóßäêßàíßå»ßäàßà╡",
    "ßäîßàóßäëßàíßå½",
    "ßäîßàóßäëßàóßå╝",
    "ßäîßàóßäîßàíßå¿ßäéßàºßå½",
    "ßäîßàóßäîßàÑßå╝",
    "ßäîßàóßäÄßàóßäÇßà╡",
    "ßäîßàóßäæßàíßå½",
    "ßäîßàóßäÆßàíßå¿",
    "ßäîßàóßäÆßà¬ßå»ßäïßà¡ßå╝",
    "ßäîßàÑßäÇßàÑßå║",
    "ßäîßàÑßäÇßà⌐ßäàßà╡",
    "ßäîßàÑßäÇßà⌐ßå║",
    "ßäîßàÑßäéßàºßå¿",
    "ßäîßàÑßäàßàÑßå½",
    "ßäîßàÑßäàßàÑßçéßäÇßàª",
    "ßäîßàÑßäçßàÑßå½",
    "ßäîßàÑßäïßà«ßå»",
    "ßäîßàÑßäîßàÑßå»ßäàßà⌐",
    "ßäîßàÑßäÄßà«ßå¿",
    "ßäîßàÑßå¿ßäÇßà│ßå¿",
    "ßäîßàÑßå¿ßäâßàíßå╝ßäÆßà╡",
    "ßäîßàÑßå¿ßäëßàÑßå╝",
    "ßäîßàÑßå¿ßäïßà¡ßå╝",
    "ßäîßàÑßå¿ßäïßà│ßå╝",
    "ßäîßàÑßå½ßäÇßàó",
    "ßäîßàÑßå½ßäÇßà⌐ßå╝",
    "ßäîßàÑßå½ßäÇßà╡",
    "ßäîßàÑßå½ßäâßàíßå»",
    "ßäîßàÑßå½ßäàßàíßäâßà⌐",
    "ßäîßàÑßå½ßäåßàíßå╝",
    "ßäîßàÑßå½ßäåßà«ßå½",
    "ßäîßàÑßå½ßäçßàíßå½",
    "ßäîßàÑßå½ßäçßà«",
    "ßäîßàÑßå½ßäëßàª",
    "ßäîßàÑßå½ßäëßà╡",
    "ßäîßàÑßå½ßäïßà¡ßå╝",
    "ßäîßàÑßå½ßäîßàí",
    "ßäîßàÑßå½ßäîßàóßå╝",
    "ßäîßàÑßå½ßäîßà«",
    "ßäîßàÑßå½ßäÄßàÑßå»",
    "ßäîßàÑßå½ßäÄßàª",
    "ßäîßàÑßå½ßäÉßà⌐ßå╝",
    "ßäîßàÑßå½ßäÆßàº",
    "ßäîßàÑßå½ßäÆßà«",
    "ßäîßàÑßå»ßäâßàó",
    "ßäîßàÑßå»ßäåßàíßå╝",
    "ßäîßàÑßå»ßäçßàíßå½",
    "ßäîßàÑßå»ßäïßàúßå¿",
    "ßäîßàÑßå»ßäÄßàí",
    "ßäîßàÑßå╖ßäÇßàÑßå╖",
    "ßäîßàÑßå╖ßäëßà«",
    "ßäîßàÑßå╖ßäëßà╡ßå╖",
    "ßäîßàÑßå╖ßäïßà»ßå½",
    "ßäîßàÑßå╖ßäîßàÑßå╖",
    "ßäîßàÑßå╖ßäÄßàí",
    "ßäîßàÑßå╕ßäÇßà│ßå½",
    "ßäîßàÑßå╕ßäëßà╡",
    "ßäîßàÑßå╕ßäÄßà⌐ßå¿",
    "ßäîßàÑßå║ßäÇßàíßäàßàíßå¿",
    "ßäîßàÑßå╝ßäÇßàÑßäîßàíßå╝",
    "ßäîßàÑßå╝ßäâßà⌐",
    "ßäîßàÑßå╝ßäàßà▓ßäîßàíßå╝",
    "ßäîßàÑßå╝ßäàßà╡",
    "ßäîßàÑßå╝ßäåßàíßå»",
    "ßäîßàÑßå╝ßäåßàºßå½",
    "ßäîßàÑßå╝ßäåßà«ßå½",
    "ßäîßàÑßå╝ßäçßàíßå½ßäâßàó",
    "ßäîßàÑßå╝ßäçßà⌐",
    "ßäîßàÑßå╝ßäçßà«",
    "ßäîßàÑßå╝ßäçßà╡",
    "ßäîßàÑßå╝ßäëßàíßå╝",
    "ßäîßàÑßå╝ßäëßàÑßå╝",
    "ßäîßàÑßå╝ßäïßà⌐",
    "ßäîßàÑßå╝ßäïßà»ßå½",
    "ßäîßàÑßå╝ßäîßàíßå╝",
    "ßäîßàÑßå╝ßäîßà╡",
    "ßäîßàÑßå╝ßäÄßà╡",
    "ßäîßàÑßå╝ßäÆßà¬ßå¿ßäÆßà╡",
    "ßäîßàªßäÇßà⌐ßå╝",
    "ßäîßàªßäÇßà¬ßäîßàÑßå╖",
    "ßäîßàªßäâßàóßäàßà⌐",
    "ßäîßàªßäåßà⌐ßå¿",
    "ßäîßàªßäçßàíßå»",
    "ßäîßàªßäçßàÑßå╕",
    "ßäîßàªßäëßàíßå║ßäéßàíßå»",
    "ßäîßàªßäïßàíßå½",
    "ßäîßàªßäïßà╡ßå»",
    "ßäîßàªßäîßàíßå¿",
    "ßäîßàªßäîßà«ßäâßà⌐",
    "ßäîßàªßäÄßà«ßå»",
    "ßäîßàªßäæßà«ßå╖",
    "ßäîßàªßäÆßàíßå½",
    "ßäîßà⌐ßäÇßàíßå¿",
    "ßäîßà⌐ßäÇßàÑßå½",
    "ßäîßà⌐ßäÇßà│ßå╖",
    "ßäîßà⌐ßäÇßà╡ßå╝",
    "ßäîßà⌐ßäåßàºßå╝",
    "ßäîßà⌐ßäåßà╡ßäàßà¡",
    "ßäîßà⌐ßäëßàíßå╝",
    "ßäîßà⌐ßäëßàÑßå½",
    "ßäîßà⌐ßäïßà¡ßå╝ßäÆßà╡",
    "ßäîßà⌐ßäîßàÑßå»",
    "ßäîßà⌐ßäîßàÑßå╝",
    "ßäîßà⌐ßäîßà╡ßå¿",
    "ßäîßà⌐ßå½ßäâßàóßå║ßäåßàíßå»",
    "ßäîßà⌐ßå½ßäîßàó",
    "ßäîßà⌐ßå»ßäïßàÑßå╕",
    "ßäîßà⌐ßå»ßäïßà│ßå╖",
    "ßäîßà⌐ßå╝ßäÇßà¡",
    "ßäîßà⌐ßå╝ßäàßà⌐",
    "ßäîßà⌐ßå╝ßäàßà▓",
    "ßäîßà⌐ßå╝ßäëßà⌐ßäàßà╡",
    "ßäîßà⌐ßå╝ßäïßàÑßå╕ßäïßà»ßå½",
    "ßäîßà⌐ßå╝ßäîßà⌐ßå╝",
    "ßäîßà⌐ßå╝ßäÆßàíßå╕",
    "ßäîßà¬ßäëßàÑßå¿",
    "ßäîßà¼ßäïßà╡ßå½",
    "ßäîßà«ßäÇßà¬ßå½ßäîßàÑßå¿",
    "ßäîßà«ßäàßà│ßå╖",
    "ßäîßà«ßäåßàíßå»",
    "ßäîßà«ßäåßàÑßäéßà╡",
    "ßäîßà«ßäåßàÑßå¿",
    "ßäîßà«ßäåßà«ßå½",
    "ßäîßà«ßäåßà╡ßå½",
    "ßäîßà«ßäçßàíßå╝",
    "ßäîßà«ßäçßàºßå½",
    "ßäîßà«ßäëßà╡ßå¿",
    "ßäîßà«ßäïßà╡ßå½",
    "ßäîßà«ßäïßà╡ßå»",
    "ßäîßà«ßäîßàíßå╝",
    "ßäîßà«ßäîßàÑßå½ßäîßàí",
    "ßäîßà«ßäÉßàóßå¿",
    "ßäîßà«ßå½ßäçßà╡",
    "ßäîßà«ßå»ßäÇßàÑßäàßà╡",
    "ßäîßà«ßå»ßäÇßà╡",
    "ßäîßà«ßå»ßäåßà«ßäéßà┤",
    "ßäîßà«ßå╝ßäÇßàíßå½",
    "ßäîßà«ßå╝ßäÇßà¿ßäçßàíßå╝ßäëßà⌐ßå╝",
    "ßäîßà«ßå╝ßäÇßà«ßå¿",
    "ßäîßà«ßå╝ßäéßàºßå½",
    "ßäîßà«ßå╝ßäâßàíßå½",
    "ßäîßà«ßå╝ßäâßà⌐ßå¿",
    "ßäîßà«ßå╝ßäçßàíßå½",
    "ßäîßà«ßå╝ßäçßà«",
    "ßäîßà«ßå╝ßäëßàª",
    "ßäîßà«ßå╝ßäëßà⌐ßäÇßà╡ßäïßàÑßå╕",
    "ßäîßà«ßå╝ßäëßà«ßå½",
    "ßäîßà«ßå╝ßäïßàíßå╝",
    "ßäîßà«ßå╝ßäïßà¡",
    "ßäîßà«ßå╝ßäÆßàíßå¿ßäÇßà¡",
    "ßäîßà│ßå¿ßäëßàÑßå¿",
    "ßäîßà│ßå¿ßäëßà╡",
    "ßäîßà│ßå»ßäÇßàÑßäïßà«ßå╖",
    "ßäîßà│ßå╝ßäÇßàí",
    "ßäîßà│ßå╝ßäÇßàÑ",
    "ßäîßà│ßå╝ßäÇßà»ßå½",
    "ßäîßà│ßå╝ßäëßàíßå╝",
    "ßäîßà│ßå╝ßäëßàª",
    "ßäîßà╡ßäÇßàíßå¿",
    "ßäîßà╡ßäÇßàíßå╕",
    "ßäîßà╡ßäÇßàºßå╝",
    "ßäîßà╡ßäÇßà│ßå¿ßäÆßà╡",
    "ßäîßà╡ßäÇßà│ßå╖",
    "ßäîßà╡ßäÇßà│ßå╕",
    "ßäîßà╡ßäéßà│ßå╝",
    "ßäîßà╡ßäàßà│ßå╖ßäÇßà╡ßå»",
    "ßäîßà╡ßäàßà╡ßäëßàíßå½",
    "ßäîßà╡ßäçßàíßå╝",
    "ßäîßà╡ßäçßà«ßå╝",
    "ßäîßà╡ßäëßà╡ßå¿",
    "ßäîßà╡ßäïßàºßå¿",
    "ßäîßà╡ßäïßà«ßäÇßàó",
    "ßäîßà╡ßäïßà»ßå½",
    "ßäîßà╡ßäîßàÑßå¿",
    "ßäîßà╡ßäîßàÑßå╖",
    "ßäîßà╡ßäîßà╡ßå½",
    "ßäîßà╡ßäÄßà«ßå»",
    "ßäîßà╡ßå¿ßäëßàÑßå½",
    "ßäîßà╡ßå¿ßäïßàÑßå╕",
    "ßäîßà╡ßå¿ßäïßà»ßå½",
    "ßäîßà╡ßå¿ßäîßàíßå╝",
    "ßäîßà╡ßå½ßäÇßà│ßå╕",
    "ßäîßà╡ßå½ßäâßà⌐ßå╝",
    "ßäîßà╡ßå½ßäàßà⌐",
    "ßäîßà╡ßå½ßäàßà¡",
    "ßäîßà╡ßå½ßäàßà╡",
    "ßäîßà╡ßå½ßäìßàí",
    "ßäîßà╡ßå½ßäÄßàíßå»",
    "ßäîßà╡ßå½ßäÄßà«ßå»",
    "ßäîßà╡ßå½ßäÉßà⌐ßå╝",
    "ßäîßà╡ßå½ßäÆßàóßå╝",
    "ßäîßà╡ßå»ßäåßà«ßå½",
    "ßäîßà╡ßå»ßäçßàºßå╝",
    "ßäîßà╡ßå»ßäëßàÑ",
    "ßäîßà╡ßå╖ßäîßàíßå¿",
    "ßäîßà╡ßå╕ßäâßàíßå½",
    "ßäîßà╡ßå╕ßäïßàíßå½",
    "ßäîßà╡ßå╕ßäîßà«ßå╝",
    "ßäìßàíßäîßà│ßå╝",
    "ßäìßà╡ßäüßàÑßäÇßà╡",
    "ßäÄßàíßäéßàíßå╖",
    "ßäÄßàíßäàßàíßäàßà╡",
    "ßäÄßàíßäàßàúßå╝",
    "ßäÄßàíßäàßà╡ßå╖",
    "ßäÄßàíßäçßàºßå»",
    "ßäÄßàíßäëßàÑßå½",
    "ßäÄßàíßäÄßà│ßå╖",
    "ßäÄßàíßå¿ßäÇßàíßå¿",
    "ßäÄßàíßå½ßäåßà«ßå»",
    "ßäÄßàíßå½ßäëßàÑßå╝",
    "ßäÄßàíßå╖ßäÇßàí",
    "ßäÄßàíßå╖ßäÇßà╡ßäàßà│ßå╖",
    "ßäÄßàíßå╖ßäëßàó",
    "ßäÄßàíßå╖ßäëßàÑßå¿",
    "ßäÄßàíßå╖ßäïßàº",
    "ßäÄßàíßå╖ßäïßà¼",
    "ßäÄßàíßå╖ßäîßà⌐",
    "ßäÄßàíßå║ßäîßàíßå½",
    "ßäÄßàíßå╝ßäÇßàí",
    "ßäÄßàíßå╝ßäÇßà⌐",
    "ßäÄßàíßå╝ßäÇßà«",
    "ßäÄßàíßå╝ßäåßà«ßå½",
    "ßäÄßàíßå╝ßäçßàíßå⌐",
    "ßäÄßàíßå╝ßäîßàíßå¿",
    "ßäÄßàíßå╝ßäîßà⌐",
    "ßäÄßàóßäéßàÑßå»",
    "ßäÄßàóßäîßàÑßå╖",
    "ßäÄßàóßå¿ßäÇßàíßäçßàíßå╝",
    "ßäÄßàóßå¿ßäçßàíßå╝",
    "ßäÄßàóßå¿ßäëßàíßå╝",
    "ßäÄßàóßå¿ßäïßà╡ßå╖",
    "ßäÄßàóßå╖ßäæßà╡ßäïßàÑßå½",
    "ßäÄßàÑßäçßàÑßå»",
    "ßäÄßàÑßäïßà│ßå╖",
    "ßäÄßàÑßå½ßäÇßà«ßå¿",
    "ßäÄßàÑßå½ßäâßà«ßå╝",
    "ßäÄßàÑßå½ßäîßàíßå╝",
    "ßäÄßàÑßå½ßäîßàó",
    "ßäÄßàÑßå½ßäÄßàÑßå½ßäÆßà╡",
    "ßäÄßàÑßå»ßäâßà⌐",
    "ßäÄßàÑßå»ßäîßàÑßäÆßà╡",
    "ßäÄßàÑßå»ßäÆßàíßå¿",
    "ßäÄßàÑßå║ßäéßàíßå»",
    "ßäÄßàÑßå║ßäìßàó",
    "ßäÄßàÑßå╝ßäéßàºßå½",
    "ßäÄßàÑßå╝ßäçßàíßäîßà╡",
    "ßäÄßàÑßå╝ßäëßà⌐",
    "ßäÄßàÑßå╝ßäÄßà«ßå½",
    "ßäÄßàªßäÇßà¿",
    "ßäÄßàªßäàßàºßå¿",
    "ßäÄßàªßäïßà⌐ßå½",
    "ßäÄßàªßäïßà▓ßå¿",
    "ßäÄßàªßäîßà«ßå╝",
    "ßäÄßàªßäÆßàÑßå╖",
    "ßäÄßà⌐ßäâßà│ßå╝ßäÆßàíßå¿ßäëßàóßå╝",
    "ßäÄßà⌐ßäçßàíßå½",
    "ßäÄßà⌐ßäçßàíßå╕",
    "ßäÄßà⌐ßäëßàíßå╝ßäÆßà¬",
    "ßäÄßà⌐ßäëßà«ßå½",
    "ßäÄßà⌐ßäïßàºßäàßà│ßå╖",
    "ßäÄßà⌐ßäïßà»ßå½",
    "ßäÄßà⌐ßäîßàÑßäéßàºßå¿",
    "ßäÄßà⌐ßäîßàÑßå╖",
    "ßäÄßà⌐ßäÄßàÑßå╝",
    "ßäÄßà⌐ßäÅßà⌐ßå»ßäàßà╡ßå║",
    "ßäÄßà⌐ßå║ßäçßà«ßå»",
    "ßäÄßà⌐ßå╝ßäÇßàíßå¿",
    "ßäÄßà⌐ßå╝ßäàßà╡",
    "ßäÄßà⌐ßå╝ßäîßàíßå╝",
    "ßäÄßà¬ßå»ßäïßàºßå╝",
    "ßäÄßà¼ßäÇßà│ßå½",
    "ßäÄßà¼ßäëßàíßå╝",
    "ßäÄßà¼ßäëßàÑßå½",
    "ßäÄßà¼ßäëßà╡ßå½",
    "ßäÄßà¼ßäïßàíßå¿",
    "ßäÄßà¼ßäîßà⌐ßå╝",
    "ßäÄßà«ßäëßàÑßå¿",
    "ßäÄßà«ßäïßàÑßå¿",
    "ßäÄßà«ßäîßà╡ßå½",
    "ßäÄßà«ßäÄßàÑßå½",
    "ßäÄßà«ßäÄßà│ßå¿",
    "ßäÄßà«ßå¿ßäÇßà«",
    "ßäÄßà«ßå¿ßäëßà⌐",
    "ßäÄßà«ßå¿ßäîßàª",
    "ßäÄßà«ßå¿ßäÆßàí",
    "ßäÄßà«ßå»ßäÇßà│ßå½",
    "ßäÄßà«ßå»ßäçßàíßå»",
    "ßäÄßà«ßå»ßäëßàíßå½",
    "ßäÄßà«ßå»ßäëßà╡ßå½",
    "ßäÄßà«ßå»ßäïßàºßå½",
    "ßäÄßà«ßå»ßäïßà╡ßå╕",
    "ßäÄßà«ßå»ßäîßàíßå╝",
    "ßäÄßà«ßå»ßäæßàíßå½",
    "ßäÄßà«ßå╝ßäÇßàºßå¿",
    "ßäÄßà«ßå╝ßäÇßà⌐",
    "ßäÄßà«ßå╝ßäâßà⌐ßå»",
    "ßäÄßà«ßå╝ßäçßà«ßå½ßäÆßà╡",
    "ßäÄßà«ßå╝ßäÄßàÑßå╝ßäâßà⌐",
    "ßäÄßà▒ßäïßàÑßå╕",
    "ßäÄßà▒ßäîßà╡ßå¿",
    "ßäÄßà▒ßäÆßàúßå╝",
    "ßäÄßà╡ßäïßàúßå¿",
    "ßäÄßà╡ßå½ßäÇßà«",
    "ßäÄßà╡ßå½ßäÄßàÑßå¿",
    "ßäÄßà╡ßå»ßäëßà╡ßå╕",
    "ßäÄßà╡ßå»ßäïßà»ßå»",
    "ßäÄßà╡ßå»ßäæßàíßå½",
    "ßäÄßà╡ßå╖ßäâßàó",
    "ßäÄßà╡ßå╖ßäåßà«ßå¿",
    "ßäÄßà╡ßå╖ßäëßà╡ßå»",
    "ßäÄßà╡ßå║ßäëßà⌐ßå»",
    "ßäÄßà╡ßå╝ßäÄßàíßå½",
    "ßäÅßàíßäåßàªßäàßàí",
    "ßäÅßàíßäïßà«ßå½ßäÉßàÑ",
    "ßäÅßàíßå»ßäÇßà«ßå¿ßäëßà«",
    "ßäÅßàóßäàßà╡ßå¿ßäÉßàÑ",
    "ßäÅßàóßå╖ßäæßàÑßäëßà│",
    "ßäÅßàóßå╖ßäæßàªßäïßà╡ßå½",
    "ßäÅßàÑßäÉßà│ßå½",
    "ßäÅßàÑßå½ßäâßà╡ßäëßàºßå½",
    "ßäÅßàÑßå»ßäàßàÑ",
    "ßäÅßàÑßå╖ßäæßà▓ßäÉßàÑ",
    "ßäÅßà⌐ßäüßà╡ßäàßà╡",
    "ßäÅßà⌐ßäåßà╡ßäâßà╡",
    "ßäÅßà⌐ßå½ßäëßàÑßäÉßà│",
    "ßäÅßà⌐ßå»ßäàßàí",
    "ßäÅßà⌐ßå╖ßäæßà│ßå»ßäàßàªßå¿ßäëßà│",
    "ßäÅßà⌐ßå╝ßäéßàíßäåßà«ßå»",
    "ßäÅßà½ßäÇßàíßå╖",
    "ßäÅßà«ßäâßàªßäÉßàí",
    "ßäÅßà│ßäàßà╡ßå╖",
    "ßäÅßà│ßå½ßäÇßà╡ßå»",
    "ßäÅßà│ßå½ßääßàíßå»",
    "ßäÅßà│ßå½ßäëßà⌐ßäàßà╡",
    "ßäÅßà│ßå½ßäïßàíßäâßà│ßå»",
    "ßäÅßà│ßå½ßäïßàÑßäåßàÑßäéßà╡",
    "ßäÅßà│ßå½ßäïßà╡ßå»",
    "ßäÅßà│ßå½ßäîßàÑßå»",
    "ßäÅßà│ßå»ßäàßàóßäëßà╡ßå¿",
    "ßäÅßà│ßå»ßäàßàÑßå╕",
    "ßäÅßà╡ßå»ßäàßà⌐",
    "ßäÉßàíßäïßà╡ßå╕",
    "ßäÉßàíßäîßàíßäÇßà╡",
    "ßäÉßàíßå¿ßäÇßà«",
    "ßäÉßàíßå¿ßäîßàí",
    "ßäÉßàíßå½ßäëßàóßå╝",
    "ßäÉßàóßäÇßà»ßå½ßäâßà⌐",
    "ßäÉßàóßäïßàúßå╝",
    "ßäÉßàóßäæßà«ßå╝",
    "ßäÉßàóßå¿ßäëßà╡",
    "ßäÉßàóßå»ßäàßàÑßå½ßäÉßà│",
    "ßäÉßàÑßäéßàÑßå»",
    "ßäÉßàÑßäåßà╡ßäéßàÑßå»",
    "ßäÉßàªßäéßà╡ßäëßà│",
    "ßäÉßàªßäëßà│ßäÉßà│",
    "ßäÉßàªßäïßà╡ßäçßà│ßå»",
    "ßäÉßàªßå»ßäàßàªßäçßà╡ßäîßàÑßå½",
    "ßäÉßà⌐ßäàßà⌐ßå½",
    "ßäÉßà⌐ßäåßàíßäÉßà⌐",
    "ßäÉßà⌐ßäïßà¡ßäïßà╡ßå»",
    "ßäÉßà⌐ßå╝ßäÇßà¿",
    "ßäÉßà⌐ßå╝ßäÇßà¬",
    "ßäÉßà⌐ßå╝ßäàßà⌐",
    "ßäÉßà⌐ßå╝ßäëßà╡ßå½",
    "ßäÉßà⌐ßå╝ßäïßàºßå¿",
    "ßäÉßà⌐ßå╝ßäïßà╡ßå»",
    "ßäÉßà⌐ßå╝ßäîßàíßå╝",
    "ßäÉßà⌐ßå╝ßäîßàª",
    "ßäÉßà⌐ßå╝ßäîßà│ßå╝",
    "ßäÉßà⌐ßå╝ßäÆßàíßå╕",
    "ßäÉßà⌐ßå╝ßäÆßà¬",
    "ßäÉßà¼ßäÇßà│ßå½",
    "ßäÉßà¼ßäïßà»ßå½",
    "ßäÉßà¼ßäîßà╡ßå¿ßäÇßà│ßå╖",
    "ßäÉßà▒ßäÇßà╡ßå╖",
    "ßäÉßà│ßäàßàÑßå¿",
    "ßäÉßà│ßå¿ßäÇßà│ßå╕",
    "ßäÉßà│ßå¿ßäçßàºßå»",
    "ßäÉßà│ßå¿ßäëßàÑßå╝",
    "ßäÉßà│ßå¿ßäëßà«",
    "ßäÉßà│ßå¿ßäîßà╡ßå╝",
    "ßäÉßà│ßå¿ßäÆßà╡",
    "ßäÉßà│ßå½ßäÉßà│ßå½ßäÆßà╡",
    "ßäÉßà╡ßäëßàºßäÄßà│",
    "ßäæßàíßäàßàíßå½ßäëßàóßå¿",
    "ßäæßàíßäïßà╡ßå»",
    "ßäæßàíßäÄßà«ßå»ßäëßà⌐",
    "ßäæßàíßå½ßäÇßàºßå»",
    "ßäæßàíßå½ßäâßàíßå½",
    "ßäæßàíßå½ßäåßàó",
    "ßäæßàíßå½ßäëßàí",
    "ßäæßàíßå»ßäëßà╡ßå╕",
    "ßäæßàíßå»ßäïßà»ßå»",
    "ßäæßàíßå╕ßäëßà⌐ßå╝",
    "ßäæßàóßäëßàºßå½",
    "ßäæßàóßå¿ßäëßà│",
    "ßäæßàóßå¿ßäëßà╡ßäåßà╡ßå»ßäàßà╡",
    "ßäæßàóßå½ßäÉßà╡",
    "ßäæßàÑßäëßàªßå½ßäÉßà│",
    "ßäæßàªßäïßà╡ßå½ßäÉßà│",
    "ßäæßàºßå½ßäÇßàºßå½",
    "ßäæßàºßå½ßäïßà┤",
    "ßäæßàºßå½ßäîßà╡",
    "ßäæßàºßå½ßäÆßà╡",
    "ßäæßàºßå╝ßäÇßàí",
    "ßäæßàºßå╝ßäÇßà▓ßå½",
    "ßäæßàºßå╝ßäëßàóßå╝",
    "ßäæßàºßå╝ßäëßà⌐",
    "ßäæßàºßå╝ßäïßàúßå╝",
    "ßäæßàºßå╝ßäïßà╡ßå»",
    "ßäæßàºßå╝ßäÆßà¬",
    "ßäæßà⌐ßäëßà│ßäÉßàÑ",
    "ßäæßà⌐ßäïßà╡ßå½ßäÉßà│",
    "ßäæßà⌐ßäîßàíßå╝",
    "ßäæßà⌐ßäÆßàíßå╖",
    "ßäæßà¡ßäåßàºßå½",
    "ßäæßà¡ßäîßàÑßå╝",
    "ßäæßà¡ßäîßà«ßå½",
    "ßäæßà¡ßäÆßàºßå½",
    "ßäæßà«ßå╖ßäåßà⌐ßå¿",
    "ßäæßà«ßå╖ßäîßà╡ßå»",
    "ßäæßà«ßå╝ßäÇßàºßå╝",
    "ßäæßà«ßå╝ßäëßà⌐ßå¿",
    "ßäæßà«ßå╝ßäëßà│ßå╕",
    "ßäæßà│ßäàßàíßå╝ßäëßà│",
    "ßäæßà│ßäàßà╡ßå½ßäÉßàÑ",
    "ßäæßà│ßå»ßäàßàíßäëßà│ßäÉßà╡ßå¿",
    "ßäæßà╡ßäÇßà⌐ßå½",
    "ßäæßà╡ßäåßàíßå╝",
    "ßäæßà╡ßäïßàíßäéßà⌐",
    "ßäæßà╡ßå»ßäàßà│ßå╖",
    "ßäæßà╡ßå»ßäëßà«",
    "ßäæßà╡ßå»ßäïßà¡",
    "ßäæßà╡ßå»ßäîßàí",
    "ßäæßà╡ßå»ßäÉßà⌐ßå╝",
    "ßäæßà╡ßå╝ßäÇßà¿",
    "ßäÆßàíßäéßà│ßäéßà╡ßå╖",
    "ßäÆßàíßäéßà│ßå»",
    "ßäÆßàíßäâßà│ßäïßà░ßäïßàÑ",
    "ßäÆßàíßäàßà«ßå║ßäçßàíßå╖",
    "ßäÆßàíßäçßàíßå½ßäÇßà╡",
    "ßäÆßàíßäëßà«ßå¿ßäîßà╡ßå╕",
    "ßäÆßàíßäëßà«ßå½",
    "ßäÆßàíßäïßàºßäÉßà│ßå½",
    "ßäÆßàíßäîßà╡ßäåßàíßå½",
    "ßäÆßàíßäÄßàÑßå½",
    "ßäÆßàíßäæßà«ßå╖",
    "ßäÆßàíßäæßà╡ßå»",
    "ßäÆßàíßå¿ßäÇßà¬",
    "ßäÆßàíßå¿ßäÇßà¡",
    "ßäÆßàíßå¿ßäÇßà│ßå╕",
    "ßäÆßàíßå¿ßäÇßà╡",
    "ßäÆßàíßå¿ßäéßàºßå½",
    "ßäÆßàíßå¿ßäàßàºßå¿",
    "ßäÆßàíßå¿ßäçßàÑßå½",
    "ßäÆßàíßå¿ßäçßà«ßäåßà⌐",
    "ßäÆßàíßå¿ßäçßà╡",
    "ßäÆßàíßå¿ßäëßàóßå╝",
    "ßäÆßàíßå¿ßäëßà«ßå»",
    "ßäÆßàíßå¿ßäëßà│ßå╕",
    "ßäÆßàíßå¿ßäïßà¡ßå╝ßäæßà«ßå╖",
    "ßäÆßàíßå¿ßäïßà»ßå½",
    "ßäÆßàíßå¿ßäïßà▒",
    "ßäÆßàíßå¿ßäîßàí",
    "ßäÆßàíßå¿ßäîßàÑßå╖",
    "ßäÆßàíßå½ßäÇßà¿",
    "ßäÆßàíßå½ßäÇßà│ßå»",
    "ßäÆßàíßå½ßäüßàÑßäçßàÑßå½ßäïßàª",
    "ßäÆßàíßå½ßäéßàíßå╜",
    "ßäÆßàíßå½ßäéßà«ßå½",
    "ßäÆßàíßå½ßäâßà⌐ßå╝ßäïßàíßå½",
    "ßäÆßàíßå½ßääßàó",
    "ßäÆßàíßå½ßäàßàíßäëßàíßå½",
    "ßäÆßàíßå½ßäåßàíßäâßà╡",
    "ßäÆßàíßå½ßäåßà«ßå½",
    "ßäÆßàíßå½ßäçßàÑßå½",
    "ßäÆßàíßå½ßäçßà⌐ßå¿",
    "ßäÆßàíßå½ßäëßà╡ßå¿",
    "ßäÆßàíßå½ßäïßàºßäàßà│ßå╖",
    "ßäÆßàíßå½ßäìßà⌐ßå¿",
    "ßäÆßàíßå»ßäåßàÑßäéßà╡",
    "ßäÆßàíßå»ßäïßàíßäçßàÑßäîßà╡",
    "ßäÆßàíßå»ßäïßà╡ßå½",
    "ßäÆßàíßå╖ßäüßàª",
    "ßäÆßàíßå╖ßäçßà«ßäàßà⌐",
    "ßäÆßàíßå╕ßäÇßàºßå¿",
    "ßäÆßàíßå╕ßäàßà╡ßäîßàÑßå¿",
    "ßäÆßàíßå╝ßäÇßà⌐ßå╝",
    "ßäÆßàíßå╝ßäÇßà«",
    "ßäÆßàíßå╝ßäëßàíßå╝",
    "ßäÆßàíßå╝ßäïßà┤",
    "ßäÆßàóßäÇßàºßå»",
    "ßäÆßàóßäÇßà«ßå½",
    "ßäÆßàóßäâßàíßå╕",
    "ßäÆßàóßäâßàíßå╝",
    "ßäÆßàóßäåßà«ßå»",
    "ßäÆßàóßäëßàÑßå¿",
    "ßäÆßàóßäëßàÑßå»",
    "ßäÆßàóßäëßà«ßäïßà¡ßå¿ßäîßàíßå╝",
    "ßäÆßàóßäïßàíßå½",
    "ßäÆßàóßå¿ßäëßà╡ßå╖",
    "ßäÆßàóßå½ßäâßà│ßäçßàóßå¿",
    "ßäÆßàóßå╖ßäçßàÑßäÇßàÑ",
    "ßäÆßàóßå║ßäçßàºßçÇ",
    "ßäÆßàóßå║ßäëßàíßå»",
    "ßäÆßàóßå╝ßäâßà⌐ßå╝",
    "ßäÆßàóßå╝ßäçßà⌐ßå¿",
    "ßäÆßàóßå╝ßäëßàí",
    "ßäÆßàóßå╝ßäïßà«ßå½",
    "ßäÆßàóßå╝ßäïßà▒",
    "ßäÆßàúßå╝ßäÇßà╡",
    "ßäÆßàúßå╝ßäëßàíßå╝",
    "ßäÆßàúßå╝ßäëßà«",
    "ßäÆßàÑßäàßàíßå¿",
    "ßäÆßàÑßäïßà¡ßå╝",
    "ßäÆßàªßå»ßäÇßà╡",
    "ßäÆßàºßå½ßäÇßà¬ßå½",
    "ßäÆßàºßå½ßäÇßà│ßå╖",
    "ßäÆßàºßå½ßäâßàó",
    "ßäÆßàºßå½ßäëßàíßå╝",
    "ßäÆßàºßå½ßäëßà╡ßå»",
    "ßäÆßàºßå½ßäîßàíßå╝",
    "ßäÆßàºßå½ßäîßàó",
    "ßäÆßàºßå½ßäîßà╡",
    "ßäÆßàºßå»ßäïßàóßå¿",
    "ßäÆßàºßå╕ßäàßàºßå¿",
    "ßäÆßàºßå╝ßäçßà«",
    "ßäÆßàºßå╝ßäëßàí",
    "ßäÆßàºßå╝ßäëßà«",
    "ßäÆßàºßå╝ßäëßà╡ßå¿",
    "ßäÆßàºßå╝ßäîßàª",
    "ßäÆßàºßå╝ßäÉßàó",
    "ßäÆßàºßå╝ßäæßàºßå½",
    "ßäÆßà¿ßäÉßàóßå¿",
    "ßäÆßà⌐ßäÇßà╡ßäëßà╡ßå╖",
    "ßäÆßà⌐ßäéßàíßå╖",
    "ßäÆßà⌐ßäàßàíßå╝ßäïßà╡",
    "ßäÆßà⌐ßäçßàíßå¿",
    "ßäÆßà⌐ßäÉßàªßå»",
    "ßäÆßà⌐ßäÆßà│ßå╕",
    "ßäÆßà⌐ßå¿ßäëßà╡",
    "ßäÆßà⌐ßå»ßäàßà⌐",
    "ßäÆßà⌐ßå╖ßäæßàªßäïßà╡ßäîßà╡",
    "ßäÆßà⌐ßå╝ßäçßà⌐",
    "ßäÆßà⌐ßå╝ßäëßà«",
    "ßäÆßà⌐ßå╝ßäÄßàí",
    "ßäÆßà¬ßäåßàºßå½",
    "ßäÆßà¬ßäçßà«ßå½",
    "ßäÆßà¬ßäëßàíßå»",
    "ßäÆßà¬ßäïßà¡ßäïßà╡ßå»",
    "ßäÆßà¬ßäîßàíßå╝",
    "ßäÆßà¬ßäÆßàíßå¿",
    "ßäÆßà¬ßå¿ßäçßà⌐",
    "ßäÆßà¬ßå¿ßäïßà╡ßå½",
    "ßäÆßà¬ßå¿ßäîßàíßå╝",
    "ßäÆßà¬ßå¿ßäîßàÑßå╝",
    "ßäÆßà¬ßå½ßäÇßàíßå╕",
    "ßäÆßà¬ßå½ßäÇßàºßå╝",
    "ßäÆßà¬ßå½ßäïßàºßå╝",
    "ßäÆßà¬ßå½ßäïßà▓ßå»",
    "ßäÆßà¬ßå½ßäîßàí",
    "ßäÆßà¬ßå»ßäÇßà╡",
    "ßäÆßà¬ßå»ßäâßà⌐ßå╝",
    "ßäÆßà¬ßå»ßäçßàíßå»ßäÆßà╡",
    "ßäÆßà¬ßå»ßäïßà¡ßå╝",
    "ßäÆßà¬ßå»ßäìßàíßå¿",
    "ßäÆßà¼ßäÇßàºßå½",
    "ßäÆßà¼ßäÇßà¬ßå½",
    "ßäÆßà¼ßäçßà⌐ßå¿",
    "ßäÆßà¼ßäëßàóßå¿",
    "ßäÆßà¼ßäïßà»ßå½",
    "ßäÆßà¼ßäîßàíßå╝",
    "ßäÆßà¼ßäîßàÑßå½",
    "ßäÆßà¼ßå║ßäëßà«",
    "ßäÆßà¼ßå╝ßäâßàíßå½ßäçßà⌐ßäâßà⌐",
    "ßäÆßà¡ßäïßà▓ßå»ßäîßàÑßå¿",
    "ßäÆßà«ßäçßàíßå½",
    "ßäÆßà«ßäÄßà«ßå║ßäÇßàíßäàßà«",
    "ßäÆßà«ßå½ßäàßàºßå½",
    "ßäÆßà»ßå»ßäèßà╡ßå½",
    "ßäÆßà▓ßäëßà╡ßå¿",
    "ßäÆßà▓ßäïßà╡ßå»",
    "ßäÆßà▓ßå╝ßäéßàó",
    "ßäÆßà│ßäàßà│ßå╖",
    "ßäÆßà│ßå¿ßäçßàóßå¿",
    "ßäÆßà│ßå¿ßäïßà╡ßå½",
    "ßäÆßà│ßå½ßäîßàÑßå¿",
    "ßäÆßà│ßå½ßäÆßà╡",
    "ßäÆßà│ßå╝ßäåßà╡",
    "ßäÆßà│ßå╝ßäçßà«ßå½",
    "ßäÆßà┤ßäÇßà⌐ßå¿",
    "ßäÆßà┤ßäåßàíßå╝",
    "ßäÆßà┤ßäëßàóßå╝",
    "ßäÆßà┤ßå½ßäëßàóßå¿",
    "ßäÆßà╡ßå╖ßäüßàÑßå║"
]

},{}],36:[function(require,module,exports){
module.exports=[
    "abacate",
    "abaixo",
    "abalar",
    "abater",
    "abduzir",
    "abelha",
    "aberto",
    "abismo",
    "abotoar",
    "abranger",
    "abreviar",
    "abrigar",
    "abrupto",
    "absinto",
    "absoluto",
    "absurdo",
    "abutre",
    "acabado",
    "acalmar",
    "acampar",
    "acanhar",
    "acaso",
    "aceitar",
    "acelerar",
    "acenar",
    "acervo",
    "acessar",
    "acetona",
    "achatar",
    "acidez",
    "acima",
    "acionado",
    "acirrar",
    "aclamar",
    "aclive",
    "acolhida",
    "acomodar",
    "acoplar",
    "acordar",
    "acumular",
    "acusador",
    "adaptar",
    "adega",
    "adentro",
    "adepto",
    "adequar",
    "aderente",
    "adesivo",
    "adeus",
    "adiante",
    "aditivo",
    "adjetivo",
    "adjunto",
    "admirar",
    "adorar",
    "adquirir",
    "adubo",
    "adverso",
    "advogado",
    "aeronave",
    "afastar",
    "aferir",
    "afetivo",
    "afinador",
    "afivelar",
    "aflito",
    "afluente",
    "afrontar",
    "agachar",
    "agarrar",
    "agasalho",
    "agenciar",
    "agilizar",
    "agiota",
    "agitado",
    "agora",
    "agradar",
    "agreste",
    "agrupar",
    "aguardar",
    "agulha",
    "ajoelhar",
    "ajudar",
    "ajustar",
    "alameda",
    "alarme",
    "alastrar",
    "alavanca",
    "albergue",
    "albino",
    "alcatra",
    "aldeia",
    "alecrim",
    "alegria",
    "alertar",
    "alface",
    "alfinete",
    "algum",
    "alheio",
    "aliar",
    "alicate",
    "alienar",
    "alinhar",
    "aliviar",
    "almofada",
    "alocar",
    "alpiste",
    "alterar",
    "altitude",
    "alucinar",
    "alugar",
    "aluno",
    "alusivo",
    "alvo",
    "amaciar",
    "amador",
    "amarelo",
    "amassar",
    "ambas",
    "ambiente",
    "ameixa",
    "amenizar",
    "amido",
    "amistoso",
    "amizade",
    "amolador",
    "amontoar",
    "amoroso",
    "amostra",
    "amparar",
    "ampliar",
    "ampola",
    "anagrama",
    "analisar",
    "anarquia",
    "anatomia",
    "andaime",
    "anel",
    "anexo",
    "angular",
    "animar",
    "anjo",
    "anomalia",
    "anotado",
    "ansioso",
    "anterior",
    "anuidade",
    "anunciar",
    "anzol",
    "apagador",
    "apalpar",
    "apanhado",
    "apego",
    "apelido",
    "apertada",
    "apesar",
    "apetite",
    "apito",
    "aplauso",
    "aplicada",
    "apoio",
    "apontar",
    "aposta",
    "aprendiz",
    "aprovar",
    "aquecer",
    "arame",
    "aranha",
    "arara",
    "arcada",
    "ardente",
    "areia",
    "arejar",
    "arenito",
    "aresta",
    "argiloso",
    "argola",
    "arma",
    "arquivo",
    "arraial",
    "arrebate",
    "arriscar",
    "arroba",
    "arrumar",
    "arsenal",
    "arterial",
    "artigo",
    "arvoredo",
    "asfaltar",
    "asilado",
    "aspirar",
    "assador",
    "assinar",
    "assoalho",
    "assunto",
    "astral",
    "atacado",
    "atadura",
    "atalho",
    "atarefar",
    "atear",
    "atender",
    "aterro",
    "ateu",
    "atingir",
    "atirador",
    "ativo",
    "atoleiro",
    "atracar",
    "atrevido",
    "atriz",
    "atual",
    "atum",
    "auditor",
    "aumentar",
    "aura",
    "aurora",
    "autismo",
    "autoria",
    "autuar",
    "avaliar",
    "avante",
    "avaria",
    "avental",
    "avesso",
    "aviador",
    "avisar",
    "avulso",
    "axila",
    "azarar",
    "azedo",
    "azeite",
    "azulejo",
    "babar",
    "babosa",
    "bacalhau",
    "bacharel",
    "bacia",
    "bagagem",
    "baiano",
    "bailar",
    "baioneta",
    "bairro",
    "baixista",
    "bajular",
    "baleia",
    "baliza",
    "balsa",
    "banal",
    "bandeira",
    "banho",
    "banir",
    "banquete",
    "barato",
    "barbado",
    "baronesa",
    "barraca",
    "barulho",
    "baseado",
    "bastante",
    "batata",
    "batedor",
    "batida",
    "batom",
    "batucar",
    "baunilha",
    "beber",
    "beijo",
    "beirada",
    "beisebol",
    "beldade",
    "beleza",
    "belga",
    "beliscar",
    "bendito",
    "bengala",
    "benzer",
    "berimbau",
    "berlinda",
    "berro",
    "besouro",
    "bexiga",
    "bezerro",
    "bico",
    "bicudo",
    "bienal",
    "bifocal",
    "bifurcar",
    "bigorna",
    "bilhete",
    "bimestre",
    "bimotor",
    "biologia",
    "biombo",
    "biosfera",
    "bipolar",
    "birrento",
    "biscoito",
    "bisneto",
    "bispo",
    "bissexto",
    "bitola",
    "bizarro",
    "blindado",
    "bloco",
    "bloquear",
    "boato",
    "bobagem",
    "bocado",
    "bocejo",
    "bochecha",
    "boicotar",
    "bolada",
    "boletim",
    "bolha",
    "bolo",
    "bombeiro",
    "bonde",
    "boneco",
    "bonita",
    "borbulha",
    "borda",
    "boreal",
    "borracha",
    "bovino",
    "boxeador",
    "branco",
    "brasa",
    "braveza",
    "breu",
    "briga",
    "brilho",
    "brincar",
    "broa",
    "brochura",
    "bronzear",
    "broto",
    "bruxo",
    "bucha",
    "budismo",
    "bufar",
    "bule",
    "buraco",
    "busca",
    "busto",
    "buzina",
    "cabana",
    "cabelo",
    "cabide",
    "cabo",
    "cabrito",
    "cacau",
    "cacetada",
    "cachorro",
    "cacique",
    "cadastro",
    "cadeado",
    "cafezal",
    "caiaque",
    "caipira",
    "caixote",
    "cajado",
    "caju",
    "calafrio",
    "calcular",
    "caldeira",
    "calibrar",
    "calmante",
    "calota",
    "camada",
    "cambista",
    "camisa",
    "camomila",
    "campanha",
    "camuflar",
    "canavial",
    "cancelar",
    "caneta",
    "canguru",
    "canhoto",
    "canivete",
    "canoa",
    "cansado",
    "cantar",
    "canudo",
    "capacho",
    "capela",
    "capinar",
    "capotar",
    "capricho",
    "captador",
    "capuz",
    "caracol",
    "carbono",
    "cardeal",
    "careca",
    "carimbar",
    "carneiro",
    "carpete",
    "carreira",
    "cartaz",
    "carvalho",
    "casaco",
    "casca",
    "casebre",
    "castelo",
    "casulo",
    "catarata",
    "cativar",
    "caule",
    "causador",
    "cautelar",
    "cavalo",
    "caverna",
    "cebola",
    "cedilha",
    "cegonha",
    "celebrar",
    "celular",
    "cenoura",
    "censo",
    "centeio",
    "cercar",
    "cerrado",
    "certeiro",
    "cerveja",
    "cetim",
    "cevada",
    "chacota",
    "chaleira",
    "chamado",
    "chapada",
    "charme",
    "chatice",
    "chave",
    "chefe",
    "chegada",
    "cheiro",
    "cheque",
    "chicote",
    "chifre",
    "chinelo",
    "chocalho",
    "chover",
    "chumbo",
    "chutar",
    "chuva",
    "cicatriz",
    "ciclone",
    "cidade",
    "cidreira",
    "ciente",
    "cigana",
    "cimento",
    "cinto",
    "cinza",
    "ciranda",
    "circuito",
    "cirurgia",
    "citar",
    "clareza",
    "clero",
    "clicar",
    "clone",
    "clube",
    "coado",
    "coagir",
    "cobaia",
    "cobertor",
    "cobrar",
    "cocada",
    "coelho",
    "coentro",
    "coeso",
    "cogumelo",
    "coibir",
    "coifa",
    "coiote",
    "colar",
    "coleira",
    "colher",
    "colidir",
    "colmeia",
    "colono",
    "coluna",
    "comando",
    "combinar",
    "comentar",
    "comitiva",
    "comover",
    "complexo",
    "comum",
    "concha",
    "condor",
    "conectar",
    "confuso",
    "congelar",
    "conhecer",
    "conjugar",
    "consumir",
    "contrato",
    "convite",
    "cooperar",
    "copeiro",
    "copiador",
    "copo",
    "coquetel",
    "coragem",
    "cordial",
    "corneta",
    "coronha",
    "corporal",
    "correio",
    "cortejo",
    "coruja",
    "corvo",
    "cosseno",
    "costela",
    "cotonete",
    "couro",
    "couve",
    "covil",
    "cozinha",
    "cratera",
    "cravo",
    "creche",
    "credor",
    "creme",
    "crer",
    "crespo",
    "criada",
    "criminal",
    "crioulo",
    "crise",
    "criticar",
    "crosta",
    "crua",
    "cruzeiro",
    "cubano",
    "cueca",
    "cuidado",
    "cujo",
    "culatra",
    "culminar",
    "culpar",
    "cultura",
    "cumprir",
    "cunhado",
    "cupido",
    "curativo",
    "curral",
    "cursar",
    "curto",
    "cuspir",
    "custear",
    "cutelo",
    "damasco",
    "datar",
    "debater",
    "debitar",
    "deboche",
    "debulhar",
    "decalque",
    "decimal",
    "declive",
    "decote",
    "decretar",
    "dedal",
    "dedicado",
    "deduzir",
    "defesa",
    "defumar",
    "degelo",
    "degrau",
    "degustar",
    "deitado",
    "deixar",
    "delator",
    "delegado",
    "delinear",
    "delonga",
    "demanda",
    "demitir",
    "demolido",
    "dentista",
    "depenado",
    "depilar",
    "depois",
    "depressa",
    "depurar",
    "deriva",
    "derramar",
    "desafio",
    "desbotar",
    "descanso",
    "desenho",
    "desfiado",
    "desgaste",
    "desigual",
    "deslize",
    "desmamar",
    "desova",
    "despesa",
    "destaque",
    "desviar",
    "detalhar",
    "detentor",
    "detonar",
    "detrito",
    "deusa",
    "dever",
    "devido",
    "devotado",
    "dezena",
    "diagrama",
    "dialeto",
    "didata",
    "difuso",
    "digitar",
    "dilatado",
    "diluente",
    "diminuir",
    "dinastia",
    "dinheiro",
    "diocese",
    "direto",
    "discreta",
    "disfarce",
    "disparo",
    "disquete",
    "dissipar",
    "distante",
    "ditador",
    "diurno",
    "diverso",
    "divisor",
    "divulgar",
    "dizer",
    "dobrador",
    "dolorido",
    "domador",
    "dominado",
    "donativo",
    "donzela",
    "dormente",
    "dorsal",
    "dosagem",
    "dourado",
    "doutor",
    "drenagem",
    "drible",
    "drogaria",
    "duelar",
    "duende",
    "dueto",
    "duplo",
    "duquesa",
    "durante",
    "duvidoso",
    "eclodir",
    "ecoar",
    "ecologia",
    "edificar",
    "edital",
    "educado",
    "efeito",
    "efetivar",
    "ejetar",
    "elaborar",
    "eleger",
    "eleitor",
    "elenco",
    "elevador",
    "eliminar",
    "elogiar",
    "embargo",
    "embolado",
    "embrulho",
    "embutido",
    "emenda",
    "emergir",
    "emissor",
    "empatia",
    "empenho",
    "empinado",
    "empolgar",
    "emprego",
    "empurrar",
    "emulador",
    "encaixe",
    "encenado",
    "enchente",
    "encontro",
    "endeusar",
    "endossar",
    "enfaixar",
    "enfeite",
    "enfim",
    "engajado",
    "engenho",
    "englobar",
    "engomado",
    "engraxar",
    "enguia",
    "enjoar",
    "enlatar",
    "enquanto",
    "enraizar",
    "enrolado",
    "enrugar",
    "ensaio",
    "enseada",
    "ensino",
    "ensopado",
    "entanto",
    "enteado",
    "entidade",
    "entortar",
    "entrada",
    "entulho",
    "envergar",
    "enviado",
    "envolver",
    "enxame",
    "enxerto",
    "enxofre",
    "enxuto",
    "epiderme",
    "equipar",
    "ereto",
    "erguido",
    "errata",
    "erva",
    "ervilha",
    "esbanjar",
    "esbelto",
    "escama",
    "escola",
    "escrita",
    "escuta",
    "esfinge",
    "esfolar",
    "esfregar",
    "esfumado",
    "esgrima",
    "esmalte",
    "espanto",
    "espelho",
    "espiga",
    "esponja",
    "espreita",
    "espumar",
    "esquerda",
    "estaca",
    "esteira",
    "esticar",
    "estofado",
    "estrela",
    "estudo",
    "esvaziar",
    "etanol",
    "etiqueta",
    "euforia",
    "europeu",
    "evacuar",
    "evaporar",
    "evasivo",
    "eventual",
    "evidente",
    "evoluir",
    "exagero",
    "exalar",
    "examinar",
    "exato",
    "exausto",
    "excesso",
    "excitar",
    "exclamar",
    "executar",
    "exemplo",
    "exibir",
    "exigente",
    "exonerar",
    "expandir",
    "expelir",
    "expirar",
    "explanar",
    "exposto",
    "expresso",
    "expulsar",
    "externo",
    "extinto",
    "extrato",
    "fabricar",
    "fabuloso",
    "faceta",
    "facial",
    "fada",
    "fadiga",
    "faixa",
    "falar",
    "falta",
    "familiar",
    "fandango",
    "fanfarra",
    "fantoche",
    "fardado",
    "farelo",
    "farinha",
    "farofa",
    "farpa",
    "fartura",
    "fatia",
    "fator",
    "favorita",
    "faxina",
    "fazenda",
    "fechado",
    "feijoada",
    "feirante",
    "felino",
    "feminino",
    "fenda",
    "feno",
    "fera",
    "feriado",
    "ferrugem",
    "ferver",
    "festejar",
    "fetal",
    "feudal",
    "fiapo",
    "fibrose",
    "ficar",
    "ficheiro",
    "figurado",
    "fileira",
    "filho",
    "filme",
    "filtrar",
    "firmeza",
    "fisgada",
    "fissura",
    "fita",
    "fivela",
    "fixador",
    "fixo",
    "flacidez",
    "flamingo",
    "flanela",
    "flechada",
    "flora",
    "flutuar",
    "fluxo",
    "focal",
    "focinho",
    "fofocar",
    "fogo",
    "foguete",
    "foice",
    "folgado",
    "folheto",
    "forjar",
    "formiga",
    "forno",
    "forte",
    "fosco",
    "fossa",
    "fragata",
    "fralda",
    "frango",
    "frasco",
    "fraterno",
    "freira",
    "frente",
    "fretar",
    "frieza",
    "friso",
    "fritura",
    "fronha",
    "frustrar",
    "fruteira",
    "fugir",
    "fulano",
    "fuligem",
    "fundar",
    "fungo",
    "funil",
    "furador",
    "furioso",
    "futebol",
    "gabarito",
    "gabinete",
    "gado",
    "gaiato",
    "gaiola",
    "gaivota",
    "galega",
    "galho",
    "galinha",
    "galocha",
    "ganhar",
    "garagem",
    "garfo",
    "gargalo",
    "garimpo",
    "garoupa",
    "garrafa",
    "gasoduto",
    "gasto",
    "gata",
    "gatilho",
    "gaveta",
    "gazela",
    "gelado",
    "geleia",
    "gelo",
    "gemada",
    "gemer",
    "gemido",
    "generoso",
    "gengiva",
    "genial",
    "genoma",
    "genro",
    "geologia",
    "gerador",
    "germinar",
    "gesso",
    "gestor",
    "ginasta",
    "gincana",
    "gingado",
    "girafa",
    "girino",
    "glacial",
    "glicose",
    "global",
    "glorioso",
    "goela",
    "goiaba",
    "golfe",
    "golpear",
    "gordura",
    "gorjeta",
    "gorro",
    "gostoso",
    "goteira",
    "governar",
    "gracejo",
    "gradual",
    "grafite",
    "gralha",
    "grampo",
    "granada",
    "gratuito",
    "graveto",
    "graxa",
    "grego",
    "grelhar",
    "greve",
    "grilo",
    "grisalho",
    "gritaria",
    "grosso",
    "grotesco",
    "grudado",
    "grunhido",
    "gruta",
    "guache",
    "guarani",
    "guaxinim",
    "guerrear",
    "guiar",
    "guincho",
    "guisado",
    "gula",
    "guloso",
    "guru",
    "habitar",
    "harmonia",
    "haste",
    "haver",
    "hectare",
    "herdar",
    "heresia",
    "hesitar",
    "hiato",
    "hibernar",
    "hidratar",
    "hiena",
    "hino",
    "hipismo",
    "hipnose",
    "hipoteca",
    "hoje",
    "holofote",
    "homem",
    "honesto",
    "honrado",
    "hormonal",
    "hospedar",
    "humorado",
    "iate",
    "ideia",
    "idoso",
    "ignorado",
    "igreja",
    "iguana",
    "ileso",
    "ilha",
    "iludido",
    "iluminar",
    "ilustrar",
    "imagem",
    "imediato",
    "imenso",
    "imersivo",
    "iminente",
    "imitador",
    "imortal",
    "impacto",
    "impedir",
    "implante",
    "impor",
    "imprensa",
    "impune",
    "imunizar",
    "inalador",
    "inapto",
    "inativo",
    "incenso",
    "inchar",
    "incidir",
    "incluir",
    "incolor",
    "indeciso",
    "indireto",
    "indutor",
    "ineficaz",
    "inerente",
    "infantil",
    "infestar",
    "infinito",
    "inflamar",
    "informal",
    "infrator",
    "ingerir",
    "inibido",
    "inicial",
    "inimigo",
    "injetar",
    "inocente",
    "inodoro",
    "inovador",
    "inox",
    "inquieto",
    "inscrito",
    "inseto",
    "insistir",
    "inspetor",
    "instalar",
    "insulto",
    "intacto",
    "integral",
    "intimar",
    "intocado",
    "intriga",
    "invasor",
    "inverno",
    "invicto",
    "invocar",
    "iogurte",
    "iraniano",
    "ironizar",
    "irreal",
    "irritado",
    "isca",
    "isento",
    "isolado",
    "isqueiro",
    "italiano",
    "janeiro",
    "jangada",
    "janta",
    "jararaca",
    "jardim",
    "jarro",
    "jasmim",
    "jato",
    "javali",
    "jazida",
    "jejum",
    "joaninha",
    "joelhada",
    "jogador",
    "joia",
    "jornal",
    "jorrar",
    "jovem",
    "juba",
    "judeu",
    "judoca",
    "juiz",
    "julgador",
    "julho",
    "jurado",
    "jurista",
    "juro",
    "justa",
    "labareda",
    "laboral",
    "lacre",
    "lactante",
    "ladrilho",
    "lagarta",
    "lagoa",
    "laje",
    "lamber",
    "lamentar",
    "laminar",
    "lampejo",
    "lanche",
    "lapidar",
    "lapso",
    "laranja",
    "lareira",
    "largura",
    "lasanha",
    "lastro",
    "lateral",
    "latido",
    "lavanda",
    "lavoura",
    "lavrador",
    "laxante",
    "lazer",
    "lealdade",
    "lebre",
    "legado",
    "legendar",
    "legista",
    "leigo",
    "leiloar",
    "leitura",
    "lembrete",
    "leme",
    "lenhador",
    "lentilha",
    "leoa",
    "lesma",
    "leste",
    "letivo",
    "letreiro",
    "levar",
    "leveza",
    "levitar",
    "liberal",
    "libido",
    "liderar",
    "ligar",
    "ligeiro",
    "limitar",
    "limoeiro",
    "limpador",
    "linda",
    "linear",
    "linhagem",
    "liquidez",
    "listagem",
    "lisura",
    "litoral",
    "livro",
    "lixa",
    "lixeira",
    "locador",
    "locutor",
    "lojista",
    "lombo",
    "lona",
    "longe",
    "lontra",
    "lorde",
    "lotado",
    "loteria",
    "loucura",
    "lousa",
    "louvar",
    "luar",
    "lucidez",
    "lucro",
    "luneta",
    "lustre",
    "lutador",
    "luva",
    "macaco",
    "macete",
    "machado",
    "macio",
    "madeira",
    "madrinha",
    "magnata",
    "magreza",
    "maior",
    "mais",
    "malandro",
    "malha",
    "malote",
    "maluco",
    "mamilo",
    "mamoeiro",
    "mamute",
    "manada",
    "mancha",
    "mandato",
    "manequim",
    "manhoso",
    "manivela",
    "manobrar",
    "mansa",
    "manter",
    "manusear",
    "mapeado",
    "maquinar",
    "marcador",
    "maresia",
    "marfim",
    "margem",
    "marinho",
    "marmita",
    "maroto",
    "marquise",
    "marreco",
    "martelo",
    "marujo",
    "mascote",
    "masmorra",
    "massagem",
    "mastigar",
    "matagal",
    "materno",
    "matinal",
    "matutar",
    "maxilar",
    "medalha",
    "medida",
    "medusa",
    "megafone",
    "meiga",
    "melancia",
    "melhor",
    "membro",
    "memorial",
    "menino",
    "menos",
    "mensagem",
    "mental",
    "merecer",
    "mergulho",
    "mesada",
    "mesclar",
    "mesmo",
    "mesquita",
    "mestre",
    "metade",
    "meteoro",
    "metragem",
    "mexer",
    "mexicano",
    "micro",
    "migalha",
    "migrar",
    "milagre",
    "milenar",
    "milhar",
    "mimado",
    "minerar",
    "minhoca",
    "ministro",
    "minoria",
    "miolo",
    "mirante",
    "mirtilo",
    "misturar",
    "mocidade",
    "moderno",
    "modular",
    "moeda",
    "moer",
    "moinho",
    "moita",
    "moldura",
    "moleza",
    "molho",
    "molinete",
    "molusco",
    "montanha",
    "moqueca",
    "morango",
    "morcego",
    "mordomo",
    "morena",
    "mosaico",
    "mosquete",
    "mostarda",
    "motel",
    "motim",
    "moto",
    "motriz",
    "muda",
    "muito",
    "mulata",
    "mulher",
    "multar",
    "mundial",
    "munido",
    "muralha",
    "murcho",
    "muscular",
    "museu",
    "musical",
    "nacional",
    "nadador",
    "naja",
    "namoro",
    "narina",
    "narrado",
    "nascer",
    "nativa",
    "natureza",
    "navalha",
    "navegar",
    "navio",
    "neblina",
    "nebuloso",
    "negativa",
    "negociar",
    "negrito",
    "nervoso",
    "neta",
    "neural",
    "nevasca",
    "nevoeiro",
    "ninar",
    "ninho",
    "nitidez",
    "nivelar",
    "nobreza",
    "noite",
    "noiva",
    "nomear",
    "nominal",
    "nordeste",
    "nortear",
    "notar",
    "noticiar",
    "noturno",
    "novelo",
    "novilho",
    "novo",
    "nublado",
    "nudez",
    "numeral",
    "nupcial",
    "nutrir",
    "nuvem",
    "obcecado",
    "obedecer",
    "objetivo",
    "obrigado",
    "obscuro",
    "obstetra",
    "obter",
    "obturar",
    "ocidente",
    "ocioso",
    "ocorrer",
    "oculista",
    "ocupado",
    "ofegante",
    "ofensiva",
    "oferenda",
    "oficina",
    "ofuscado",
    "ogiva",
    "olaria",
    "oleoso",
    "olhar",
    "oliveira",
    "ombro",
    "omelete",
    "omisso",
    "omitir",
    "ondulado",
    "oneroso",
    "ontem",
    "opcional",
    "operador",
    "oponente",
    "oportuno",
    "oposto",
    "orar",
    "orbitar",
    "ordem",
    "ordinal",
    "orfanato",
    "orgasmo",
    "orgulho",
    "oriental",
    "origem",
    "oriundo",
    "orla",
    "ortodoxo",
    "orvalho",
    "oscilar",
    "ossada",
    "osso",
    "ostentar",
    "otimismo",
    "ousadia",
    "outono",
    "outubro",
    "ouvido",
    "ovelha",
    "ovular",
    "oxidar",
    "oxigenar",
    "pacato",
    "paciente",
    "pacote",
    "pactuar",
    "padaria",
    "padrinho",
    "pagar",
    "pagode",
    "painel",
    "pairar",
    "paisagem",
    "palavra",
    "palestra",
    "palheta",
    "palito",
    "palmada",
    "palpitar",
    "pancada",
    "panela",
    "panfleto",
    "panqueca",
    "pantanal",
    "papagaio",
    "papelada",
    "papiro",
    "parafina",
    "parcial",
    "pardal",
    "parede",
    "partida",
    "pasmo",
    "passado",
    "pastel",
    "patamar",
    "patente",
    "patinar",
    "patrono",
    "paulada",
    "pausar",
    "peculiar",
    "pedalar",
    "pedestre",
    "pediatra",
    "pedra",
    "pegada",
    "peitoral",
    "peixe",
    "pele",
    "pelicano",
    "penca",
    "pendurar",
    "peneira",
    "penhasco",
    "pensador",
    "pente",
    "perceber",
    "perfeito",
    "pergunta",
    "perito",
    "permitir",
    "perna",
    "perplexo",
    "persiana",
    "pertence",
    "peruca",
    "pescado",
    "pesquisa",
    "pessoa",
    "petiscar",
    "piada",
    "picado",
    "piedade",
    "pigmento",
    "pilastra",
    "pilhado",
    "pilotar",
    "pimenta",
    "pincel",
    "pinguim",
    "pinha",
    "pinote",
    "pintar",
    "pioneiro",
    "pipoca",
    "piquete",
    "piranha",
    "pires",
    "pirueta",
    "piscar",
    "pistola",
    "pitanga",
    "pivete",
    "planta",
    "plaqueta",
    "platina",
    "plebeu",
    "plumagem",
    "pluvial",
    "pneu",
    "poda",
    "poeira",
    "poetisa",
    "polegada",
    "policiar",
    "poluente",
    "polvilho",
    "pomar",
    "pomba",
    "ponderar",
    "pontaria",
    "populoso",
    "porta",
    "possuir",
    "postal",
    "pote",
    "poupar",
    "pouso",
    "povoar",
    "praia",
    "prancha",
    "prato",
    "praxe",
    "prece",
    "predador",
    "prefeito",
    "premiar",
    "prensar",
    "preparar",
    "presilha",
    "pretexto",
    "prevenir",
    "prezar",
    "primata",
    "princesa",
    "prisma",
    "privado",
    "processo",
    "produto",
    "profeta",
    "proibido",
    "projeto",
    "prometer",
    "propagar",
    "prosa",
    "protetor",
    "provador",
    "publicar",
    "pudim",
    "pular",
    "pulmonar",
    "pulseira",
    "punhal",
    "punir",
    "pupilo",
    "pureza",
    "puxador",
    "quadra",
    "quantia",
    "quarto",
    "quase",
    "quebrar",
    "queda",
    "queijo",
    "quente",
    "querido",
    "quimono",
    "quina",
    "quiosque",
    "rabanada",
    "rabisco",
    "rachar",
    "racionar",
    "radial",
    "raiar",
    "rainha",
    "raio",
    "raiva",
    "rajada",
    "ralado",
    "ramal",
    "ranger",
    "ranhura",
    "rapadura",
    "rapel",
    "rapidez",
    "raposa",
    "raquete",
    "raridade",
    "rasante",
    "rascunho",
    "rasgar",
    "raspador",
    "rasteira",
    "rasurar",
    "ratazana",
    "ratoeira",
    "realeza",
    "reanimar",
    "reaver",
    "rebaixar",
    "rebelde",
    "rebolar",
    "recado",
    "recente",
    "recheio",
    "recibo",
    "recordar",
    "recrutar",
    "recuar",
    "rede",
    "redimir",
    "redonda",
    "reduzida",
    "reenvio",
    "refinar",
    "refletir",
    "refogar",
    "refresco",
    "refugiar",
    "regalia",
    "regime",
    "regra",
    "reinado",
    "reitor",
    "rejeitar",
    "relativo",
    "remador",
    "remendo",
    "remorso",
    "renovado",
    "reparo",
    "repelir",
    "repleto",
    "repolho",
    "represa",
    "repudiar",
    "requerer",
    "resenha",
    "resfriar",
    "resgatar",
    "residir",
    "resolver",
    "respeito",
    "ressaca",
    "restante",
    "resumir",
    "retalho",
    "reter",
    "retirar",
    "retomada",
    "retratar",
    "revelar",
    "revisor",
    "revolta",
    "riacho",
    "rica",
    "rigidez",
    "rigoroso",
    "rimar",
    "ringue",
    "risada",
    "risco",
    "risonho",
    "robalo",
    "rochedo",
    "rodada",
    "rodeio",
    "rodovia",
    "roedor",
    "roleta",
    "romano",
    "roncar",
    "rosado",
    "roseira",
    "rosto",
    "rota",
    "roteiro",
    "rotina",
    "rotular",
    "rouco",
    "roupa",
    "roxo",
    "rubro",
    "rugido",
    "rugoso",
    "ruivo",
    "rumo",
    "rupestre",
    "russo",
    "sabor",
    "saciar",
    "sacola",
    "sacudir",
    "sadio",
    "safira",
    "saga",
    "sagrada",
    "saibro",
    "salada",
    "saleiro",
    "salgado",
    "saliva",
    "salpicar",
    "salsicha",
    "saltar",
    "salvador",
    "sambar",
    "samurai",
    "sanar",
    "sanfona",
    "sangue",
    "sanidade",
    "sapato",
    "sarda",
    "sargento",
    "sarjeta",
    "saturar",
    "saudade",
    "saxofone",
    "sazonal",
    "secar",
    "secular",
    "seda",
    "sedento",
    "sediado",
    "sedoso",
    "sedutor",
    "segmento",
    "segredo",
    "segundo",
    "seiva",
    "seleto",
    "selvagem",
    "semanal",
    "semente",
    "senador",
    "senhor",
    "sensual",
    "sentado",
    "separado",
    "sereia",
    "seringa",
    "serra",
    "servo",
    "setembro",
    "setor",
    "sigilo",
    "silhueta",
    "silicone",
    "simetria",
    "simpatia",
    "simular",
    "sinal",
    "sincero",
    "singular",
    "sinopse",
    "sintonia",
    "sirene",
    "siri",
    "situado",
    "soberano",
    "sobra",
    "socorro",
    "sogro",
    "soja",
    "solda",
    "soletrar",
    "solteiro",
    "sombrio",
    "sonata",
    "sondar",
    "sonegar",
    "sonhador",
    "sono",
    "soprano",
    "soquete",
    "sorrir",
    "sorteio",
    "sossego",
    "sotaque",
    "soterrar",
    "sovado",
    "sozinho",
    "suavizar",
    "subida",
    "submerso",
    "subsolo",
    "subtrair",
    "sucata",
    "sucesso",
    "suco",
    "sudeste",
    "sufixo",
    "sugador",
    "sugerir",
    "sujeito",
    "sulfato",
    "sumir",
    "suor",
    "superior",
    "suplicar",
    "suposto",
    "suprimir",
    "surdina",
    "surfista",
    "surpresa",
    "surreal",
    "surtir",
    "suspiro",
    "sustento",
    "tabela",
    "tablete",
    "tabuada",
    "tacho",
    "tagarela",
    "talher",
    "talo",
    "talvez",
    "tamanho",
    "tamborim",
    "tampa",
    "tangente",
    "tanto",
    "tapar",
    "tapioca",
    "tardio",
    "tarefa",
    "tarja",
    "tarraxa",
    "tatuagem",
    "taurino",
    "taxativo",
    "taxista",
    "teatral",
    "tecer",
    "tecido",
    "teclado",
    "tedioso",
    "teia",
    "teimar",
    "telefone",
    "telhado",
    "tempero",
    "tenente",
    "tensor",
    "tentar",
    "termal",
    "terno",
    "terreno",
    "tese",
    "tesoura",
    "testado",
    "teto",
    "textura",
    "texugo",
    "tiara",
    "tigela",
    "tijolo",
    "timbrar",
    "timidez",
    "tingido",
    "tinteiro",
    "tiragem",
    "titular",
    "toalha",
    "tocha",
    "tolerar",
    "tolice",
    "tomada",
    "tomilho",
    "tonel",
    "tontura",
    "topete",
    "tora",
    "torcido",
    "torneio",
    "torque",
    "torrada",
    "torto",
    "tostar",
    "touca",
    "toupeira",
    "toxina",
    "trabalho",
    "tracejar",
    "tradutor",
    "trafegar",
    "trajeto",
    "trama",
    "trancar",
    "trapo",
    "traseiro",
    "tratador",
    "travar",
    "treino",
    "tremer",
    "trepidar",
    "trevo",
    "triagem",
    "tribo",
    "triciclo",
    "tridente",
    "trilogia",
    "trindade",
    "triplo",
    "triturar",
    "triunfal",
    "trocar",
    "trombeta",
    "trova",
    "trunfo",
    "truque",
    "tubular",
    "tucano",
    "tudo",
    "tulipa",
    "tupi",
    "turbo",
    "turma",
    "turquesa",
    "tutelar",
    "tutorial",
    "uivar",
    "umbigo",
    "unha",
    "unidade",
    "uniforme",
    "urologia",
    "urso",
    "urtiga",
    "urubu",
    "usado",
    "usina",
    "usufruir",
    "vacina",
    "vadiar",
    "vagaroso",
    "vaidoso",
    "vala",
    "valente",
    "validade",
    "valores",
    "vantagem",
    "vaqueiro",
    "varanda",
    "vareta",
    "varrer",
    "vascular",
    "vasilha",
    "vassoura",
    "vazar",
    "vazio",
    "veado",
    "vedar",
    "vegetar",
    "veicular",
    "veleiro",
    "velhice",
    "veludo",
    "vencedor",
    "vendaval",
    "venerar",
    "ventre",
    "verbal",
    "verdade",
    "vereador",
    "vergonha",
    "vermelho",
    "verniz",
    "versar",
    "vertente",
    "vespa",
    "vestido",
    "vetorial",
    "viaduto",
    "viagem",
    "viajar",
    "viatura",
    "vibrador",
    "videira",
    "vidraria",
    "viela",
    "viga",
    "vigente",
    "vigiar",
    "vigorar",
    "vilarejo",
    "vinco",
    "vinheta",
    "vinil",
    "violeta",
    "virada",
    "virtude",
    "visitar",
    "visto",
    "vitral",
    "viveiro",
    "vizinho",
    "voador",
    "voar",
    "vogal",
    "volante",
    "voleibol",
    "voltagem",
    "volumoso",
    "vontade",
    "vulto",
    "vuvuzela",
    "xadrez",
    "xarope",
    "xeque",
    "xeretar",
    "xerife",
    "xingar",
    "zangado",
    "zarpar",
    "zebu",
    "zelador",
    "zombar",
    "zoologia",
    "zumbido"
]

},{}],37:[function(require,module,exports){
module.exports=[
    "a╠übaco",
    "abdomen",
    "abeja",
    "abierto",
    "abogado",
    "abono",
    "aborto",
    "abrazo",
    "abrir",
    "abuelo",
    "abuso",
    "acabar",
    "academia",
    "acceso",
    "accio╠ün",
    "aceite",
    "acelga",
    "acento",
    "aceptar",
    "a╠ücido",
    "aclarar",
    "acne╠ü",
    "acoger",
    "acoso",
    "activo",
    "acto",
    "actriz",
    "actuar",
    "acudir",
    "acuerdo",
    "acusar",
    "adicto",
    "admitir",
    "adoptar",
    "adorno",
    "aduana",
    "adulto",
    "ae╠üreo",
    "afectar",
    "aficio╠ün",
    "afinar",
    "afirmar",
    "a╠ügil",
    "agitar",
    "agoni╠üa",
    "agosto",
    "agotar",
    "agregar",
    "agrio",
    "agua",
    "agudo",
    "a╠üguila",
    "aguja",
    "ahogo",
    "ahorro",
    "aire",
    "aislar",
    "ajedrez",
    "ajeno",
    "ajuste",
    "alacra╠ün",
    "alambre",
    "alarma",
    "alba",
    "a╠ülbum",
    "alcalde",
    "aldea",
    "alegre",
    "alejar",
    "alerta",
    "aleta",
    "alfiler",
    "alga",
    "algodo╠ün",
    "aliado",
    "aliento",
    "alivio",
    "alma",
    "almeja",
    "almi╠übar",
    "altar",
    "alteza",
    "altivo",
    "alto",
    "altura",
    "alumno",
    "alzar",
    "amable",
    "amante",
    "amapola",
    "amargo",
    "amasar",
    "a╠ümbar",
    "a╠ümbito",
    "ameno",
    "amigo",
    "amistad",
    "amor",
    "amparo",
    "amplio",
    "ancho",
    "anciano",
    "ancla",
    "andar",
    "ande╠ün",
    "anemia",
    "a╠üngulo",
    "anillo",
    "a╠ünimo",
    "ani╠üs",
    "anotar",
    "antena",
    "antiguo",
    "antojo",
    "anual",
    "anular",
    "anuncio",
    "an╠âadir",
    "an╠âejo",
    "an╠âo",
    "apagar",
    "aparato",
    "apetito",
    "apio",
    "aplicar",
    "apodo",
    "aporte",
    "apoyo",
    "aprender",
    "aprobar",
    "apuesta",
    "apuro",
    "arado",
    "aran╠âa",
    "arar",
    "a╠ürbitro",
    "a╠ürbol",
    "arbusto",
    "archivo",
    "arco",
    "arder",
    "ardilla",
    "arduo",
    "a╠ürea",
    "a╠ürido",
    "aries",
    "armoni╠üa",
    "arne╠üs",
    "aroma",
    "arpa",
    "arpo╠ün",
    "arreglo",
    "arroz",
    "arruga",
    "arte",
    "artista",
    "asa",
    "asado",
    "asalto",
    "ascenso",
    "asegurar",
    "aseo",
    "asesor",
    "asiento",
    "asilo",
    "asistir",
    "asno",
    "asombro",
    "a╠üspero",
    "astilla",
    "astro",
    "astuto",
    "asumir",
    "asunto",
    "atajo",
    "ataque",
    "atar",
    "atento",
    "ateo",
    "a╠ütico",
    "atleta",
    "a╠ütomo",
    "atraer",
    "atroz",
    "atu╠ün",
    "audaz",
    "audio",
    "auge",
    "aula",
    "aumento",
    "ausente",
    "autor",
    "aval",
    "avance",
    "avaro",
    "ave",
    "avellana",
    "avena",
    "avestruz",
    "avio╠ün",
    "aviso",
    "ayer",
    "ayuda",
    "ayuno",
    "azafra╠ün",
    "azar",
    "azote",
    "azu╠ücar",
    "azufre",
    "azul",
    "baba",
    "babor",
    "bache",
    "bahi╠üa",
    "baile",
    "bajar",
    "balanza",
    "balco╠ün",
    "balde",
    "bambu╠ü",
    "banco",
    "banda",
    "ban╠âo",
    "barba",
    "barco",
    "barniz",
    "barro",
    "ba╠üscula",
    "basto╠ün",
    "basura",
    "batalla",
    "bateri╠üa",
    "batir",
    "batuta",
    "bau╠ül",
    "bazar",
    "bebe╠ü",
    "bebida",
    "bello",
    "besar",
    "beso",
    "bestia",
    "bicho",
    "bien",
    "bingo",
    "blanco",
    "bloque",
    "blusa",
    "boa",
    "bobina",
    "bobo",
    "boca",
    "bocina",
    "boda",
    "bodega",
    "boina",
    "bola",
    "bolero",
    "bolsa",
    "bomba",
    "bondad",
    "bonito",
    "bono",
    "bonsa╠üi",
    "borde",
    "borrar",
    "bosque",
    "bote",
    "boti╠ün",
    "bo╠üveda",
    "bozal",
    "bravo",
    "brazo",
    "brecha",
    "breve",
    "brillo",
    "brinco",
    "brisa",
    "broca",
    "broma",
    "bronce",
    "brote",
    "bruja",
    "brusco",
    "bruto",
    "buceo",
    "bucle",
    "bueno",
    "buey",
    "bufanda",
    "bufo╠ün",
    "bu╠üho",
    "buitre",
    "bulto",
    "burbuja",
    "burla",
    "burro",
    "buscar",
    "butaca",
    "buzo╠ün",
    "caballo",
    "cabeza",
    "cabina",
    "cabra",
    "cacao",
    "cada╠üver",
    "cadena",
    "caer",
    "cafe╠ü",
    "cai╠üda",
    "caima╠ün",
    "caja",
    "cajo╠ün",
    "cal",
    "calamar",
    "calcio",
    "caldo",
    "calidad",
    "calle",
    "calma",
    "calor",
    "calvo",
    "cama",
    "cambio",
    "camello",
    "camino",
    "campo",
    "ca╠üncer",
    "candil",
    "canela",
    "canguro",
    "canica",
    "canto",
    "can╠âa",
    "can╠âo╠ün",
    "caoba",
    "caos",
    "capaz",
    "capita╠ün",
    "capote",
    "captar",
    "capucha",
    "cara",
    "carbo╠ün",
    "ca╠ürcel",
    "careta",
    "carga",
    "carin╠âo",
    "carne",
    "carpeta",
    "carro",
    "carta",
    "casa",
    "casco",
    "casero",
    "caspa",
    "castor",
    "catorce",
    "catre",
    "caudal",
    "causa",
    "cazo",
    "cebolla",
    "ceder",
    "cedro",
    "celda",
    "ce╠ülebre",
    "celoso",
    "ce╠ülula",
    "cemento",
    "ceniza",
    "centro",
    "cerca",
    "cerdo",
    "cereza",
    "cero",
    "cerrar",
    "certeza",
    "ce╠üsped",
    "cetro",
    "chacal",
    "chaleco",
    "champu╠ü",
    "chancla",
    "chapa",
    "charla",
    "chico",
    "chiste",
    "chivo",
    "choque",
    "choza",
    "chuleta",
    "chupar",
    "ciclo╠ün",
    "ciego",
    "cielo",
    "cien",
    "cierto",
    "cifra",
    "cigarro",
    "cima",
    "cinco",
    "cine",
    "cinta",
    "cipre╠üs",
    "circo",
    "ciruela",
    "cisne",
    "cita",
    "ciudad",
    "clamor",
    "clan",
    "claro",
    "clase",
    "clave",
    "cliente",
    "clima",
    "cli╠ünica",
    "cobre",
    "coccio╠ün",
    "cochino",
    "cocina",
    "coco",
    "co╠üdigo",
    "codo",
    "cofre",
    "coger",
    "cohete",
    "coji╠ün",
    "cojo",
    "cola",
    "colcha",
    "colegio",
    "colgar",
    "colina",
    "collar",
    "colmo",
    "columna",
    "combate",
    "comer",
    "comida",
    "co╠ümodo",
    "compra",
    "conde",
    "conejo",
    "conga",
    "conocer",
    "consejo",
    "contar",
    "copa",
    "copia",
    "corazo╠ün",
    "corbata",
    "corcho",
    "cordo╠ün",
    "corona",
    "correr",
    "coser",
    "cosmos",
    "costa",
    "cra╠üneo",
    "cra╠üter",
    "crear",
    "crecer",
    "crei╠üdo",
    "crema",
    "cri╠üa",
    "crimen",
    "cripta",
    "crisis",
    "cromo",
    "cro╠ünica",
    "croqueta",
    "crudo",
    "cruz",
    "cuadro",
    "cuarto",
    "cuatro",
    "cubo",
    "cubrir",
    "cuchara",
    "cuello",
    "cuento",
    "cuerda",
    "cuesta",
    "cueva",
    "cuidar",
    "culebra",
    "culpa",
    "culto",
    "cumbre",
    "cumplir",
    "cuna",
    "cuneta",
    "cuota",
    "cupo╠ün",
    "cu╠üpula",
    "curar",
    "curioso",
    "curso",
    "curva",
    "cutis",
    "dama",
    "danza",
    "dar",
    "dardo",
    "da╠ütil",
    "deber",
    "de╠übil",
    "de╠ücada",
    "decir",
    "dedo",
    "defensa",
    "definir",
    "dejar",
    "delfi╠ün",
    "delgado",
    "delito",
    "demora",
    "denso",
    "dental",
    "deporte",
    "derecho",
    "derrota",
    "desayuno",
    "deseo",
    "desfile",
    "desnudo",
    "destino",
    "desvi╠üo",
    "detalle",
    "detener",
    "deuda",
    "di╠üa",
    "diablo",
    "diadema",
    "diamante",
    "diana",
    "diario",
    "dibujo",
    "dictar",
    "diente",
    "dieta",
    "diez",
    "difi╠ücil",
    "digno",
    "dilema",
    "diluir",
    "dinero",
    "directo",
    "dirigir",
    "disco",
    "disen╠âo",
    "disfraz",
    "diva",
    "divino",
    "doble",
    "doce",
    "dolor",
    "domingo",
    "don",
    "donar",
    "dorado",
    "dormir",
    "dorso",
    "dos",
    "dosis",
    "drago╠ün",
    "droga",
    "ducha",
    "duda",
    "duelo",
    "duen╠âo",
    "dulce",
    "du╠üo",
    "duque",
    "durar",
    "dureza",
    "duro",
    "e╠übano",
    "ebrio",
    "echar",
    "eco",
    "ecuador",
    "edad",
    "edicio╠ün",
    "edificio",
    "editor",
    "educar",
    "efecto",
    "eficaz",
    "eje",
    "ejemplo",
    "elefante",
    "elegir",
    "elemento",
    "elevar",
    "elipse",
    "e╠ülite",
    "elixir",
    "elogio",
    "eludir",
    "embudo",
    "emitir",
    "emocio╠ün",
    "empate",
    "empen╠âo",
    "empleo",
    "empresa",
    "enano",
    "encargo",
    "enchufe",
    "enci╠üa",
    "enemigo",
    "enero",
    "enfado",
    "enfermo",
    "engan╠âo",
    "enigma",
    "enlace",
    "enorme",
    "enredo",
    "ensayo",
    "ensen╠âar",
    "entero",
    "entrar",
    "envase",
    "envi╠üo",
    "e╠üpoca",
    "equipo",
    "erizo",
    "escala",
    "escena",
    "escolar",
    "escribir",
    "escudo",
    "esencia",
    "esfera",
    "esfuerzo",
    "espada",
    "espejo",
    "espi╠üa",
    "esposa",
    "espuma",
    "esqui╠ü",
    "estar",
    "este",
    "estilo",
    "estufa",
    "etapa",
    "eterno",
    "e╠ütica",
    "etnia",
    "evadir",
    "evaluar",
    "evento",
    "evitar",
    "exacto",
    "examen",
    "exceso",
    "excusa",
    "exento",
    "exigir",
    "exilio",
    "existir",
    "e╠üxito",
    "experto",
    "explicar",
    "exponer",
    "extremo",
    "fa╠übrica",
    "fa╠übula",
    "fachada",
    "fa╠ücil",
    "factor",
    "faena",
    "faja",
    "falda",
    "fallo",
    "falso",
    "faltar",
    "fama",
    "familia",
    "famoso",
    "farao╠ün",
    "farmacia",
    "farol",
    "farsa",
    "fase",
    "fatiga",
    "fauna",
    "favor",
    "fax",
    "febrero",
    "fecha",
    "feliz",
    "feo",
    "feria",
    "feroz",
    "fe╠ürtil",
    "fervor",
    "festi╠ün",
    "fiable",
    "fianza",
    "fiar",
    "fibra",
    "ficcio╠ün",
    "ficha",
    "fideo",
    "fiebre",
    "fiel",
    "fiera",
    "fiesta",
    "figura",
    "fijar",
    "fijo",
    "fila",
    "filete",
    "filial",
    "filtro",
    "fin",
    "finca",
    "fingir",
    "finito",
    "firma",
    "flaco",
    "flauta",
    "flecha",
    "flor",
    "flota",
    "fluir",
    "flujo",
    "flu╠üor",
    "fobia",
    "foca",
    "fogata",
    "fogo╠ün",
    "folio",
    "folleto",
    "fondo",
    "forma",
    "forro",
    "fortuna",
    "forzar",
    "fosa",
    "foto",
    "fracaso",
    "fra╠ügil",
    "franja",
    "frase",
    "fraude",
    "frei╠ür",
    "freno",
    "fresa",
    "fri╠üo",
    "frito",
    "fruta",
    "fuego",
    "fuente",
    "fuerza",
    "fuga",
    "fumar",
    "funcio╠ün",
    "funda",
    "furgo╠ün",
    "furia",
    "fusil",
    "fu╠ütbol",
    "futuro",
    "gacela",
    "gafas",
    "gaita",
    "gajo",
    "gala",
    "galeri╠üa",
    "gallo",
    "gamba",
    "ganar",
    "gancho",
    "ganga",
    "ganso",
    "garaje",
    "garza",
    "gasolina",
    "gastar",
    "gato",
    "gavila╠ün",
    "gemelo",
    "gemir",
    "gen",
    "ge╠ünero",
    "genio",
    "gente",
    "geranio",
    "gerente",
    "germen",
    "gesto",
    "gigante",
    "gimnasio",
    "girar",
    "giro",
    "glaciar",
    "globo",
    "gloria",
    "gol",
    "golfo",
    "goloso",
    "golpe",
    "goma",
    "gordo",
    "gorila",
    "gorra",
    "gota",
    "goteo",
    "gozar",
    "grada",
    "gra╠üfico",
    "grano",
    "grasa",
    "gratis",
    "grave",
    "grieta",
    "grillo",
    "gripe",
    "gris",
    "grito",
    "grosor",
    "gru╠üa",
    "grueso",
    "grumo",
    "grupo",
    "guante",
    "guapo",
    "guardia",
    "guerra",
    "gui╠üa",
    "guin╠âo",
    "guion",
    "guiso",
    "guitarra",
    "gusano",
    "gustar",
    "haber",
    "ha╠übil",
    "hablar",
    "hacer",
    "hacha",
    "hada",
    "hallar",
    "hamaca",
    "harina",
    "haz",
    "hazan╠âa",
    "hebilla",
    "hebra",
    "hecho",
    "helado",
    "helio",
    "hembra",
    "herir",
    "hermano",
    "he╠üroe",
    "hervir",
    "hielo",
    "hierro",
    "hi╠ügado",
    "higiene",
    "hijo",
    "himno",
    "historia",
    "hocico",
    "hogar",
    "hoguera",
    "hoja",
    "hombre",
    "hongo",
    "honor",
    "honra",
    "hora",
    "hormiga",
    "horno",
    "hostil",
    "hoyo",
    "hueco",
    "huelga",
    "huerta",
    "hueso",
    "huevo",
    "huida",
    "huir",
    "humano",
    "hu╠ümedo",
    "humilde",
    "humo",
    "hundir",
    "huraca╠ün",
    "hurto",
    "icono",
    "ideal",
    "idioma",
    "i╠üdolo",
    "iglesia",
    "iglu╠ü",
    "igual",
    "ilegal",
    "ilusio╠ün",
    "imagen",
    "ima╠ün",
    "imitar",
    "impar",
    "imperio",
    "imponer",
    "impulso",
    "incapaz",
    "i╠ündice",
    "inerte",
    "infiel",
    "informe",
    "ingenio",
    "inicio",
    "inmenso",
    "inmune",
    "innato",
    "insecto",
    "instante",
    "intere╠üs",
    "i╠üntimo",
    "intuir",
    "inu╠ütil",
    "invierno",
    "ira",
    "iris",
    "ironi╠üa",
    "isla",
    "islote",
    "jabali╠ü",
    "jabo╠ün",
    "jamo╠ün",
    "jarabe",
    "jardi╠ün",
    "jarra",
    "jaula",
    "jazmi╠ün",
    "jefe",
    "jeringa",
    "jinete",
    "jornada",
    "joroba",
    "joven",
    "joya",
    "juerga",
    "jueves",
    "juez",
    "jugador",
    "jugo",
    "juguete",
    "juicio",
    "junco",
    "jungla",
    "junio",
    "juntar",
    "ju╠üpiter",
    "jurar",
    "justo",
    "juvenil",
    "juzgar",
    "kilo",
    "koala",
    "labio",
    "lacio",
    "lacra",
    "lado",
    "ladro╠ün",
    "lagarto",
    "la╠ügrima",
    "laguna",
    "laico",
    "lamer",
    "la╠ümina",
    "la╠ümpara",
    "lana",
    "lancha",
    "langosta",
    "lanza",
    "la╠üpiz",
    "largo",
    "larva",
    "la╠üstima",
    "lata",
    "la╠ütex",
    "latir",
    "laurel",
    "lavar",
    "lazo",
    "leal",
    "leccio╠ün",
    "leche",
    "lector",
    "leer",
    "legio╠ün",
    "legumbre",
    "lejano",
    "lengua",
    "lento",
    "len╠âa",
    "leo╠ün",
    "leopardo",
    "lesio╠ün",
    "letal",
    "letra",
    "leve",
    "leyenda",
    "libertad",
    "libro",
    "licor",
    "li╠üder",
    "lidiar",
    "lienzo",
    "liga",
    "ligero",
    "lima",
    "li╠ümite",
    "limo╠ün",
    "limpio",
    "lince",
    "lindo",
    "li╠ünea",
    "lingote",
    "lino",
    "linterna",
    "li╠üquido",
    "liso",
    "lista",
    "litera",
    "litio",
    "litro",
    "llaga",
    "llama",
    "llanto",
    "llave",
    "llegar",
    "llenar",
    "llevar",
    "llorar",
    "llover",
    "lluvia",
    "lobo",
    "locio╠ün",
    "loco",
    "locura",
    "lo╠ügica",
    "logro",
    "lombriz",
    "lomo",
    "lonja",
    "lote",
    "lucha",
    "lucir",
    "lugar",
    "lujo",
    "luna",
    "lunes",
    "lupa",
    "lustro",
    "luto",
    "luz",
    "maceta",
    "macho",
    "madera",
    "madre",
    "maduro",
    "maestro",
    "mafia",
    "magia",
    "mago",
    "mai╠üz",
    "maldad",
    "maleta",
    "malla",
    "malo",
    "mama╠ü",
    "mambo",
    "mamut",
    "manco",
    "mando",
    "manejar",
    "manga",
    "maniqui╠ü",
    "manjar",
    "mano",
    "manso",
    "manta",
    "man╠âana",
    "mapa",
    "ma╠üquina",
    "mar",
    "marco",
    "marea",
    "marfil",
    "margen",
    "marido",
    "ma╠ürmol",
    "marro╠ün",
    "martes",
    "marzo",
    "masa",
    "ma╠üscara",
    "masivo",
    "matar",
    "materia",
    "matiz",
    "matriz",
    "ma╠üximo",
    "mayor",
    "mazorca",
    "mecha",
    "medalla",
    "medio",
    "me╠üdula",
    "mejilla",
    "mejor",
    "melena",
    "melo╠ün",
    "memoria",
    "menor",
    "mensaje",
    "mente",
    "menu╠ü",
    "mercado",
    "merengue",
    "me╠ürito",
    "mes",
    "meso╠ün",
    "meta",
    "meter",
    "me╠ütodo",
    "metro",
    "mezcla",
    "miedo",
    "miel",
    "miembro",
    "miga",
    "mil",
    "milagro",
    "militar",
    "millo╠ün",
    "mimo",
    "mina",
    "minero",
    "mi╠ünimo",
    "minuto",
    "miope",
    "mirar",
    "misa",
    "miseria",
    "misil",
    "mismo",
    "mitad",
    "mito",
    "mochila",
    "mocio╠ün",
    "moda",
    "modelo",
    "moho",
    "mojar",
    "molde",
    "moler",
    "molino",
    "momento",
    "momia",
    "monarca",
    "moneda",
    "monja",
    "monto",
    "mon╠âo",
    "morada",
    "morder",
    "moreno",
    "morir",
    "morro",
    "morsa",
    "mortal",
    "mosca",
    "mostrar",
    "motivo",
    "mover",
    "mo╠üvil",
    "mozo",
    "mucho",
    "mudar",
    "mueble",
    "muela",
    "muerte",
    "muestra",
    "mugre",
    "mujer",
    "mula",
    "muleta",
    "multa",
    "mundo",
    "mun╠âeca",
    "mural",
    "muro",
    "mu╠üsculo",
    "museo",
    "musgo",
    "mu╠üsica",
    "muslo",
    "na╠ücar",
    "nacio╠ün",
    "nadar",
    "naipe",
    "naranja",
    "nariz",
    "narrar",
    "nasal",
    "natal",
    "nativo",
    "natural",
    "na╠üusea",
    "naval",
    "nave",
    "navidad",
    "necio",
    "ne╠üctar",
    "negar",
    "negocio",
    "negro",
    "neo╠ün",
    "nervio",
    "neto",
    "neutro",
    "nevar",
    "nevera",
    "nicho",
    "nido",
    "niebla",
    "nieto",
    "nin╠âez",
    "nin╠âo",
    "ni╠ütido",
    "nivel",
    "nobleza",
    "noche",
    "no╠ümina",
    "noria",
    "norma",
    "norte",
    "nota",
    "noticia",
    "novato",
    "novela",
    "novio",
    "nube",
    "nuca",
    "nu╠ücleo",
    "nudillo",
    "nudo",
    "nuera",
    "nueve",
    "nuez",
    "nulo",
    "nu╠ümero",
    "nutria",
    "oasis",
    "obeso",
    "obispo",
    "objeto",
    "obra",
    "obrero",
    "observar",
    "obtener",
    "obvio",
    "oca",
    "ocaso",
    "oce╠üano",
    "ochenta",
    "ocho",
    "ocio",
    "ocre",
    "octavo",
    "octubre",
    "oculto",
    "ocupar",
    "ocurrir",
    "odiar",
    "odio",
    "odisea",
    "oeste",
    "ofensa",
    "oferta",
    "oficio",
    "ofrecer",
    "ogro",
    "oi╠üdo",
    "oi╠ür",
    "ojo",
    "ola",
    "oleada",
    "olfato",
    "olivo",
    "olla",
    "olmo",
    "olor",
    "olvido",
    "ombligo",
    "onda",
    "onza",
    "opaco",
    "opcio╠ün",
    "o╠üpera",
    "opinar",
    "oponer",
    "optar",
    "o╠üptica",
    "opuesto",
    "oracio╠ün",
    "orador",
    "oral",
    "o╠ürbita",
    "orca",
    "orden",
    "oreja",
    "o╠ürgano",
    "orgi╠üa",
    "orgullo",
    "oriente",
    "origen",
    "orilla",
    "oro",
    "orquesta",
    "oruga",
    "osadi╠üa",
    "oscuro",
    "osezno",
    "oso",
    "ostra",
    "oton╠âo",
    "otro",
    "oveja",
    "o╠üvulo",
    "o╠üxido",
    "oxi╠ügeno",
    "oyente",
    "ozono",
    "pacto",
    "padre",
    "paella",
    "pa╠ügina",
    "pago",
    "pai╠üs",
    "pa╠üjaro",
    "palabra",
    "palco",
    "paleta",
    "pa╠ülido",
    "palma",
    "paloma",
    "palpar",
    "pan",
    "panal",
    "pa╠ünico",
    "pantera",
    "pan╠âuelo",
    "papa╠ü",
    "papel",
    "papilla",
    "paquete",
    "parar",
    "parcela",
    "pared",
    "parir",
    "paro",
    "pa╠ürpado",
    "parque",
    "pa╠ürrafo",
    "parte",
    "pasar",
    "paseo",
    "pasio╠ün",
    "paso",
    "pasta",
    "pata",
    "patio",
    "patria",
    "pausa",
    "pauta",
    "pavo",
    "payaso",
    "peato╠ün",
    "pecado",
    "pecera",
    "pecho",
    "pedal",
    "pedir",
    "pegar",
    "peine",
    "pelar",
    "peldan╠âo",
    "pelea",
    "peligro",
    "pellejo",
    "pelo",
    "peluca",
    "pena",
    "pensar",
    "pen╠âo╠ün",
    "peo╠ün",
    "peor",
    "pepino",
    "pequen╠âo",
    "pera",
    "percha",
    "perder",
    "pereza",
    "perfil",
    "perico",
    "perla",
    "permiso",
    "perro",
    "persona",
    "pesa",
    "pesca",
    "pe╠üsimo",
    "pestan╠âa",
    "pe╠ütalo",
    "petro╠üleo",
    "pez",
    "pezun╠âa",
    "picar",
    "picho╠ün",
    "pie",
    "piedra",
    "pierna",
    "pieza",
    "pijama",
    "pilar",
    "piloto",
    "pimienta",
    "pino",
    "pintor",
    "pinza",
    "pin╠âa",
    "piojo",
    "pipa",
    "pirata",
    "pisar",
    "piscina",
    "piso",
    "pista",
    "pito╠ün",
    "pizca",
    "placa",
    "plan",
    "plata",
    "playa",
    "plaza",
    "pleito",
    "pleno",
    "plomo",
    "pluma",
    "plural",
    "pobre",
    "poco",
    "poder",
    "podio",
    "poema",
    "poesi╠üa",
    "poeta",
    "polen",
    "polici╠üa",
    "pollo",
    "polvo",
    "pomada",
    "pomelo",
    "pomo",
    "pompa",
    "poner",
    "porcio╠ün",
    "portal",
    "posada",
    "poseer",
    "posible",
    "poste",
    "potencia",
    "potro",
    "pozo",
    "prado",
    "precoz",
    "pregunta",
    "premio",
    "prensa",
    "preso",
    "previo",
    "primo",
    "pri╠üncipe",
    "prisio╠ün",
    "privar",
    "proa",
    "probar",
    "proceso",
    "producto",
    "proeza",
    "profesor",
    "programa",
    "prole",
    "promesa",
    "pronto",
    "propio",
    "pro╠üximo",
    "prueba",
    "pu╠üblico",
    "puchero",
    "pudor",
    "pueblo",
    "puerta",
    "puesto",
    "pulga",
    "pulir",
    "pulmo╠ün",
    "pulpo",
    "pulso",
    "puma",
    "punto",
    "pun╠âal",
    "pun╠âo",
    "pupa",
    "pupila",
    "pure╠ü",
    "quedar",
    "queja",
    "quemar",
    "querer",
    "queso",
    "quieto",
    "qui╠ümica",
    "quince",
    "quitar",
    "ra╠übano",
    "rabia",
    "rabo",
    "racio╠ün",
    "radical",
    "rai╠üz",
    "rama",
    "rampa",
    "rancho",
    "rango",
    "rapaz",
    "ra╠üpido",
    "rapto",
    "rasgo",
    "raspa",
    "rato",
    "rayo",
    "raza",
    "razo╠ün",
    "reaccio╠ün",
    "realidad",
    "reban╠âo",
    "rebote",
    "recaer",
    "receta",
    "rechazo",
    "recoger",
    "recreo",
    "recto",
    "recurso",
    "red",
    "redondo",
    "reducir",
    "reflejo",
    "reforma",
    "refra╠ün",
    "refugio",
    "regalo",
    "regir",
    "regla",
    "regreso",
    "rehe╠ün",
    "reino",
    "rei╠ür",
    "reja",
    "relato",
    "relevo",
    "relieve",
    "relleno",
    "reloj",
    "remar",
    "remedio",
    "remo",
    "rencor",
    "rendir",
    "renta",
    "reparto",
    "repetir",
    "reposo",
    "reptil",
    "res",
    "rescate",
    "resina",
    "respeto",
    "resto",
    "resumen",
    "retiro",
    "retorno",
    "retrato",
    "reunir",
    "reve╠üs",
    "revista",
    "rey",
    "rezar",
    "rico",
    "riego",
    "rienda",
    "riesgo",
    "rifa",
    "ri╠ügido",
    "rigor",
    "rinco╠ün",
    "rin╠âo╠ün",
    "ri╠üo",
    "riqueza",
    "risa",
    "ritmo",
    "rito",
    "rizo",
    "roble",
    "roce",
    "rociar",
    "rodar",
    "rodeo",
    "rodilla",
    "roer",
    "rojizo",
    "rojo",
    "romero",
    "romper",
    "ron",
    "ronco",
    "ronda",
    "ropa",
    "ropero",
    "rosa",
    "rosca",
    "rostro",
    "rotar",
    "rubi╠ü",
    "rubor",
    "rudo",
    "rueda",
    "rugir",
    "ruido",
    "ruina",
    "ruleta",
    "rulo",
    "rumbo",
    "rumor",
    "ruptura",
    "ruta",
    "rutina",
    "sa╠übado",
    "saber",
    "sabio",
    "sable",
    "sacar",
    "sagaz",
    "sagrado",
    "sala",
    "saldo",
    "salero",
    "salir",
    "salmo╠ün",
    "salo╠ün",
    "salsa",
    "salto",
    "salud",
    "salvar",
    "samba",
    "sancio╠ün",
    "sandi╠üa",
    "sanear",
    "sangre",
    "sanidad",
    "sano",
    "santo",
    "sapo",
    "saque",
    "sardina",
    "sarte╠ün",
    "sastre",
    "sata╠ün",
    "sauna",
    "saxofo╠ün",
    "seccio╠ün",
    "seco",
    "secreto",
    "secta",
    "sed",
    "seguir",
    "seis",
    "sello",
    "selva",
    "semana",
    "semilla",
    "senda",
    "sensor",
    "sen╠âal",
    "sen╠âor",
    "separar",
    "sepia",
    "sequi╠üa",
    "ser",
    "serie",
    "sermo╠ün",
    "servir",
    "sesenta",
    "sesio╠ün",
    "seta",
    "setenta",
    "severo",
    "sexo",
    "sexto",
    "sidra",
    "siesta",
    "siete",
    "siglo",
    "signo",
    "si╠ülaba",
    "silbar",
    "silencio",
    "silla",
    "si╠ümbolo",
    "simio",
    "sirena",
    "sistema",
    "sitio",
    "situar",
    "sobre",
    "socio",
    "sodio",
    "sol",
    "solapa",
    "soldado",
    "soledad",
    "so╠ülido",
    "soltar",
    "solucio╠ün",
    "sombra",
    "sondeo",
    "sonido",
    "sonoro",
    "sonrisa",
    "sopa",
    "soplar",
    "soporte",
    "sordo",
    "sorpresa",
    "sorteo",
    "soste╠ün",
    "so╠ütano",
    "suave",
    "subir",
    "suceso",
    "sudor",
    "suegra",
    "suelo",
    "suen╠âo",
    "suerte",
    "sufrir",
    "sujeto",
    "sulta╠ün",
    "sumar",
    "superar",
    "suplir",
    "suponer",
    "supremo",
    "sur",
    "surco",
    "suren╠âo",
    "surgir",
    "susto",
    "sutil",
    "tabaco",
    "tabique",
    "tabla",
    "tabu╠ü",
    "taco",
    "tacto",
    "tajo",
    "talar",
    "talco",
    "talento",
    "talla",
    "talo╠ün",
    "taman╠âo",
    "tambor",
    "tango",
    "tanque",
    "tapa",
    "tapete",
    "tapia",
    "tapo╠ün",
    "taquilla",
    "tarde",
    "tarea",
    "tarifa",
    "tarjeta",
    "tarot",
    "tarro",
    "tarta",
    "tatuaje",
    "tauro",
    "taza",
    "tazo╠ün",
    "teatro",
    "techo",
    "tecla",
    "te╠ücnica",
    "tejado",
    "tejer",
    "tejido",
    "tela",
    "tele╠üfono",
    "tema",
    "temor",
    "templo",
    "tenaz",
    "tender",
    "tener",
    "tenis",
    "tenso",
    "teori╠üa",
    "terapia",
    "terco",
    "te╠ürmino",
    "ternura",
    "terror",
    "tesis",
    "tesoro",
    "testigo",
    "tetera",
    "texto",
    "tez",
    "tibio",
    "tiburo╠ün",
    "tiempo",
    "tienda",
    "tierra",
    "tieso",
    "tigre",
    "tijera",
    "tilde",
    "timbre",
    "ti╠ümido",
    "timo",
    "tinta",
    "ti╠üo",
    "ti╠üpico",
    "tipo",
    "tira",
    "tiro╠ün",
    "tita╠ün",
    "ti╠ütere",
    "ti╠ütulo",
    "tiza",
    "toalla",
    "tobillo",
    "tocar",
    "tocino",
    "todo",
    "toga",
    "toldo",
    "tomar",
    "tono",
    "tonto",
    "topar",
    "tope",
    "toque",
    "to╠ürax",
    "torero",
    "tormenta",
    "torneo",
    "toro",
    "torpedo",
    "torre",
    "torso",
    "tortuga",
    "tos",
    "tosco",
    "toser",
    "to╠üxico",
    "trabajo",
    "tractor",
    "traer",
    "tra╠üfico",
    "trago",
    "traje",
    "tramo",
    "trance",
    "trato",
    "trauma",
    "trazar",
    "tre╠übol",
    "tregua",
    "treinta",
    "tren",
    "trepar",
    "tres",
    "tribu",
    "trigo",
    "tripa",
    "triste",
    "triunfo",
    "trofeo",
    "trompa",
    "tronco",
    "tropa",
    "trote",
    "trozo",
    "truco",
    "trueno",
    "trufa",
    "tuberi╠üa",
    "tubo",
    "tuerto",
    "tumba",
    "tumor",
    "tu╠ünel",
    "tu╠ünica",
    "turbina",
    "turismo",
    "turno",
    "tutor",
    "ubicar",
    "u╠ülcera",
    "umbral",
    "unidad",
    "unir",
    "universo",
    "uno",
    "untar",
    "un╠âa",
    "urbano",
    "urbe",
    "urgente",
    "urna",
    "usar",
    "usuario",
    "u╠ütil",
    "utopi╠üa",
    "uva",
    "vaca",
    "vaci╠üo",
    "vacuna",
    "vagar",
    "vago",
    "vaina",
    "vajilla",
    "vale",
    "va╠ülido",
    "valle",
    "valor",
    "va╠ülvula",
    "vampiro",
    "vara",
    "variar",
    "varo╠ün",
    "vaso",
    "vecino",
    "vector",
    "vehi╠üculo",
    "veinte",
    "vejez",
    "vela",
    "velero",
    "veloz",
    "vena",
    "vencer",
    "venda",
    "veneno",
    "vengar",
    "venir",
    "venta",
    "venus",
    "ver",
    "verano",
    "verbo",
    "verde",
    "vereda",
    "verja",
    "verso",
    "verter",
    "vi╠üa",
    "viaje",
    "vibrar",
    "vicio",
    "vi╠üctima",
    "vida",
    "vi╠üdeo",
    "vidrio",
    "viejo",
    "viernes",
    "vigor",
    "vil",
    "villa",
    "vinagre",
    "vino",
    "vin╠âedo",
    "violi╠ün",
    "viral",
    "virgo",
    "virtud",
    "visor",
    "vi╠üspera",
    "vista",
    "vitamina",
    "viudo",
    "vivaz",
    "vivero",
    "vivir",
    "vivo",
    "volca╠ün",
    "volumen",
    "volver",
    "voraz",
    "votar",
    "voto",
    "voz",
    "vuelo",
    "vulgar",
    "yacer",
    "yate",
    "yegua",
    "yema",
    "yerno",
    "yeso",
    "yodo",
    "yoga",
    "yogur",
    "zafiro",
    "zanja",
    "zapato",
    "zarza",
    "zona",
    "zorro",
    "zumo",
    "zurdo"
]

},{}],38:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer
var Transform = require('stream').Transform
var StringDecoder = require('string_decoder').StringDecoder
var inherits = require('inherits')

function CipherBase (hashMode) {
  Transform.call(this)
  this.hashMode = typeof hashMode === 'string'
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest
  } else {
    this.final = this._finalOrDigest
  }
  if (this._final) {
    this.__final = this._final
    this._final = null
  }
  this._decoder = null
  this._encoding = null
}
inherits(CipherBase, Transform)

CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = Buffer.from(data, inputEnc)
  }

  var outData = this._update(data)
  if (this.hashMode) return this

  if (outputEnc) {
    outData = this._toString(outData, outputEnc)
  }

  return outData
}

CipherBase.prototype.setAutoPadding = function () {}
CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
}

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
}

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
}

CipherBase.prototype._transform = function (data, _, next) {
  var err
  try {
    if (this.hashMode) {
      this._update(data)
    } else {
      this.push(this._update(data))
    }
  } catch (e) {
    err = e
  } finally {
    next(err)
  }
}
CipherBase.prototype._flush = function (done) {
  var err
  try {
    this.push(this.__final())
  } catch (e) {
    err = e
  }

  done(err)
}
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this.__final() || Buffer.alloc(0)
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true)
  }
  return outData
}

CipherBase.prototype._toString = function (value, enc, fin) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc)
    this._encoding = enc
  }

  if (this._encoding !== enc) throw new Error('can\'t switch encodings')

  var out = this._decoder.write(value)
  if (fin) {
    out += this._decoder.end()
  }

  return out
}

module.exports = CipherBase

},{"inherits":58,"safe-buffer":68,"stream":9,"string_decoder":24}],39:[function(require,module,exports){
'use strict'
var inherits = require('inherits')
var MD5 = require('md5.js')
var RIPEMD160 = require('ripemd160')
var sha = require('sha.js')
var Base = require('cipher-base')

function Hash (hash) {
  Base.call(this, 'digest')

  this._hash = hash
}

inherits(Hash, Base)

Hash.prototype._update = function (data) {
  this._hash.update(data)
}

Hash.prototype._final = function () {
  return this._hash.digest()
}

module.exports = function createHash (alg) {
  alg = alg.toLowerCase()
  if (alg === 'md5') return new MD5()
  if (alg === 'rmd160' || alg === 'ripemd160') return new RIPEMD160()

  return new Hash(sha(alg))
}

},{"cipher-base":38,"inherits":58,"md5.js":59,"ripemd160":67,"sha.js":70}],40:[function(require,module,exports){
var MD5 = require('md5.js')

module.exports = function (buffer) {
  return new MD5().update(buffer).digest()
}

},{"md5.js":59}],41:[function(require,module,exports){
'use strict'
var Buffer = require('safe-buffer').Buffer
var Transform = require('readable-stream').Transform
var inherits = require('inherits')

function throwIfNotStringOrBuffer (val, prefix) {
  if (!Buffer.isBuffer(val) && typeof val !== 'string') {
    throw new TypeError(prefix + ' must be a string or a buffer')
  }
}

function HashBase (blockSize) {
  Transform.call(this)

  this._block = Buffer.allocUnsafe(blockSize)
  this._blockSize = blockSize
  this._blockOffset = 0
  this._length = [0, 0, 0, 0]

  this._finalized = false
}

inherits(HashBase, Transform)

HashBase.prototype._transform = function (chunk, encoding, callback) {
  var error = null
  try {
    this.update(chunk, encoding)
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype._flush = function (callback) {
  var error = null
  try {
    this.push(this.digest())
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype.update = function (data, encoding) {
  throwIfNotStringOrBuffer(data, 'Data')
  if (this._finalized) throw new Error('Digest already called')
  if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding)

  // consume data
  var block = this._block
  var offset = 0
  while (this._blockOffset + data.length - offset >= this._blockSize) {
    for (var i = this._blockOffset; i < this._blockSize;) block[i++] = data[offset++]
    this._update()
    this._blockOffset = 0
  }
  while (offset < data.length) block[this._blockOffset++] = data[offset++]

  // update length
  for (var j = 0, carry = data.length * 8; carry > 0; ++j) {
    this._length[j] += carry
    carry = (this._length[j] / 0x0100000000) | 0
    if (carry > 0) this._length[j] -= 0x0100000000 * carry
  }

  return this
}

HashBase.prototype._update = function () {
  throw new Error('_update is not implemented')
}

HashBase.prototype.digest = function (encoding) {
  if (this._finalized) throw new Error('Digest already called')
  this._finalized = true

  var digest = this._digest()
  if (encoding !== undefined) digest = digest.toString(encoding)

  // reset state
  this._block.fill(0)
  this._blockOffset = 0
  for (var i = 0; i < 4; ++i) this._length[i] = 0

  return digest
}

HashBase.prototype._digest = function () {
  throw new Error('_digest is not implemented')
}

module.exports = HashBase

},{"inherits":58,"readable-stream":56,"safe-buffer":57}],42:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],43:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"./_stream_readable":45,"./_stream_writable":47,"_process":7,"dup":11,"inherits":58}],44:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./_stream_transform":46,"dup":12,"inherits":58}],45:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"../errors":42,"./_stream_duplex":43,"./internal/streams/async_iterator":48,"./internal/streams/buffer_list":49,"./internal/streams/destroy":50,"./internal/streams/from":52,"./internal/streams/state":54,"./internal/streams/stream":55,"_process":7,"buffer":3,"dup":13,"events":4,"inherits":58,"string_decoder/":77,"util":2}],46:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../errors":42,"./_stream_duplex":43,"dup":14,"inherits":58}],47:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"../errors":42,"./_stream_duplex":43,"./internal/streams/destroy":50,"./internal/streams/state":54,"./internal/streams/stream":55,"_process":7,"buffer":3,"dup":15,"inherits":58,"util-deprecate":78}],48:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./end-of-stream":51,"_process":7,"dup":16}],49:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"buffer":3,"dup":17,"util":2}],50:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"_process":7,"dup":18}],51:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"../../../errors":42,"dup":19}],52:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],53:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"../../../errors":42,"./end-of-stream":51,"dup":21}],54:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"../../../errors":42,"dup":22}],55:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23,"events":4}],56:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
exports.finished = require('./lib/internal/streams/end-of-stream.js');
exports.pipeline = require('./lib/internal/streams/pipeline.js');

},{"./lib/_stream_duplex.js":43,"./lib/_stream_passthrough.js":44,"./lib/_stream_readable.js":45,"./lib/_stream_transform.js":46,"./lib/_stream_writable.js":47,"./lib/internal/streams/end-of-stream.js":51,"./lib/internal/streams/pipeline.js":53}],57:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"buffer":3,"dup":8}],58:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],59:[function(require,module,exports){
'use strict'
var inherits = require('inherits')
var HashBase = require('hash-base')
var Buffer = require('safe-buffer').Buffer

var ARRAY16 = new Array(16)

function MD5 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
}

inherits(MD5, HashBase)

MD5.prototype._update = function () {
  var M = ARRAY16
  for (var i = 0; i < 16; ++i) M[i] = this._block.readInt32LE(i * 4)

  var a = this._a
  var b = this._b
  var c = this._c
  var d = this._d

  a = fnF(a, b, c, d, M[0], 0xd76aa478, 7)
  d = fnF(d, a, b, c, M[1], 0xe8c7b756, 12)
  c = fnF(c, d, a, b, M[2], 0x242070db, 17)
  b = fnF(b, c, d, a, M[3], 0xc1bdceee, 22)
  a = fnF(a, b, c, d, M[4], 0xf57c0faf, 7)
  d = fnF(d, a, b, c, M[5], 0x4787c62a, 12)
  c = fnF(c, d, a, b, M[6], 0xa8304613, 17)
  b = fnF(b, c, d, a, M[7], 0xfd469501, 22)
  a = fnF(a, b, c, d, M[8], 0x698098d8, 7)
  d = fnF(d, a, b, c, M[9], 0x8b44f7af, 12)
  c = fnF(c, d, a, b, M[10], 0xffff5bb1, 17)
  b = fnF(b, c, d, a, M[11], 0x895cd7be, 22)
  a = fnF(a, b, c, d, M[12], 0x6b901122, 7)
  d = fnF(d, a, b, c, M[13], 0xfd987193, 12)
  c = fnF(c, d, a, b, M[14], 0xa679438e, 17)
  b = fnF(b, c, d, a, M[15], 0x49b40821, 22)

  a = fnG(a, b, c, d, M[1], 0xf61e2562, 5)
  d = fnG(d, a, b, c, M[6], 0xc040b340, 9)
  c = fnG(c, d, a, b, M[11], 0x265e5a51, 14)
  b = fnG(b, c, d, a, M[0], 0xe9b6c7aa, 20)
  a = fnG(a, b, c, d, M[5], 0xd62f105d, 5)
  d = fnG(d, a, b, c, M[10], 0x02441453, 9)
  c = fnG(c, d, a, b, M[15], 0xd8a1e681, 14)
  b = fnG(b, c, d, a, M[4], 0xe7d3fbc8, 20)
  a = fnG(a, b, c, d, M[9], 0x21e1cde6, 5)
  d = fnG(d, a, b, c, M[14], 0xc33707d6, 9)
  c = fnG(c, d, a, b, M[3], 0xf4d50d87, 14)
  b = fnG(b, c, d, a, M[8], 0x455a14ed, 20)
  a = fnG(a, b, c, d, M[13], 0xa9e3e905, 5)
  d = fnG(d, a, b, c, M[2], 0xfcefa3f8, 9)
  c = fnG(c, d, a, b, M[7], 0x676f02d9, 14)
  b = fnG(b, c, d, a, M[12], 0x8d2a4c8a, 20)

  a = fnH(a, b, c, d, M[5], 0xfffa3942, 4)
  d = fnH(d, a, b, c, M[8], 0x8771f681, 11)
  c = fnH(c, d, a, b, M[11], 0x6d9d6122, 16)
  b = fnH(b, c, d, a, M[14], 0xfde5380c, 23)
  a = fnH(a, b, c, d, M[1], 0xa4beea44, 4)
  d = fnH(d, a, b, c, M[4], 0x4bdecfa9, 11)
  c = fnH(c, d, a, b, M[7], 0xf6bb4b60, 16)
  b = fnH(b, c, d, a, M[10], 0xbebfbc70, 23)
  a = fnH(a, b, c, d, M[13], 0x289b7ec6, 4)
  d = fnH(d, a, b, c, M[0], 0xeaa127fa, 11)
  c = fnH(c, d, a, b, M[3], 0xd4ef3085, 16)
  b = fnH(b, c, d, a, M[6], 0x04881d05, 23)
  a = fnH(a, b, c, d, M[9], 0xd9d4d039, 4)
  d = fnH(d, a, b, c, M[12], 0xe6db99e5, 11)
  c = fnH(c, d, a, b, M[15], 0x1fa27cf8, 16)
  b = fnH(b, c, d, a, M[2], 0xc4ac5665, 23)

  a = fnI(a, b, c, d, M[0], 0xf4292244, 6)
  d = fnI(d, a, b, c, M[7], 0x432aff97, 10)
  c = fnI(c, d, a, b, M[14], 0xab9423a7, 15)
  b = fnI(b, c, d, a, M[5], 0xfc93a039, 21)
  a = fnI(a, b, c, d, M[12], 0x655b59c3, 6)
  d = fnI(d, a, b, c, M[3], 0x8f0ccc92, 10)
  c = fnI(c, d, a, b, M[10], 0xffeff47d, 15)
  b = fnI(b, c, d, a, M[1], 0x85845dd1, 21)
  a = fnI(a, b, c, d, M[8], 0x6fa87e4f, 6)
  d = fnI(d, a, b, c, M[15], 0xfe2ce6e0, 10)
  c = fnI(c, d, a, b, M[6], 0xa3014314, 15)
  b = fnI(b, c, d, a, M[13], 0x4e0811a1, 21)
  a = fnI(a, b, c, d, M[4], 0xf7537e82, 6)
  d = fnI(d, a, b, c, M[11], 0xbd3af235, 10)
  c = fnI(c, d, a, b, M[2], 0x2ad7d2bb, 15)
  b = fnI(b, c, d, a, M[9], 0xeb86d391, 21)

  this._a = (this._a + a) | 0
  this._b = (this._b + b) | 0
  this._c = (this._c + c) | 0
  this._d = (this._d + d) | 0
}

MD5.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.allocUnsafe(16)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fnF (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + b) | 0
}

function fnG (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + b) | 0
}

function fnH (a, b, c, d, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + b) | 0
}

function fnI (a, b, c, d, m, k, s) {
  return (rotl((a + ((c ^ (b | (~d)))) + m + k) | 0, s) + b) | 0
}

module.exports = MD5

},{"hash-base":41,"inherits":58,"safe-buffer":68}],60:[function(require,module,exports){
exports.pbkdf2 = require('./lib/async')
exports.pbkdf2Sync = require('./lib/sync')

},{"./lib/async":61,"./lib/sync":64}],61:[function(require,module,exports){
(function (global){(function (){
var Buffer = require('safe-buffer').Buffer

var checkParameters = require('./precondition')
var defaultEncoding = require('./default-encoding')
var sync = require('./sync')
var toBuffer = require('./to-buffer')

var ZERO_BUF
var subtle = global.crypto && global.crypto.subtle
var toBrowser = {
  sha: 'SHA-1',
  'sha-1': 'SHA-1',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  'sha-256': 'SHA-256',
  sha384: 'SHA-384',
  'sha-384': 'SHA-384',
  'sha-512': 'SHA-512',
  sha512: 'SHA-512'
}
var checks = []
function checkNative (algo) {
  if (global.process && !global.process.browser) {
    return Promise.resolve(false)
  }
  if (!subtle || !subtle.importKey || !subtle.deriveBits) {
    return Promise.resolve(false)
  }
  if (checks[algo] !== undefined) {
    return checks[algo]
  }
  ZERO_BUF = ZERO_BUF || Buffer.alloc(8)
  var prom = browserPbkdf2(ZERO_BUF, ZERO_BUF, 10, 128, algo)
    .then(function () {
      return true
    }).catch(function () {
      return false
    })
  checks[algo] = prom
  return prom
}
var nextTick
function getNextTick () {
  if (nextTick) {
    return nextTick
  }
  if (global.process && global.process.nextTick) {
    nextTick = global.process.nextTick
  } else if (global.queueMicrotask) {
    nextTick = global.queueMicrotask
  } else if (global.setImmediate) {
    nextTick = global.setImmediate
  } else {
    nextTick = global.setTimeout
  }
  return nextTick
}
function browserPbkdf2 (password, salt, iterations, length, algo) {
  return subtle.importKey(
    'raw', password, { name: 'PBKDF2' }, false, ['deriveBits']
  ).then(function (key) {
    return subtle.deriveBits({
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: {
        name: algo
      }
    }, key, length << 3)
  }).then(function (res) {
    return Buffer.from(res)
  })
}

function resolvePromise (promise, callback) {
  promise.then(function (out) {
    getNextTick()(function () {
      callback(null, out)
    })
  }, function (e) {
    getNextTick()(function () {
      callback(e)
    })
  })
}
module.exports = function (password, salt, iterations, keylen, digest, callback) {
  if (typeof digest === 'function') {
    callback = digest
    digest = undefined
  }

  digest = digest || 'sha1'
  var algo = toBrowser[digest.toLowerCase()]

  if (!algo || typeof global.Promise !== 'function') {
    getNextTick()(function () {
      var out
      try {
        out = sync(password, salt, iterations, keylen, digest)
      } catch (e) {
        return callback(e)
      }
      callback(null, out)
    })
    return
  }

  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')
  if (typeof callback !== 'function') throw new Error('No callback provided to pbkdf2')

  resolvePromise(checkNative(algo).then(function (resp) {
    if (resp) return browserPbkdf2(password, salt, iterations, keylen, algo)

    return sync(password, salt, iterations, keylen, digest)
  }), callback)
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./default-encoding":62,"./precondition":63,"./sync":64,"./to-buffer":65,"safe-buffer":68}],62:[function(require,module,exports){
(function (process,global){(function (){
var defaultEncoding
/* istanbul ignore next */
if (global.process && global.process.browser) {
  defaultEncoding = 'utf-8'
} else if (global.process && global.process.version) {
  var pVersionMajor = parseInt(process.version.split('.')[0].slice(1), 10)

  defaultEncoding = pVersionMajor >= 6 ? 'utf-8' : 'binary'
} else {
  defaultEncoding = 'utf-8'
}
module.exports = defaultEncoding

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":7}],63:[function(require,module,exports){
var MAX_ALLOC = Math.pow(2, 30) - 1 // default in iojs

module.exports = function (iterations, keylen) {
  if (typeof iterations !== 'number') {
    throw new TypeError('Iterations not a number')
  }

  if (iterations < 0) {
    throw new TypeError('Bad iterations')
  }

  if (typeof keylen !== 'number') {
    throw new TypeError('Key length not a number')
  }

  if (keylen < 0 || keylen > MAX_ALLOC || keylen !== keylen) { /* eslint no-self-compare: 0 */
    throw new TypeError('Bad key length')
  }
}

},{}],64:[function(require,module,exports){
var md5 = require('create-hash/md5')
var RIPEMD160 = require('ripemd160')
var sha = require('sha.js')
var Buffer = require('safe-buffer').Buffer

var checkParameters = require('./precondition')
var defaultEncoding = require('./default-encoding')
var toBuffer = require('./to-buffer')

var ZEROS = Buffer.alloc(128)
var sizes = {
  md5: 16,
  sha1: 20,
  sha224: 28,
  sha256: 32,
  sha384: 48,
  sha512: 64,
  rmd160: 20,
  ripemd160: 20
}

function Hmac (alg, key, saltLen) {
  var hash = getDigest(alg)
  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

  if (key.length > blocksize) {
    key = hash(key)
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = Buffer.allocUnsafe(blocksize + sizes[alg])
  var opad = Buffer.allocUnsafe(blocksize + sizes[alg])
  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var ipad1 = Buffer.allocUnsafe(blocksize + saltLen + 4)
  ipad.copy(ipad1, 0, 0, blocksize)
  this.ipad1 = ipad1
  this.ipad2 = ipad
  this.opad = opad
  this.alg = alg
  this.blocksize = blocksize
  this.hash = hash
  this.size = sizes[alg]
}

Hmac.prototype.run = function (data, ipad) {
  data.copy(ipad, this.blocksize)
  var h = this.hash(ipad)
  h.copy(this.opad, this.blocksize)
  return this.hash(this.opad)
}

function getDigest (alg) {
  function shaFunc (data) {
    return sha(alg).update(data).digest()
  }
  function rmd160Func (data) {
    return new RIPEMD160().update(data).digest()
  }

  if (alg === 'rmd160' || alg === 'ripemd160') return rmd160Func
  if (alg === 'md5') return md5
  return shaFunc
}

function pbkdf2 (password, salt, iterations, keylen, digest) {
  checkParameters(iterations, keylen)
  password = toBuffer(password, defaultEncoding, 'Password')
  salt = toBuffer(salt, defaultEncoding, 'Salt')

  digest = digest || 'sha1'

  var hmac = new Hmac(digest, password, salt.length)

  var DK = Buffer.allocUnsafe(keylen)
  var block1 = Buffer.allocUnsafe(salt.length + 4)
  salt.copy(block1, 0, 0, salt.length)

  var destPos = 0
  var hLen = sizes[digest]
  var l = Math.ceil(keylen / hLen)

  for (var i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, salt.length)

    var T = hmac.run(block1, hmac.ipad1)
    var U = T

    for (var j = 1; j < iterations; j++) {
      U = hmac.run(U, hmac.ipad2)
      for (var k = 0; k < hLen; k++) T[k] ^= U[k]
    }

    T.copy(DK, destPos)
    destPos += hLen
  }

  return DK
}

module.exports = pbkdf2

},{"./default-encoding":62,"./precondition":63,"./to-buffer":65,"create-hash/md5":40,"ripemd160":67,"safe-buffer":68,"sha.js":70}],65:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer

module.exports = function (thing, encoding, name) {
  if (Buffer.isBuffer(thing)) {
    return thing
  } else if (typeof thing === 'string') {
    return Buffer.from(thing, encoding)
  } else if (ArrayBuffer.isView(thing)) {
    return Buffer.from(thing.buffer)
  } else {
    throw new TypeError(name + ' must be a string, a Buffer, a typed array or a DataView')
  }
}

},{"safe-buffer":68}],66:[function(require,module,exports){
(function (process,global){(function (){
'use strict'

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
var MAX_UINT32 = 4294967295

function oldBrowser () {
  throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
}

var Buffer = require('safe-buffer').Buffer
var crypto = global.crypto || global.msCrypto

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes
} else {
  module.exports = oldBrowser
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

  var bytes = Buffer.allocUnsafe(size)

  if (size > 0) {  // getRandomValues fails on IE if size == 0
    if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
      // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
      for (var generated = 0; generated < size; generated += MAX_BYTES) {
        // buffer.slice automatically checks if the end is past the end of
        // the buffer so we don't have to here
        crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
      }
    } else {
      crypto.getRandomValues(bytes)
    }
  }

  if (typeof cb === 'function') {
    return process.nextTick(function () {
      cb(null, bytes)
    })
  }

  return bytes
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":7,"safe-buffer":68}],67:[function(require,module,exports){
'use strict'
var Buffer = require('buffer').Buffer
var inherits = require('inherits')
var HashBase = require('hash-base')

var ARRAY16 = new Array(16)

var zl = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]

var zr = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]

var sl = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]

var sr = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]

var hl = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
var hr = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

function RIPEMD160 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0
}

inherits(RIPEMD160, HashBase)

RIPEMD160.prototype._update = function () {
  var words = ARRAY16
  for (var j = 0; j < 16; ++j) words[j] = this._block.readInt32LE(j * 4)

  var al = this._a | 0
  var bl = this._b | 0
  var cl = this._c | 0
  var dl = this._d | 0
  var el = this._e | 0

  var ar = this._a | 0
  var br = this._b | 0
  var cr = this._c | 0
  var dr = this._d | 0
  var er = this._e | 0

  // computation
  for (var i = 0; i < 80; i += 1) {
    var tl
    var tr
    if (i < 16) {
      tl = fn1(al, bl, cl, dl, el, words[zl[i]], hl[0], sl[i])
      tr = fn5(ar, br, cr, dr, er, words[zr[i]], hr[0], sr[i])
    } else if (i < 32) {
      tl = fn2(al, bl, cl, dl, el, words[zl[i]], hl[1], sl[i])
      tr = fn4(ar, br, cr, dr, er, words[zr[i]], hr[1], sr[i])
    } else if (i < 48) {
      tl = fn3(al, bl, cl, dl, el, words[zl[i]], hl[2], sl[i])
      tr = fn3(ar, br, cr, dr, er, words[zr[i]], hr[2], sr[i])
    } else if (i < 64) {
      tl = fn4(al, bl, cl, dl, el, words[zl[i]], hl[3], sl[i])
      tr = fn2(ar, br, cr, dr, er, words[zr[i]], hr[3], sr[i])
    } else { // if (i<80) {
      tl = fn5(al, bl, cl, dl, el, words[zl[i]], hl[4], sl[i])
      tr = fn1(ar, br, cr, dr, er, words[zr[i]], hr[4], sr[i])
    }

    al = el
    el = dl
    dl = rotl(cl, 10)
    cl = bl
    bl = tl

    ar = er
    er = dr
    dr = rotl(cr, 10)
    cr = br
    br = tr
  }

  // update state
  var t = (this._b + cl + dr) | 0
  this._b = (this._c + dl + er) | 0
  this._c = (this._d + el + ar) | 0
  this._d = (this._e + al + br) | 0
  this._e = (this._a + bl + cr) | 0
  this._a = t
}

RIPEMD160.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.alloc ? Buffer.alloc(20) : new Buffer(20)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  buffer.writeInt32LE(this._e, 16)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fn1 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + e) | 0
}

function fn2 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + e) | 0
}

function fn3 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b | (~c)) ^ d) + m + k) | 0, s) + e) | 0
}

function fn4 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + e) | 0
}

function fn5 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ (c | (~d))) + m + k) | 0, s) + e) | 0
}

module.exports = RIPEMD160

},{"buffer":3,"hash-base":41,"inherits":58}],68:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],69:[function(require,module,exports){
var Buffer = require('safe-buffer').Buffer

// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = Buffer.alloc(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = Buffer.from(data, enc)
  }

  var block = this._block
  var blockSize = this._blockSize
  var length = data.length
  var accum = this._len

  for (var offset = 0; offset < length;) {
    var assigned = accum % blockSize
    var remainder = Math.min(length - offset, blockSize - assigned)

    for (var i = 0; i < remainder; i++) {
      block[assigned + i] = data[offset + i]
    }

    accum += remainder
    offset += remainder

    if ((accum % blockSize) === 0) {
      this._update(block)
    }
  }

  this._len += length
  return this
}

Hash.prototype.digest = function (enc) {
  var rem = this._len % this._blockSize

  this._block[rem] = 0x80

  // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
  // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
  this._block.fill(0, rem + 1)

  if (rem >= this._finalSize) {
    this._update(this._block)
    this._block.fill(0)
  }

  var bits = this._len * 8

  // uint32
  if (bits <= 0xffffffff) {
    this._block.writeUInt32BE(bits, this._blockSize - 4)

  // uint64
  } else {
    var lowBits = (bits & 0xffffffff) >>> 0
    var highBits = (bits - lowBits) / 0x100000000

    this._block.writeUInt32BE(highBits, this._blockSize - 8)
    this._block.writeUInt32BE(lowBits, this._blockSize - 4)
  }

  this._update(this._block)
  var hash = this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash

},{"safe-buffer":68}],70:[function(require,module,exports){
var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = require('./sha')
exports.sha1 = require('./sha1')
exports.sha224 = require('./sha224')
exports.sha256 = require('./sha256')
exports.sha384 = require('./sha384')
exports.sha512 = require('./sha512')

},{"./sha":71,"./sha1":72,"./sha224":73,"./sha256":74,"./sha384":75,"./sha512":76}],71:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha

},{"./hash":69,"inherits":58,"safe-buffer":68}],72:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1

},{"./hash":69,"inherits":58,"safe-buffer":68}],73:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Sha256 = require('./sha256')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = Buffer.allocUnsafe(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224

},{"./hash":69,"./sha256":74,"inherits":58,"safe-buffer":68}],74:[function(require,module,exports){
/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = Buffer.allocUnsafe(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256

},{"./hash":69,"inherits":58,"safe-buffer":68}],75:[function(require,module,exports){
var inherits = require('inherits')
var SHA512 = require('./sha512')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = Buffer.allocUnsafe(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384

},{"./hash":69,"./sha512":76,"inherits":58,"safe-buffer":68}],76:[function(require,module,exports){
var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = Buffer.allocUnsafe(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512

},{"./hash":69,"inherits":58,"safe-buffer":68}],77:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"safe-buffer":68}],78:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],79:[function(require,module,exports){
(function (Buffer){(function (){
// import { v4 as uuidv4 } from "uuid";
// import { Base64 } from "js-base64";
// import sha256 from "sha256";
// import bip39 from "bip39";
const bip39 = require("bip39");

function guid() {
  //Get Kaios Bluetooth device address
  // var address = instanceOfBluetoothDevice.address;
  var address = "dQDFWUBFUHAEBJRFFHBESIJKNZIJANGBHSZHFBGEYAUHYS";

  // Get KAIOS bluetooth device uuids
  // var uuids = instanceOfBluetoothDevice.uuids;
  var uuids = "5u0qt89uqr4h3g718758yth7gw8u89wy6858utu8g592h6j893huiyhj";

  // base64 (BTAdress + uuids)
  var base64 = Base64.encode(address + uuids);

  //result = "ZFFERldVQkZVSEFFQkpSRkZIQkVTSUpLTlpJSkFOR0JIU1pIRkJHRVlBVUhZUzV1MHF0ODl1cXI0aDNnNzE4NzU4eXRoN2d3OHU4OXd5Njg1OHV0dThnNTkyaDZqODkzaHVpeWhq"

  // Get Current Date and Time

  var dateAndTime = new Date();
  var currentTime = dateAndTime.getTime();
  var seconds = dateAndTime.getSeconds();
  // console.log(currentTime);

  // sha256 encryption
  var sha256Encryption = sha256.x2(base64 + (currentTime + seconds));
  // result = "0c3f96ca1b631d0414fb4aaac3c1ab01ce6dd1f20bcffbd293fd29259b83b253"

  //Create Guid
  var guid = uuidv4(sha256Encryption);
  //result = "b8e2d9b2-3e63-4e30-a29e-1ce32f794639";

  // bip39.generateMnemonic();
}

let buf = Buffer.from("b8e2d9b2-3e63-4e30-a29e-1ce32f794639");
// console.log(buf);

let num = "";
for (let i = 0; i < buf.length; i++) {
  num += buf[i];
}
let num32 = num.substring(0, 32);

console.log(num32);

let words = bip39.entropyToMnemonic(num32);

var seed = bip39.mnemonicToSeedSync(words).toString("hex");
console.log(seed, bip39.validateMnemonic(words));

}).call(this)}).call(this,require("buffer").Buffer)
},{"bip39":27,"buffer":3}]},{},[79]);
