// Parameters
const lambda0 = 650; // nm
const ne = 2.2; // effective index
const fwhm = 10; // nm, full width at half max for the bandpass

// Elements
const aoiSlider = document.getElementById('aoi-slider');
const aoiValue = document.getElementById('aoi-value');
const shiftedCwlSpan = document.getElementById('shifted-cwl');

// Calculate shifted center wavelength
function calcShiftedCWL(aoiDeg) {
    const thetaRad = aoiDeg * Math.PI / 180;
    const shifted = lambda0 * (Math.sqrt(ne*ne - Math.pow(Math.sin(thetaRad),2)) / ne);
    return shifted;
}

// Generate Gaussian bandpass spectrum
function generateSpectrum(center, width, rangeMin, rangeMax, points=300) {
    const x = [];
    const y = [];
    const sigma = width / (2 * Math.sqrt(2 * Math.log(2)));
    for (let i = 0; i < points; i++) {
        const wl = rangeMin + (rangeMax - rangeMin) * i / (points - 1);
        x.push(wl);
        y.push(100 * Math.exp(-0.5 * Math.pow((wl - center) / sigma, 2)));
    }
    return {x, y};
}

// AOI animation drawing
function drawAOICanvas(aoi) {
    const canvas = document.getElementById('aoi-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Plate (horizontal)
    const plateY = 120;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, plateY);
    ctx.lineTo(360, plateY);
    ctx.stroke();

    // Normal (vertical, dashed)
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#1e90ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, plateY);
    ctx.lineTo(200, plateY - 70);
    ctx.stroke();
    ctx.restore();

    // Laser beam (red)
    // AOI is from normal, so angle from vertical
    const angleRad = aoi * Math.PI / 180;
    const beamLen = 90;
    // Start point: above plate, offset left
    const x0 = 200 - Math.sin(angleRad) * beamLen;
    const y0 = plateY - Math.cos(angleRad) * beamLen;
    // End point: hit plate at center
    const x1 = 200;
    const y1 = plateY;
    ctx.strokeStyle = '#e4572e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Draw AOI arc
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(200, plateY, 28, -Math.PI/2, -Math.PI/2 + angleRad, false);
    ctx.stroke();
    ctx.restore();

    // AOI label
    ctx.save();
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Segoe UI, Arial';
    const labelAngle = -Math.PI/2 + angleRad/2;
    const labelX = 200 + Math.cos(labelAngle) * 38;
    const labelY = plateY + Math.sin(labelAngle) * 38;
    ctx.fillText(`${aoi}°`, labelX - 10, labelY + 5);
    ctx.restore();
}

// Update plot and values
function updateAll() {
    const aoi = parseFloat(aoiSlider.value);
    aoiValue.textContent = aoi;
    const shiftedCwl = calcShiftedCWL(aoi);
    shiftedCwlSpan.textContent = shiftedCwl.toFixed(1);

    // Spectrum range: ±30 nm around λ₀
    const spectrum = generateSpectrum(shiftedCwl, fwhm, lambda0 - 30, lambda0 + 30);
    const baseline = generateSpectrum(lambda0, fwhm, lambda0 - 30, lambda0 + 30);

    const traceBaseline = {
        x: baseline.x,
        y: baseline.y,
        mode: 'lines',
        line: {color: '#bbb', width: 3, dash: 'dash'},
        name: 'Baseline (AOI = 0°)',
        opacity: 0.7
    };
    const traceShifted = {
        x: spectrum.x,
        y: spectrum.y,
        mode: 'lines',
        line: {color: '#e4572e', width: 3},
        fill: 'tozeroy',
        name: `Shifted (AOI = ${aoi}°)`
    };
    const layout = {
        title: '',
        xaxis: {title: 'Wavelength (nm)', range: [lambda0 - 30, lambda0 + 30]},
        yaxis: {title: 'Transmission (%)', range: [0, 105]},
        margin: {t: 20, r: 20, l: 60, b: 60},
        legend: {orientation: 'h', x: 0.5, xanchor: 'center', y: -0.18},
        showlegend: true
    };
    Plotly.newPlot('plot', [traceBaseline, traceShifted], layout, {responsive: true, displayModeBar: false});

    // Draw AOI animation
    drawAOICanvas(aoi);
}

aoiSlider.addEventListener('input', updateAll);

// Initial plot
updateAll(); 