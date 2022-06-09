import React from "react";
import { Link } from "react-router-dom";

const Settings = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgb(37, 36, 36)",
        color: "white",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      <div className="d-flex justify-content-between align-items-center">
        <Link to="/wallet" style={{ fontSize: "25px", textDecoration: "none" }}>
          &#8592;{" "}
        </Link>
        <h6 style={{ color: "white", height: "12px" }}>Settings</h6>
        <h6 style={{ color: "white" }}></h6>
      </div>
      <div className="mt-3">
        <Link
          to="/wallet-details"
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
        >
          Wallet
        </Link>
        <br />
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <Link
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
          to="/"
        >
          Transactions
        </Link>
        <hr style={{ margin: "5px 0px 5px 0px" }} />
        <Link
          style={{ textDecoration: "none", color: "white", fontSize: "14px" }}
          to="/about"
        >
          About
        </Link>
      </div>
    </div>
  );
};

export default Settings;
