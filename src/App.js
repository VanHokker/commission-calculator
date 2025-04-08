import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function CommissionCalculator() {
  const [location, setLocation] = useState("");
  const [contractPrice, setContractPrice] = useState(0);
  const [commissionInput, setCommissionInput] = useState("3%");
  const [leadSource, setLeadSource] = useState("");
  const [customReferralFee, setCustomReferralFee] = useState(0);
  const [yearsWithCompany, setYearsWithCompany] = useState("");
  const [hasCapped, setHasCapped] = useState(null);
  const [kwCapRemaining, setKwCapRemaining] = useState(5000);
  const [kwRoyaltyRemaining, setKwRoyaltyRemaining] = useState(3000);
  const [result, setResult] = useState({
    totalCommission: 0,
    referralFeeRate: 0,
    afterReferral: 0,
    agentGross: 0,
    kwCommission: 0,
    kwRoyalty: 0,
    netIncome: 0,
    splitLabel: "0/0",
  });
  const [priceInput, setPriceInput] = useState("");
  const [showTaxPlan, setShowTaxPlan] = useState(false);
  const [includeTaxPlanning, setIncludeTaxPlanning] = useState(false);
  const [isExcludedSOI, setIsExcludedSOI] = useState(false);
  const [withinTwoYearsZillow, setWithinTwoYearsZillow] = useState(true);
  const [firstOrSecondZillowTransaction, setFirstOrSecondZillowTransaction] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const contractPriceInputRef = useRef();
  const leadSourceSelectRef = useRef();
  const yearsSelectRef = useRef();
  const capRadioYesRef = useRef();
  const capRadioNoRef = useRef();

  const inputRefs = [
    contractPriceInputRef,
    leadSourceSelectRef,
    yearsSelectRef,
    capRadioYesRef,
  ];

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputRefs[index + 1];
      next?.current?.focus();
    }
  };

  const referralFees = {
    "SOI": 0,
    "Zillow.com": (price) => price < 150000 ? 0.3 : price <= 250000 ? 0.35 : 0.4,
    "OpCity": 0.25,
    "Movoto.com": 0.175,
    "Listing.com": 0,
    "EZHomesearch.com": 0,
    "EZ Referral": 0.25,
    "MarketVIP": 0.3,
    "OpenDoor (LWOD)": 0.35,
    "Other": () => customReferralFee ? customReferralFee / 100 : 0,
    "Personal Deal": 0,
  };

  const soiSplits = {
    "1": 0.5,
    "2": 0.6,
    "3": 0.6,
    "4": 0.65,
    "5": 0.65,
    "6": 0.7,
  };

  const parseCommission = () => {
    const value = commissionInput.trim();
    if (value.endsWith("%")) {
      return contractPrice * (parseFloat(value) / 100);
    } else {
      return parseFloat(value.replace(/[^\d.]/g, "")) || 0;
    }
  };

  const formatCommissionInput = () => {
    const value = commissionInput.trim();
    const num = parseFloat(value.replace(/[^\d.]/g, ""));
    if (!isNaN(num)) {
      if (value.includes("%") || num < 100) {
        setCommissionInput(num + "%");
      } else {
        setCommissionInput("$" + num.toLocaleString());
      }
    }
  };

  const handleCalculate = () => {
    const missing = [];
    if (!contractPrice || contractPrice <= 0) missing.push("Contract Price");
    if (!leadSource) missing.push("Lead Source");
    if (!yearsWithCompany) missing.push("Years with Company");
    if (hasCapped === null) missing.push("KW Cap Status");

    if (missing.length > 0) {
      setMissingFields(missing);
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 600);
      return;
    } else {
      setMissingFields([]);
    }

    let referralFeeRate;
    if (leadSource === "Zillow.com") {
      const qualifyForZillowFee = withinTwoYearsZillow && firstOrSecondZillowTransaction;
      referralFeeRate = qualifyForZillowFee ? referralFees["Zillow.com"](contractPrice) : referralFees["SOI"];
    } else {
      referralFeeRate = typeof referralFees[leadSource] === "function"
        ? referralFees[leadSource](contractPrice)
        : referralFees[leadSource];
    }

    const totalCommission = parseCommission();
    const afterReferral = totalCommission * (1 - referralFeeRate);

    let agentSplit = 0.5;
    if (leadSource === "SOI") {
      agentSplit = soiSplits[yearsWithCompany];
      if (yearsWithCompany === "1" && isExcludedSOI) {
        agentSplit = 0.85;
      }
    } else if (leadSource === "Personal Deal") {
      agentSplit = 1.0;
    }

    const splitLabel = `${Math.round(agentSplit * 100)}/${Math.round((1 - agentSplit) * 100)}`;

    const agentGross = afterReferral * agentSplit;
    const kwCommission = hasCapped ? 0 : Math.min(agentGross * 0.3, kwCapRemaining);
    const kwRoyalty = hasCapped ? 0 : Math.min(agentGross * 0.06, kwRoyaltyRemaining);
    const netIncome = agentGross - kwCommission - kwRoyalty;

    setResult({
      totalCommission,
      referralFeeRate,
      afterReferral,
      agentGross,
      kwCommission,
      kwRoyalty,
      netIncome,
      splitLabel,
    });
    setShowTaxPlan(true);
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    setContractPrice(Number(raw));
    setPriceInput(e.target.value);
  };

  const handlePriceBlur = () => {
    setPriceInput(
      isNaN(contractPrice)
        ? ""
        : currencyFormatter.format(contractPrice)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4">Deal Info</h2>
            <motion.div animate={shakeTrigger && missingFields.includes("Contract Price") ? { x: [0, -5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
              <label className="block font-medium text-blue-900 mb-1">Contract Price</label>
              <input
                ref={contractPriceInputRef}
                type="text"
                value={priceInput}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                onKeyDown={(e) => handleKeyDown(e, 0)}
                className={`w-full p-3 border rounded-xl shadow-sm ${missingFields.includes("Contract Price") ? "border-red-500" : ""}`}
                placeholder="$0.00"
              />
            </motion.div>

            <motion.div animate={shakeTrigger && missingFields.includes("Lead Source") ? { x: [0, -5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
              <label className="block font-medium text-blue-900 mb-1 mt-6">
                Lead Source <span title="Where the lead came from." className="cursor-help text-blue-600">ℹ️</span>
              </label>
              <select
                ref={leadSourceSelectRef}
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                className={`w-full p-3 border rounded-xl shadow-sm ${missingFields.includes("Lead Source") ? "border-red-500" : ""}`}
              >
                <option value="">Choose Lead Source</option>
                {Object.keys(referralFees).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </motion.div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4">Agent Info</h2>
            <motion.div animate={shakeTrigger && missingFields.includes("Years with Company") ? { x: [0, -5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
              <label className="block font-medium text-blue-900 mb-1">
                Years with Company <span title="Determines your SOI split if applicable." className="cursor-help text-blue-600">ℹ️</span>
              </label>
              <select
                ref={yearsSelectRef}
                value={yearsWithCompany}
                onChange={(e) => setYearsWithCompany(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 2)}
                className={`w-full p-3 border rounded-xl shadow-sm ${missingFields.includes("Years with Company") ? "border-red-500" : ""}`}
              >
                <option value="">Select tenure</option>
                <option value="1">This is my 1st year</option>
                <option value="2">This is my 2nd year</option>
                <option value="3">This is my 3rd year</option>
                <option value="4">This is my 4th year</option>
                <option value="5">This is my 5th year</option>
                <option value="6">More than 5 years</option>
              </select>
            </motion.div>

            <motion.div animate={shakeTrigger && missingFields.includes("KW Cap Status") ? { x: [0, -5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
              <label className="block font-medium text-blue-900 mb-1 mt-6">
                Capped with KW? <span title="Have you met your cap with Keller Williams this year?" className="cursor-help text-blue-600">ℹ️</span>
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input ref={capRadioYesRef} type="radio" name="cap" value="yes" checked={hasCapped === true} onChange={() => setHasCapped(true)} onKeyDown={(e) => handleKeyDown(e, 3)} className="mr-2" /> Yes
                </label>
                <label className="inline-flex items-center">
                  <input ref={capRadioNoRef} type="radio" name="cap" value="no" checked={hasCapped === false} onChange={() => setHasCapped(false)} className="mr-2" /> No
                </label>
              </div>
            </motion.div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-blue-900 text-white font-semibold text-lg py-3 rounded-xl hover:bg-blue-800 transition-all mt-6"
        >
          Calculate
        </button>

        {result && (
          <div className="bg-gray-100 border border-blue-200 p-6 rounded-2xl shadow-inner mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Commission Summary</h2>
            <p><strong>Total Commission:</strong> {currencyFormatter.format(result.totalCommission)}</p>
            <p><strong>Referral Fee (%):</strong> {(result.referralFeeRate * 100).toFixed(1)}%</p>
            <p><strong>After Referral:</strong> {currencyFormatter.format(result.afterReferral)}</p>
            <p><strong>Team/Agent Split:</strong> {result.splitLabel} (You: {Math.round(result.agentGross / result.afterReferral * 100)}%)</p>
            <p><strong>Agent Gross:</strong> {currencyFormatter.format(result.agentGross)}</p>
            <p><strong>KW Commission:</strong> {currencyFormatter.format(result.kwCommission)}</p>
            <p><strong>KW Royalty:</strong> {currencyFormatter.format(result.kwRoyalty)}</p>
            <p className="text-lg font-bold text-green-700 mt-4">Net Income: {currencyFormatter.format(result.netIncome)}</p>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                <input
                  type="checkbox"
                  checked={includeTaxPlanning}
                  onChange={(e) => setIncludeTaxPlanning(e.target.checked)}
                />
                Plan for income tax?
              </label>
              {includeTaxPlanning && (
                <p className="mt-2 text-blue-600 font-semibold">
                  Suggested Tax Set-Aside (20%): {currencyFormatter.format(result.netIncome * 0.2)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
