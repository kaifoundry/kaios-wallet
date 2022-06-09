import React, { useState } from "react";
import { Form, FormGroup, Label, Input } from "reactstrap";
import createAddress from "../keys/createAddress";
import { Link, useNavigate } from "react-router-dom";

const CreateWallet = (props) => {
  const [phrase, setPhrase] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [error, setError] = useState(false);
  const [check, setCheck] = useState(false);

  const history = useNavigate();
  function getPassphrase(event) {
    setPhrase(event.target.value);
  }
  function getConfirmPassphrase(event) {
    setConfirmPhrase(event.target.value);
  }

  function toCheckPass() {
    if (phrase === confirmPhrase && phrase !== "" && check == true) {
      let dataOfCreateAddress = createAddress(phrase);
      props.setPhrase(confirmPhrase);
      props.dataOfCreateAddress(dataOfCreateAddress.words);
      props.pblAddress(dataOfCreateAddress.pblAddress);
      props.pblKey(dataOfCreateAddress.pblKey);
      props.xpub(dataOfCreateAddress.xpub);
      history("/check-pass");
    } else setError(true);
  }

  function checkbox(event) {
    if (event.target.checked == true) setCheck(true);
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
          <strong>Create a strong passphrase for your wallet.</strong>
          <Form>
            <FormGroup className="mt-2">
              <Label style={{ fontSize: "13px" }} for="passphrase">
                Create a Passphrase
              </Label>
              <Input
                style={{
                  fontSize: "13px",
                  border: error ? "2px solid red" : "auto",
                }}
                type="password"
                name="passphrase"
                id="passphrase"
                onChange={getPassphrase}
              />
              <Label style={{ fontSize: "13px" }} for="passphrase">
                Confirm the Passphrase
              </Label>
              <Input
                style={{
                  fontSize: "13px",
                  border: error ? "2px solid red" : "auto",
                }}
                type="password"
                name="confirm-passphrase"
                id="confirm-passphrase"
                onChange={getConfirmPassphrase}
              />
              <Label
                style={{ fontSize: "10px", textAlign: "justify" }}
                className="mt-3"
                check
              >
                <Input type="checkbox" onClick={checkbox} /> I understand that
                Walnut Wallet can't provide assistance in the case of lost or
                forgotten passphrases. Walnut Wallet never has any knowledge of
                my passphrase.
              </Label>
            </FormGroup>
          </Form>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link to="/" style={{ fontSize: "25px", textDecoration: "none" }}>
              &#8592;
            </Link>
            <a
              onClick={toCheckPass}
              to="/check-pass"
              style={{
                fontSize: "25px",
                textDecoration: "none",
                color: "#0d6efd",
              }}
            >
              &#8594;
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateWallet;
