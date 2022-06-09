import React from "react";
import { Link } from "react-router-dom";
import { faMarsStroke } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Transactions = () => {
  return (
    <>
      <div
        style={{
          backgroundColor: "rgb(37, 36, 36)",
          width: "100vw",
          height: "35vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          to="/wallet"
          style={{
            fontSize: "25px",
            textDecoration: "none",
            position: "fixed",
            top: "5px",
            left: "15px",
            color: "white",
          }}
        >
          &#8592;
        </Link>
        <h1 className="text-white mt-5">
          <pre>0.00000 BTC</pre>
        </h1>
      </div>

      <div
        style={{
          backgroundColor: "#252424",
          width: "100vw",
          height: "65vh",
          color: "white",
          overflowY: "scroll",
          boxShadow: "0px 0px 10px #1e1818",
        }}
      >
        <h6
          style={{ fontSize: "9px", color: "#dcdede", padding: "6px 0 0 10px" }}
        >
          23 Nov 2020
        </h6>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0d6efd",
            padding: "10px 25px 0px 25px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h6>
              <FontAwesomeIcon icon={faMarsStroke} />
              <br />
              {/* <h6> */}
              <pre style={{ fontSize: "10px" }}>10:00</pre>
              {/* </h6> */}
            </h6>
          </div>
          <h6>
            <pre style={{ marginBottom: "0" }}>-0.00002</pre>
          </h6>
          <h5 style={{ marginBottom: "12px" }}> &#8594;</h5>
        </div>
        <h6
          style={{ fontSize: "9px", color: "#dcdede", padding: "6px 0 0 10px" }}
        >
          23 Nov 2020
        </h6>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0d6efd",
            padding: "10px 25px 0px 25px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h6>
              <FontAwesomeIcon icon={faMarsStroke} />
              <br />
              {/* <h6> */}
              <pre style={{ fontSize: "10px" }}>10:00</pre>
              {/* </h6> */}
            </h6>
          </div>
          <h6>
            <pre style={{ marginBottom: "0" }}>-0.00002</pre>
          </h6>
          <h5 style={{ marginBottom: "12px" }}> &#8594;</h5>
        </div>
        <h6
          style={{ fontSize: "9px", color: "#dcdede", padding: "6px 0 0 10px" }}
        >
          23 Nov 2020
        </h6>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0d6efd",
            padding: "10px 25px 0px 25px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h6>
              <FontAwesomeIcon icon={faMarsStroke} />
              <br />
              {/* <h6> */}
              <pre style={{ fontSize: "10px" }}>10:00</pre>
              {/* </h6> */}
            </h6>
          </div>
          <h6>
            <pre style={{ marginBottom: "0" }}>-0.00002</pre>
          </h6>
          <h5 style={{ marginBottom: "12px" }}> &#8594;</h5>
        </div>
      </div>
    </>
  );
};

export default Transactions;
