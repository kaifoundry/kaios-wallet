import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Data } from "../App";

function Keywords() {
  let arrayOfWords = useContext(Data);
  const keywords = arrayOfWords.wordsArray;
  let navigate = useNavigate();
  useEffect(() => {
    if (keywords.length != 12) {
      navigate("/");
    }
  }, []);
  return (
    <div
      className="text-white"
      style={{
        backgroundColor: "#010006db",
        width: "100vw",
        height: "100vh",
        overflowY: "scroll",
        textAlign: "center",
      }}
    >
      <h6 className="p-3" style={{ fontSize: "13px" }}>
        Write down words and keep them secret. Together with your passphrase
        they allow access to your wallet.
      </h6>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          padding: "0 10px 0 10px",
        }}
      >
        {keywords.map((keyword) => {
          return (
            <div
              style={{
                border: "1px solid white",
                margin: "10px",
                padding: "0",
                height: "25px",
                borderRadius: "5px",
              }}
              key={keyword}
            >
              <p style={{ fontSize: "12px", margin: "1px 0 0 0" }}>{keyword}</p>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px",
        }}
      >
        <Link
          to="check-pass"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8592;
        </Link>
        <Link
          to="/first-keyword"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8594;
        </Link>
      </div>
    </div>
  );
}

export default Keywords;
