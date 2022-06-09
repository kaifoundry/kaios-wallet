import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Data } from "../App";
import generateBech32 from "../keys/generateBech32";
import Cryptr from "cryptr";

const WalletDetails = (props) => {
  let cryptr = new Cryptr("dQDFWUBFUHAEBJRFFHBESIJKNZIJANGBHSZHFBGEYAUHYS");
  let words = cryptr.decrypt(
    localStorage.getItem(
      "5u0qt89uqr4h3g718758yth7gw8u89wy6858utu8g592h6j893huiyhj"
    )
  );
  let wordsArray = words.split(",");
  words = wordsArray;
  let navigate = useNavigate();
  return (
    <div
      style={{
        width: "100vw",
        backgroundColor: "rgb(37, 36, 36)",
        color: "white",
        padding: "10px ",
      }}
    >
      <div className="d-flex justify-content-between align-items-center">
        <Link
          to="/settings"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8592;{" "}
        </Link>
        <h6 style={{ color: "white", height: "12px" }}>Settings | Wallet</h6>
        <h6 style={{ color: "white" }}></h6>
      </div>
      <div className="mt-3">
        <a
          onClick={() => {
            props.setLocalStorageData(words);
            navigate("/details?mnemonic=true");
          }}
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
        >
          Show Mnemonic
        </a>
        <br />
        <small style={{ color: "#b4b0b0" }}>
          Show 12-word seed for this wallet
        </small>
        <br />
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <a
          onClick={() => {
            let localStorageData = generateBech32(...words);
            props.setLocalStorageData(localStorageData.pblAddress);
            navigate("/details?address=true");
          }}
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
        >
          Show Address
        </a>
        <br />
        <small style={{ color: "#b4b0b0" }}>Show BIP84 address (P2WPKH)</small>
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <a
          onClick={() => {
            let localStorageData = generateBech32(...words);
            props.setLocalStorageData(localStorageData.xpub);
            navigate("/details?xpub=true");
          }}
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
        >
          Show Segwit XPUB
        </a>
        <br />
        <small style={{ color: "#b4b0b0" }}>
          Show extended public key for BIP84 (Bech32)
        </small>
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <a
          onClick={() => {
            let localStorageData = generateBech32(...words);
            props.setLocalStorageData(localStorageData.pblKey);
            navigate("/details?publickey=true");
          }}
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
        >
          Show Public Key
        </a>
        <br />
        <small style={{ color: "#b4b0b0" }}>
          Show public key for BIP84 (Bech32)
        </small>
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <Link
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
          to="/details"
        >
          Erase Wallet
        </Link>
        <br />
        <small style={{ color: "#b4b0b0" }}>
          Erase the wallet from this phone
        </small>
      </div>
    </div>
  );
};

export default WalletDetails;
