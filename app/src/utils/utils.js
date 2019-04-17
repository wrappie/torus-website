const ethUtil = require('ethereumjs-util')
const assert = require('assert')
const BN = require('bn.js')
const {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_BRAVE
} = require('./enums')

/**
 * Generates an example stack trace
 *
 * @returns {string} A stack trace
 *
 */
function getStack() {
  const stack = new Error('Stack trace generator - not an error').stack
  return stack
}

/**
 * Used to determine the window type through which the app is being viewed.
 *  - 'popup' refers to the extension opened through the browser app icon (in top right corner in chrome and firefox)
 *  - 'responsive' refers to the main browser window
 *  - 'notification' refers to the popup that appears in its own window when taking action outside of metamask
 *
 * @returns {string} A single word label that represents the type of window through which the app is being viewed
 *
 */
const getEnvironmentType = (url = window.location.href) => {
  if (url.match(/popup.html(?:#.*)*$/)) {
    return ENVIRONMENT_TYPE_POPUP
  } else if (url.match(/home.html(?:\?.+)*$/) || url.match(/home.html(?:#.*)*$/)) {
    return ENVIRONMENT_TYPE_FULLSCREEN
  } else {
    return ENVIRONMENT_TYPE_NOTIFICATION
  }
}

/**
 * Returns the platform (browser) where the extension is running.
 *
 * @returns {string} the platform ENUM
 *
 */
const getPlatform = _ => {
  const ua = navigator.userAgent
  if (ua.search('Firefox') !== -1) {
    return PLATFORM_FIREFOX
  } else {
    if (window && window.chrome && window.chrome.ipcRenderer) {
      return PLATFORM_BRAVE
    } else if (ua.search('Edge') !== -1) {
      return PLATFORM_EDGE
    } else if (ua.search('OPR') !== -1) {
      return PLATFORM_OPERA
    } else {
      return PLATFORM_CHROME
    }
  }
}

/**
 * Checks whether a given balance of ETH, represented as a hex string, is sufficient to pay a value plus a gas fee
 *
 * @param {object} txParams Contains data about a transaction
 * @param {string} txParams.gas The gas for a transaction
 * @param {string} txParams.gasPrice The price per gas for the transaction
 * @param {string} txParams.value The value of ETH to send
 * @param {string} hexBalance A balance of ETH represented as a hex string
 * @returns {boolean} Whether the balance is greater than or equal to the value plus the value of gas times gasPrice
 *
 */
function sufficientBalance(txParams, hexBalance) {
  // validate hexBalance is a hex string
  assert.strictEqual(typeof hexBalance, 'string', 'sufficientBalance - hexBalance is not a hex string')
  assert.strictEqual(hexBalance.slice(0, 2), '0x', 'sufficientBalance - hexBalance is not a hex string')

  const balance = hexToBn(hexBalance)
  const value = hexToBn(txParams.value)
  const gasLimit = hexToBn(txParams.gas)
  const gasPrice = hexToBn(txParams.gasPrice)

  const maxCost = value.add(gasLimit.mul(gasPrice))
  return balance.gte(maxCost)
}

/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param {BN} inputBn The BN to convert to a hex string
 * @returns {string} A '0x' prefixed hex string
 *
 */
function bnToHex(inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

/**
 * Converts a hex string to a BN object
 *
 * @param {string} inputHex A number represented as a hex string
 * @returns {Object} A BN object
 *
 */
function hexToBn(inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}

/**
 * Used to multiply a BN by a fraction
 *
 * @param {BN} targetBN The number to multiply by a fraction
 * @param {number|string} numerator The numerator of the fraction multiplier
 * @param {number|string} denominator The denominator of the fraction multiplier
 * @returns {BN} The product of the multiplication
 *
 */
function BnMultiplyByFraction(targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}

function applyListeners(listeners, emitter) {
  Object.keys(listeners).forEach(key => {
    emitter.on(key, listeners[key])
  })
}

function removeListeners(listeners, emitter) {
  Object.keys(listeners).forEach(key => {
    emitter.removeListener(key, listeners[key])
  })
}

/**
 * Converts a hex-encoded string to a text string.
 *
 * @param {string} hex Hex string to be converted
 * @returns {string} Text converted from the hex string
 */
function hexToText(hex) {
  try {
    const stripped = ethUtil.stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.toString('utf8')
  } catch (e) {
    return hex
  }
}

function addressSlicer(address = '') {
  if (address.length < 11) {
    return address
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function significantDigits(number, perc = false, len = 2) {
  let input = number
  if (input === 0) return input
  if (perc) {
    input *= 100
  }
  let depth
  if (input >= 1) {
    depth = 2
  } else {
    depth = len - 1 + Math.ceil(Math.log10(1 / input))
  }
  const shift = Math.pow(10, depth)
  const roundedNum = Math.round(shift * input) / shift
  return roundedNum
}

export {
  removeListeners,
  applyListeners,
  getPlatform,
  getStack,
  getEnvironmentType,
  sufficientBalance,
  hexToBn,
  bnToHex,
  BnMultiplyByFraction,
  hexToText,
  addressSlicer,
  significantDigits
}
