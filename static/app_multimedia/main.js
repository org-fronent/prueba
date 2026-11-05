// --- MAPA Y RUTAS CON LEAFLET Y OSRM ---
let map = L.map('map').setView([2.4448, -76.6147], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let originMarker = null;
let destinationMarker = null;
let routeControl = null;

map.on('click', function(e) {
  if (!originMarker) {
    originMarker = L.marker(e.latlng, {draggable: true}).addTo(map).bindPopup("Origen").openPopup();
    document.getElementById('origin').value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
  } else if (!destinationMarker) {
    destinationMarker = L.marker(e.latlng, {draggable: true}).addTo(map).bindPopup("Destino").openPopup();
    document.getElementById('destination').value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    calculateRoute();
  }
});

document.getElementById('btn-route').addEventListener('click', calculateRoute);

async function geocode(query) {
  if (query.includes(',')) {
    const parts = query.split(',').map(p => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) return { lat: parts[0], lon: parts[1] };
  }
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }
  throw new Error("Ubicación no encontrada: " + query);
}

async function calculateRoute() {
  const originText = document.getElementById('origin').value;
  const destText = document.getElementById('destination').value;

  if (!originText || !destText) {
    alert("Por favor ingresa un origen y un destino.");
    return;
  }

  try {
    const originCoords = await geocode(originText);
    const destCoords = await geocode(destText);

    if (originMarker) map.removeLayer(originMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);

    originMarker = L.marker([originCoords.lat, originCoords.lon]).addTo(map).bindPopup("Origen");
    destinationMarker = L.marker([destCoords.lat, destCoords.lon]).addTo(map).bindPopup("Destino");

    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      if (routeControl) map.removeLayer(routeControl);

      routeControl = L.geoJSON(route.geometry, {
        style: { color: '#2a5298', weight: 5, opacity: 0.8 }
      }).addTo(map);

      map.fitBounds(routeControl.getBounds(), { padding: [50, 50] });

      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationMin = Math.round(route.duration / 60);

      document.getElementById('info-distance').innerText = `${distanceKm} km`;
      document.getElementById('info-duration').innerText = `${durationMin} min`;
      document.getElementById('route-info').classList.remove('hidden');
    }
  } catch (err) {
    alert(err.message || "Error al calcular la ruta.");
  }
}

// --- SELECCION Y FILTRADO DE ARCHIVOS ---
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const selectedFileList = document.getElementById('selected-file-list');
const selectionSummary = document.getElementById('selection-summary');
const uploadButton = document.getElementById('upload-button');

if (fileInput) fileInput.addEventListener('change', updateSelectedFiles);

if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const transfer = new DataTransfer();
    Array.from(e.dataTransfer.files).forEach(file => transfer.items.add(file));
    fileInput.files = transfer.files;
    updateSelectedFiles();
  });
}

function updateSelectedFiles() {
  const files = Array.from(fileInput.files);
  selectedFileList.replaceChildren();
  selectionSummary.textContent = files.length
    ? `${files.length} archivo(s) listo(s) para subir`
    : 'Ningún archivo seleccionado';
  uploadButton.disabled = files.length === 0;

  files.forEach(file => {
    const item = document.createElement('li');
    item.textContent = `${file.name} (${formatFileSize(file.size)})`;
    selectedFileList.appendChild(item);
  });
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (event) => {
    const selectedButton = event.target.closest('.filter-btn');
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    selectedButton.classList.add('active');
    document.querySelectorAll('.media-item').forEach(item => {
      item.classList.toggle('hidden', selectedButton.dataset.filter !== 'all' && item.dataset.category !== selectedButton.dataset.filter);
    });
  });
});