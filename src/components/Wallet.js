import React from "react";
import { Button } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  faDonate,
  faPaperPlane,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Wallet = () => {
  const navigate = useNavigate();
  return (
    <>
      <div
        style={{
          backgroundColor: "#0d6efd",
          width: "100vw",
          height: "35vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesomeIcon
          color="white"
          icon={faCog}
          style={{ position: "absolute", right: "12px", top: "12px" }}
          onClick={() => navigate("/settings")}
        />
        <h1 className="text-white mt-5">
          <pre>0.00000 BTC</pre>
        </h1>
      </div>
      <div
        style={{
          backgroundColor: "#252424",
          textAlign: "center",
        }}
      >
        <Link
          to="/transactions"
          className="btn text-white mt-3"
          style={{ fontSize: "14px" }}
        >
          Go to transactions{" "}
          <span className="text-primary" style={{ fontSize: "18px" }}>
            &#8594;
          </span>
        </Link>
      </div>

      <div
        style={{
          backgroundColor: "#252424",
          width: "100vw",
          height: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link to="/send-money">
          <Button
            color="primary"
            className=" text-white"
            style={{
              borderRadius: "50%",
              fontSize: "20px",
              padding: "0 11px 3px -1px",
              textAlign: "center",
              margin: "20px 20px 0 20px",
            }}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </Link>
        <Link to="/receive-money">
          <Button
            color="primary"
            className=" text-white"
            style={{
              borderRadius: "50%",
              fontSize: "20px",
              margin: "20px 20px 0 20px",
              padding: "0 11px 3px -1px",
              textAlign: "center",
            }}
          >
            <FontAwesomeIcon icon={faDonate} />
          </Button>
        </Link>
      </div>
    </>
  );
};

export default Wallet;
