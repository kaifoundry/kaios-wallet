import BIP84 from "bip84";
import Cryptr from "cryptr";
export default function generateBech32(words) {
  var root = new BIP84.fromMnemonic(words);
  var child0 = root.deriveAccount(0);

  let data = {};
  const cryptr = new Cryptr("dQDFWUBFUHAEBJRFFHBESIJKNZIJANGBHSZHFBGEYAUHYS"); //instanceOfBluetoothDevice.address,

  // console.log("mnemonic:", root);
  // console.log("rootpriv:", root.getRootPrivateKey());
  // console.log("rootpub:", root.getRootPublicKey());
  // console.log("\n");

  var account0 = new BIP84.fromZPrv(child0);

  // console.log("Account 0, root = m/84'/0'/0'");
  // console.log("Account 0 xprv:", account0.getAccountPrivateKey());
  // console.log("Account 0 xpub:", account0.getAccountPublicKey());
  // console.log("\n");

  // console.log("Account 0, first receiving address = m/84'/0'/0'/0/0");
  // console.log("Prvkey:", account0.getPrivateKey(0));
  let pvtKey = account0.getPrivateKey(0);
  // console.log(pvtKey, "pvtkey");
  let pblKey = account0.getPublicKey(0);
  let pblAddress = account0.getAddress(0);
  let xpub = account0.getAccountPublicKey();
  // console.log("Pubkey:", account0.getPublicKey(0));
  // console.log("Address:", account0.getAddress(0));
  // console.log("\n");
  // console.log("Account 0, second receiving address = m/84'/0'/0'/0/1");
  // console.log("Prvkey:", account0.getPrivateKey(1));
  // console.log("Pubkey:", account0.getPublicKey(1));
  // console.log("Address:", account0.getAddress(1));
  // console.log("\n");
  // console.log("Account 0, first change address = m/84'/0'/0'/1/0");
  // console.log("Prvkey:", account0.getPrivateKey(0, true));
  // console.log("Pubkey:", account0.getPublicKey(0, true));
  // // console.log("Address:", account0.getAddress(0, true));
  // console.log("\n");

  let wordsArray = words.split(" ");
  let encryptedWordsArray = cryptr.encrypt(wordsArray);
  console.log("encrypt", encryptedWordsArray);

  localStorage.setItem(
    "5u0qt89uqr4h3g718758yth7gw8u89wy6858utu8g592h6j893huiyhj",
    encryptedWordsArray
  );

  data["words"] = wordsArray;
  data["pvtKey"] = pvtKey;
  data["pblKey"] = pblKey;
  data["pblAddress"] = pblAddress;
  data["xpub"] = xpub;
  return data;
}
