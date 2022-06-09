import { v4 as uuidv4 } from "uuid";
import { Base64 } from "js-base64";
import sha256 from "sha256";
import generateBech32 from "./generateBech32";
const bip39 = require("bip39");
// let { bech32, bech32m } = require("bech32");
// // const EC = require("elliptic").ec;
// // var crypto = require("crypto-js");
// // const bitcore = require("bitcore-lib");
// var hdkey = require("hdkey");
// var createHash = require("create-hash");
// var bs58check = require("bs58check");

export default function createAddress(passphrase) {
  //Get Kaios Bluetooth device address
  // var address = instanceOfBluetoothDevice.address;
  //Assuming demo address:
  var address = "dQDFWUBFUHAEBJRFFHBESIJKNZIJANGBHSZHFBGEYAUHYS";

  // Get KAIOS bluetooth device uuids
  // var uuids = instanceOfBluetoothDevice.uuids;
  //Assuming demo uuids:
  var uuids = "5u0qt89uqr4h3g718758yth7gw8u89wy6858utu8g592h6j893huiyhj";

  // base64 (BTAdress + uuids)
  var base64 = Base64.encode(address + uuids + passphrase);
  console.log("base64: ", base64);

  // Get Current Date and Time

  var dateAndTime = new Date();
  var currentTime = dateAndTime.getTime();
  var seconds = dateAndTime.getSeconds();
  // console.log(currentTime);

  // sha256 encryption
  var sha256Encryption = sha256.x2(base64);
  // result = "0c3f96ca1b631d0414fb4aaac3c1ab01ce6dd1f20bcffbd293fd29259b83b253"
  console.log("sha256Encryption: ", sha256Encryption);

  //Create Guid
  var guid;
  for (let i = 0; i < 5000; i++) {
    guid = uuidv4(
      sha256Encryption *
        (currentTime * seconds) *
        (i * (Math.random() * (1000000 * (Math.random() * 5000000))))
    );
  }
  //result = "b8e2d9b2-3e63-4e30-a29e-1ce32f794639";
  console.log("Guid: ", guid);
  // bip39.generateMnemonic();

  let buf = Buffer.from(guid);
  console.log("Buffer: ", buf);

  let num = "";
  for (let i = 0; i < buf.length; i++) {
    num += buf[i];
  }
  let num32 = num.substring(0, 32);

  console.log("32 Numbers: ", num32);

  //Generating 12 Words:
  let words = bip39.entropyToMnemonic(num32);
  // let words =
  //   "ring slow neutral figure good race minute smile merge describe arena angry";
  // console.log("Words: ", words);

  //Generating Seed:
  // var seed = bip39.mnemonicToSeedSync(words).toString("hex");
  // console.log(
  //   "Seed: " + seed,
  //   "\n",
  //   " validation of words: " + bip39.validateMnemonic(words)
  // );

  let data = generateBech32(words);
  return data;
  // let b32 = bech32.encode("bc", words);
  // console.log("bech32: ", b32);
  // // const ec = new EC("secp256k1");
  // // let secret = crypto.cr("sha256").update("password").digest("hex");
  // // let keyPair = ec.keyFromSecret(secret);

  // //Bitcore method
  // // let bn = bitcore.crypto.BN.fromBuffer(num32);
  // // console.log(bn);
  // // let pk = new bitcore.PrivateKey(bn).toWIF();
  // // let publicAddress = new bitcore.PrivateKey(bn).toAddress();
  // // console.log("private key: ", pk);
  // // console.log("public key: ", publicAddress);

  // var versionByte = "6f";
  // const root = hdkey.fromMasterSeed(seed);
  // console.log("root", root);
  // const masterPrivateKey = root.privateKey.toString("hex");
  // console.log("master private key", masterPrivateKey.toString("hex"));
  // //derive the address of length 0
  // const addrnode = root.derive("m/44'/0'/0'/0/2");

  // //generate a bitcoin address from the public key
  // const step1 = addrnode._publicKey;
  // console.log("public address derived", addrnode._publicKey.toString("hex"));
  // console.log("private address derived", addrnode._privateKey.toString("hex"));
  // // console.log(step1.toString('hex'));
  // const step2 = createHash("sha256").update(step1).digest();
  // const step3 = createHash("rmd160").update(step2).digest();

  // const step4 = versionByte + step3.toString("hex");

  // console.log("step4encoding", bs58check.encode(Buffer.from(step4, "hex")));
  // var step9 = bs58check.encode(Buffer.from(step4, "hex"));
  // var step9 = bech32.toWords(Buffer.from(seed, "utf8"));
  // console.log(step9);
  // console.log(bech32.encode(addrnode._privateKey.toString("hex"), step9));
}
