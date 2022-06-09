import React, { useEffect } from "react";
import { FormGroup, Form, Label, Input } from "reactstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { BlockCypherUrl, Token } from "../api/APIs";
var bitcoin = require("bitcoinjs-lib");
var secp = require("tiny-secp256k1");
const ecfacory = require("ecpair");

const SendMoney = ({ pblAdd }) => {
  const [sendingAddress, setSendingAddress] = React.useState("");
  const [sendingAmount, setSendingAmount] = React.useState();

  var ECPair = ecfacory.ECPairFactory(secp);

  const keyBuffer = new Buffer.from(
    "KwYAUMUjaTKkznzcdrFwBBV7LAavRmR5QyiwGjiy8B5FpA8egEo6"
  );
  console.log(keyBuffer);
  var keys = ECPair.fromPrivateKey(keyBuffer);
  console.log(keys);

  const [createTransaction, setCreateTransaction] = React.useState({});

  useEffect(() => {
    sign();
  }, [createTransaction]);

  function sign() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify(createTransaction);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      `${BlockCypherUrl}/v1/btc/test3/txs/send?token=` + Token,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }
  function sendBtc() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      inputs: [
        {
          addresses: ["tb1q3vhnqlkqlauh6mv8askyu3vqpa33j54kn34x67"],
        },
      ],
      outputs: [
        {
          addresses: ["tb1qptjd0ecwte605ytwjwy459w0htyff58xdpsgqc"],
          value: 1,
        },
      ],
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      `${BlockCypherUrl}/v1/btc/test3/txs/new?token=` + Token,
      requestOptions
    )
      .then((response) => response.json())
      .then((tmptx) => {
        // signing each of the hex-encoded string required to finalize the transaction
        tmptx.pubkeys = [];
        tmptx.signatures = tmptx.tosign.map(function (tosign, n) {
          tmptx.pubkeys.push(keys.publicKey.toString("hex"));
          return bitcoin.script.signature
            .encode(keys.sign(Buffer.from(tosign, "hex")), 0x01)
            .toString("hex")
            .slice(0, -2);
        });
        // fetch(`${BlockCypherUrl}/v1/btc/test3/txs/send?token=` + Token, {
        //   method: "POST",
        //   headers: myHeaders,
        //   body: JSON.stringify({
        //     tmptx,
        //   }),
        //   redirect: "follow",
        // });
        // setCreateTransaction({
        //   ...result,
        //   signatures: [
        //     "3045022100921fc36b911094280f07d8504a80fbab9b823a25f102e2bc69b14bcd369dfc7902200d07067d47f040e724b556e5bc3061af132d5a47bd96e901429d53c41e0f8cca",
        //   ],
        //   pubkeys: [
        //     "02152e2bb5b273561ece7bbe8b1df51a4c44f5ab0bc940c105045e2cc77e618044",
        //   ],
        // });
      })
      .then(() => {})
      .catch((error) => console.log("error", error));
  }
  return (
    <>
      <div
        style={{
          backgroundColor: "#010006db",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          color: "gainsboro",
        }}
      >
        <div style={{ marginTop: "5%", padding: "15px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingRight: "5px",
            }}
          >
            <strong>Send Money</strong>
            <strong>
              <FontAwesomeIcon icon={faQrcode} />
            </strong>
          </div>
          <Form>
            <FormGroup className="mt-2">
              <Label style={{ fontSize: "13px" }} for="receiver">
                To
              </Label>
              <Input
                style={{ fontSize: "13px" }}
                type="text"
                name="receiver"
                id="receiver"
                onChange={(e) => setSendingAddress(e.target.value)}
              />
              <Label style={{ fontSize: "13px" }} for="BTC">
                BTC
              </Label>
              <Input
                style={{ fontSize: "13px" }}
                type="text"
                name="BTC"
                id="BTC"
                onChange={(e) => setSendingAmount(e.target.value)}
              />
              {/* <Label style={{ fontSize: "13px" }} for="sat">
              Sat
            </Label>
            <Input
              style={{ fontSize: "13px" }}
              type="text"
              name="sat"
              id="sat"
            /> */}
            </FormGroup>
          </Form>
          <div className="text-center mt-2">
            <h6 style={{ fontSize: "10px" }}>Total available amount</h6>
            <h6 style={{ fontSize: "12px" }}>
              <pre>0.00000 BTC</pre>
            </h6>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "-10px",
            }}
          >
            <Link
              to="/wallet"
              style={{ fontSize: "25px", textDecoration: "none" }}
            >
              &#8592;
            </Link>
            <a
              style={{
                fontSize: "25px",
                textDecoration: "none",
                color: "#0d6efd",
              }}
              onClick={sendBtc}
            >
              &#8594;
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendMoney;
