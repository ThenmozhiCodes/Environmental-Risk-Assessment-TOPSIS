// ============================================================
// ECORISK - RAINFALL RISK
// DISTRICT + TALUK + TOPSIS
// IMPROVED PROFESSIONAL MAP
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

    const blocksContainer =
        document.getElementById("blocksContainer");


    // ========================================================
    // MAP VARIABLES
    // ========================================================

    let rainfallMap = null;
    let districtLayer = null;
    let labelLayer = null;


    // ========================================================
    // CHART VARIABLES
    // ========================================================

    let rainfallChart = null;
    let latestRainfallData = null;


    // ========================================================
    // START
    // ========================================================

    loadDistricts();
    loadRainfallMap();


    // ========================================================
    // LOAD DISTRICTS
    // ========================================================

    async function loadDistricts() {

        districtSelect.innerHTML =
            `<option value="">Loading districts...</option>`;

        try {

            const response =
                await fetch(
                    "/rainfall/districts",
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


            districtSelect.innerHTML =
                `<option value="">Select District</option>`;


            data.districts.forEach(
                function (district) {

                    const option =
                        document.createElement("option");

                    option.value =
                        district;

                    option.textContent =
                        district;

                    districtSelect.appendChild(
                        option
                    );

                }
            );


            console.log(
                "DISTRICTS LOADED:",
                data.districts
            );

        }
        catch (error) {

            console.error(
                "DISTRICT ERROR:",
                error
            );

            districtSelect.innerHTML =
                `<option value="">
                    ERROR: ${error.message}
                </option>`;

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


            talukSelect.innerHTML =
                `<option value="">
                    Select Place / Taluk
                </option>`;


            talukSelect.disabled =
                true;


            if (blocksContainer) {

                blocksContainer.innerHTML =
                    "";

            }


            latestRainfallData =
                null;


            hideVisualization();


            if (!district) {

                resetMapSelection();

                return;

            }


            highlightDistrict(
                district
            );


            loadTaluks(
                district
            );

        }
    );


    // ========================================================
    // LOAD TALUKS
    // ========================================================

    async function loadTaluks(
        district
    ) {

        try {

            if (loading) {

                loading.textContent =
                    "Loading taluks...";

                loading.style.display =
                    "block";

            }


            const url =
                "/rainfall/district/" +
                encodeURIComponent(
                    district
                );


            const response =
                await fetch(
                    url,
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


            talukSelect.innerHTML =
                `<option value="">
                    Select Place / Taluk
                </option>`;


            if (blocksContainer) {

                blocksContainer.innerHTML =
                    "";

            }


            if (
                !data.taluks ||
                data.taluks.length === 0
            ) {

                talukSelect.innerHTML =
                    `<option value="">
                        No taluks available
                    </option>`;


                if (blocksContainer) {

                    blocksContainer.innerHTML =
                        `<div class="no-taluks">
                            No taluks available
                        </div>`;

                }


                return;

            }


            data.taluks.forEach(
                function (taluk) {

                    // ========================================
                    // DROPDOWN
                    // ========================================

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


                    // ========================================
                    // TALUK BUTTON
                    // ========================================

                    if (blocksContainer) {

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


                                button.classList.add(
                                    "active"
                                );


                                loadRainfallResult(
                                    district,
                                    taluk
                                );

                            }
                        );


                        blocksContainer.appendChild(
                            button
                        );

                    }

                }
            );


            talukSelect.disabled =
                false;


            const blocksCard =
                document.getElementById(
                    "blocksCard"
                );


            if (blocksCard) {

                blocksCard.style.display =
                    "block";

            }

        }
        catch (error) {

            console.error(
                "TALUK ERROR:",
                error
            );


            talukSelect.innerHTML =
                `<option value="">
                    ERROR: ${error.message}
                </option>`;


            talukSelect.disabled =
                true;


            if (blocksContainer) {

                blocksContainer.innerHTML =
                    `<div class="no-taluks">
                        Unable to load taluks
                    </div>`;

            }

        }
        finally {

            if (loading) {

                loading.style.display =
                    "none";

            }

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


            if (!district || !taluk) {

                return;

            }


            document
                .querySelectorAll(
                    ".taluk-button"
                )
                .forEach(
                    function (button) {

                        button.classList.toggle(
                            "active",
                            button.textContent.trim() ===
                            taluk
                        );

                    }
                );


            loadRainfallResult(
                district,
                taluk
            );

        }
    );


    // ========================================================
    // LOAD RAINFALL RESULT
    // ========================================================

    async function loadRainfallResult(
        district,
        taluk
    ) {

        try {

            if (loading) {

                loading.textContent =
                    "Calculating TOPSIS rainfall risk...";

                loading.style.display =
                    "block";

            }


            hideVisualization();


            const url =
                "/rainfall/" +
                encodeURIComponent(
                    district
                ) +
                "/" +
                encodeURIComponent(
                    taluk
                );


            const response =
                await fetch(
                    url,
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            console.log(
                "RAINFALL RESULT:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to calculate rainfall risk"
                );

            }


            latestRainfallData =
                data;


            displayResult(
                data
            );

        }
        catch (error) {

            console.error(
                "RAINFALL RESULT ERROR:",
                error
            );


            alert(
                error.message
            );

        }
        finally {

            if (loading) {

                loading.style.display =
                    "none";

            }

        }

    }


    // ========================================================
    // DISPLAY RESULT
    // ========================================================

    function displayResult(
        data
    ) {

        // ====================================================
        // LOCATION
        // ====================================================

        const location =
            document.getElementById(
                "selectedLocation"
            );


        if (location) {

            location.textContent =
                data.district +
                " - " +
                data.taluk;

        }


        // ====================================================
        // RISK BADGE
        // ====================================================

        const badge =
            document.getElementById(
                "qualityBadge"
            );


        if (badge) {

            badge.textContent =
                data.risk;


            badge.className =
                "quality-badge " +
                String(
                    data.risk
                ).toLowerCase();

        }


        // ====================================================
        // TOPSIS SCORE
        // ====================================================

        const score =
            document.getElementById(
                "topsisScore"
            );


        if (score) {

            score.textContent =
                Number(
                    data.score
                ).toFixed(3);

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
                data.recommendation;

        }


        // ====================================================
        // RAINFALL VALUES
        // ====================================================

        const annual =
            document.getElementById(
                "annualRainfall"
            );

        const sw =
            document.getElementById(
                "swMonsoon"
            );

        const ne =
            document.getElementById(
                "neMonsoon"
            );

        const winter =
            document.getElementById(
                "winter"
            );

        const summer =
            document.getElementById(
                "summer"
            );


        if (annual) {

            annual.textContent =
                Number(
                    data.annualRainfall
                ).toFixed(2);

        }


        if (sw) {

            sw.textContent =
                Number(
                    data.swMonsoon
                ).toFixed(2);

        }


        if (ne) {

            ne.textContent =
                Number(
                    data.neMonsoon
                ).toFixed(2);

        }


        if (winter) {

            winter.textContent =
                Number(
                    data.winter
                ).toFixed(2);

        }


        if (summer) {

            summer.textContent =
                Number(
                    data.summer
                ).toFixed(2);

        }


        // ====================================================
        // SHOW RESULT
        // ====================================================

        const resultSection =
            document.getElementById(
                "resultSection"
            );


        if (resultSection) {

            resultSection.style.display =
                "block";


            resultSection.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        }

    }


    // ========================================================
    // HIDE VISUALIZATION
    // ========================================================

    function hideVisualization() {

        const chartContainer =
            document.getElementById(
                "chartContainer"
            );


        if (chartContainer) {

            chartContainer.style.display =
                "none";

        }


        if (rainfallChart) {

            rainfallChart.destroy();

            rainfallChart =
                null;

        }

    }


    // ========================================================
    // LOAD RAINFALL MAP
    // ========================================================

    async function loadRainfallMap() {

        const mapContainer =
            document.getElementById(
                "rainfallMap"
            );


        if (!mapContainer) {

            return;

        }


        if (typeof L === "undefined") {

            mapContainer.innerHTML =
                `<div class="map-loading">
                    Leaflet library is not loaded.
                </div>`;

            return;

        }


        try {

            const response =
                await fetch(
                    "/static/geojson/tamilnadu.json",
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Tamil Nadu district GeoJSON not found"
                );

            }


            const geojson =
                await response.json();


            if (
                !geojson.features ||
                geojson.features.length === 0
            ) {

                throw new Error(
                    "GeoJSON contains no district features"
                );

            }


            createLeafletMap(
                mapContainer,
                geojson
            );

        }
        catch (error) {

            console.error(
                "MAP ERROR:",
                error
            );


            mapContainer.innerHTML =
                `<div class="map-loading">
                    Unable to load Tamil Nadu district map.
                    <br><br>
                    ${error.message}
                </div>`;

        }

    }


    // ========================================================
    // CREATE LEAFLET MAP
    // ========================================================

    function createLeafletMap(
        container,
        geojson
    ) {

        container.innerHTML =
            "";


        // ====================================================
        // CREATE MAP
        // ====================================================

        rainfallMap =
            L.map(
                container,
                {
                    zoomControl: true,
                    attributionControl: false,

                    minZoom: 6,

                    maxZoom: 11,

                    maxBoundsViscosity: 0.85,

                    worldCopyJump: false
                }
            );


        // ====================================================
        // DARK MAP BACKGROUND
        // ====================================================

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 20,

                attribution:
                    '&copy; OpenStreetMap &copy; CARTO',

                subdomains:
                    "abcd"
            }
        ).addTo(
            rainfallMap
        );


        // ====================================================
        // DISTRICT GEOJSON
        // ====================================================

        districtLayer =
            L.geoJSON(
                geojson,
                {

                    style:
                        districtStyle,


                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {

                            const districtName =
                                getDistrictName(
                                    feature
                                );


                            // =================================
                            // NORMAL HOVER TOOLTIP
                            // =================================

                            layer.bindTooltip(
                                districtName,
                                {
                                    sticky: true,

                                    direction:
                                        "top",

                                    className:
                                        "district-label",

                                    opacity:
                                        0.95
                                }
                            );


                            // =================================
                            // POPUP
                            // =================================

                            layer.bindPopup(
                                `
                                <div class="district-popup">

                                    <div class="popup-title">
                                        ${districtName}
                                    </div>

                                    <div class="popup-subtitle">
                                        Rainfall Risk Assessment
                                    </div>

                                    <button
                                        class="map-select-btn"
                                        type="button"
                                    >
                                        Select District
                                    </button>

                                </div>
                                `,
                                {
                                    closeButton:
                                        true,

                                    maxWidth:
                                        220
                                }
                            );


                            // =================================
                            // CLICK
                            // =================================

                            layer.on(
                                "click",
                                function () {

                                    selectDistrictFromMap(
                                        districtName
                                    );

                                }
                            );


                            // =================================
                            // MOUSE OVER
                            // =================================

                            layer.on(
                                "mouseover",
                                function () {

                                    layer.setStyle({

                                        weight:
                                            3,

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


                            // =================================
                            // MOUSE OUT
                            // =================================

                            layer.on(
                                "mouseout",
                                function () {

                                    if (
                                        districtLayer
                                    ) {

                                        districtLayer.resetStyle(
                                            layer
                                        );

                                    }

                                }
                            );

                        }

                }
            ).addTo(
                rainfallMap
            );


        // ====================================================
        // FIT TAMIL NADU
        // ====================================================

        const bounds =
            districtLayer.getBounds();


        if (bounds.isValid()) {

            rainfallMap.fitBounds(
                bounds,
                {
                    padding:
                        [30, 30],

                    maxZoom:
                        8
                }
            );

        }


        // ====================================================
        // LABEL LAYER
        // ====================================================

        createDistrictLabels(
            geojson
        );


        // ====================================================
        // MAP ZOOM EVENTS
        // ====================================================

        rainfallMap.on(
            "zoomend",
            function () {

                updateDistrictLabels();

            }
        );


        // ====================================================
        // MAP RESIZE
        // ====================================================

        setTimeout(
            function () {

                if (rainfallMap) {

                    rainfallMap.invalidateSize();

                }

            },
            400
        );

    }


    // ========================================================
    // DISTRICT STYLE
    // ========================================================

    function districtStyle() {

        return {

            weight:
                1.2,

            opacity:
                1,

            color:
                "#00d9bd",

            fillColor:
                "#087f73",

            fillOpacity:
                0.28

        };

    }


    // ========================================================
    // CREATE DISTRICT LABELS
    // ========================================================

    function createDistrictLabels(
        geojson
    ) {

        if (!rainfallMap) {

            return;

        }


        // Remove old labels

        if (labelLayer) {

            rainfallMap.removeLayer(
                labelLayer
            );

        }


        labelLayer =
            L.layerGroup();


        geojson.features.forEach(
            function (feature) {

                const districtName =
                    getDistrictName(
                        feature
                    );


                if (
                    !feature.geometry
                ) {

                    return;

                }


                try {

                    const tempLayer =
                        L.geoJSON(
                            feature
                        );


                    const center =
                        tempLayer
                            .getBounds()
                            .getCenter();


                    const marker =
                        L.marker(
                            center,
                            {
                                icon:
                                    L.divIcon(
                                        {
                                            className:
                                                "district-map-label",

                                            html:
                                                `<span>
                                                    ${districtName}
                                                </span>`,

                                            iconSize:
                                                null,

                                            iconAnchor:
                                                [0, 0]
                                        }
                                    ),

                                interactive:
                                    false
                            }
                        );


                    marker._districtName =
                        districtName;


                    labelLayer.addLayer(
                        marker
                    );

                }
                catch (error) {

                    console.warn(
                        "Label error:",
                        districtName,
                        error
                    );

                }

            }
        );


        labelLayer.addTo(
            rainfallMap
        );


        updateDistrictLabels();

    }


    // ========================================================
    // SHOW/HIDE LABELS BASED ON ZOOM
    // ========================================================

    function updateDistrictLabels() {

        if (
            !rainfallMap ||
            !labelLayer
        ) {

            return;

        }


        const zoom =
            rainfallMap.getZoom();


        labelLayer.eachLayer(
            function (marker) {

                const element =
                    marker.getElement();


                if (!element) {

                    return;

                }


                const label =
                    element.querySelector(
                        "span"
                    );


                if (!label) {

                    return;

                }


                // ============================================
                // INITIAL MAP
                // ============================================

                if (zoom < 7.5) {

                    label.style.opacity =
                        "0.0";

                    label.style.pointerEvents =
                        "none";

                }

                // ============================================
                // MEDIUM ZOOM
                // ============================================

                else if (zoom < 8.5) {

                    label.style.opacity =
                        "0.65";

                    label.style.pointerEvents =
                        "none";

                }

                // ============================================
                // HIGH ZOOM
                // ============================================

                else {

                    label.style.opacity =
                        "1";

                    label.style.pointerEvents =
                        "none";

                }

            }
        );

    }


    // ========================================================
    // GET DISTRICT NAME
    // ========================================================

    function getDistrictName(
        feature
    ) {

        const properties =
            feature.properties || {};


        const districtName =

            properties.NAME_2 ||

            properties.REGNAME ||

            properties.DISTRICT ||

            properties.District ||

            properties.NAME ||

            properties.Name ||

            properties.name ||

            properties.DIST_NAME ||

            properties.DISTRICT_N ||

            properties.district;


        if (
            districtName !== undefined &&
            districtName !== null &&
            String(
                districtName
            ).trim() !== ""
        ) {

            return String(
                districtName
            ).trim();

        }


        return "Unknown District";

    }


    // ========================================================
    // NORMALIZE DISTRICT
    // ========================================================

    function normalizeDistrict(
        name
    ) {

        return String(
            name
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
    // SELECT DISTRICT FROM MAP
    // ========================================================

    function selectDistrictFromMap(
        mapDistrict
    ) {

        if (!mapDistrict) {

            return;

        }


        const options =
            Array.from(
                districtSelect.options
            );


        const matchedOption =
            options.find(
                function (option) {

                    return normalizeDistrict(
                        option.value
                    ) ===
                    normalizeDistrict(
                        mapDistrict
                    );

                }
            );


        if (!matchedOption) {

            console.warn(
                "District not found:",
                mapDistrict
            );

            return;

        }


        districtSelect.value =
            matchedOption.value;


        districtSelect.dispatchEvent(
            new Event(
                "change"
            )
        );


        highlightDistrict(
            matchedOption.value
        );

    }


    // ========================================================
    // HIGHLIGHT DISTRICT
    // ========================================================

    function highlightDistrict(
        selectedDistrict
    ) {

        if (!districtLayer) {

            return;

        }


        let selectedLayer =
            null;


        districtLayer.eachLayer(
            function (layer) {

                const mapName =
                    getDistrictName(
                        layer.feature
                    );


                const isSelected =
                    normalizeDistrict(
                        mapName
                    ) ===
                    normalizeDistrict(
                        selectedDistrict
                    );


                if (isSelected) {

                    selectedLayer =
                        layer;


                    layer.setStyle({

                        weight:
                            4,

                        color:
                            "#ffffff",

                        fillColor:
                            "#00e6c3",

                        fillOpacity:
                            0.80

                    });


                    layer.bringToFront();

                }
                else {

                    districtLayer.resetStyle(
                        layer
                    );

                }

            }
        );


        // ====================================================
        // ZOOM TO SELECTED DISTRICT
        // ====================================================

        if (
            selectedLayer &&
            rainfallMap
        ) {

            const bounds =
                selectedLayer.getBounds();


            if (bounds.isValid()) {

                rainfallMap.flyToBounds(
                    bounds,
                    {
                        padding:
                            [60, 60],

                        maxZoom:
                            9,

                        duration:
                            1.2
                    }
                );

            }


            // Open popup after zoom

            setTimeout(
                function () {

                    if (
                        selectedLayer
                    ) {

                        selectedLayer.openPopup();

                    }

                },
                850
            );

        }

    }


    // ========================================================
    // RESET MAP SELECTION
    // ========================================================

    function resetMapSelection() {

        if (!districtLayer) {

            return;

        }


        districtLayer.eachLayer(
            function (layer) {

                districtLayer.resetStyle(
                    layer
                );

            }
        );


        if (rainfallMap) {

            const bounds =
                districtLayer.getBounds();


            if (bounds.isValid()) {

                rainfallMap.flyToBounds(
                    bounds,
                    {
                        padding:
                            [30, 30],

                        maxZoom:
                            8,

                        duration:
                            1
                    }
                );

            }

        }

    }


    // ========================================================
    // TOPSIS VISUALIZATION BUTTON
    // ========================================================

    const visualizeBtn =
        document.getElementById(
            "visualizeBtn"
        );


    if (visualizeBtn) {

        visualizeBtn.addEventListener(
            "click",
            function () {

                // ============================================
                // CHECK TALUK
                // ============================================

                if (!latestRainfallData) {

                    alert(
                        "Please select a district and taluk first."
                    );

                    return;

                }


                // ============================================
                // CHECK CHART.JS
                // ============================================

                if (
                    typeof Chart ===
                    "undefined"
                ) {

                    alert(
                        "Chart.js is not loaded."
                    );

                    return;

                }


                // ============================================
                // GET SCORE
                // ============================================

                const score =
                    Number(
                        latestRainfallData.score
                    );


                if (
                    isNaN(score)
                ) {

                    alert(
                        "TOPSIS score is not available for this place."
                    );

                    return;

                }


                // ============================================
                // SHOW CHART
                // ============================================

                const chartContainer =
                    document.getElementById(
                        "chartContainer"
                    );


                if (chartContainer) {

                    chartContainer.style.display =
                        "block";

                }


                // ============================================
                // CREATE CHART
                // ============================================

                createRainfallChart(
                    latestRainfallData
                );


                // ============================================
                // SCROLL
                // ============================================

                if (chartContainer) {

                    setTimeout(
                        function () {

                            chartContainer.scrollIntoView({

                                behavior:
                                    "smooth",

                                block:
                                    "center"

                            });

                        },
                        100
                    );

                }

            }
        );

    }


    // ========================================================
    // CREATE TOPSIS CHART
    // ========================================================

    function createRainfallChart(
        data
    ) {

        const canvas =
            document.getElementById(
                "rainfallChart"
            );


        if (!canvas) {

            console.error(
                "rainfallChart canvas not found"
            );

            return;

        }


        if (rainfallChart) {

            rainfallChart.destroy();

            rainfallChart =
                null;

        }


        const score =
            Number(
                data.score
            );


        if (isNaN(score)) {

            return;

        }


        // ====================================================
        // LOCATION
        // ====================================================

        const chartLocation =
            document.getElementById(
                "chartLocation"
            );


        if (chartLocation) {

            chartLocation.textContent =
                data.district +
                " - " +
                data.taluk;

        }


        // ====================================================
        // SCORE
        // ====================================================

        const chartScore =
            document.getElementById(
                "chartScore"
            );


        if (chartScore) {

            chartScore.textContent =
                score.toFixed(3);

        }


        // ====================================================
        // RISK
        // ====================================================

        const chartRisk =
            document.getElementById(
                "chartRisk"
            );


        if (chartRisk) {

            chartRisk.textContent =
                data.risk || "Risk";

        }


        // ====================================================
        // CHART
        // ====================================================

        rainfallChart =
            new Chart(
                canvas,
                {

                    type:
                        "bar",


                    data: {

                        labels: [
                            "TOPSIS Score"
                        ],


                        datasets: [

                            {

                                label:
                                    data.taluk +
                                    " TOPSIS Score",


                                data: [
                                    score
                                ],


                                backgroundColor:
                                    "rgba(0, 230, 195, 0.75)",


                                borderColor:
                                    "#00f0ce",


                                borderWidth:
                                    2,


                                borderRadius:
                                    10,


                                barThickness:
                                    90

                            }

                        ]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        animation: {

                            duration:
                                800

                        },


                        plugins: {

                            legend: {

                                display:
                                    true,

                                labels: {

                                    color:
                                        "#d9f7f3",

                                    font: {

                                        size:
                                            13,

                                        weight:
                                            "bold"

                                    }

                                }

                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            return (
                                                "TOPSIS Score: " +
                                                Number(
                                                    context.raw
                                                ).toFixed(3)
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                min:
                                    0,

                                max:
                                    1,


                                ticks: {

                                    color:
                                        "#b9ccd3",

                                    stepSize:
                                        0.1

                                },


                                grid: {

                                    color:
                                        "rgba(255,255,255,0.08)"

                                },


                                title: {

                                    display:
                                        true,

                                    text:
                                        "TOPSIS Score",

                                    color:
                                        "#d9f7f3",

                                    font: {

                                        size:
                                            14,

                                        weight:
                                            "bold"

                                    }

                                }

                            },


                            x: {

                                ticks: {

                                    color:
                                        "#d9f7f3",

                                    font: {

                                        size:
                                            13,

                                        weight:
                                            "bold"

                                    }

                                },


                                grid: {

                                    display:
                                        false

                                },


                                title: {

                                    display:
                                        true,

                                    text:
                                        "Selected Location",

                                    color:
                                        "#d9f7f3",

                                    font: {

                                        size:
                                            14,

                                        weight:
                                            "bold"

                                    }

                                }

                            }

                        }

                    }

                }
            );

    }

});