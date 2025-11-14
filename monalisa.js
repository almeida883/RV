// monalisa.js — versão JS da estratégia Monalisa v1.7 sincronizada

export function monalisaStrategy(data) {
  const MA_WINDOW = 200;
  const RSI_PERIOD = 14;
  const closes = data.map(d => d.close);

  // --- Média móvel simples (MA200)
  const ma = [];
  for (let i = 0; i < closes.length; i++) {
    const start = Math.max(0, i - MA_WINDOW + 1);
    const slice = closes.slice(start, i + 1);
    ma.push(slice.reduce((a,b)=>a+b,0)/slice.length);
  }

  // --- RSI
  function computeRSI(values, period = 14) {
    let rsis = [];
    let gains = 0, losses = 0;

    for (let i = 1; i < values.length; i++) {
      const diff = values[i] - values[i-1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;

      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;

      const rs = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
      rsis.push(rs);
    }
    rsis.unshift(50);
    return rsis;
  }

  const rsi = computeRSI(closes, RSI_PERIOD);
  const aSOPR = rsi.map(v => 1 + (v - 50) / 50);   // mesmo cálculo que a estratégia usa
  const MVRV  = data.map((d,i) => d.close / ma[i]);

  // --- BUY/SELL logic
  const signals = [];
  let inPosition = false;

  for (let i = 1; i < data.length; i++) {
    const buyCond  = aSOPR[i] > 1 && MVRV[i] > 1; // ← mudar para i
    const sellCond = data[i].close < ma[i] && data[i - 1].close > ma[i - 1]; // inverter ordem lógica para coerência

    if (!inPosition && buyCond) {
      inPosition = true;
      signals.push({ time: data[i].time, type: "buy" });
    } else if (inPosition && sellCond) {
      inPosition = false;
      signals.push({ time: data[i].time, type: "sell" });
    }
  }

  return signals;
}

// ===================================================
// Indicadores usados na visualização (iguais à estratégia)
// ===================================================

// MVRV = close / MA200
export function computeMVRV(data) {
  const out = [];
  const closes = data.map(d => d.close);
  for (let i = 0; i < closes.length; i++) {
    const start = Math.max(0, i - 199);
    const slice = closes.slice(start, i + 1);
    const ma = slice.reduce((a,b)=>a+b,0) / slice.length;
    out.push({ time: data[i].time, value: closes[i] / ma });
  }
  return out;
}

// aSOPR = 1 + (RSI(14) - 50) / 50
export function computeASOPR(data) {
  const closes = data.map(d => d.close);
  const RSI_PERIOD = 14;
  function computeRSI(values, period = 14) {
    let rsis = [];
    let gains = 0, losses = 0;
    for (let i = 1; i < values.length; i++) {
      const diff = values[i] - values[i-1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
      rsis.push(rs);
    }
    rsis.unshift(50);
    return rsis;
  }
  const rsi = computeRSI(closes, RSI_PERIOD);
  const aSOPR = rsi.map(v => 1 + (v - 50) / 50);
  return data.map((d, i) => ({ time: d.time, value: aSOPR[i] }));
}
