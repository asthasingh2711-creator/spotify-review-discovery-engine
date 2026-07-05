let currentPage = 1;
let filteredTotal = 0;
let perPage = 50;
let pollTimer = null;

const els = {
  tableBody: document.getElementById("tableBody"),
  scrapedAt: document.getElementById("scrapedAt"),
  dateRange: document.getElementById("dateRange"),
  totalEntries: document.getElementById("totalEntries"),
  showingCount: document.getElementById("showingCount"),
  sourceChips: document.getElementById("sourceChips"),
  errorsBox: document.getElementById("errorsBox"),
  searchInput: document.getElementById("searchInput"),
  sourceFilter: document.getElementById("sourceFilter"),
  typeFilter: document.getElementById("typeFilter"),
  perPageSelect: document.getElementById("perPage"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  pageInfo: document.getElementById("pageInfo"),
  refreshBtn: document.getElementById("refreshBtn"),
  refreshStatus: document.getElementById("refreshStatus"),
};

function badgeClass(source) {
  const map = {
    Reddit: "badge-reddit",
    "App Store": "badge-appstore",
    "Play Store": "badge-playstore",
    "Spotify Community": "badge-community",
  };
  return map[source] || "";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatScrapedAt(iso) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-GB");
  } catch {
    return iso;
  }
}

function renderChips(sources) {
  els.sourceChips.innerHTML = Object.entries(sources || {})
    .map(([name, count]) => `<span class="chip">${name}<strong>${count}</strong></span>`)
    .join("");
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) {
    els.errorsBox.classList.add("hidden");
    els.errorsBox.innerHTML = "";
    return;
  }
  els.errorsBox.classList.remove("hidden");
  els.errorsBox.innerHTML = "<strong>Scraper warnings:</strong><br>" + errors.join("<br>");
}

function renderTable(entries) {
  if (!entries.length) {
    els.tableBody.innerHTML = '<tr><td colspan="8" class="empty">No entries found. Click "Refresh data" to scrape.</td></tr>';
    return;
  }
  els.tableBody.innerHTML = entries.map((e) => `
    <tr>
      <td class="col-date">${formatDate(e.date)}</td>
      <td class="col-source"><span class="badge ${badgeClass(e.source)}">${esc(e.source)}</span></td>
      <td>${esc(e.type)}</td>
      <td class="col-rating">${e.rating != null ? esc(String(e.rating)) + "★" : "—"}</td>
      <td class="col-title">${esc(e.title)}</td>
      <td class="col-text">${esc(e.text)}</td>
      <td class="col-author">${esc(e.author)}</td>
      <td class="col-link">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">Open</a>` : "—"}</td>
    </tr>
  `).join("");
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadData() {
  const params = new URLSearchParams({
    page: currentPage,
    per_page: perPage,
  });
  const q = els.searchInput.value.trim();
  const source = els.sourceFilter.value;
  const type = els.typeFilter.value;
  if (q) params.set("q", q);
  if (source) params.set("source", source);
  if (type) params.set("entry_type", type);

  els.tableBody.innerHTML = '<tr><td colspan="8" class="empty">Loading...</td></tr>';

  const resp = await fetch(`/api/data?${params}`);
  const data = await resp.json();

  els.scrapedAt.textContent = formatScrapedAt(data.scraped_at);
  els.dateRange.textContent = data.date_range
    ? `${data.date_range.start} → ${data.date_range.end}`
    : "—";
  els.totalEntries.textContent = data.total_entries ?? 0;
  filteredTotal = data.filtered_total ?? 0;

  const start = filteredTotal === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filteredTotal);
  els.showingCount.textContent = filteredTotal ? `${start}–${end} of ${filteredTotal}` : "0";

  renderChips(data.sources);
  renderErrors(data.errors);
  renderTable(data.entries);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / perPage));
  els.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  els.prevBtn.disabled = currentPage <= 1;
  els.nextBtn.disabled = currentPage >= totalPages;
}

async function startRefresh() {
  els.refreshBtn.disabled = true;
  els.refreshStatus.textContent = "Starting refresh...";
  els.refreshStatus.className = "status-pill running";

  const resp = await fetch("/api/refresh", { method: "POST" });
  const data = await resp.json();

  if (!resp.ok) {
    els.refreshStatus.textContent = data.message || "Refresh already running";
    els.refreshBtn.disabled = false;
    return;
  }

  pollRefreshStatus();
}

async function pollRefreshStatus() {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const resp = await fetch("/api/refresh/status");
    const status = await resp.json();
    els.refreshStatus.textContent = status.message || "Refreshing...";
    els.refreshStatus.className = "status-pill running";

    if (!status.running) {
      clearInterval(pollTimer);
      els.refreshBtn.disabled = false;
      els.refreshStatus.className = status.message.includes("failed")
        ? "status-pill error"
        : "status-pill done";
      els.refreshStatus.textContent = status.message;
      currentPage = 1;
      await loadData();
    }
  }, 2000);
}

els.refreshBtn.addEventListener("click", startRefresh);
els.prevBtn.addEventListener("click", () => { currentPage--; loadData(); });
els.nextBtn.addEventListener("click", () => { currentPage++; loadData(); });
els.sourceFilter.addEventListener("change", () => { currentPage = 1; loadData(); });
els.typeFilter.addEventListener("change", () => { currentPage = 1; loadData(); });
els.perPageSelect.addEventListener("change", () => {
  perPage = parseInt(els.perPageSelect.value, 10);
  currentPage = 1;
  loadData();
});

let searchDebounce;
els.searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => { currentPage = 1; loadData(); }, 350);
});

loadData();
