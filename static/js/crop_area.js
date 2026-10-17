// ============================================================
// ECORISK - CROP AREA ASSESSMENT
// DISTRICT + TALUK + TOPSIS + MAP + VISUALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================================
    // ELEMENTS
    // ========================================================

    const districtSelect =
        document.getElementById("districtSelect");

    const talukSelect =
        document.getElementById("talukSelect");

    const loading =
        document.getElementById("loading");

    const blocksCard =
        document.getElementById("blocksCard");

    const blocksContainer =
        document.getElementById("blocksContainer");

    const resultSection =
        document.getElementById("resultSection");

    const mapContainer =
        document.getElementById("cropAreaMap");


    // ========================================================
    // MAP VARIABLES
    // ========================================================

    let cropMap = null;

    let districtLayer = null;


    // ========================================================
    // CHART VARIABLES
    // ========================================================

    let cropAreaChart = null;

    let cropAreaBarChart = null;

    let cropAreaDoughnutChart = null;


    // ========================================================
    // START APPLICATION
    // ========================================================

    loadDistricts();

    loadCropMap();


    // ========================================================
    // LOAD DISTRICTS
    // ========================================================

    async function loadDistricts() {

        districtSelect.innerHTML = `
            <option value="">
                Loading districts...
            </option>
        `;

        try {

            const response =
                await fetch(
                    "/crop_area/districts",
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to load districts"
                );

            }


            if (
                !data.districts ||
                data.districts.length === 0
            ) {

                throw new Error(
                    "No districts found"
                );

            }


            districtSelect.innerHTML = `
                <option value="">
                    Select District
                </option>
            `;


            data.districts.forEach(
                function (district) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        district;

                    option.textContent =
                        district;

                    districtSelect.appendChild(
                        option
                    );

                }
            );


        }
        catch (error) {

            console.error(
                "DISTRICT ERROR:",
                error
            );


            districtSelect.innerHTML = `
                <option value="">
                    ERROR: ${escapeHtml(error.message)}
                </option>
            `;

        }

    }


    // ========================================================
    // DISTRICT CHANGE
    // ========================================================

    districtSelect.addEventListener(
        "change",
        function () {

            const district =
                this.value.trim();


            // Reset taluk dropdown

            talukSelect.innerHTML = `
                <option value="">
                    Select Place / Taluk
                </option>
            `;

            talukSelect.disabled = true;


            // Reset blocks

            blocksContainer.innerHTML = "";

            blocksCard.style.display =
                "none";


            // Hide result

            resultSection.style.display =
                "none";


            // Destroy charts

            destroyAllCharts();


            // Reset map

            resetDistrictHighlight();


            if (!district) {

                return;

            }


            // Highlight district

            highlightDistrict(
                district
            );


            // Load taluks

            loadTaluks(
                district
            );

        }
    );


    // ========================================================
    // LOAD TALUKS
    // ========================================================

    async function loadTaluks(district) {

        try {

            loading.textContent =
                "Loading available taluks...";

            loading.style.display =
                "block";


            const response =
                await fetch(
                    "/crop_area/district/" +
                    encodeURIComponent(
                        district
                    ),
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to load taluks"
                );

            }


            if (
                !data.taluks ||
                data.taluks.length === 0
            ) {

                throw new Error(
                    "No taluks available"
                );

            }


            // =================================================
            // RESET DROPDOWN
            // =================================================

            talukSelect.innerHTML = `
                <option value="">
                    Select Place / Taluk
                </option>
            `;


            // =================================================
            // RESET BUTTONS
            // =================================================

            blocksContainer.innerHTML = "";


            // =================================================
            // CREATE TALUKS
            // =================================================

            data.taluks.forEach(
                function (taluk) {


                    // -----------------------------------------
                    // DROPDOWN OPTION
                    // -----------------------------------------

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        taluk;

                    option.textContent =
                        taluk;

                    talukSelect.appendChild(
                        option
                    );


                    // -----------------------------------------
                    // TALUK BUTTON
                    // -----------------------------------------

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "taluk-button";

                    button.textContent =
                        taluk;


                    button.addEventListener(
                        "click",
                        function () {

                            talukSelect.value =
                                taluk;


                            // Remove active

                            document
                                .querySelectorAll(
                                    ".taluk-button"
                                )
                                .forEach(
                                    function (btn) {

                                        btn.classList.remove(
                                            "active"
                                        );

                                    }
                                );


                            // Add active

                            button.classList.add(
                                "active"
                            );


                            // Load result

                            loadCropResult(
                                district,
                                taluk
                            );

                        }
                    );


                    blocksContainer.appendChild(
                        button
                    );

                }
            );


            // Enable dropdown

            talukSelect.disabled =
                false;


            // Show available taluks

            blocksCard.style.display =
                "block";


        }
        catch (error) {

            console.error(
                "TALUK ERROR:",
                error
            );


            blocksContainer.innerHTML = `
                <div class="no-taluks">
                    ${escapeHtml(error.message)}
                </div>
            `;


            blocksCard.style.display =
                "block";

        }
        finally {

            loading.style.display =
                "none";

        }

    }


    // ========================================================
    // TALUK DROPDOWN CHANGE
    // ========================================================

    talukSelect.addEventListener(
        "change",
        function () {

            const district =
                districtSelect.value.trim();


            const taluk =
                this.value.trim();


            if (
                !district ||
                !taluk
            ) {

                return;

            }


            // Remove active

            document
                .querySelectorAll(
                    ".taluk-button"
                )
                .forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );


                        if (
                            btn.textContent.trim() ===
                            taluk
                        ) {

                            btn.classList.add(
                                "active"
                            );

                        }

                    }
                );


            // Load result

            loadCropResult(
                district,
                taluk
            );

        }
    );


    // ========================================================
    // LOAD CROP RESULT
    // ========================================================

    async function loadCropResult(
        district,
        taluk
    ) {

        try {

            loading.textContent =
                "Calculating TOPSIS crop area assessment...";

            loading.style.display =
                "block";


            const response =
                await fetch(
                    "/crop_area/" +
                    encodeURIComponent(
                        district
                    ) +
                    "/" +
                    encodeURIComponent(
                        taluk
                    ),
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to calculate assessment"
                );

            }


            console.log(
                "CROP AREA RESULT:",
                data
            );


            // Display result

            displayResult(
                data
            );

        }
        catch (error) {

            console.error(
                "CROP RESULT ERROR:",
                error
            );


            showErrorMessage(
                error.message
            );

        }
        finally {

            loading.style.display =
                "none";

        }

    }


    // ========================================================
    // DISPLAY RESULT
    // ========================================================

    function displayResult(data) {

        // ====================================================
        // LOCATION
        // ====================================================

        const location =
            document.getElementById(
                "selectedLocation"
            );


        if (location) {

            location.textContent =
                (data.district || "-") +
                " - " +
                (data.taluk || "-");

        }


        // ====================================================
        // RISK / QUALITY BADGE
        // ====================================================

        const badge =
            document.getElementById(
                "qualityBadge"
            );


        if (badge) {

            const risk =
                data.risk ||
                "Unknown";


            badge.textContent =
                risk;


            badge.className =
                "quality-badge " +
                String(risk)
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        "-"
                    );

        }


        // ====================================================
        // TOPSIS SCORE
        // ====================================================

        const scoreElement =
            document.getElementById(
                "topsisScore"
            );


        if (scoreElement) {

            const score =
                Number(data.score);


            scoreElement.textContent =
                Number.isFinite(score)
                    ? score.toFixed(3)
                    : "-";

        }


        // ====================================================
        // RECOMMENDATION
        // ====================================================

        const recommendation =
            document.getElementById(
                "recommendation"
            );


        if (recommendation) {

            recommendation.textContent =
                data.recommendation ||
                "No recommendation available.";

        }


        // ====================================================
        // RICE
        // ====================================================

        const riceElement =
            document.getElementById(
                "riceArea"
            );


        if (riceElement) {

            riceElement.textContent =
                formatNumber(
                    data.rice
                );

        }


        // ====================================================
        // GROUNDNUT
        // ====================================================

        const groundnutElement =
            document.getElementById(
                "groundnutArea"
            );


        if (groundnutElement) {

            groundnutElement.textContent =
                formatNumber(
                    data.groundnut
                );

        }


        // ====================================================
        // SUGARCANE
        // ====================================================

        const sugarcaneElement =
            document.getElementById(
                "sugarcaneArea"
            );


        if (sugarcaneElement) {

            sugarcaneElement.textContent =
                formatNumber(
                    data.sugarcane
                );

        }


        // ====================================================
        // TOTAL CROP AREA
        // ====================================================

        const totalElement =
            document.getElementById(
                "totalCropArea"
            );


        if (totalElement) {

            totalElement.textContent =
                formatNumber(
                    data.totalCropArea
                );

        }


        // ====================================================
        // UPDATE VISUALIZATION
        // ====================================================

        updateAllCharts(
            data
        );


        // ====================================================
        // SHOW RESULT
        // ====================================================

        resultSection.style.display =
            "block";


        // ====================================================
        // SCROLL
        // ====================================================

        setTimeout(
            function () {

                resultSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
        );

    }


    // ========================================================
    // UPDATE ALL CHARTS
    // ========================================================

    function updateAllCharts(data) {

        const rice =
            getNumber(data.rice);

        const groundnut =
            getNumber(data.groundnut);

        const sugarcane =
            getNumber(data.sugarcane);

        const total =
            getNumber(data.totalCropArea);


        // ====================================================
        // OLD / SINGLE BAR CHART
        // ====================================================

        updateCropAreaChart(
            rice,
            groundnut,
            sugarcane,
            total
        );


        // ====================================================
        // NEW BAR CHART
        // ====================================================

        updateCropAreaBarChart(
            rice,
            groundnut,
            sugarcane
        );


        // ====================================================
        // DOUGHNUT CHART
        // ====================================================

        updateCropAreaDoughnutChart(
            rice,
            groundnut,
            sugarcane
        );

    }


    // ========================================================
    // SINGLE CROP AREA BAR CHART
    // ========================================================

    function updateCropAreaChart(
        rice,
        groundnut,
        sugarcane,
        total
    ) {

        const canvas =
            document.getElementById(
                "cropAreaChart"
            );


        if (!canvas) {

            return;

        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            console.error(
                "Chart.js is not loaded."
            );

            return;

        }


        if (cropAreaChart) {

            cropAreaChart.destroy();

            cropAreaChart =
                null;

        }


        cropAreaChart =
            new Chart(
                canvas,
                {

                    type: "bar",

                    data: {

                        labels: [
                            "Rice",
                            "Groundnut",
                            "Sugarcane",
                            "Total Crop Area"
                        ],

                        datasets: [

                            {

                                label:
                                    "Crop Area (hectares)",

                                data: [
                                    rice,
                                    groundnut,
                                    sugarcane,
                                    total
                                ],

                                backgroundColor: [
                                    "rgba(0, 230, 195, 0.75)",
                                    "rgba(0, 180, 255, 0.75)",
                                    "rgba(255, 190, 80, 0.75)",
                                    "rgba(180, 120, 255, 0.75)"
                                ],

                                borderColor: [
                                    "#00e6c3",
                                    "#00b4ff",
                                    "#ffbe50",
                                    "#b478ff"
                                ],

                                borderWidth: 2,

                                borderRadius: 8,

                                barPercentage: 0.65,

                                categoryPercentage: 0.70

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        animation: {
                            duration: 800
                        },

                        plugins: {

                            legend: {

                                display: true,

                                position: "top",

                                labels: {

                                    color:
                                        "#d3dce2",

                                    padding: 18,

                                    font: {

                                        size: 12,

                                        weight: "600"

                                    }

                                }

                            },

                            tooltip: {

                                enabled: true,

                                backgroundColor:
                                    "rgba(6, 21, 33, 0.95)",

                                borderColor:
                                    "#00e6c3",

                                borderWidth: 1,

                                titleColor:
                                    "#00e6c3",

                                bodyColor:
                                    "#ffffff",

                                padding: 12,

                                callbacks: {

                                    label:
                                        function(context) {

                                            const value =
                                                Number(
                                                    context.raw
                                                );

                                            return (
                                                " " +
                                                value.toLocaleString(
                                                    "en-IN"
                                                ) +
                                                " hectares"
                                            );

                                        }

                                }

                            }

                        },

                        scales: {

                            x: {

                                ticks: {

                                    color:
                                        "#c8d2d8",

                                    padding: 10,

                                    font: {

                                        size: 12,

                                        weight: "600"

                                    }

                                },

                                grid: {

                                    display: false

                                },

                                border: {

                                    color:
                                        "rgba(255,255,255,0.12)"

                                }

                            },

                            y: {

                                beginAtZero: true,

                                ticks: {

                                    color:
                                        "#c8d2d8",

                                    padding: 10,

                                    font: {

                                        size: 11

                                    },

                                    callback:
                                        function(value) {

                                            return Number(
                                                value
                                            ).toLocaleString(
                                                "en-IN"
                                            );

                                        }

                                },

                                title: {

                                    display: true,

                                    text:
                                        "Area (Hectares)",

                                    color:
                                        "#00e6c3",

                                    font: {

                                        size: 12,

                                        weight: "bold"

                                    }

                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,0.08)"

                                }

                            }

                        }

                    }

                }
            );

    }


    // ========================================================
    // CROP-WISE BAR CHART
    // ========================================================

    function updateCropAreaBarChart(
        rice,
        groundnut,
        sugarcane
    ) {

        const canvas =
            document.getElementById(
                "cropAreaBarChart"
            );


        if (!canvas) {

            return;

        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            return;

        }


        if (cropAreaBarChart) {

            cropAreaBarChart.destroy();

            cropAreaBarChart =
                null;

        }


        cropAreaBarChart =
            new Chart(
                canvas,
                {

                    type: "bar",

                    data: {

                        labels: [
                            "Rice",
                            "Groundnut",
                            "Sugarcane"
                        ],

                        datasets: [

                            {

                                label:
                                    "Area (hectares)",

                                data: [
                                    rice,
                                    groundnut,
                                    sugarcane
                                ],

                                backgroundColor: [
                                    "rgba(0, 230, 195, 0.75)",
                                    "rgba(0, 180, 255, 0.75)",
                                    "rgba(255, 190, 80, 0.75)"
                                ],

                                borderColor: [
                                    "#00e6c3",
                                    "#00b4ff",
                                    "#ffbe50"
                                ],

                                borderWidth: 2,

                                borderRadius: 8,

                                barPercentage: 0.65,

                                categoryPercentage: 0.70

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        animation: {

                            duration: 800

                        },

                        plugins: {

                            legend: {

                                display: true,

                                labels: {

                                    color:
                                        "#d3dce2",

                                    font: {

                                        size: 11,

                                        weight: "600"

                                    }

                                }

                            },

                            tooltip: {

                                backgroundColor:
                                    "rgba(6, 21, 33, 0.95)",

                                borderColor:
                                    "#00e6c3",

                                borderWidth: 1,

                                titleColor:
                                    "#00e6c3",

                                bodyColor:
                                    "#ffffff",

                                callbacks: {

                                    label:
                                        function(context) {

                                            return (
                                                " " +
                                                Number(
                                                    context.raw
                                                ).toLocaleString(
                                                    "en-IN"
                                                ) +
                                                " hectares"
                                            );

                                        }

                                }

                            }

                        },

                        scales: {

                            x: {

                                ticks: {

                                    color:
                                        "#c8d2d8",

                                    font: {

                                        size: 11,

                                        weight: "600"

                                    }

                                },

                                grid: {

                                    display: false

                                }

                            },

                            y: {

                                beginAtZero: true,

                                ticks: {

                                    color:
                                        "#c8d2d8",

                                    font: {

                                        size: 10

                                    },

                                    callback:
                                        function(value) {

                                            return Number(
                                                value
                                            ).toLocaleString(
                                                "en-IN"
                                            );

                                        }

                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,0.08)"

                                }

                            }

                        }

                    }

                }
            );

    }


    // ========================================================
    // DOUGHNUT CHART
    // ========================================================

    function updateCropAreaDoughnutChart(
        rice,
        groundnut,
        sugarcane
    ) {

        const canvas =
            document.getElementById(
                "cropAreaDoughnutChart"
            );


        if (!canvas) {

            return;

        }


        if (
            typeof Chart ===
            "undefined"
        ) {

            return;

        }


        if (cropAreaDoughnutChart) {

            cropAreaDoughnutChart.destroy();

            cropAreaDoughnutChart =
                null;

        }


        cropAreaDoughnutChart =
            new Chart(
                canvas,
                {

                    type: "doughnut",

                    data: {

                        labels: [
                            "Rice",
                            "Groundnut",
                            "Sugarcane"
                        ],

                        datasets: [

                            {

                                data: [
                                    rice,
                                    groundnut,
                                    sugarcane
                                ],

                                backgroundColor: [
                                    "rgba(0, 230, 195, 0.80)",
                                    "rgba(0, 180, 255, 0.80)",
                                    "rgba(255, 190, 80, 0.80)"
                                ],

                                borderColor: [
                                    "#00e6c3",
                                    "#00b4ff",
                                    "#ffbe50"
                                ],

                                borderWidth: 2,

                                hoverOffset: 8

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        cutout: "58%",

                        animation: {

                            duration: 800

                        },

                        plugins: {

                            legend: {

                                display: true,

                                position: "bottom",

                                labels: {

                                    color:
                                        "#d3dce2",

                                    padding: 12,

                                    font: {

                                        size: 10,

                                        weight: "600"

                                    }

                                }

                            },

                            tooltip: {

                                backgroundColor:
                                    "rgba(6, 21, 33, 0.95)",

                                borderColor:
                                    "#00e6c3",

                                borderWidth: 1,

                                titleColor:
                                    "#00e6c3",

                                bodyColor:
                                    "#ffffff",

                                padding: 10,

                                callbacks: {

                                    label:
                                        function(context) {

                                            const value =
                                                Number(
                                                    context.raw
                                                );

                                            return (
                                                " " +
                                                value.toLocaleString(
                                                    "en-IN"
                                                ) +
                                                " hectares"
                                            );

                                        }

                                }

                            }

                        }

                    }

                }
            );

    }


    // ========================================================
    // DESTROY ALL CHARTS
    // ========================================================

    function destroyAllCharts() {

        if (cropAreaChart) {

            cropAreaChart.destroy();

            cropAreaChart =
                null;

        }


        if (cropAreaBarChart) {

            cropAreaBarChart.destroy();

            cropAreaBarChart =
                null;

        }


        if (cropAreaDoughnutChart) {

            cropAreaDoughnutChart.destroy();

            cropAreaDoughnutChart =
                null;

        }

    }


    // ========================================================
    // LOAD TAMIL NADU MAP
    // ========================================================

    async function loadCropMap() {

        if (!mapContainer) {

            console.error(
                "Map container not found."
            );

            return;

        }


        // ====================================================
        // CHECK LEAFLET
        // ====================================================

        if (
            typeof L ===
            "undefined"
        ) {

            mapContainer.innerHTML = `
                <div class="map-error">
                    Leaflet library is not loaded.
                </div>
            `;

            return;

        }


        try {

            const response =
                await fetch(
                    "/static/geojson/tamil_nadu_districts.geojson",
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Tamil Nadu district GeoJSON not found."
                );

            }


            const geojson =
                await response.json();


            createMap(
                mapContainer,
                geojson
            );

        }
        catch (error) {

            console.error(
                "MAP ERROR:",
                error
            );


            mapContainer.innerHTML = `
                <div class="map-error">

                    Unable to load Tamil Nadu map.

                    <br><br>

                    ${escapeHtml(
                        error.message
                    )}

                </div>
            `;

        }

    }


    // ========================================================
    // CREATE MAP
    // ========================================================

    function createMap(
        container,
        geojson
    ) {

        // Clear loading

        container.innerHTML = "";


        // ====================================================
        // CREATE MAP
        // ====================================================

        cropMap =
            L.map(
                container,
                {

                    zoomControl: true,

                    attributionControl: false,

                    zoomSnap: 0.5,

                    zoomDelta: 0.5,

                    minZoom: 6,

                    maxZoom: 11

                }
            );


        // ====================================================
        // CREATE DISTRICT LAYER
        // ====================================================

        districtLayer =
            L.geoJSON(
                geojson,
                {

                    style:
                        districtStyle,


                    onEachFeature:
                        function(
                            feature,
                            layer
                        ) {

                            const name =
                                getDistrictName(
                                    feature
                                );


                            // ==================================
                            // HOVER TOOLTIP
                            // ==================================
                            // permanent:false is IMPORTANT.
                            // It prevents all district names
                            // from appearing at the same time.
                            // ==================================

                            layer.bindTooltip(
                                name,
                                {

                                    direction:
                                        "center",

                                    sticky:
                                        true,

                                    permanent:
                                        false,

                                    className:
                                        "district-label",

                                    opacity:
                                        1

                                }
                            );


                            // ==================================
                            // POPUP
                            // ==================================

                            layer.bindPopup(`
                                <div class="district-popup">

                                    <strong>
                                        ${escapeHtml(
                                            name
                                        )}
                                    </strong>

                                    <span>
                                        Crop Area Assessment
                                    </span>

                                    <button
                                        type="button"
                                        class="map-select-btn"
                                    >
                                        Select District
                                    </button>

                                </div>
                            `);


                            // ==================================
                            // DISTRICT CLICK
                            // ==================================

                            layer.on(
                                "click",
                                function() {

                                    selectDistrictFromMap(
                                        name
                                    );


                                    highlightDistrict(
                                        name
                                    );


                                    layer.openPopup();

                                }
                            );


                            // ==================================
                            // MOUSE OVER
                            // ==================================

                            layer.on(
                                "mouseover",
                                function() {

                                    layer.setStyle({

                                        weight: 3,

                                        color:
                                            "#ffffff",

                                        fillColor:
                                            "#00e6c3",

                                        fillOpacity:
                                            0.75

                                    });


                                    layer.bringToFront();

                                }
                            );


                            // ==================================
                            // MOUSE OUT
                            // ==================================

                            layer.on(
                                "mouseout",
                                function() {

                                    const currentDistrict =
                                        districtSelect.value.trim();


                                    const currentName =
                                        getDistrictName(
                                            feature
                                        );


                                    if (
                                        normalizeDistrict(
                                            currentDistrict
                                        ) !==
                                        normalizeDistrict(
                                            currentName
                                        )
                                    ) {

                                        districtLayer.resetStyle(
                                            layer
                                        );

                                    }

                                }
                            );

                        }

                }
            );


        // Add layer

        districtLayer.addTo(
            cropMap
        );


        // ====================================================
        // FIT MAP TO TAMIL NADU
        // ====================================================

        const bounds =
            districtLayer.getBounds();


        if (
            bounds.isValid()
        ) {

            cropMap.fitBounds(
                bounds,
                {

                    paddingTopLeft:
                        [35, 35],

                    paddingBottomRight:
                        [35, 35],

                    maxZoom:
                        7.5,

                    animate:
                        false

                }
            );

        }


        // ====================================================
        // FIX MAP SIZE
        // ====================================================

        setTimeout(
            function() {

                cropMap.invalidateSize();

            },
            300
        );

    }


    // ========================================================
    // DISTRICT STYLE
    // ========================================================

    function districtStyle() {

        return {

            weight:
                1.5,

            opacity:
                1,

            color:
                "#00d9bd",

            fillColor:
                "#0b5961",

            fillOpacity:
                0.58,

            lineJoin:
                "round",

            lineCap:
                "round"

        };

    }


    // ========================================================
    // GET DISTRICT NAME
    // ========================================================

    function getDistrictName(
        feature
    ) {

        const properties =
            feature.properties ||
            {};


        const name =
            properties.REGNAME ||
            properties.DISTRICT ||
            properties.District ||
            properties.NAME ||
            properties.Name ||
            properties.name;


        if (
            name !== undefined &&
            name !== null &&
            String(name).trim() !== ""
        ) {

            return String(
                name
            ).trim();

        }


        return "Unknown District";

    }


    // ========================================================
    // SELECT DISTRICT FROM MAP
    // ========================================================

    function selectDistrictFromMap(
        mapDistrict
    ) {

        const normalized =
            normalizeDistrict(
                mapDistrict
            );


        const options =
            Array.from(
                districtSelect.options
            );


        const matched =
            options.find(
                function(option) {

                    return (
                        normalizeDistrict(
                            option.value
                        ) ===
                        normalized
                    );

                }
            );


        if (!matched) {

            console.warn(
                "District not found:",
                mapDistrict
            );

            return;

        }


        // Set dropdown

        districtSelect.value =
            matched.value;


        // Trigger district change

        districtSelect.dispatchEvent(
            new Event(
                "change"
            )
        );


        // Highlight

        highlightDistrict(
            matched.value
        );

    }


    // ========================================================
    // NORMALIZE DISTRICT
    // ========================================================

    function normalizeDistrict(
        value
    ) {

        return String(
            value || ""
        )
            .toLowerCase()
            .replace(
                /district/g,
                ""
            )
            .replace(
                /[^a-z0-9]/g,
                ""
            )
            .trim();

    }


    // ========================================================
    // HIGHLIGHT SELECTED DISTRICT
    // ========================================================

    function highlightDistrict(
        selectedDistrict
    ) {

        if (!districtLayer) {

            return;

        }


        districtLayer.eachLayer(
            function(layer) {

                const mapName =
                    getDistrictName(
                        layer.feature
                    );


                const selected =
                    normalizeDistrict(
                        mapName
                    ) ===
                    normalizeDistrict(
                        selectedDistrict
                    );


                if (selected) {

                    layer.setStyle({

                        weight:
                            4,

                        color:
                            "#ffffff",

                        fillColor:
                            "#00e6c3",

                        fillOpacity:
                            0.85

                    });


                    layer.bringToFront();


                    // Show selected district tooltip

                    layer.openTooltip();

                }
                else {

                    districtLayer.resetStyle(
                        layer
                    );


                    layer.closeTooltip();

                    layer.closePopup();

                }

            }
        );

    }


    // ========================================================
    // RESET DISTRICT HIGHLIGHT
    // ========================================================

    function resetDistrictHighlight() {

        if (!districtLayer) {

            return;

        }


        districtLayer.eachLayer(
            function(layer) {

                districtLayer.resetStyle(
                    layer
                );


                layer.closeTooltip();

                layer.closePopup();

            }
        );

    }


    // ========================================================
    // FORMAT NUMBER
    // ========================================================

    function formatNumber(
        value
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "-";

        }


        return number.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:
                    2
            }
        );

    }


    // ========================================================
    // GET NUMBER
    // ========================================================

    function getNumber(
        value
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return 0;

        }


        return number;

    }


    // ========================================================
    // ERROR MESSAGE
    // ========================================================

    function showErrorMessage(
        message
    ) {

        console.error(
            message
        );


        alert(
            message
        );

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHtml(
        value
    ) {

        return String(
            value || ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ========================================================
    // END
    // ========================================================

});