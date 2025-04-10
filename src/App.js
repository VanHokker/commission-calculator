import { useState, useRef } from "react";

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
  const [kwCapInput, setKwCapInput] = useState("$5,000");
  const [kwRoyaltyInput, setKwRoyaltyInput] = useState("$3,000");
  const [result, setResult] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [showTaxPlan, setShowTaxPlan] = useState(false);
  const [includeTaxPlanning, setIncludeTaxPlanning] = useState(false);
  const [isExcludedSOI, setIsExcludedSOI] = useState(false);
  const [withinTwoYearsZillow, setWithinTwoYearsZillow] = useState(true);
  const [firstOrSecondZillowTransaction, setFirstOrSecondZillowTransaction] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [usedBuyerCashRewards, setUsedBuyerCashRewards] = useState(false);
  const [isSellerLWOD, setIsSellerLWOD] = useState(false);
  const [isBuyerLWOD, setIsBuyerLWOD] = useState(false);

  const updateCapDefaults = (office) => {
    const capMap = {
      "Charleston": 5000,
      "Greenville": 5000,
      "Savannah": 5000,
      "Jacksonville": 5000,
      "Atlanta": 5000,
      "Columbia": 6600,
      "Charlotte": 8000,
    };
  
    const cap = capMap[office] ?? 5000;
    setKwCapRemaining(cap);
    setKwCapInput(currencyFormatter.format(cap));
  
    const royalty = 3000;
    setKwRoyaltyRemaining(royalty);
    setKwRoyaltyInput(currencyFormatter.format(royalty));
  };

  const inputRefs = useRef([]);
  inputRefs.current = [];

  const focusAndSelect = (input) => {
    if (input) {
      input.focus();
      input.select?.();
    }
  };

  const handleEnterKey = (e, index, callback) => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback?.();
      const nextInput = inputRefs.current[index + 1];
      focusAndSelect(nextInput);
    }
  };

  const referralFees = {
    "Zillow.com": (price, office) => {
      const groupOne = ["Columbia", "Greenville", "Savannah", "Jacksonville"];
    const groupTwo = ["Charleston", "Charlotte", "Atlanta"];

    if (groupOne.includes(office)) {
      if (price >= 300000) return 0.4;
      if (price >= 225000) return 0.35;
      if (price >= 150000) return 0.3;
      if (price >= 75000) return 0.25;
      return 0.15;
    }

    if (groupTwo.includes(office)) {
      if (price >= 400000) return 0.4;
      if (price >= 300000) return 0.35;
      if (price >= 200000) return 0.3;
      if (price >= 100000) return 0.25;
      return 0.15;
    }
  },

    "OpCity": (price, usedBuyerCashRewards) => {
    let baseRate = price <= 150000 ? 0.3 : 0.35;
    if (usedBuyerCashRewards) {
      baseRate += 0.03;
    }
    return baseRate;
  },

    "OpenDoor (LWOD)": (price, isSeller, grossCommission, isBuyer) => {
    if (isSeller) return price * 0.0125 / grossCommission; // Convert to a % of commission
    if (isBuyer) return 0.3;
    return 0; // Default fallback
  },
    "MarketVIP": 0.3,
    "Movoto.com": 0.175,
    "Listing.com": 0,
    "EZHomesearch.com": 0,
    "EZ Referral": 0.25,
    "Personal Deal": 0,
    "Immediate Family Member": 0.15,
    "SOI": 0,
    "Other": () => customReferralFee ? customReferralFee / 100 : 0,
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
    setValidationError("");
    let referralFeeRate = 0;

    if (!contractPrice || contractPrice <= 0) {
      setValidationError("Please enter a valid contract price.");
      return;
    }
    if (!commissionInput) {
      setValidationError("Please enter the commission value.");
      return;
    }
    if (!leadSource) {
      setValidationError("Please select a lead source.");
      return;
    }
    if (!yearsWithCompany) {
      setValidationError("Please select how long you have been with Chucktown Homes.");
      return;
    }
    if (hasCapped === null) {
      setValidationError("Please indicate if you have capped with KW for the year.");
      return;
    }
    if (leadSource === "Other" && (!customReferralFee || customReferralFee <= 0)) {
      setValidationError("Please enter a valid custom referral fee.");
      return;
    }
    if (leadSource === "OpenDoor (LWOD)" && !isSellerLWOD && !isBuyerLWOD) {
      setValidationError("Please specify if this is a Seller or Buyer lead for OpenDoor (LWOD).");
      return;
    }
    
    if (leadSource === "Zillow.com") {
      const qualifyForZillowFee = withinTwoYearsZillow && firstOrSecondZillowTransaction;
      referralFeeRate = qualifyForZillowFee
        ? referralFees["Zillow.com"](contractPrice, location)
        : referralFees["SOI"];
    } else {
      const totalCommission = parseCommission();

      referralFeeRate = typeof referralFees[leadSource] === "function"
        ? leadSource === "OpenDoor (LWOD)"
          ? referralFees[leadSource](contractPrice, isSellerLWOD, totalCommission, isBuyerLWOD)
          : referralFees[leadSource](contractPrice, usedBuyerCashRewards)
        : referralFees[leadSource];
    }

    const totalCommission = parseCommission();
    const afterReferral = totalCommission * (1 - referralFeeRate);
    const fmlsFee = location === "Atlanta" ? contractPrice * 0.0012 : 0;

    let agentSplit = 0.5;

    if (leadSource === "SOI") {
      agentSplit = soiSplits[yearsWithCompany];
      if (yearsWithCompany === "1" && isExcludedSOI) {
        agentSplit = 0.85;
      }
    } else if (leadSource === "Personal Deal") {
      agentSplit = 1.0;
    } else if (leadSource === "Immediate Family Member") {
      agentSplit = 0.85;
    }

    const splitLabel = `${Math.round(agentSplit * 100)}/${Math.round((1 - agentSplit) * 100)}`;
    const agentGross = afterReferral * agentSplit;
    const kwCommission = hasCapped ? 0 : Math.min(agentGross * 0.3, kwCapRemaining);
    const kwRoyalty = hasCapped ? 0 : Math.min(agentGross * 0.06, kwRoyaltyRemaining);
    const netIncome = agentGross - kwCommission - kwRoyalty - fmlsFee;

    setResult({
      totalCommission,
      referralFeeRate,
      afterReferral,
      agentGross,
      kwCommission,
      kwRoyalty,
      netIncome,
      splitLabel,
      fmlsFee,
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

  const handleKwCapChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    const value = Number(raw);
    setKwCapRemaining(value);
    setKwCapInput(currencyFormatter.format(value));
  };

  const handleKwRoyaltyChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    const value = Number(raw);
    setKwRoyaltyRemaining(value);
    setKwRoyaltyInput(currencyFormatter.format(value));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8 space-y-8">
        <h1 className="text-4xl font-extrabold text-blue-900 text-center">Commission Calculator</h1>
        <p className="text-center text-gray-500">The following calculation is simply an estimation. Please contact your Team Leader to confirm results.</p>

        {validationError && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3 text-sm">
            ⚠️ {validationError}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-blue-900 mb-1">Office Location</label>
              <select
                ref={(el) => (inputRefs.current[0] = el)}
                onKeyDown={(e) => handleEnterKey(e, 0)}
                value={location}
                onChange={(e) => {
                  const selected = e.target.value;
                  setLocation(selected);
                  updateCapDefaults(selected);
                }}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                <option value="">Choose Office</option>
                {["Charleston", "Columbia", "Charlotte", "Greenville", "Savannah", "Jacksonville", "Atlanta"].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-blue-900 mb-1">Contract Price</label>
              <input
                ref={(el) => (inputRefs.current[1] = el)}
                onKeyDown={(e) => handleEnterKey(e, 1)}
                type="text"
                value={priceInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.]/g, "");
                  setContractPrice(Number(raw));
                  setPriceInput(e.target.value);
                }}
                onBlur={() => setPriceInput(isNaN(contractPrice) ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(contractPrice))}
                className="w-full p-3 border rounded-xl shadow-sm"
                placeholder="$0.00"
              />
            </div>

            <div>
              <label className="block font-medium text-blue-900 mb-1">Commission as a % or a flat fee</label>
              <input
                ref={(el) => (inputRefs.current[2] = el)}
                onKeyDown={(e) => handleEnterKey(e, 2)}
                type="text"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                onBlur={() => {
                  const value = commissionInput.trim();
                  const num = parseFloat(value.replace(/[^\d.]/g, ""));
                  if (!isNaN(num)) {
                    if (value.includes("%") || num < 100) {
                      setCommissionInput(num + "%");
                    } else {
                      setCommissionInput("$" + num.toLocaleString());
                    }
                  }
                }}
                className="w-full p-3 border rounded-xl shadow-sm"
                placeholder="3% or $9000"
              />
            </div>

            <div>
              <label className="block font-medium text-blue-900 mb-1">Lead Source</label>
              <select
                ref={(el) => (inputRefs.current[3] = el)}
                onKeyDown={(e) => handleEnterKey(e, 3)}
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                <option value="">Choose Lead Source</option>
                {["Zillow.com", 
                "MarketVIP", 
                "OpCity", 
                "Movoto.com", 
                "OpenDoor (LWOD)",
                "Listing.com", 
                "EZHomesearch.com", 
                "EZ Referral",
                "Immediate Family Member", 
                "Personal Deal",
                "SOI",
                "Other"].map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>

            {leadSource === "Personal Deal" && (
             <div className="bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                ⚠️ You are allowed two free personal deals a year.
              </div>
            )}

            {leadSource === "Zillow.com" && (
             <div className="bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                ⚠️ A referral fee is due for the first two deals within two years of claiming the lead.
              </div>
            )}

            {leadSource === "OpCity" && (
             <div className="bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                ⚠️ A referral fee is due for any deal within two years of claiming the lead.
              </div>
            )}

            {leadSource === "OpCity" && (
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={usedBuyerCashRewards}
                    onChange={(e) => setUsedBuyerCashRewards(e.target.checked)}
                    className="accent-blue-600"
                  />
                  Is this a lead that utilized the Buyer Cash Rewards program?
                </label>
              </div>
            )}

            {leadSource === "Movoto.com" && (
             <div className="bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                ⚠️ A referral fee is due for any deal within two years of claiming the lead.
              </div>
            )}
            
            {leadSource === "Immediate Family Member" && (
              <div className="bg-yellow-100 text-yellow-800 text-sm border border-yellow-300 rounded-lg px-4 py-3 mt-2">
                ⚠️ You are allowed two deals at 85/15 involving immediate family members a year.
              </div>
            )}

          </div>
            {leadSource === "Other" && (
              <div>
                <label className="block font-medium text-blue-900 mb-1">Custom Referral Fee %</label>
                <input
                  ref={(el) => (inputRefs.current[4] = el)}
                  onKeyDown={(e) => handleEnterKey(e, 4)}
                  type="number"
                  value={customReferralFee}
                  onChange={(e) => setCustomReferralFee(Number(e.target.value))}
                  className="w-full p-3 border rounded-xl shadow-sm"
                />
              </div>
            )}

            {leadSource === "OpenDoor (LWOD)" && (
              <div className="mt-2 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={isSellerLWOD}
                    onChange={(e) => {
                      setIsSellerLWOD(e.target.checked);
                      if (e.target.checked) setIsBuyerLWOD(false);
                    }}
                    className="accent-blue-600"
                  />
                  Is this a Seller lead?
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={isBuyerLWOD}
                    onChange={(e) => {
                      setIsBuyerLWOD(e.target.checked);
                      if (e.target.checked) setIsSellerLWOD(false);
                    }}
                    className="accent-blue-600"
                  />
                  Is this a Buyer lead?
                </label>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-blue-900 mb-1">How long have you been with Chucktown Homes?</label>
              <select
                ref={(el) => (inputRefs.current[5] = el)}
                onKeyDown={(e) => handleEnterKey(e, 5)}
                value={yearsWithCompany}
                onChange={(e) => setYearsWithCompany(e.target.value)}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                <option value="">Select tenure</option>
                <option value="1">This is my 1st year</option>
                <option value="2">This is my 2nd year</option>
                <option value="3">This is my 3rd year</option>
                <option value="4">This is my 4th year</option>
                <option value="5">This is my 5th year</option>
                <option value="6">I have been with CTH for more than 5 years</option>
              </select>
            </div>
            {leadSource === "SOI" && yearsWithCompany === "1" && (
              <div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-900">
                  <input
                    type="checkbox"
                    checked={isExcludedSOI}
                    onChange={(e) => setIsExcludedSOI(e.target.checked)}
                    className="accent-blue-600"
                  />
                  Is this lead on your Exclusion List?
                </label>
              </div>
            )}
            <div>
              <label className="block font-medium text-blue-900 mb-1">Have you capped with KW this year?</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    ref={(el) => (inputRefs.current[6] = el)}
                    onKeyDown={(e) => handleEnterKey(e, 6)}
                    type="radio"
                    name="cap"
                    value="yes"
                    checked={hasCapped === true}
                    onChange={() => setHasCapped(true)}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="inline-flex items-center">
                  <input
                    ref={(el) => (inputRefs.current[7] = el)}
                    onKeyDown={(e) => handleEnterKey(e, 7)}
                    type="radio"
                    name="cap"
                    value="no"
                    checked={hasCapped === false}
                    onChange={() => setHasCapped(false)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {!hasCapped && hasCapped !== null && (
              <>
                <div>
                  <label className="block font-medium text-blue-900 mb-1">KW Cap Remaining</label>
                  <input
                    ref={(el) => (inputRefs.current[8] = el)}
                    onKeyDown={(e) => handleEnterKey(e, 8)}
                    type="text"
                    value={kwCapInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      const value = Number(raw);
                      setKwCapRemaining(value);
                      setKwCapInput(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value));
                    }}
                    className="w-full p-3 border rounded-xl shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-blue-900 mb-1">KW Royalty Remaining</label>
                  <input
                    ref={(el) => (inputRefs.current[9] = el)}
                    onKeyDown={(e) => handleEnterKey(e, 9)}
                    type="text"
                    value={kwRoyaltyInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      const value = Number(raw);
                      setKwRoyaltyRemaining(value);
                      setKwRoyaltyInput(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value));
                    }}
                    className="w-full p-3 border rounded-xl shadow-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleCalculate}
          ref={(el) => (inputRefs.current[10] = el)}
          className="w-full bg-blue-900 text-white font-semibold text-lg py-3 rounded-xl hover:bg-blue-800 transition-all"
        >
          Calculate
        </button>

        {result && (
          <div className="bg-gray-100 border border-blue-200 p-6 rounded-2xl shadow-inner mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Commission Summary</h2>
            <p><strong>Total Commission:</strong> {currencyFormatter.format(result.totalCommission)}</p>
            <p><strong>Referral Fee (%):</strong> {(result.referralFeeRate * 100).toFixed(1)}%</p>
            <p><strong>After Referral:</strong> {currencyFormatter.format(result.afterReferral)}</p>
            {location === "Atlanta" && (
              <p><strong>FMLS Fee (0.12%):</strong> {currencyFormatter.format(result.fmlsFee)}</p>
            )}
            <p><strong>Team/Agent Split:</strong> {result.splitLabel}</p>
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