import React from "react";
import { FormGroup, Form, Label, Input } from "reactstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { BlockCypherUrl, Token } from "../api/APIs";

const SendMoney = () => {
  const [sendingAddress, setSendingAddress] = React.useState("");
  const [sendingAmount, setSendingAmount] = React.useState();
  function sendBtc() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var raw = {
      inputs: [
        {
          addresses: ["bc1qjr9y78heau4kmwl85pzzw89z50ccsv9w9qwu2p"],
        },
      ],
      outputs: [
        {
          addresses: [sendingAddress],
          value: sendingAmount,
        },
      ],
    };

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      `${BlockCypherUrl}/v1/btc/main/txs/new?token=${Token}&includeToSignTx=true`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
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
