/**
 * SLtoLot — Forex Lot Size Calculator
 * Pure client-side, no dependencies.
 *
 * Core question: "What lot size makes X pips equal Y dollars?"
 * Formula: Lot Size = Risk Amount / (SL pips × Pip Value per Lot)
 */

// ── State ──────────────────────────────────────────────────────────────────
let riskType = 'percent'; // 'percent' | 'fixed'

// ── Toggle Risk Type ───────────────────────────────────────────────────────
function setRiskType(type) {
  riskType = type;
  document.getElementById('btnPercent').classList.toggle('active', type === 'percent');
  document.getElementById('btnFixed').classList.toggle('active', type === 'fixed');

  const label  = document.getElementById('riskLabel');
  const suffix = document.getElementById('riskSuffix');
  const input  = document.getElementById('riskValue');

  if (type === 'percent') {
    label.textContent   = 'Risk %';
    suffix.textContent  = '%';
    input.placeholder   = '1';
  } else {
    label.textContent   = 'Risk Amount';
    suffix.textContent  = document.getElementById('accountCurrency').value.trim().toUpperCase() || '$';
    input.placeholder   = '50';
  }
  calculate();
}

// ── getPipSize ─────────────────────────────────────────────────────────────
/**
 * Determines pip size based on pair symbol.
 * JPY pairs use 0.01; all others use 0.0001.
 * Detection: if the quote currency (last 3 chars) is JPY → 0.01
 */
function getPipSize(pair) {
  if (!pair || pair.length < 6) return null;
  // Remove any separator (e.g. EUR/USD → EURUSD)
  const clean = pair.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (clean.length < 6) return null;
  const quoteCurrency = clean.slice(-3); // last 3 chars = quote currency
  return quoteCurrency === 'JPY' ? 0.01 : 0.0001;
}

// ── parsePair ──────────────────────────────────────────────────────────────
/**
 * Returns { base, quote } from a pair string like "EURUSD" or "EUR/USD"
 */
function parsePair(pair) {
  const clean = pair.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (clean.length < 6) return null;
  return {
    base:  clean.slice(0, 3),
    quote: clean.slice(3, 6)
  };
}

// ── calculatePipValue ──────────────────────────────────────────────────────
/**
 * Calculates pip value PER LOT in the account currency.
 *
 * Base formula (quote currency):
 *   pipValueQuote = pipSize × contractSize
 *
 * Three cases:
 *   Case 1: accountCurrency === quote → no conversion needed
 *     pipValue = pipSize × contractSize
 *
 *   Case 2: accountCurrency === base → need conversion rate (quote/account)
 *     pipValue = pipSize × contractSize / conversionRate
 *     (conversionRate = 1 unit of account currency in quote currency)
 *
 *   Case 3: cross pair → need manual conversion rate (quote → account)
 *     pipValue = pipSize × contractSize × conversionRate
 *     (conversionRate = 1 unit of quote currency in account currency)
 *
 * Returns: { pipValue, needsConversion, conversionCase, hint }
 */
function calculatePipValue(pair, accountCurrency, contractSize, conversionRate) {
  const parsed = parsePair(pair);
  if (!parsed) return null;

  const { base, quote } = parsed;
  const acc   = accountCurrency.toUpperCase();
  const pip   = getPipSize(pair);
  const pipValueInQuote = pip * contractSize; // pip value in quote currency

  let pipValue        = null;
  let needsConversion = false;
  let conversionCase  = 0;
  let hint            = '';

  if (acc === quote) {
    // Case 1: account = quote currency → direct
    pipValue = pipValueInQuote;
    needsConversion = false;

  } else if (acc === base) {
    // Case 2: account = base currency
    // pipValue (in account) = pipValueInQuote / (quote/base rate)
    // User provides: 1 base = X quote  →  convRate = quote per base
    needsConversion = true;
    conversionCase  = 2;
    hint = `Your account currency (${acc}) is the BASE of ${base}${quote}.\n` +
           `Enter the rate: 1 ${acc} = ? ${quote}`;
    if (conversionRate && conversionRate > 0) {
      pipValue = pipValueInQuote / conversionRate;
    }

  } else {
    // Case 3: cross pair — account is neither base nor quote
    // pipValueInQuote → convert to account currency
    // User provides: 1 quote currency = X account currency
    needsConversion = true;
    conversionCase  = 3;
    hint = `${base}${quote} is a cross pair for a ${acc} account.\n` +
           `Enter the rate: 1 ${quote} = ? ${acc}`;
    if (conversionRate && conversionRate > 0) {
      pipValue = pipValueInQuote * conversionRate;
    }
  }

  return { pipValue, needsConversion, conversionCase, hint, pipSize: pip, base, quote };
}

// ── calculateLotSize ───────────────────────────────────────────────────────
/**
 * Lot Size = Risk Amount / (SL pips × Pip Value per Lot)
 */
function calculateLotSize(riskAmount, stopLossPips, pipValuePerLot) {
  if (!pipValuePerLot || !stopLossPips || stopLossPips <= 0 || pipValuePerLot <= 0) return null;
  return riskAmount / (stopLossPips * pipValuePerLot);
}

// ── getRiskAmount ──────────────────────────────────────────────────────────
function getRiskAmount(balance, riskVal, type) {
  if (type === 'percent') {
    return balance * (riskVal / 100);
  }
  return riskVal; // fixed dollar amount
}

// ── formatLotSize ──────────────────────────────────────────────────────────
/**
 * Returns standard/mini/micro classification and formatted string.
 */
function classifyLot(lotSize) {
  if (lotSize >= 1)       return { type: 'Standard',  display: lotSize.toFixed(2) };
  if (lotSize >= 0.1)     return { type: 'Mini',       display: lotSize.toFixed(2) };
  if (lotSize >= 0.01)    return { type: 'Micro',      display: lotSize.toFixed(2) };
  return                         { type: 'Nano',       display: lotSize.toFixed(4) };
}

// ── updateConversionUI ─────────────────────────────────────────────────────
function updateConversionUI(result) {
  const card = document.getElementById('conversionCard');
  const hint = document.getElementById('convHint');

  if (result && result.needsConversion) {
    card.style.display = 'block';
    hint.textContent   = result.hint;
  } else {
    card.style.display = 'none';
  }
}

// ── updateUI ───────────────────────────────────────────────────────────────
function updateUI(data) {
  const rc = document.getElementById('resultContent');

  if (!data || data.error) {
    rc.className = 'result-error';
    rc.innerHTML = data ? `⚠ ${data.error}` : '<span class="result-empty">Fill in the fields above to see your lot size</span>';
    return;
  }

  const lot    = classifyLot(data.lotSize);
  const units  = Math.round(data.lotSize * data.contractSize);
  const acc    = data.accountCurrency.toUpperCase();

  rc.className = '';
  rc.innerHTML = `
    <div class="result-grid">
      <div class="result-item">
        <div class="result-label">Lot Size</div>
        <div class="result-value big">${lot.display}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Lot Type</div>
        <div class="result-value">${lot.type}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Units</div>
        <div class="result-value">${units.toLocaleString()}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Pip Value / Lot</div>
        <div class="result-value">${data.pipValuePerLot.toFixed(4)} ${acc}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Pip Value (your size)</div>
        <div class="result-value">${(data.pipValuePerLot * data.lotSize).toFixed(4)} ${acc}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Risk Amount</div>
        <div class="result-value">${data.riskAmount.toFixed(2)} ${acc}</div>
      </div>
    </div>
    <div class="result-confirm">
      <strong>${data.stopLoss} pips</strong>
      &times;
      <strong>${(data.pipValuePerLot * data.lotSize).toFixed(4)} ${acc}/pip</strong>
      =
      <strong>${data.riskAmount.toFixed(2)} ${acc} risk</strong>
      &nbsp;&mdash;&nbsp;
      <strong>${lot.display} lots</strong> (${units.toLocaleString()} units)
    </div>
  `;
}

// ── calculate (main) ───────────────────────────────────────────────────────
function calculate() {
  const balance       = parseFloat(document.getElementById('balance').value);
  const accCurrency   = document.getElementById('accountCurrency').value.trim();
  const riskVal       = parseFloat(document.getElementById('riskValue').value);
  const pair          = document.getElementById('pair').value.trim();
  const stopLoss      = parseFloat(document.getElementById('stopLoss').value);
  const contractSize  = parseFloat(document.getElementById('contractSize').value) || 100000;
  const convRate      = parseFloat(document.getElementById('convRate').value) || 0;

  // Basic validation
  if (!balance || balance <= 0)      return updateUI(null);
  if (!accCurrency || accCurrency.length !== 3) return updateUI(null);
  if (!riskVal  || riskVal <= 0)     return updateUI(null);
  if (!pair     || pair.replace(/[^A-Za-z]/g, '').length < 6) return updateUI(null);
  if (!stopLoss || stopLoss <= 0)    return updateUI(null);

  // Pip size validation
  const pipSize = getPipSize(pair);
  if (!pipSize) return updateUI({ error: 'Could not determine pip size. Check the currency pair.' });

  // Calculate pip value info
  const pvInfo = calculatePipValue(pair, accCurrency, contractSize, convRate);
  if (!pvInfo) return updateUI({ error: 'Invalid currency pair format.' });

  // Update conversion rate UI
  updateConversionUI(pvInfo);

  // If conversion required but not yet provided
  if (pvInfo.needsConversion && (!convRate || convRate <= 0)) {
    updateUI({ error: 'Please enter the conversion rate shown above.' });
    return;
  }

  if (!pvInfo.pipValue || pvInfo.pipValue <= 0) {
    return updateUI({ error: 'Could not calculate pip value. Check your inputs.' });
  }

  // Risk amount
  const riskAmount = getRiskAmount(balance, riskVal, riskType);
  if (!riskAmount || riskAmount <= 0) return updateUI({ error: 'Risk amount is zero or invalid.' });
  if (riskAmount > balance)           return updateUI({ error: 'Risk amount exceeds account balance.' });

  // Lot size
  const lotSize = calculateLotSize(riskAmount, stopLoss, pvInfo.pipValue);
  if (!lotSize || lotSize <= 0) return updateUI({ error: 'Could not calculate lot size. Check your inputs.' });

  updateUI({
    lotSize,
    riskAmount,
    stopLoss,
    pipValuePerLot: pvInfo.pipValue,
    contractSize,
    accountCurrency: accCurrency
  });
}

// ── Event Listeners ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const inputs = ['balance', 'accountCurrency', 'riskValue', 'pair', 'stopLoss', 'contractSize', 'convRate'];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', calculate);
  });

  // Update suffix on account currency change
  document.getElementById('accountCurrency').addEventListener('input', () => {
    const acc = document.getElementById('accountCurrency').value.trim().toUpperCase();
    document.getElementById('riskSuffix').textContent = riskType === 'fixed' ? (acc || '$') : '%';
  });
});
