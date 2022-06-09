import React from "react";
import { Link } from "react-router-dom";
import { FormGroup, Form, Label, Input } from "reactstrap";

const ExternalWallet = () => {
  return (
    <>
      <div
        style={{
          backgroundColor: "#010006db",
          height: "100vh",
          width: "100vw",
          textAlign: "center",
          position: "fixed",
          top: 0,
        }}
      >
        <div className="text-center mt-5">
          <p
            className="text-white p-2 text-center"
            style={{ textAlign: "left" }}
          >
            IMPORT EXTERNAL WALLET <br />
            <small>
              Enter your mnemonic key (12 Words) to import a wallet from another
              provider.
            </small>
          </p>
          <Form>
            <FormGroup style={{ padding: "0 20px 0 20px" }}>
              <Label for="mnemonic" className="text-white">
                Enter your code here
              </Label>
              <Input
                className="mt-1"
                type="password"
                name="text"
                id="mnemonic"
              />
            </FormGroup>
          </Form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "white",
              padding: "16px",
            }}
          >
            <Link
              to="/existing-wallet"
              style={{ fontSize: "25px", textDecoration: "none" }}
            >
              &#8592;
            </Link>
            <Link
              to="/wallet"
              style={{ fontSize: "25px", textDecoration: "none" }}
            >
              &#8594;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExternalWallet;
