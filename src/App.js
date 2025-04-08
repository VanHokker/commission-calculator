// Complete CommissionCalculator with full input form and logic
import { useState } from "react";

export default function CommissionCalculator() {
  const [location, setLocation] = useState("");
  const [contractPrice, setContractPrice] = useState(0);
  const [commissionInput, setCommissionInput] = useState("3%");
  const [leadSource, setLeadSource] = useState("SOI");
  const [customReferralFee, setCustomReferralFee] = useState(0);
  const [yearsWithCompany, setYearsWithCompany] = useState(1);
  const [hasCapped, setHasCapped] = useState(true);
  const [kwCapRemaining, setKwCapRemaining] = useState(5000);
  const [kwRoyaltyRemaining, setKwRoyaltyRemaining] = useState(3000);
  const [result, setResult] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [showTaxPlan, setShowTaxPlan] = useState(false);
  const [includeTaxPlanning, setIncludeTaxPlanning] = useState(false);
  const [isExcludedSOI, setIsExcludedSOI] = useState(false);
  const [withinTwoYearsZillow, setWithinTwoYearsZillow] = useState(true);
  const [firstOrSecondZillowTransaction, setFirstOrSecondZillowTransaction] = useState(true);

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
    1: 0.5,
    2: 0.6,
    3: 0.6,
    4: 0.65,
    5: 0.65,
    6: 0.7,
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
    if (!contractPrice || contractPrice <= 0) {
      alert("Please enter a valid contract price.");
      return;
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
    if (leadSource === "SOI" || (leadSource === "Zillow.com" && !(withinTwoYearsZillow && firstOrSecondZillowTransaction))) {
      agentSplit = isExcludedSOI ? 0.85 : soiSplits[Math.min(yearsWithCompany, 6)];
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
        <h1 className="text-4xl font-extrabold text-blue-900 text-center">Commission Calculator</h1>
        <p className="text-center text-gray-500">Estimate your take-home pay from any deal. Numbers are for reference only.</p>
  
        <div className="grid md:grid-cols-2 gap-8">
          {/* Column 1 */}
          <div className="space-y-6">
            {/* Office Location */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Office Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                <option value="">Choose Office</option>
                {["Charleston", "Columbia", "Charlotte", "Greenville", "Savannah", "Jacksonville", "Atlanta"].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
  
            {/* Contract Price */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Contract Price</label>
              <input
                type="text"
                value={priceInput}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                className="w-full p-3 border rounded-xl shadow-sm"
                placeholder="$0.00"
              />
            </div>
  
            {/* Commission Input */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Commission (Percent or Flat Fee)</label>
              <input
                type="text"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                onBlur={formatCommissionInput}
                className="w-full p-3 border rounded-xl shadow-sm"
                placeholder="3% or $9000"
              />
            </div>
  
            {/* Lead Source */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Lead Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                {Object.keys(referralFees).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
  
            {/* SOI / Zillow / Other fields */}
            {leadSource === "SOI" && (
              <div className="text-sm text-blue-900 font-medium">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isExcludedSOI}
                    onChange={(e) => setIsExcludedSOI(e.target.checked)}
                    className="mr-2"
                  />
                  Is this lead on your Exclusion List?
                </label>
              </div>
            )}
  
            {leadSource === "Zillow.com" && (
              <>
                <div className="text-sm text-blue-900 font-medium">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={withinTwoYearsZillow}
                      onChange={(e) => setWithinTwoYearsZillow(e.target.checked)}
                      className="mr-2"
                    />
                    Transaction within 2 years of claiming the lead?
                  </label>
                </div>
                <div className="text-sm text-blue-900 font-medium">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={firstOrSecondZillowTransaction}
                      onChange={(e) => setFirstOrSecondZillowTransaction(e.target.checked)}
                      className="mr-2"
                    />
                    First or second transaction with this lead?
                  </label>
                </div>
              </>
            )}
  
            {leadSource === "Other" && (
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Custom Referral Fee %</label>
                <input
                  type="number"
                  value={customReferralFee}
                  onChange={(e) => setCustomReferralFee(Number(e.target.value))}
                  className="w-full p-3 border rounded-xl shadow-sm"
                />
              </div>
            )}
          </div>
  
          {/* Column 2 */}
          <div className="space-y-6">
            {/* Years with company */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Years with Chucktown Homes</label>
              <select
                value={yearsWithCompany}
                onChange={(e) => setYearsWithCompany(Number(e.target.value))}
                className="w-full p-3 border rounded-xl shadow-sm"
              >
                {[1, 2, 3, 4, 5].map((yr) => (
                  <option key={yr} value={yr}>{yr} year{yr > 1 ? "s" : ""}</option>
                ))}
                <option value={6}>5+ years</option>
              </select>
            </div>
  
            {/* KW Cap Status */}
            <div className="text-sm text-blue-900 font-medium">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={hasCapped}
                  onChange={(e) => setHasCapped(e.target.checked)}
                  className="mr-2"
                />
                Have you capped with KW this year?
              </label>
            </div>
  
            {!hasCapped && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">KW Cap Remaining</label>
                  <input
                    type="number"
                    value={kwCapRemaining}
                    onChange={(e) => setKwCapRemaining(Number(e.target.value))}
                    className="w-full p-3 border rounded-xl shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">KW Royalty Remaining</label>
                  <input
                    type="number"
                    value={kwRoyaltyRemaining}
                    onChange={(e) => setKwRoyaltyRemaining(Number(e.target.value))}
                    className="w-full p-3 border rounded-xl shadow-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>
  
        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-900 text-white text-lg font-semibold py-3 rounded-xl shadow-md hover:bg-blue-800 transition-all"
        >
          Calculate
        </button>
  
        {/* Results */}
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
  
            {showTaxPlan && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );} // end of function