
// ==========================================
// UMKM FINTRACK - JAVASCRIPT
// ==========================================

const STORAGE_KEY = "umkm_fintrack_data_v1";

const rupiah = value => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value || 0);

const today = () => new Date().toISOString().slice(0, 10);

function dateAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// DATA SIMULASI AWAL
function getDefaultData() {
  return {
    transactions: [
      {id:1, type:"income", description:"Penjualan Makaroni", category:"Penjualan", amount:450000, payment:"QRIS", date:dateAgo(0)},
      {id:2, type:"expense", description:"Pembelian Bahan Baku", category:"Bahan Baku", amount:150000, payment:"Transfer", date:dateAgo(0)},
      {id:3, type:"income", description:"Penjualan Produk", category:"Penjualan", amount:320000, payment:"Tunai", date:dateAgo(1)},
      {id:4, type:"expense", description:"Biaya Operasional", category:"Operasional", amount:100000, payment:"Transfer", date:dateAgo(2)},
      {id:5, type:"income", description:"Pesanan Pelanggan", category:"Penjualan", amount:520000, payment:"QRIS", date:dateAgo(2)},
      {id:6, type:"income", description:"Penjualan Online", category:"Penjualan", amount:280000, payment:"E-Wallet", date:dateAgo(3)},
      {id:7, type:"expense", description:"Pembelian Kemasan", category:"Bahan Baku", amount:85000, payment:"Tunai", date:dateAgo(3)},
      {id:8, type:"income", description:"Penjualan Produk", category:"Penjualan", amount:400000, payment:"QRIS", date:dateAgo(4)},
      {id:9, type:"expense", description:"Biaya Transportasi", category:"Transportasi", amount:65000, payment:"Tunai", date:dateAgo(5)},
      {id:10, type:"income", description:"Penjualan Harian", category:"Penjualan", amount:350000, payment:"Transfer", date:dateAgo(6)}
    ],
    products: [
      {id:1,name:"Makaroni Pedas",category:"Makanan",price:15000,stock:35},
      {id:2,name:"Keripik Singkong",category:"Makanan",price:12000,stock:20},
      {id:3,name:"Basreng Pedas",category:"Makanan",price:10000,stock:8},
      {id:4,name:"Minuman Cokelat",category:"Minuman",price:8000,stock:15},
      {id:5,name:"Makaroni Keju",category:"Makanan",price:18000,stock:5}
    ]
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : getDefaultData();
  } catch {
    return getDefaultData();
  }
}

let data = loadData();
// Menyiapkan penyimpanan riwayat analisis
data.analyses = data.analyses || [];

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ==========================================
// NAVIGASI HALAMAN
// ==========================================

const pageTitles = {
  dashboard:"Dashboard Overview",
  transactions:"Manajemen Transaksi",
  products:"Produk & Persediaan",
  calculator:"Kalkulator HPP & BEP",
  comparison: "Perbandingan Produk",
  reports:"Laporan Keuangan",
  advisor:"Smart Financial Advisor",
  education:"Edukasi Keuangan"
};

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const target = document.getElementById(page);
  if (target) {
    target.classList.add("active");
    document.getElementById("pageTitle").textContent = pageTitles[page];
    document.getElementById("crumb").textContent = pageTitles[page];
  }

  document.getElementById("sidebar").classList.remove("open");
  renderAll();
}

document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ==========================================
// MODAL TRANSAKSI
// ==========================================

function openModal() {
  document.getElementById("transactionModal").classList.add("show");
  document.getElementById("date").value = today();
}

function closeModal() {
  document.getElementById("transactionModal").classList.remove("show");
}

document.getElementById("transactionModal").addEventListener("click", e => {
  if (e.target.id === "transactionModal") closeModal();
});

document.getElementById("transactionForm").addEventListener("submit", e => {
  e.preventDefault();

  
const type = document.getElementById("type").value;
const selectedProductId = document.getElementById("saleProduct").value;
const selectedProduct = data.products.find(
  p => String(p.id) === selectedProductId
);

const quantity = Number(document.getElementById("saleQuantity").value) || 0;

const transaction = {
  id: Date.now(),
  type: type,
  description: document.getElementById("description").value.trim(),
  category: document.getElementById("category").value,
  amount: Number(document.getElementById("amount").value),
  payment: document.getElementById("payment").value,
  date: document.getElementById("date").value,

  productId: type === "income" && selectedProduct ? selectedProduct.id : null,
  product: type === "income" && selectedProduct ? selectedProduct.name : "",
  quantity: type === "income" && selectedProduct ? quantity : 0
};


  if (!transaction.description || transaction.amount <= 0 || !transaction.date) {
    alert("Mohon lengkapi data transaksi dengan benar.");
    return;
  }

  data.transactions.push(transaction);
  saveData();
  e.target.reset();
  closeModal();
  renderAll();
  alert("Transaksi berhasil disimpan!");
});

// ==========================================
// PERHITUNGAN KEUANGAN
// ==========================================

function getTotals() {
  const income = data.transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = data.transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    income,
    expense,
    profit: income - expense,
    count: data.transactions.length
  };
}

function getHealthScore() {
  const t = getTotals();

  if (t.income === 0 && t.expense === 0) {
    return {score:0,cash:0,profit:0,status:"Belum ada data"};
  }

  const cash = t.income > 0
    ? Math.max(0, Math.min(100, (t.profit / t.income) * 100 + 50))
    : 0;

  const profitability = t.income > 0
    ? Math.max(0, Math.min(100, (t.profit / t.income) * 100))
    : 0;

  const score = Math.round(cash * 0.4 + profitability * 0.6);

  let status = "Perlu Perhatian";
  if (score >= 75) status = "Sangat Sehat";
  else if (score >= 50) status = "Cukup Sehat";
  else if (score >= 30) status = "Kurang Sehat";

  return {
    score,
    cash:Math.round(cash),
    profit:Math.round(profitability),
    status
  };
}

// ==========================================
// DASHBOARD UTAMA
// ==========================================

function renderDashboard() {
  const t = getTotals();
  const h = getHealthScore();

  document.getElementById("totalOmzet").textContent = rupiah(t.income);
  document.getElementById("totalExpense").textContent = rupiah(t.expense);
  document.getElementById("totalProfit").textContent = rupiah(t.profit);
  document.getElementById("totalTransactions").textContent = t.count;

  document.getElementById("healthScore").textContent = h.score;
  document.getElementById("healthStatus").textContent = h.status;
  document.getElementById("healthDesc").textContent =
    "Skor berdasarkan data pemasukan dan pengeluaran yang dicatat.";

  document.getElementById("scoreCircle").style.background =
    `conic-gradient(#8da184 ${h.score * 3.6}deg, #edf0e9 0deg)`;

  document.getElementById("cashScore").textContent = h.cash + "%";
  document.getElementById("profitScore").textContent = h.profit + "%";
  document.getElementById("cashBar").style.width = h.cash + "%";
  document.getElementById("profitBar").style.width = h.profit + "%";

  renderChart();
  renderRecent();
  renderPaymentStats();
}


function renderChart() {
  const container = document.getElementById("financeChart");
  container.innerHTML = "";

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = dateAgo(i);
    const transactions = data.transactions.filter(t => t.date === date);

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    days.push({ date, income, expense });
  }
  const hasTransactions = days.some(
  d => d.income > 0 || d.expense > 0
);

if (!hasTransactions) {
  container.innerHTML = `
    <div class="chart-empty">
      <strong>Belum Ada Data Transaksi</strong>
      <small>Catat pemasukan atau pengeluaran untuk melihat grafik keuangan.</small>
    </div>
  `;
  return;
}

  const max = Math.max(1, ...days.flatMap(d => [d.income, d.expense]));

  days.forEach(d => {
    const day = new Date(d.date + "T12:00:00")
      .toLocaleDateString("id-ID", { weekday: "short" });

    const wrap = document.createElement("div");
    wrap.className = "chart-day";

    const bars = document.createElement("div");
    bars.className = "bars";

    function createChartBar(value, type, label) {
      const group = document.createElement("div");
      group.className = "chart-bar-group";

      const valueLabel = document.createElement("small");
      valueLabel.className = "chart-value";

      if (value >= 1000000) {
        valueLabel.textContent = (value / 1000000).toFixed(1) + "jt";
      } else if (value >= 1000) {
        valueLabel.textContent =
          (value / 1000).toFixed(1).replace(/\.0$/, "") + "rb";
      } else {
  valueLabel.textContent = value.toLocaleString("id-ID");
}

      const bar = document.createElement("div");
      bar.className = "bar " + type;
      bar.style.height = Math.max(2, value / max * 75) + "%";
      bar.title = label + ": " + rupiah(value);

      group.append(valueLabel, bar);

      return group;
    }

    const income = createChartBar(d.income, "income", "Pemasukan");
    const expense = createChartBar(d.expense, "expense", "Pengeluaran");

    bars.append(income, expense);

    const label = document.createElement("small");
    label.textContent = day;

    wrap.append(bars, label);
    container.appendChild(wrap);
  });
}


// ==========================================
// TABEL TRANSAKSI
// ==========================================

function renderRecent() {
  const body = document.getElementById("recentTransactions");

  const recent = [...data.transactions]
    .sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id)
    .slice(0,5);

  if (!recent.length) {
    body.innerHTML = `<tr><td colspan="4" class="empty">Belum ada transaksi.</td></tr>`;
    return;
  }

  body.innerHTML = recent.map(t => `
    <tr>
      <td>${escapeHTML(t.description)}</td>
      <td>${escapeHTML(t.category)}</td>
      <td>${formatDate(t.date)}</td>
      <td class="${t.type === "income" ? "amount-income" : "amount-expense"}">
        ${t.type === "income" ? "+" : "-"}${rupiah(t.amount)}
      </td>
    </tr>
  `).join("");
}

function renderTransactions() {
  const body = document.getElementById("allTransactions");
  const filter = document.getElementById("filterType").value;

  const list = [...data.transactions]
    .filter(t => filter === "all" || t.type === filter)
    .sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id);

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty">Belum ada transaksi.</td></tr>`;
  } else {
    body.innerHTML = list.map(t => `
      <tr>
        <td>${escapeHTML(t.description)}</td>
        <td>${escapeHTML(t.category)}</td>
        <td>${escapeHTML(t.payment)}</td>
        <td>${formatDate(t.date)}</td>
        <td><span class="type-badge ${t.type}">
          ${t.type === "income" ? "Pemasukan" : "Pengeluaran"}
        </span></td>
        <td class="${t.type === "income" ? "amount-income" : "amount-expense"}">
          ${rupiah(t.amount)}
        </td>
        <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Hapus</button></td>
      </tr>
    `).join("");
  }

  const totals = getTotals();
  document.getElementById("transIncome").textContent = rupiah(totals.income);
  document.getElementById("transExpense").textContent = rupiah(totals.expense);
  document.getElementById("transCount").textContent = totals.count;
}

function deleteTransaction(id) {
  if (!confirm("Hapus transaksi ini?")) return;

  data.transactions = data.transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
}

// ==========================================
// METODE PEMBAYARAN
// ==========================================

function renderPaymentStats() {
  const container = document.getElementById("paymentStats");
  const income = data.transactions.filter(t => t.type === "income");

  const total = income.reduce((s,t) => s + t.amount,0);

  const methods = ["QRIS","Transfer","Tunai","E-Wallet"];

  container.innerHTML = methods.map((method,i) => {
    const amount = income
      .filter(t => t.payment === method)
      .reduce((s,t) => s+t.amount,0);

    const percent = total > 0 ? amount/total*100 : 0;

    return `
      <div class="payment-item">
        <div class="payment-info">
          <span>${method}</span>
          <strong>${Math.round(percent)}% · ${rupiah(amount)}</strong>
        </div>
        <div class="payment-track">
          <div style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================
// MANAJEMEN PRODUK
// ==========================================

function renderProducts() {
  const body = document.getElementById("productTable");

  document.getElementById("productCount").textContent = data.products.length;

  document.getElementById("stockCount").textContent =
    data.products.reduce((s,p) => s + Number(p.stock),0);

  document.getElementById("lowStock").textContent =
    data.products.filter(p => p.stock <= 10).length;

  if (!data.products.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Belum ada produk.</td></tr>`;
    return;
  }

  body.innerHTML = data.products.map(p => `
    <tr>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>${rupiah(p.price)}</td>
      <td>${p.stock} unit</td>
      <td>
        <span class="type-badge ${p.stock <= 10 ? "expense" : "income"}">
          ${p.stock <= 10 ? "Stok Menipis" : "Tersedia"}
        </span>
      </td>
      <td>
        <button class="edit-btn" onclick="editProduct(${p.id})">Edit</button>
        <button class="delete-btn" onclick="deleteProduct(${p.id})">Hapus</button>
      </td>
    </tr>
  `).join("");
}


// ==========================================
// NOTIFIKASI STOK MENIPIS
// ==========================================

function renderStockNotifications() {
  const lowStockProducts = data.products.filter(p => Number(p.stock) <= 10);

  const notificationContainer = document.getElementById("stockNotifications");

  if (!notificationContainer) return;

  if (lowStockProducts.length === 0) {
    notificationContainer.innerHTML = `
      <p class="empty">Semua stok produk masih aman.</p>
    `;
    return;
  }

  notificationContainer.innerHTML = lowStockProducts.map(p => {
    const stock = Number(p.stock);
    const status = stock === 0 ? "Stok Habis" : "Stok Menipis";
    const recommendation = Math.max(0, 10 - stock);

    return `
      <div class="stock-alert-item">
        <div>
          <strong>${escapeHTML(p.name)}</strong>
          <p>Stok tersisa: ${stock} unit</p>
          <small>${status} — Perlu tambahan ${recommendation} unit untuk mencapai stok minimum.</small>
        </div>
        <span class="type-badge expense">${status}</span>
      </div>
    `;
  }).join("");
}

function addProduct() {
  const name = prompt("Masukkan nama produk:");
  if (!name || !name.trim()) return;

  const category = prompt("Kategori produk:", "Makanan");
  if (!category || !category.trim()) return;

  const price = Number(prompt("Harga jual produk:"));
  const stock = Number(prompt("Jumlah stok:"));

  if (!Number.isFinite(price) || !Number.isInteger(stock) ||
      price <= 0 || stock < 0) {
    alert("Harga harus lebih dari 0 dan stok harus bilangan bulat minimal 0.");
    return;
  }

  data.products.push({
    id:Date.now(),
    name:name.trim(),
    category:category.trim(),
    price,
    stock
  });

  saveData();
  renderAll();
}

function editProduct(id) {
  const p = data.products.find(x => x.id === id);
  if (!p) return;

  const name = prompt("Nama produk:",p.name);
  if (!name || !name.trim()) return;

  const price = Number(prompt("Harga jual:",p.price));
  const stock = Number(prompt("Jumlah stok:",p.stock));

  if (!Number.isFinite(price) || !Number.isInteger(stock) ||
      price <= 0 || stock < 0) {
    alert("Data harga atau stok tidak valid.");
    return;
  }

  p.name = name.trim();
  p.price = price;
  p.stock = stock;

  saveData();
  renderAll();
}

function deleteProduct(id) {
  if (!confirm("Hapus produk ini?")) return;
  data.products = data.products.filter(p => p.id !== id);
  saveData();
  renderAll();
}

// ==========================================
// LAPORAN KEUANGAN
// ==========================================

function renderReports() {
  const t = getTotals();

  document.getElementById("reportIncome").textContent = rupiah(t.income);
  document.getElementById("reportExpense").textContent = rupiah(t.expense);
  document.getElementById("reportProfit").textContent = rupiah(t.profit);

  const margin = t.income > 0 ? t.profit/t.income*100 : 0;

  document.getElementById("reportMargin").textContent =
    margin.toFixed(1) + "%";

  document.getElementById("reportSummary").innerHTML = `
    <div class="report-line"><span>Total Pemasukan</span><strong>${rupiah(t.income)}</strong></div>
    <div class="report-line"><span>Total Pengeluaran</span><strong>${rupiah(t.expense)}</strong></div>
    <div class="report-line"><span>Laba / Rugi Bersih</span><strong>${rupiah(t.profit)}</strong></div>
    <div class="report-line"><span>Jumlah Transaksi</span><strong>${t.count} transaksi</strong></div>
    <div class="report-line"><span>Margin Keuntungan</span><strong>${margin.toFixed(1)}%</strong></div>
  `;
}

function exportCSV() {
  const rows = [
    ["Tanggal","Deskripsi","Jenis","Kategori","Metode Pembayaran","Jumlah"],
    ...data.transactions.map(t => [
      t.date,t.description,t.type,t.category,t.payment,t.amount
    ])
  ];

  const csv = "\uFEFF" + rows.map(row =>
    row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "laporan-umkm-fintrack.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// SMART FINANCIAL ADVISOR
// ==========================================

function renderAdvisor() {
  const t = getTotals();
  const h = getHealthScore();

  document.getElementById("advisorScore").textContent = h.score + "/100";
  document.getElementById("advisorStatus").textContent = h.status;

  const recommendations = [];

  if (t.income === 0) {
    recommendations.push([
      "Mulai Catat Pemasukan",
      "Masukkan data penjualan agar sistem dapat menganalisis kondisi keuangan usaha."
    ]);
  }

  if (t.income > 0 && t.profit < 0) {
    recommendations.push([
      "Evaluasi Pengeluaran",
      "Pengeluaran lebih besar daripada pemasukan. Periksa biaya operasional dan bahan baku."
    ]);
  }

  if (t.income > 0 && t.profit >= 0) {
    recommendations.push([
      "Pertahankan Keuntungan",
      "Usaha memiliki hasil keuangan positif. Pertahankan pengendalian biaya dan evaluasi penjualan secara berkala."
    ]);
  }

  if (t.income > 0 && t.expense/t.income > 0.7) {
    recommendations.push([
      "Perhatikan Rasio Pengeluaran",
      "Pengeluaran sudah mencapai lebih dari 70% pemasukan. Evaluasi biaya dan efisiensi operasional."
    ]);
  }

  if (data.products.some(p => p.stock <= 10)) {
    recommendations.push([
      "Periksa Persediaan Produk",
      "Beberapa produk memiliki stok 10 unit atau kurang. Pertimbangkan pengadaan stok agar tidak kehabisan barang."
    ]);
  }

  if (t.income > 0 && t.profit/t.income >= 0.3) {
    recommendations.push([
      "Pertahankan Margin Keuntungan",
      "Margin keuntungan saat ini cukup baik berdasarkan catatan transaksi. Tetap perhatikan kualitas dan biaya produksi."
    ]);
  }

  recommendations.push([
    "Bangun Dana Cadangan",
    "Sisihkan sebagian keuntungan untuk menghadapi kebutuhan mendadak dan menjaga keberlanjutan usaha."
  ]);

  document.getElementById("recommendations").innerHTML =
    recommendations.map(r => `
      <div class="recommendation">
        <strong>✧ ${r[0]}</strong>
        <p>${r[1]}</p>
      </div>
    `).join("");
}

function calculateSimulation() {
  const price = Number(document.getElementById("simPrice").value);
  const cost = Number(document.getElementById("simCost").value);
  const units = Number(document.getElementById("simUnits").value);

  const result = document.getElementById("simulationResult");

  if (!Number.isFinite(price) || !Number.isFinite(cost) ||
      !Number.isInteger(units) || price < 0 || cost < 0 || units < 0) {
    result.textContent = "Mohon masukkan angka yang valid.";
    return;
  }

  const revenue = price * units;
  const capital = cost * units;
  const profit = revenue - capital;

  result.innerHTML = `
    <strong>Hasil Simulasi Bisnis</strong><br>
    Total omzet: ${rupiah(revenue)}<br>
    Total modal produk: ${rupiah(capital)}<br>
    <strong>Perkiraan laba: ${rupiah(profit)}</strong><br>
    ${profit >= 0 ? "Simulasi menghasilkan keuntungan." : "Simulasi menunjukkan kerugian."}
    <br><small>*Belum termasuk biaya operasional dan biaya lainnya.</small>
  `;
}

// ==========================================
// FUNGSI BANTUAN
// ==========================================

function formatDate(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("id-ID",{
    day:"2-digit",
    month:"short",
    year:"numeric"
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  })[char]);
}

function renderAll() {
  renderDashboard();
  renderTransactions();
  renderProducts();
  renderReports();
  renderAdvisor();
  renderCalculatorProducts();
  renderHPPHistory();
  renderProductComparison();
  renderSaleProducts();
  renderStockNotifications();
}

// ==========================================
// INISIALISASI WEBSITE
// ==========================================

document.getElementById("today").textContent =
  new Date().toLocaleDateString("id-ID",{
    weekday:"long",
    day:"numeric",
    month:"long",
    year:"numeric"
  });

document.getElementById("date").value = today();

// ==========================================
// KALKULATOR HPP DAN BEP
// ==========================================
// ==========================================
// INTEGRASI PRODUK DENGAN KALKULATOR
// ==========================================

function renderCalculatorProducts() {
  const select = document.getElementById("calcProductSelect");

  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">-- Pilih Produk --</option>
    ${data.products.map(p => `
      <option value="${p.id}">
        ${escapeHTML(p.name)}
      </option>
    `).join("")}
  `;

  if (data.products.some(p => String(p.id) === currentValue)) {
    select.value = currentValue;
  }
}

function selectCalculatorProduct() {
  const id = document.getElementById("calcProductSelect").value;

  const product = data.products.find(p => String(p.id) === id);

  if (!product) return;

  document.getElementById("calcProduct").value = product.name;
  document.getElementById("calcPrice").value = product.price;
}

// MENGISI PILIHAN PRODUK PADA FORM TRANSAKSI
function renderSaleProducts() {
  const select = document.getElementById("saleProduct");
  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = `
    <option value="">-- Pilih Produk --</option>
    ${data.products.map(p => `
      <option value="${p.id}">
        ${escapeHTML(p.name)}
      </option>
    `).join("")}
  `;

  if (data.products.some(p => String(p.id) === currentValue)) {
    select.value = currentValue;
  }
}


// ==========================================
// RIWAYAT ANALISIS HPP
// ==========================================

function renderHPPHistory() {
  const table = document.getElementById("hppHistoryTable");

  if (!table) return;

  if (!data.analyses || data.analyses.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Belum ada riwayat analisis.
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = [...data.analyses].reverse().map(item => `
    <tr>
      <td>${escapeHTML(item.name)}</td>
      <td>${rupiah(item.hpp)}</td>
      <td>${rupiah(item.price)}</td>
      <td class="amount-income">${rupiah(item.profit)}</td>
      <td>${item.margin.toFixed(1)}%</td>
      <td>
        <button class="delete-btn"
          onclick="deleteHPPHistory(${item.id})">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");
}

function deleteHPPHistory(id) {
  if (!confirm("Hapus riwayat analisis ini?")) return;

  data.analyses = data.analyses.filter(item => item.id !== id);

  saveData();
  renderHPPHistory();
}

// DASHBOARD PERBANDINGAN PRODUK

function renderProductComparison() {
  const analyses = data.analyses || [];
  
  const nameEl = document.getElementById("bestProductName");
  const profitEl = document.getElementById("bestProductProfit");
  const totalEl = document.getElementById("totalComparedProducts");
  const chartEl = document.getElementById("productComparisonChart");
  const tableEl = document.getElementById("productComparisonTable");
  const recommendationEl = document.getElementById("productRecommendation");

  if (!nameEl || !profitEl || !totalEl || !chartEl || !tableEl || !recommendationEl) return;

  // Menggabungkan analisis berdasarkan nama produk
  const grouped = {};

  analyses.forEach(item => {
    const key = item.name.trim().toLowerCase();

    if (!grouped[key]) {
      grouped[key] = {
        name: item.name,
        hpp: item.hpp,
        price: item.price,
        profit: item.profit,
        margin: item.margin,
        unitsSold: 0,
        totalProfit: 0
      };
    }

    // Menggunakan data transaksi untuk menghitung jumlah terjual
    const sold = (data.transactions || [])
      .filter(t =>
        String(t.product || "").trim().toLowerCase() === key &&
        (t.type === "sale" || t.type === "income")
      )
      .reduce((sum, t) => sum + Number(t.quantity || t.qty || 0), 0);

    grouped[key].unitsSold = sold;
    grouped[key].totalProfit = sold * grouped[key].profit;
  });

  const products = Object.values(grouped)
    .sort((a, b) => b.totalProfit - a.totalProfit);

  if (products.length === 0) {
    nameEl.textContent = "-";
    profitEl.textContent = "Rp 0";
    totalEl.textContent = "0";
    chartEl.innerHTML = '<p class="empty">Belum ada data perbandingan.</p>';
    tableEl.innerHTML = '<tr><td colspan="8" class="empty">Belum ada data perbandingan.</td></tr>';
    recommendationEl.textContent = "Silakan analisis produk terlebih dahulu.";
    return;
  }

  const best = products[0];

  nameEl.textContent = best.name;
  profitEl.textContent = rupiah(best.totalProfit);
  totalEl.textContent = products.length;

  // Grafik total keuntungan
  const maxProfit = Math.max(...products.map(p => p.totalProfit), 1);

  chartEl.innerHTML = products.map(item => {
    const width = Math.max(0, item.totalProfit / maxProfit * 100);

    return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:7px;">
          <strong>${escapeHTML(item.name)}</strong>
          <strong>${rupiah(item.totalProfit)}</strong>
        </div>
        <div style="height:12px;background:#e8ede3;border-radius:20px;overflow:hidden;">
          <div style="height:100%;width:${width}%;background:#65765d;border-radius:20px;"></div>
        </div>
      </div>
    `;
  }).join("");

  // Tabel perbandingan
  tableEl.innerHTML = products.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHTML(item.name)}</td>
      <td>${rupiah(item.hpp)}</td>
      <td>${rupiah(item.price)}</td>
      <td>${rupiah(item.profit)}</td>
      <td>${item.unitsSold}</td>
      <td class="amount-income">${rupiah(item.totalProfit)}</td>
      <td>${Number(item.margin).toFixed(1)}%</td>
    </tr>
  `).join("");

  // Rekomendasi
  recommendationEl.innerHTML = `
    <p>
      Produk dengan total keuntungan tertinggi adalah
      <strong>${escapeHTML(best.name)}</strong>,
      dengan total keuntungan sebesar
      <strong>${rupiah(best.totalProfit)}</strong>.
    </p>
    <p style="margin-top:10px;">
      Jumlah produk terjual: <strong>${best.unitsSold} unit</strong>.
      Laba per unit: <strong>${rupiah(best.profit)}</strong>.
    </p>
    <p style="margin-top:10px;">
      Produk ini dapat dipertimbangkan untuk diprioritaskan
      berdasarkan data penjualan dan hasil analisis HPP.
    </p>
  `;
}


function calculateHPP() {

  const name = document.getElementById("calcProduct").value.trim();
  const units = Number(document.getElementById("calcUnits").value);
  const material = Number(document.getElementById("calcMaterial").value);
  const labor = Number(document.getElementById("calcLabor").value);
  const overhead = Number(document.getElementById("calcOverhead").value);
  const fixed = Number(document.getElementById("calcFixed").value);
  const price = Number(document.getElementById("calcPrice").value);
  const variable = Number(document.getElementById("calcVariable").value);

  if (
    !name ||
    !Number.isInteger(units) || units <= 0 ||
    ![material,labor,overhead,fixed,price,variable].every(Number.isFinite) ||
    [material,labor,overhead,fixed,price,variable].some(v => v < 0) ||
    price <= 0
  ) {
    alert("Mohon isi seluruh data dengan benar. Jumlah produksi harus lebih dari 0.");
    return;
  }

  if (price <= variable) {
    alert("Harga jual harus lebih besar daripada biaya variabel per unit agar BEP dapat dihitung.");
    return;
  }

  // PERHITUNGAN HPP
  const totalCost = material + labor + overhead;
  const hpp = totalCost / units;

  // KEUNTUNGAN
  const profit = price - hpp;

  // PERHITUNGAN BEP
  const contribution = price - variable;
  const bepUnit = Math.ceil(fixed / contribution);
  const bepRupiah = bepUnit * price;

  // MARGIN KEUNTUNGAN
  const margin = (profit / price) * 100;

// SIMPAN HASIL ANALISIS
const analysis = {
  id: Date.now(),
  name: name,
  units: units,
  totalCost: totalCost,
  hpp: hpp,
  price: price,
  profit: profit,
  bepUnit: bepUnit,
  bepRupiah: bepRupiah,
  margin: margin,
  date: today()
};

data.analyses.push(analysis);

saveData();
renderHPPHistory();

  // MENAMPILKAN HASIL
  document.getElementById("resultTotalCost").textContent = rupiah(totalCost);

  document.getElementById("resultHPP").textContent = rupiah(hpp);

  document.getElementById("resultProfit").textContent = rupiah(profit);

  document.getElementById("resultBEP").textContent = bepUnit + " unit";

  document.getElementById("resultBEPRupiah").textContent = rupiah(bepRupiah);

  document.getElementById("resultMargin").textContent =
    margin.toFixed(1) + "%";

  // KESIMPULAN
  const conclusion = document.getElementById("hppConclusion");

  conclusion.innerHTML = `
    <strong>Analisis Produk: ${escapeHTML(name)}</strong><br><br>

    Total biaya produksi sebesar ${rupiah(totalCost)} 
    untuk menghasilkan ${units} unit produk.

    <br><br>
    HPP setiap produk adalah <strong>${rupiah(hpp)}</strong>.
    Dengan harga jual ${rupiah(price)}, keuntungan berdasarkan
    HPP adalah <strong>${rupiah(profit)}</strong> per unit.

    <br><br>
    Usaha perlu menjual minimal <strong>${bepUnit} unit</strong>
    atau mencapai omzet sebesar <strong>${rupiah(bepRupiah)}</strong>
    untuk mencapai titik impas berdasarkan biaya tetap dan biaya variabel
    yang dimasukkan.

    <br><br>
    <strong>
      ${profit > 0
        ? "Harga jual lebih tinggi daripada HPP."
        : "Perhatian: harga jual belum menutupi HPP."}
    </strong>
  `;

  document.getElementById("hppResult").style.display = "block";
  document.getElementById("hppResult").scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
}


renderAll();
