import React from "react";
import { Link } from "react-router-dom";

const ImportOrCreateWallet = () => {
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
        <div className="text-center" style={{ marginTop: "50%" }}>
          <Link
            to="/create-wallet"
            className="btn btn-primary mt-2"
            style={{ paddingLeft: "25px", paddingRight: "25px" }}
          >
            Create New Wallet
          </Link>
          <br />
          <Link to="/existing-wallet" className="btn text-white mt-2">
            Restore an Existing Wallet
          </Link>
        </div>
      </div>
    </>
  );
};

export default ImportOrCreateWallet;
