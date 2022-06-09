import React from "react";
import { Link } from "react-router-dom";

const ExistingWallet = () => {
  return (
    <>
      <div
        style={{
          backgroundColor: "#010006db",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
        }}
      >
        <Link
          to="/"
          style={{
            textAlign: "left",
            fontSize: "25px",
            marginLeft: "10px",
            textDecoration: "none",
          }}
        >
          &#8592;
        </Link>
        <div className="text-center mt-4">
          <p
            className="text-white p-3 text-center"
            style={{ textAlign: "left" }}
          >
            Restoring a wallet? No problem, let's restore your wallet.
          </p>
          <Link to="/external-wallet" className="btn text-white mt-2">
            I have an external wallet{" "}
            <span className="text-primary" style={{ fontSize: "18px" }}>
              &#8594;
            </span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default ExistingWallet;
