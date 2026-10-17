// ============================================================
// ECORISK - SOIL QUALITY
// Complete JavaScript
// ============================================================


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let districtGeoJSON = null;

let districtLayers = {};

let selectedDistrictLayer = null;

let soilQualityChart = null;


// ============================================================
// MAP CONTAINER
// ============================================================

const mapContainer =
    document.getElementById("soilMap");


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDistrictMap();

        loadDistricts();

    }
);


// ============================================================
// LOAD LOCAL GEOJSON
// ============================================================

async function loadDistrictMap() {

    try {

        const response =
            await fetch(
                "/static/geojson/tamil_nadu_districts.geojson"
            );

        if (!response.ok) {

            throw new Error(
                "Local GeoJSON file not found"
            );

        }

        districtGeoJSON =
            await response.json();

        createOfflineMap(
            districtGeoJSON
        );

    }

    catch (error) {

        console.warn(
            "Offline GeoJSON:",
            error
        );

        createFallbackMap();

    }

}


// ============================================================
// CREATE OFFLINE SVG MAP
// ============================================================

function createOfflineMap(geojson) {

    mapContainer.innerHTML = "";

    const svg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

    svg.setAttribute(
        "viewBox",
        "0 0 800 600"
    );

    svg.classList.add(
        "offline-map-svg"
    );

    const features =
        geojson.features || [];

    if (features.length === 0) {

        createFallbackMap();

        return;

    }

    districtLayers = {};

    // --------------------------------------------------------
    // FIND GEOJSON BOUNDING BOX
    // --------------------------------------------------------

    let minX = Infinity;
    let minY = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;


    features.forEach(
        feature => {

            const coordinates =
                getAllCoordinates(
                    feature.geometry
                );

            coordinates.forEach(
                point => {

                    minX =
                        Math.min(
                            minX,
                            point[0]
                        );

                    maxX =
                        Math.max(
                            maxX,
                            point[0]
                        );

                    minY =
                        Math.min(
                            minY,
                            point[1]
                        );

                    maxY =
                        Math.max(
                            maxY,
                            point[1]
                        );

                }
            );

        }
    );


    const width =
        maxX - minX || 1;

    const height =
        maxY - minY || 1;


    // --------------------------------------------------------
    // CREATE DISTRICT PATHS
    // --------------------------------------------------------

    features.forEach(
        feature => {

            const districtName =
                getDistrictName(
                    feature
                );

            if (!districtName) {

                return;

            }


            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            const d =
                createSVGPath(
                    feature.geometry,
                    minX,
                    minY,
                    width,
                    height
                );


            path.setAttribute(
                "d",
                d
            );


            path.classList.add(
                "map-district"
            );


            path.dataset.district =
                districtName;


            // ------------------------------------------------
            // CLICK DISTRICT
            // ------------------------------------------------

            path.addEventListener(
                "click",
                function () {

                    selectDistrict(
                        districtName
                    );

                    highlightDistrict(
                        districtName
                    );

                }
            );


            // ------------------------------------------------
            // HOVER
            // ------------------------------------------------

            path.addEventListener(
                "mouseenter",
                function () {

                    path.style.fill =
                        "#00a990";

                    path.style.stroke =
                        "#ffffff";

                }
            );


            path.addEventListener(
                "mouseleave",
                function () {

                    if (
                        !path.classList.contains(
                            "selected"
                        )
                    ) {

                        path.style.fill = "";

                        path.style.stroke = "";

                    }

                }
            );


            svg.appendChild(
                path
            );


            districtLayers[
                districtName
                    .trim()
                    .toLowerCase()
            ] = path;


            // ------------------------------------------------
            // DISTRICT LABEL
            // ------------------------------------------------

            const center =
                getFeatureCenter(
                    feature.geometry
                );


            if (center) {

                const label =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "text"
                    );


                const x =
                    (
                        (center[0] - minX) /
                        width
                    ) * 760 + 20;


                const y =
                    580 -
                    (
                        (center[1] - minY) /
                        height
                    ) * 540;


                label.setAttribute(
                    "x",
                    x
                );


                label.setAttribute(
                    "y",
                    y
                );


                label.classList.add(
                    "map-label"
                );


                label.textContent =
                    districtName;


                svg.appendChild(
                    label
                );

            }

        }
    );


    mapContainer.appendChild(
        svg
    );


    // --------------------------------------------------------
    // MAP INFORMATION
    // --------------------------------------------------------

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "map-info";


    info.innerHTML =
        "<strong>Offline Map</strong><br>" +
        "Click a district to view soil data.";


    mapContainer.appendChild(
        info
    );

}


// ============================================================
// FALLBACK OFFLINE MAP
// ============================================================

function createFallbackMap() {

    mapContainer.innerHTML = "";

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.width =
        "100%";

    wrapper.style.height =
        "100%";

    wrapper.style.display =
        "flex";

    wrapper.style.alignItems =
        "center";

    wrapper.style.justifyContent =
        "center";

    wrapper.style.flexDirection =
        "column";

    wrapper.style.padding =
        "25px";


    const title =
        document.createElement(
            "div"
        );


    title.textContent =
        "Tamil Nadu District Selection";


    title.style.color =
        "#00e6c3";


    title.style.fontSize =
        "18px";


    title.style.fontWeight =
        "bold";


    title.style.marginBottom =
        "20px";


    wrapper.appendChild(
        title
    );


    const message =
        document.createElement(
            "div"
        );


    message.textContent =
        "Offline map boundary file not found. " +
        "Select a district below.";


    message.style.color =
        "#9eb0bb";


    message.style.fontSize =
        "12px";


    message.style.marginBottom =
        "20px";


    wrapper.appendChild(
        message
    );


    const districtGrid =
        document.createElement(
            "div"
        );


    districtGrid.style.display =
        "grid";


    districtGrid.style.gridTemplateColumns =
        "repeat(4, minmax(100px, 1fr))";


    districtGrid.style.gap =
        "8px";


    districtGrid.style.width =
        "100%";


    districtGrid.style.maxHeight =
        "320px";


    districtGrid.style.overflowY =
        "auto";


    wrapper.appendChild(
        districtGrid
    );


    window.fallbackDistrictGrid =
        districtGrid;


    mapContainer.appendChild(
        wrapper
    );

}


// ============================================================
// GET DISTRICT NAME
// ============================================================

function getDistrictName(feature) {

    if (
        !feature ||
        !feature.properties
    ) {

        return null;

    }


    return (

        feature.properties.REGNAME ||

        feature.properties.DISTRICT ||

        feature.properties.District ||

        feature.properties.NAME ||

        feature.properties.NAME_2 ||

        feature.properties.district

    );

}


// ============================================================
// GET ALL COORDINATES
// ============================================================

function getAllCoordinates(
    geometry
) {

    const result = [];


    function walk(
        coordinates
    ) {

        if (
            typeof coordinates[0] ===
            "number"
        ) {

            result.push(
                coordinates
            );

            return;

        }


        coordinates.forEach(
            item => {

                walk(item);

            }
        );

    }


    if (geometry) {

        walk(
            geometry.coordinates
        );

    }


    return result;

}


// ============================================================
// CREATE SVG PATH
// ============================================================

function createSVGPath(
    geometry,
    minX,
    minY,
    width,
    height
) {

    if (!geometry) {

        return "";

    }


    const parts = [];


    function convertPoint(
        point
    ) {

        const x =
            (
                (point[0] - minX) /
                width
            ) * 760 + 20;


        const y =
            580 -
            (
                (point[1] - minY) /
                height
            ) * 540;


        return [
            x,
            y
        ];

    }


    function polygonPath(
        polygon
    ) {

        let path = "";


        polygon.forEach(
            ring => {

                ring.forEach(
                    (point, index) => {

                        const [
                            x,
                            y
                        ] =
                            convertPoint(
                                point
                            );


                        if (
                            index === 0
                        ) {

                            path +=
                                `M ${x} ${y} `;

                        }

                        else {

                            path +=
                                `L ${x} ${y} `;

                        }

                    }
                );


                path += "Z ";

            }
        );


        return path;

    }


    if (
        geometry.type ===
        "Polygon"
    ) {

        return polygonPath(
            geometry.coordinates
        );

    }


    if (
        geometry.type ===
        "MultiPolygon"
    ) {

        let result = "";


        geometry.coordinates.forEach(
            polygon => {

                result +=
                    polygonPath(
                        polygon
                    );

            }
        );


        return result;

    }


    return "";

}


// ============================================================
// FEATURE CENTER
// ============================================================

function getFeatureCenter(
    geometry
) {

    const coordinates =
        getAllCoordinates(
            geometry
        );


    if (
        coordinates.length === 0
    ) {

        return null;

    }


    let x = 0;
    let y = 0;


    coordinates.forEach(
        point => {

            x += point[0];

            y += point[1];

        }
    );


    return [
        x / coordinates.length,
        y / coordinates.length
    ];

}


// ============================================================
// HIGHLIGHT DISTRICT
// ============================================================

function highlightDistrict(
    district
) {

    Object.values(
        districtLayers
    ).forEach(
        layer => {

            if (layer.classList) {

                layer.classList.remove(
                    "selected"
                );

            }

        }
    );


    const layer =
        districtLayers[
            district
                .trim()
                .toLowerCase()
        ];


    if (layer) {

        layer.classList.add(
            "selected"
        );

        selectedDistrictLayer =
            layer;

    }

}


// ============================================================
// LOAD DISTRICTS
// ============================================================

async function loadDistricts() {

    try {

        const response =
            await fetch(
                "/soil_api/districts"
            );


        if (!response.ok) {

            throw new Error(
                "District API failed: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "Unable to load districts"
            );

        }


        const select =
            document.getElementById(
                "districtSelect"
            );


        select.innerHTML = `
            <option value="">
                Select District
            </option>
        `;


        data.districts.forEach(
            district => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    district;


                option.textContent =
                    district;


                select.appendChild(
                    option
                );


                // Fallback map buttons

                if (
                    window.fallbackDistrictGrid
                ) {

                    createFallbackDistrictButton(
                        district
                    );

                }

            }
        );

    }

    catch (error) {

        console.error(
            "District API error:",
            error
        );


        document.getElementById(
            "loading"
        ).textContent =
            "Unable to load districts: " +
            error.message;

    }

}


// ============================================================
// FALLBACK DISTRICT BUTTON
// ============================================================

function createFallbackDistrictButton(
    district
) {

    const button =
        document.createElement(
            "button"
        );


    button.textContent =
        district;


    button.style.padding =
        "10px 7px";


    button.style.borderRadius =
        "8px";


    button.style.border =
        "1px solid rgba(0,230,195,0.25)";


    button.style.background =
        "rgba(0,230,195,0.06)";


    button.style.color =
        "#d6e5e8";


    button.style.cursor =
        "pointer";


    button.style.fontSize =
        "10px";


    button.addEventListener(
        "click",
        function () {

            selectDistrict(
                district
            );

        }
    );


    window.fallbackDistrictGrid.appendChild(
        button
    );

}


// ============================================================
// SELECT DISTRICT
// ============================================================

async function selectDistrict(
    district
) {

    if (!district) {

        return;

    }


    const select =
        document.getElementById(
            "districtSelect"
        );


    const options =
        Array.from(
            select.options
        );


    const matchingOption =
        options.find(
            option =>
                option.value
                    .trim()
                    .toLowerCase()
                ===
                district
                    .trim()
                    .toLowerCase()
        );


    if (matchingOption) {

        select.value =
            matchingOption.value;

        district =
            matchingOption.value;

    }


    // Highlight district

    highlightDistrict(
        district
    );


    // Show popup

    showDistrictToast(
        district
    );


    // Load blocks

    await loadBlocks(
        district
    );

}


// ============================================================
// DISTRICT POPUP
// ============================================================

function showDistrictToast(
    district
) {

    const oldToast =
        document.querySelector(
            ".district-toast"
        );


    if (oldToast) {

        oldToast.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "district-toast";


    const formattedDistrict =
        String(district)
            .toLowerCase()
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            );


    toast.textContent =
        "You selected " +
        formattedDistrict;


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                function () {

                    if (
                        toast.parentNode
                    ) {

                        toast.remove();

                    }

                },
                250
            );

        },
        1800
    );

}


// ============================================================
// DISTRICT DROPDOWN
// ============================================================

document
    .getElementById(
        "districtSelect"
    )
    .addEventListener(
        "change",
        async function () {

            const district =
                this.value;


            if (!district) {

                return;

            }


            await selectDistrict(
                district
            );

        }
    );


// ============================================================
// LOAD BLOCKS
// ============================================================

async function loadBlocks(
    district
) {

    const blockSelect =
        document.getElementById(
            "blockSelect"
        );


    const blocksCard =
        document.getElementById(
            "blocksCard"
        );


    const blocksContainer =
        document.getElementById(
            "blocksContainer"
        );


    const loading =
        document.getElementById(
            "loading"
        );


    blockSelect.innerHTML = `
        <option value="">
            Loading places...
        </option>
    `;


    blockSelect.disabled =
        true;


    blocksContainer.innerHTML =
        "";


    blocksCard.style.display =
        "none";


    loading.style.display =
        "block";


    try {

        const response =
            await fetch(
                "/soil_api/blocks/" +
                encodeURIComponent(
                    district
                )
            );


        if (!response.ok) {

            throw new Error(
                "Block API failed: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to load blocks"
            );

        }


        blockSelect.innerHTML = `
            <option value="">
                Select Place / Block
            </option>
        `;


        // ----------------------------------------------------
        // DROPDOWN BLOCKS
        // ----------------------------------------------------

        data.blocks.forEach(
            block => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    block;


                option.textContent =
                    block;


                blockSelect.appendChild(
                    option
                );

            }
        );


        blockSelect.disabled =
            false;


        // ----------------------------------------------------
        // BLOCK BUTTONS
        // ----------------------------------------------------

        data.blocks.forEach(
            block => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "block-btn";


                button.textContent =
                    block;


                button.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                ".block-btn"
                            )
                            .forEach(
                                btn =>
                                    btn.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        blockSelect.value =
                            block;


                        loadBlockResult(
                            district,
                            block
                        );

                    }
                );


                blocksContainer.appendChild(
                    button
                );

            }
        );


        blocksCard.style.display =
            "block";

    }

    catch (error) {

        console.error(
            "Block API error:",
            error
        );


        blockSelect.innerHTML = `
            <option value="">
                Unable to load places
            </option>
        `;


        blockSelect.disabled =
            true;

    }


    loading.style.display =
        "none";

}


// ============================================================
// BLOCK DROPDOWN
// ============================================================

document
    .getElementById(
        "blockSelect"
    )
    .addEventListener(
        "change",
        function () {

            const district =
                document.getElementById(
                    "districtSelect"
                ).value;


            const block =
                this.value;


            if (
                district &&
                block
            ) {

                // Highlight corresponding button

                document
                    .querySelectorAll(
                        ".block-btn"
                    )
                    .forEach(
                        btn => {

                            btn.classList.remove(
                                "active"
                            );

                            if (
                                btn.textContent
                                    .trim()
                                ===
                                block
                                    .trim()
                            ) {

                                btn.classList.add(
                                    "active"
                                );

                            }

                        }
                    );


                loadBlockResult(
                    district,
                    block
                );

            }

        }
    );


// ============================================================
// LOAD BLOCK RESULT
// ============================================================

async function loadBlockResult(
    district,
    block
) {

    const resultSection =
        document.getElementById(
            "resultSection"
        );


    resultSection.style.display =
        "block";


    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    // --------------------------------------------------------
    // LOADING MESSAGE
    // --------------------------------------------------------

    document.getElementById(
        "recommendation"
    ).textContent =
        "Calculating TOPSIS assessment...";


    // Reset visualization location

    const visualizationLocation =
        document.getElementById(
            "visualizationLocation"
        );


    if (visualizationLocation) {

        visualizationLocation.textContent =
            "Loading...";

    }


    try {

        // ----------------------------------------------------
        // CALL API
        // ----------------------------------------------------

        const response =
            await fetch(

                "/soil_api/block_result/" +

                encodeURIComponent(
                    district
                ) +

                "/" +

                encodeURIComponent(
                    block
                )

            );


        if (!response.ok) {

            throw new Error(
                "TOPSIS API failed: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                data.message ||
                "Unknown server error"
            );

        }


        // ====================================================
        // LOCATION
        // ====================================================

        document.getElementById(
            "selectedLocation"
        ).textContent =

            data.district +
            " - " +
            data.block;


        // ====================================================
        // YEAR VALUES
        // ====================================================

        document.getElementById(
            "year2023"
        ).textContent =
            data.year_2023_24;


        document.getElementById(
            "year2024"
        ).textContent =
            data.year_2024_25;


        document.getElementById(
            "year2025"
        ).textContent =
            data.year_2025_26;


        document.getElementById(
            "year2026"
        ).textContent =
            data.year_2026_27;


        // ====================================================
        // TOPSIS SCORE
        // ====================================================

        const topsisValue =
            Number(
                data.topsis
            ) || 0;


        document.getElementById(
            "topsisScore"
        ).textContent =
            topsisValue.toFixed(3);


        // ====================================================
        // QUALITY LEVEL
        // ====================================================

        const badge =
            document.getElementById(
                "qualityBadge"
            );


        badge.textContent =
            data.level;


        badge.style.borderColor =
            getLevelBorderColor(
                data.level
            );


        badge.style.color =
            getLevelColor(
                data.level
            );


        badge.style.background =
            getLevelBackground(
                data.level
            );


        // ====================================================
        // RECOMMENDATION
        // ====================================================

        document.getElementById(
            "recommendation"
        ).textContent =
            data.recommendation;


        // ====================================================
        // UPDATE VISUALIZATION
        // ====================================================

        updateSoilQualityChart(
            data
        );

    }

    catch (error) {

        console.error(
            "TOPSIS error:",
            error
        );


        document.getElementById(
            "recommendation"
        ).textContent =
            "Error: " +
            error.message;


        const visualizationLocation =
            document.getElementById(
                "visualizationLocation"
            );


        if (visualizationLocation) {

            visualizationLocation.textContent =
                "Unable to load";

        }

    }

}


// ============================================================
// SOIL QUALITY VISUALIZATION
// ============================================================

function updateSoilQualityChart(
    data
) {

    const canvas =
        document.getElementById(
            "soilQualityChart"
        );


    // If chart HTML is not added yet,
    // don't cause an error.

    if (!canvas) {

        console.warn(
            "soilQualityChart canvas not found"
        );

        return;

    }


    // ========================================================
    // GET YEAR VALUES
    // ========================================================

    const year2023 =
        Number(
            data.year_2023_24
        ) || 0;


    const year2024 =
        Number(
            data.year_2024_25
        ) || 0;


    const year2025 =
        Number(
            data.year_2025_26
        ) || 0;


    const year2026 =
        Number(
            data.year_2026_27
        ) || 0;


    // ========================================================
    // GET TOPSIS
    // ========================================================

    const topsis =
        Number(
            data.topsis
        ) || 0;


    // ========================================================
    // UPDATE LOCATION
    // ========================================================

    const locationElement =
        document.getElementById(
            "visualizationLocation"
        );


    if (locationElement) {

        locationElement.textContent =
            data.district +
            " - " +
            data.block;

    }


    // ========================================================
    // UPDATE VISUAL TOPSIS SCORE
    // ========================================================

    const visualScore =
        document.getElementById(
            "visualTopsisScore"
        );


    if (visualScore) {

        visualScore.textContent =
            topsis.toFixed(3);

    }


    // ========================================================
    // UPDATE TOPSIS PROGRESS
    // ========================================================

    const fill =
        document.getElementById(
            "topsisFill"
        );


    if (fill) {

        let percentage =
            topsis * 100;


        // Keep between 0 and 100

        percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            );


        fill.style.width =
            percentage + "%";


        // Change visual colour according
        // to TOPSIS level

        const level =
            String(
                data.level || ""
            ).toUpperCase();


        if (level === "HIGH") {

            fill.style.background =
                "linear-gradient(90deg,#ff7373,#ff4f4f)";

            fill.style.boxShadow =
                "0 0 15px rgba(255,80,80,0.35)";

        }

        else if (
            level === "MODERATE"
        ) {

            fill.style.background =
                "linear-gradient(90deg,#ffc857,#ffad33)";

            fill.style.boxShadow =
                "0 0 15px rgba(255,190,50,0.35)";

        }

        else {

            fill.style.background =
                "linear-gradient(90deg,#00a990,#00e6c3)";

            fill.style.boxShadow =
                "0 0 15px rgba(0,230,195,0.35)";

        }

    }


    // ========================================================
    // DESTROY OLD CHART
    // ========================================================

    if (soilQualityChart) {

        soilQualityChart.destroy();

        soilQualityChart =
            null;

    }


    // ========================================================
    // CREATE NEW CHART
    // ========================================================

    soilQualityChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels: [

                        "2023-24",
                        "2024-25",
                        "2025-26",
                        "2026-27"

                    ],

                    datasets: [

                        {

                            label:
                                "Soil Value",

                            data: [

                                year2023,
                                year2024,
                                year2025,
                                year2026

                            ],

                            backgroundColor:
                                "rgba(0,230,195,0.55)",

                            borderColor:
                                "#00e6c3",

                            borderWidth: 1,

                            borderRadius: 8,

                            hoverBackgroundColor:
                                "rgba(0,245,200,0.75)"

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    animation: {

                        duration: 700

                    },


                    plugins: {

                        legend: {

                            display: true,

                            labels: {

                                color:
                                    "#d8e5ea",

                                font: {

                                    size: 12

                                }

                            }

                        },


                        tooltip: {

                            backgroundColor:
                                "#102532",

                            titleColor:
                                "#00e6c3",

                            bodyColor:
                                "#ffffff",

                            borderColor:
                                "rgba(0,230,195,0.35)",

                            borderWidth: 1,


                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            " Soil Value: " +
                                            context.parsed.y
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#9fb0ba",

                                font: {

                                    size: 11

                                }

                            },


                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            }

                        },


                        y: {

                            beginAtZero: true,


                            ticks: {

                                color:
                                    "#9fb0ba",

                                font: {

                                    size: 11

                                }

                            },


                            grid: {

                                color:
                                    "rgba(255,255,255,0.06)"

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// LEVEL COLOR
// ============================================================

function getLevelColor(
    level
) {

    if (
        String(level)
            .toUpperCase()
        ===
        "HIGH"
    ) {

        return "#ff7373";

    }


    if (
        String(level)
            .toUpperCase()
        ===
        "MODERATE"
    ) {

        return "#ffc857";

    }


    return "#00f5c8";

}


// ============================================================
// LEVEL BORDER COLOR
// ============================================================

function getLevelBorderColor(
    level
) {

    if (
        String(level)
            .toUpperCase()
        ===
        "HIGH"
    ) {

        return "rgba(255,90,90,0.45)";

    }


    if (
        String(level)
            .toUpperCase()
        ===
        "MODERATE"
    ) {

        return "rgba(255,200,70,0.45)";

    }


    return "rgba(0,230,195,0.35)";

}


// ============================================================
// LEVEL BACKGROUND
// ============================================================

function getLevelBackground(
    level
) {

    if (
        String(level)
            .toUpperCase()
        ===
        "HIGH"
    ) {

        return "rgba(255,80,80,0.10)";

    }


    if (
        String(level)
            .toUpperCase()
        ===
        "MODERATE"
    ) {

        return "rgba(255,190,50,0.10)";

    }


    return "rgba(0,230,195,0.10)";

}