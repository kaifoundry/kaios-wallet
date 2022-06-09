import React, { useContext, useEffect } from "react";
import { Form, FormGroup, Label, Input } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { Data } from "../App";

const CheckPass = () => {
  let navigate = useNavigate();
  let data = useContext(Data);
  useEffect(() => {
    if (!data.phrase) {
      navigate("/");
    }
  }, []);

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
          <strong>
            Passphrase is a required part of your offline paper backup. Without
            it you can't restore your wallet.
          </strong>
          <Form>
            <FormGroup className="mt-2">
              <Label style={{ fontSize: "13px" }} for="passphrase">
                Your Passphrase
              </Label>
              <Input
                style={{ fontSize: "13px" }}
                type="text"
                name="passphrase"
                id="passphrase"
                value={data.phrase}
                readOnly
              />
              <Label
                style={{ fontSize: "10px", textAlign: "justify" }}
                className="mt-3"
                check
              >
                Your passphrase will not be shown to you again.
              </Label>
            </FormGroup>
          </Form>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link
              to="/create-wallet"
              style={{ fontSize: "25px", textDecoration: "none" }}
            >
              &#8592;
            </Link>
            <Link
              to="/keywords"
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

export default CheckPass;
