import React, { createContext, useState } from "react";
import { Route, Routes } from "react-router-dom";
import ImportOrCreateWallet from "./components/ImportOrCreateWallet";
import CreateWallet from "./components/CreateWallet";
import ExistingWallet from "./components/ExistingWallet";
import ExternalWallet from "./components/ExternalWallet";
import CheckPass from "./components/CheckPass";
import Wallet from "./components/Wallet";
import SendMoney from "./components/SendMoney";
import ReceiveMoney from "./components/ReceiveMoney";
import Transactions from "./components/Transactions";
import Keywords from "./components/Keywords";
import CheckFirstKeyword from "./components/CheckFirstKeyword";
import CheckSecondKeyword from "./components/CheckSecondKeyword";
import Settings from "./components/Settings";
import About from "./components/About";
import WalletDetails from "./components/WalletDetails";
import WalletSingleDetails from "./components/WalletSingleDetails";
let Data = createContext();

const App = () => {
  const [phrase, setPhrase] = useState("");
  const [wordsArray, setWordsArray] = useState([]);
  const [pblKeyData, setPblKeyData] = useState("");
  const [pblAddressData, setPblAddressData] = useState("");
  const [xpubdata, setXpubData] = useState("");
  const [detailsData, setDetailsData] = useState("");
  return (
    <Data.Provider
      value={{
        phrase,
        wordsArray,
        pblKeyData,
        pblAddressData,
        xpubdata,
        detailsData,
      }}
    >
      <Routes>
        <Route path="/" element={<ImportOrCreateWallet />} />
        <Route
          path="/create-wallet"
          element={
            <CreateWallet
              dataOfCreateAddress={(words) => setWordsArray(words)}
              setPhrase={(passphrase) => setPhrase(passphrase)}
              pblKey={(pblKeyData) => setPblKeyData(pblKeyData)}
              pblAddress={(pblAddressData) => setPblAddressData(pblAddressData)}
              xpub={(xpub) => setXpubData(xpub)}
            />
          }
        />
        <Route path="/existing-wallet" element={<ExistingWallet />} />
        <Route path="/external-wallet" element={<ExternalWallet />} />
        <Route path="/check-pass" element={<CheckPass />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route
          path="/send-money"
          element={<SendMoney pblAdd={pblAddressData} />}
        />
        <Route path="/receive-money" element={<ReceiveMoney />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/keywords" element={<Keywords />} />
        <Route path="/first-keyword" element={<CheckFirstKeyword />} />
        <Route path="/second-keyword" element={<CheckSecondKeyword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/wallet-details"
          element={
            <WalletDetails
              setLocalStorageData={(data) => {
                if (typeof data == "string") setDetailsData(data);
                else setWordsArray(data);
              }}
            />
          }
        />
        <Route path="/details" element={<WalletSingleDetails />} />
      </Routes>
    </Data.Provider>
  );
};

export default App;
export { Data };
