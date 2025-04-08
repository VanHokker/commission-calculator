import { useState } from "react";

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
  const [result, setResult] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [showTaxPlan, setShowTaxPlan] = useState(false);
  const [includeTaxPlanning, setIncludeTaxPlanning] = useState(false);
  const [isExcludedSOI, setIsExcludedSOI] = useState(false);
  const [withinTwoYearsZillow, setWithinTwoYearsZillow] = useState(true);
  const [firstOrSecondZillowTransaction, setFirstOrSecondZillowTransaction] = useState(true);
  const [within2Years, setWithin2Years] = useState(false);
  const [within18Months, setWithin18Months] = useState(false);
  const [isAgentReferred, setIsAgentReferred] = useState(false);
  const [isSellerLead, setIsSellerLead] = useState(false);
  const [isBuyerLead, setIsBuyerLead] = useState(false);
  const [withinUpnestSellerTime, setWithinUpnestSellerTime] = useState(false);
  const [withinUpnestBuyerTime, setWithinUpnestBuyerTime] = useState(false);

  const referralFees = {
    "SOI": 0,
    "Zillow.com": (price) => price < 150000 ? 0.3 : price <= 250000 ? 0.35 : 0.4,
    "OpCity": (price) => price > 150000 ? 0.35 : 0.3,
    "Movoto.com": (price) => within2Years ? 0.175 : 0,
    "Listing.com": 0,
    "EZHomesearch.com": 0,
    "EZ Referral": 0.25,
    "MarketVIP": 0.3,
    "OpenDoor (LWOD)": 0.35,
    "Personal Deal": 0,
    "Other": () => customReferralFee ? customReferralFee / 100 : 0,
    "Agent Pronto": () => within2Years ? 0.3 : 0,
    "Better Mortgage": 0.3,
    "Dave Ramsey": 0.3,
    "Estately": () => within18Months ? 0.3 : 0,
    "Fast Expert": 0.25,
    "Glenn Beck": 0.25,
    "Homelight": () => within2Years ? 0.25 : 0,
    "Ideal Agent": (price) => {
      if (parseFloat(commissionInput) > 2) alert("Commission must be 2% for Ideal Agent");
      if (price < 250000) return 0.25;
      if (price < 500000) return 0.3;
      return 0.35;
    },
    "My Agent Finder": (price) => price < 150000 ? 0.25 : 0.35,
    "Agentology": (price) => price < 150000 ? 0.25 : 0.35,
    "OpenDoor Agent Connect": () => 0.0125,
    "Redfin.com": () => within18Months ? 0.3 : 0,
    "Referral Exchange / Agent Machine": (price) => isAgentReferred ? 0.35 : price > 150000 ? 0.3 : 0.25,
    "Sold.com": 0,
    "Upnest.com": () => {
      if (isSellerLead && withinUpnestSellerTime) return 0.3;
      if (isBuyerLead && withinUpnestBuyerTime) return 0.3;
      return 0;
    }
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
    if (!contractPrice || contractPrice <= 0) {
      alert("Please enter a valid contract price.");
      return;
    }

    let referralFeeRate;
    const referralLogic = referralFees[leadSource];
    if (typeof referralLogic === "function") {
      referralFeeRate = referralLogic(contractPrice);
    } else {
      referralFeeRate = referralLogic || 0;
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
        <h1 className="text-4xl font-extrabold text-blue-900 text-center">Commission Calculator</h1>
        <p className="text-center text-gray-500">Estimate your take-home pay from any deal. Numbers are for reference only.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Office */}
            <div>
              <label className="block font-medium text-blue-900 mb-1">Office Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-3 border rounded-xl shadow-sm">
                <option value="">Choose Office</option>
                {["Charleston", "Columbia", "Charlotte", "Greenville", "Savannah", "Jacksonville", "Atlanta"].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Contract Price */}
            <div>
              <label className="block font-medium text-blue-900 mb-1">Contract Price</label>
              <input
                type="text"
                value={priceInput}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                className="w-full p-3 border rounded-xl shadow-sm"
                placeholder="$0.00"
              />
            </div>

            {/* Commission */}
            <div>
              <label className="block font-medium text-blue-900 mb-1">Commission (Percent or Flat Fee)</label>
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
              <label className="block font-medium text-blue-900 mb-1">Lead Source</label>
              <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} className="w-full p-3 border rounded-xl shadow-sm">
                <option value="">Choose Lead Source</option>
                {Object.keys(referralFees).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            {/* SOI Exclusion */}
            {leadSource === "SOI" && yearsWithCompany === "1" && (
              <label className="inline-flex items-center text-blue-900 font-medium text-sm">
                <input type="checkbox" className="mr-2" checked={isExcludedSOI} onChange={(e) => setIsExcludedSOI(e.target.checked)} />
                Is this lead on your Exclusion List?
              </label>
            )}

            {/* Zillow Flags */}
            {leadSource === "Zillow.com" && (
              <>
                <label className="inline-flex items-center text-blue-900 font-medium text-sm">
                  <input type="checkbox" className="mr-2" checked={withinTwoYearsZillow} onChange={(e) => setWithinTwoYearsZillow(e.target.checked)} />
                  Within 2 years of claiming lead?
                </label>
                <label className="inline-flex items-center text-blue-900 font-medium text-sm">
                  <input type="checkbox" className="mr-2" checked={firstOrSecondZillowTransaction} onChange={(e) => setFirstOrSecondZillowTransaction(e.target.checked)} />
                  First or second transaction?
                </label>
              </>
            )}

            {/* Other Referral Fee */}
            {leadSource === "Other" && (
              <div>
                <label className="block font-medium text-blue-900 mb-1">Custom Referral Fee %</label>
                <input
                  type="number"
                  value={customReferralFee}
                  onChange={(e) => setCustomReferralFee(Number(e.target.value))}
                  className="w-full p-3 border rounded-xl shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-blue-900 mb-1">How long have you been with Chucktown Homes?</label>
              <select value={yearsWithCompany} onChange={(e) => setYearsWithCompany(e.target.value)} className="w-full p-3 border rounded-xl shadow-sm">
                <option value="">Select tenure</option>
                <option value="1">This is my 1st year</option>
                <option value="2">This is my 2nd year</option>
                <option value="3">This is my 3rd year</option>
                <option value="4">This is my 4th year</option>
                <option value="5">This is my 5th year</option>
                <option value="6">I have been with CTH for more than 5 years</option>
              </select>
            </div>

            {/* KW Cap Toggle */}
            <div>
              <label className="block font-medium text-blue-900 mb-1">Have you capped with KW this year?</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="cap" value="yes" checked={hasCapped === true} onChange={() => setHasCapped(true)} className="mr-2" />
                  Yes
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="cap" value="no" checked={hasCapped === false} onChange={() => setHasCapped(false)} className="mr-2" />
                  No
                </label>
              </div>
            </div>

            {!hasCapped && hasCapped !== null && (
              <>
                <div>
                  <label className="block font-medium text-blue-900 mb-1">KW Cap Remaining</label>
                  <input type="number" value={kwCapRemaining} onChange={(e) => setKwCapRemaining(Number(e.target.value))} className="w-full p-3 border rounded-xl shadow-sm" />
                </div>
                <div>
                  <label className="block font-medium text-blue-900 mb-1">KW Royalty Remaining</label>
                  <input type="number" value={kwRoyaltyRemaining} onChange={(e) => setKwRoyaltyRemaining(Number(e.target.value))} className="w-full p-3 border rounded-xl shadow-sm" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full bg-blue-900 text-white font-semibold text-lg py-3 rounded-xl hover:bg-blue-800 transition-all"
        >
          Calculate
        </button>

        {/* Show result */}
        {result && (
          <div className="bg-gray-100 border border-blue-200 p-6 rounded-2xl shadow-inner mt-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Commission Summary</h2>
            <p><strong>Total Commission:</strong> {currencyFormatter.format(result.totalCommission)}</p>
            <p><strong>Referral Fee (%):</strong> {(result.referralFeeRate * 100).toFixed(1)}%</p>
            <p><strong>After Referral:</strong> {currencyFormatter.format(result.afterReferral)}</p>
            <p><strong>Team/Agent Split:</strong> {result.splitLabel}</p>
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
  );
}