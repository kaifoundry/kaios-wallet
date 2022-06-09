import React from "react";
import { Link } from "react-router-dom";

const About = () => {
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
          to="/settings"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8592;{" "}
        </Link>
        <h6 style={{ color: "white", height: "12px" }}>Settings | About</h6>
        <h6 style={{ color: "white" }}></h6>
      </div>
      <h6 className="m-0 mt-2">Version</h6>
      <small style={{ color: "#b4b0b0" }}>Walnut - 1.0.0</small>
    </div>
  );
};

export default About;
