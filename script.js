// ==================== Variables globales ====================
let todaysRecords = [];
let tomorrowsRecords = [];
let currentDataset = "today";
let currentRecords = [];
let currentPage = 1;
const itemsPerPage = 15;
let totalPages = 1;
let autoPageInterval = null;
let inactivityTimer = null;
let currentLang = "en"; // idioma por defecto

// ==================== Traducciones ====================
const translations = {
  en: {
    title_today: "Today’s pick-up airport transfers",
    title_tomorrow: "Tomorrow’s pick-up airport transfers",
    search_booking: "Search my booking number",
    find_adventure: "Find your next adventure",
    back: "← Back",
    find_transfer: "Find my transfer",
    placeholder_booking: "Enter your booking number",
    legend_text: "If you have any questions about your pickup transfer time, please reach out to your Royalton Excursion Rep at the hospitality desk. You can also contact us via chat on the NexusTours App or by calling +52 998 251 6559. We're here to assist you!",
    result_title: "We got you, here are your transfer details",
    error_text: "If you have any questions about your pickup transfer time, please reach out...",
    th_booking: "Booking No.",
    th_flight: "Flight No.",
    th_hotel: "Hotel",
    th_pickup: "Pick-Up time",
    page: "Page"
  },
  es: {
    title_today: "Traslados al aeropuerto de hoy",
    title_tomorrow: "Traslados al aeropuerto de mañana",
    search_booking: "Buscar mi número de reserva",
    find_adventure: "Encuentra tu próxima aventura",
    back: "← Volver",
    find_transfer: "Encuentra mi traslado",
    placeholder_booking: "Ingresa tu número de reserva",
    legend_text: "Si tienes alguna pregunta sobre tu horario de traslado, comunícate con tu representante de Royalton...",
    result_title: "Aquí tienes los detalles de tu traslado",
    error_text: "Si tienes alguna pregunta sobre tu traslado, comunícate con tu representante de Royalton...",
    th_booking: "N° de reserva",
    th_flight: "N° de vuelo",
    th_hotel: "Hotel",
    th_pickup: "Hora de recogida",
    page: "Página"
  },
  fr: {
    title_today: "Transferts aéroport d’aujourd’hui",
    title_tomorrow: "Transferts aéroport de demain",
    search_booking: "Rechercher mon numéro de réservation",
    find_adventure: "Trouvez votre prochaine aventure",
    back: "← Retour",
    find_transfer: "Trouver mon transfert",
    placeholder_booking: "Entrez votre numéro de réservation",
    legend_text: "Si vous avez des questions concernant votre transfert, contactez votre représentant Royalton...",
    result_title: "Voici vos détails de transfert",
    error_text: "Si vous avez des questions concernant votre transfert, contactez votre représentant Royalton...",
    th_booking: "N° de réservation",
    th_flight: "N° de vol",
    th_hotel: "Hôtel",
    th_pickup: "Heure de prise en charge",
    page: "Page"
  }
};

// ==================== Referencias DOM ====================
const homeContainer   = document.getElementById('home-container');
const searchContainer = document.getElementById('search-container');
const tableContainer  = document.getElementById('table-container');
const searchTransferBtn = document.getElementById('search-transfer-btn');
const adventureBtn    = document.getElementById('adventure-btn');
const backHomeBtn     = document.getElementById('back-home-btn');
const searchInput     = document.getElementById('search-input');
const searchButton    = document.getElementById('search-button');
const searchResult    = document.getElementById('search-result');
const searchLegend    = document.getElementById('search-legend');
const mainTitle       = document.getElementById('main-title');
const langButtons     = document.querySelectorAll('.lang-btn');

// ==================== Cargar JSON ====================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [todayResp, tomorrowResp] = await Promise.all([
      fetch('data.json'),
      fetch('data_2.json')
    ]);
    if (!todayResp.ok || !tomorrowResp.ok) throw new Error("Fetch error");

    todaysRecords    = (await todayResp.json()).templates?.content || [];
    tomorrowsRecords = (await tomorrowResp.json()).templates?.content || [];

    currentDataset = "today";
    currentRecords = todaysRecords;
    totalPages     = Math.max(1, Math.ceil(currentRecords.length / itemsPerPage));

    updateTexts();
    renderTable();
  } catch (err) {
    console.error("Error:", err);
    tableContainer.innerHTML = `<p style="color:red;text-align:center;">Error loading data.</p>`;
  }
});

// ==================== Cambio de idioma con botones ====================
langButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    langButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    updateTexts();
    renderTable();
  });
});

function updateTexts() {
  const t = translations[currentLang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t[el.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t[el.dataset.i18nPlaceholder];
  });
  updateTitle();
}

function updateTitle() {
  const t = translations[currentLang];
  mainTitle.innerText = currentDataset === "today" ? t.title_today : t.title_tomorrow;
}

// ==================== Renderizar tabla ====================
function renderTable() {
  if (autoPageInterval) clearInterval(autoPageInterval);

  currentRecords = currentDataset === "today" ? todaysRecords : tomorrowsRecords;
  totalPages     = Math.max(1, Math.ceil(currentRecords.length / itemsPerPage));

  const t = translations[currentLang];
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const pageRecords = currentRecords.slice(startIndex, startIndex + itemsPerPage);

  let html = `
    <div class="bktable">
      <table>
        <thead>
          <tr>
            <th>${t.th_booking}</th>
            <th>${t.th_flight}</th>
            <th>${t.th_hotel}</th>
            <th>${t.th_pickup}</th>
          </tr>
        </thead>
        <tbody>
  `;

  pageRecords.forEach(item => {
    html += `
      <tr>
        <td>${item.id}</td>
        <td>${item.Flight}</td>
        <td>${item.HotelName}</td>
        <td>${item.PickupTime}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
    <div class="auto-page-info">${t.page} ${currentPage} / ${totalPages}</div>
  `;

  tableContainer.innerHTML = html;
  startAutoPagination();
}

// ==================== Auto-paginación ====================
function startAutoPagination() {
  autoPageInterval = setInterval(() => {
    currentPage++;
    if (currentPage > totalPages) {
      currentDataset = currentDataset === "today" ? "tomorrow" : "today";
      updateTitle();
      currentPage = 1;
    }
    renderTable();
  }, 10000);
}

// ==================== Navegación y búsqueda ====================
searchTransferBtn.addEventListener('click', goToSearch);
backHomeBtn.addEventListener('click', goToHome);

function goToSearch() {
  homeContainer.style.display   = 'none';
  searchContainer.style.display = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  searchLegend.style.display    = 'block';
  clearInterval(autoPageInterval);
}

function goToHome() {
  searchContainer.style.display = 'none';
  homeContainer.style.display   = 'block';
  searchResult.innerHTML        = '';
  searchInput.value             = '';
  currentPage = 1;
  renderTable();
}

searchButton.addEventListener('click', () => {
  searchLegend.style.display = 'none';
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return goToHome();

  const matchesToday    = todaysRecords.filter(r => r.id.toLowerCase() === query);
  const matchesTomorrow = tomorrowsRecords.filter(r => r.id.toLowerCase() === query);
  const foundRecords    = [...matchesToday, ...matchesTomorrow];

  const t = translations[currentLang];

  if (foundRecords.length > 0) {
    let resultHTML = `
      <div class="bktableqrresultados">
        <p class="titulo_result"><strong>${t.result_title}</strong></p>
        <table class="transfer-result-table">
          <thead>
            <tr>
              <th>${t.th_booking}</th>
              <th>${t.th_flight}</th>
              <th>${t.th_hotel}</th>
              <th>${t.th_pickup}</th>
            </tr>
          </thead>
          <tbody>
    `;
    foundRecords.forEach(record => {
      resultHTML += `
        <tr>
          <td>${record.id}</td>
          <td>${record.Flight}</td>
          <td>${record.HotelName}</td>
          <td>${record.PickupTime}</td>
        </tr>
      `;
    });
    resultHTML += `</tbody></table></div>`;
    searchResult.innerHTML = resultHTML;
  } else {
    searchResult.innerHTML = `
      <div class="bktableqr">
        <p class="error-text">${t.error_text}</p>
        <div class="qr-container">
          <img src="https://miguelgrhub.github.io/Dyspl/Qr.jpeg" alt="QR Code">
        </div>
      </div>
    `;
  }
});
