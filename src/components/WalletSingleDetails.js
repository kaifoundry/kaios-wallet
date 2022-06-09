import React, { useEffect, useState, useContext } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Data } from "../App";

const WalletSingleDetails = () => {
  const [query, setQuery] = useState("");
  const [queryData, setQueryData] = useState("");
  const [words, setWords] = useState([]);
  let data = useContext(Data);
  let navigate = useNavigate();
  // console.log(data);
  useEffect(() => {
    let url = new URLSearchParams(window.location.search);
    let checkQuery = Object.fromEntries(url.entries());

    if (checkQuery.mnemonic) {
      setQuery("Mnemonic");
      setWords(data.wordsArray);
    } else if (checkQuery.xpub) {
      setQuery("Xpub");
      setQueryData(data.detailsData);
    } else if (checkQuery.address) {
      setQuery("Address");
      setQueryData(data.detailsData);
    } else if (checkQuery.publickey) {
      setQuery("Public Key");
      setQueryData(data.detailsData);
    } else {
      navigate("/");
    }
  }, []);
  return (
    <div
      style={{
        backgroundColor: "rgb(37, 36, 36)",
        width: "100vw",
        height: "100vh",
        color: "white",
        padding: "10px",
      }}
    >
      <div className="d-flex justify-content-between align-items-center">
        <Link
          to="/wallet-details"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8592;{" "}
        </Link>
        <h6 style={{ color: "white", height: "12px" }}>
          Settings | Wallet | {query}
        </h6>
        <h6 style={{ color: "white" }}></h6>
      </div>
      <h6 className="m-0 mt-2">{query}</h6>
      {words.length == 12 ? (
        <div
          style={{
            display: "grid",
            width: "90vw",
            gridTemplateColumns: "auto auto auto",
            gridGap: "20px",
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          {words.map((word) => {
            return (
              <small
                key={word}
                style={{
                  color: "#b4b0b0",
                }}
              >
                {word}
              </small>
            );
          })}
        </div>
      ) : (
        <small
          style={{
            color: "#b4b0b0",
            width: "90vw",
            overflowWrap: "break-word",
          }}
        >
          {queryData}
        </small>
      )}
    </div>
  );
};

export default WalletSingleDetails;
