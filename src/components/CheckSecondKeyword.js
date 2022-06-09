import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, FormGroup, Input, Label } from "reactstrap";
import { Data } from "../App";

function CheckSecondKeyword() {
  const [check, setCheck] = React.useState(false);
  let data = useContext(Data);
  let fifthWord = data.wordsArray[4];
  let navigate = useNavigate();
  let thirdWord = data.wordsArray[2];
  useEffect(() => {
    if (!fifthWord) {
      navigate("/");
    }
  }, []);
  function checkFifthWord() {
    if (check) navigate("/wallet");
  }
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#010006db",
        color: "white",
        overflowY: "scroll",
      }}
    >
      <div className="p-3 text-center">
        <h6 className="pt-4">Verify Keywords</h6>
        <small>Please Select the 5th keyword!</small>
      </div>
      <Form
        className="p-3"
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          marginLeft: "25px",
        }}
      >
        <FormGroup check>
          <Input
            name="radio1"
            type="radio"
            onClick={(event) => {
              if (event.target.checked == true) setCheck(false);
            }}
          />{" "}
          <Label check>Red</Label>
        </FormGroup>
        <FormGroup check>
          <Input
            name="radio1"
            type="radio"
            onClick={(event) => {
              if (event.target.checked == true) setCheck(true);
            }}
          />{" "}
          <Label check>{fifthWord}</Label>
        </FormGroup>
        <FormGroup check>
          <Input
            name="radio1"
            type="radio"
            onClick={(event) => {
              if (event.target.checked == true) setCheck(false);
            }}
          />{" "}
          <Label check>Fruit</Label>
        </FormGroup>
        <FormGroup check>
          <Input
            name="radio1"
            type="radio"
            onClick={(event) => {
              if (event.target.checked == true) setCheck(false);
            }}
          />{" "}
          <Label check>Lion</Label>
        </FormGroup>
      </Form>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "15px",
        }}
      >
        <Link
          to="/first-keyword"
          style={{ fontSize: "25px", textDecoration: "none" }}
        >
          &#8592;
        </Link>
        <a
          onClick={checkFifthWord}
          style={{ fontSize: "25px", textDecoration: "none", color: "#0d6efd" }}
        >
          &#8594;
        </a>
      </div>
    </div>
  );
}

export default CheckSecondKeyword;
