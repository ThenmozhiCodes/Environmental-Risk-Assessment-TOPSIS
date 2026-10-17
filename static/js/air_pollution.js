// ============================================================
// ECORISK - AIR POLLUTION
// TAMIL NADU DATASET ONLY
// ============================================================

let airMap = null;
let markerLayer = null;
let pollutionChart = null;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAirPollutionMap();

        loadDistricts();

        document
            .getElementById("districtSelect")
            .addEventListener(
                "change",
                handleDistrictChange
            );

        document
            .getElementById("placeSelect")
            .addEventListener(
                "change",
                handlePlaceChange
            );

    }
);


// ============================================================
// INITIALIZE MAP
// ============================================================

function initializeAirPollutionMap() {

    airMap = L.map(
        "airPollutionMap",
        {
            zoomControl: true,
            attributionControl: true
        }
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(
        airMap
    );


    markerLayer =
        L.layerGroup().addTo(
            airMap
        );


    // Same general Tamil Nadu view

    airMap.setView(
        [11.1271, 78.6569],
        7
    );


    loadAllStationsOnMap();

}


// ============================================================
// LOAD ALL TAMIL NADU STATIONS
// ============================================================

async function loadAllStationsOnMap() {

    try {

        const response =
            await fetch(
                "/air_pollution/stations"
            );


        const data =
            await response.json();


        if (data.error) {

            console.error(
                data.error
            );

            return;

        }


        displayStationsOnMap(
            data.stations
        );

    }

    catch (error) {

        console.error(
            "Map loading error:",
            error
        );

    }

}


// ============================================================
// DISPLAY MAP MARKERS
// ============================================================

function displayStationsOnMap(
    stations
) {

    markerLayer.clearLayers();


    const bounds = [];


    stations.forEach(
        function (station) {

            const latitude =
                Number(
                    station.latitude
                );


            const longitude =
                Number(
                    station.longitude
                );


            if (

                Number.isNaN(latitude) ||
                Number.isNaN(longitude)

            ) {

                return;

            }


            bounds.push([
                latitude,
                longitude
            ]);


            // --------------------------------------------
            // Risk based marker color
            // --------------------------------------------

            const markerColor =
                getRiskColor(
                    station.risk
                );


            // --------------------------------------------
            // Marker
            // --------------------------------------------

            const marker =
                L.circleMarker(

                    [
                        latitude,
                        longitude
                    ],

                    {

                        radius: 9,

                        color: "#ffffff",

                        weight: 2,

                        fillColor:
                            markerColor,

                        fillOpacity: 0.95

                    }

                );


            // --------------------------------------------
            // Popup
            // --------------------------------------------

            const popupHTML = `

                <div class="station-popup">

                    <h4>
                        ${escapeHtml(
                            station.station
                        )}
                    </h4>

                    <p>
                        <strong>District:</strong>
                        ${escapeHtml(
                            station.district
                        )}
                    </p>

                    <p>
                        <strong>Place:</strong>
                        ${escapeHtml(
                            station.city
                        )}
                    </p>

                    <p>
                        <strong>TOPSIS:</strong>
                        ${Number(
                            station.score
                        ).toFixed(3)}
                    </p>

                    <p>
                        <strong>Risk:</strong>
                        ${escapeHtml(
                            station.risk
                        )}
                    </p>

                    <hr>

                    <p>
                        <strong>PM2.5:</strong>
                        ${station.pm25}
                        µg/m³
                    </p>

                    <p>
                        <strong>PM10:</strong>
                        ${station.pm10}
                        µg/m³
                    </p>

                    <p>
                        <strong>NO₂:</strong>
                        ${station.no2}
                        µg/m³
                    </p>

                    <p>
                        <strong>SO₂:</strong>
                        ${station.so2}
                        µg/m³
                    </p>

                    <button
                        class="map-view-btn"
                        onclick="selectStationFromMap(
                            '${escapeJs(station.district)}',
                            '${escapeJs(station.station)}'
                        )"
                    >
                        View Full Analysis
                    </button>

                </div>

            `;


            marker.bindPopup(
                popupHTML
            );


            // Click marker

            marker.on(
                "click",
                function () {

                    loadStationResult(
                        station.district,
                        station.station
                    );

                }
            );


            marker.addTo(
                markerLayer
            );

        }
    );


    // --------------------------------------------
    // Fit Tamil Nadu station bounds
    // --------------------------------------------

    if (bounds.length > 0) {

        airMap.fitBounds(
            bounds,
            {
                padding: [
                    35,
                    35
                ]
            }
        );

    }

}


// ============================================================
// RISK COLOR
// ============================================================

function getRiskColor(
    risk
) {

    const value =
        String(
            risk || ""
        ).toUpperCase();


    if (value === "HIGH") {

        return "#ff5f65";

    }


    if (value === "MODERATE") {

        return "#f2b84b";

    }


    return "#35d39a";

}


// ============================================================
// LOAD DISTRICTS
// ============================================================

async function loadDistricts() {

    const districtSelect =
        document.getElementById(
            "districtSelect"
        );


    try {

        const response =
            await fetch(
                "/air_pollution/districts"
            );


        const data =
            await response.json();


        districtSelect.innerHTML = "";


        const defaultOption =
            document.createElement(
                "option"
            );


        defaultOption.value = "";

        defaultOption.textContent =
            "Select District";


        districtSelect.appendChild(
            defaultOption
        );


        if (
            data.districts &&
            data.districts.length
        ) {

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

    }

    catch (error) {

        console.error(
            "District loading error:",
            error
        );


        districtSelect.innerHTML = `

            <option value="">
                Unable to load districts
            </option>

        `;

    }

}


// ============================================================
// DISTRICT CHANGE
// ============================================================

async function handleDistrictChange() {

    const district =
        document.getElementById(
            "districtSelect"
        ).value;


    const placeSelect =
        document.getElementById(
            "placeSelect"
        );


    resetResult();


    if (!district) {

        placeSelect.disabled = true;

        placeSelect.innerHTML = `

            <option value="">
                Select Place / Monitoring Station
            </option>

        `;


        loadAllStationsOnMap();

        return;

    }


    showLoading(true);


    try {

        // --------------------------------------------
        // Get places
        // --------------------------------------------

        const response =
            await fetch(

                "/air_pollution/district/" +
                encodeURIComponent(
                    district
                )

            );


        const data =
            await response.json();


        placeSelect.innerHTML = `

            <option value="">
                Select Place / Monitoring Station
            </option>

        `;


        if (
            data.places &&
            data.places.length
        ) {

            data.places.forEach(
                function (place) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        place;


                    option.textContent =
                        place;


                    placeSelect.appendChild(
                        option
                    );

                }
            );

        }


        placeSelect.disabled = false;


        // --------------------------------------------
        // Show district stations on map
        // --------------------------------------------

        const stationResponse =
            await fetch(

                "/air_pollution/stations/" +
                encodeURIComponent(
                    district
                )

            );


        const stationData =
            await stationResponse.json();


        displayStationsOnMap(
            stationData.stations || []
        );


    }

    catch (error) {

        console.error(
            "District error:",
            error
        );

    }

    finally {

        showLoading(false);

    }

}


// ============================================================
// PLACE CHANGE
// ============================================================

async function handlePlaceChange() {

    const district =
        document.getElementById(
            "districtSelect"
        ).value;


    const place =
        document.getElementById(
            "placeSelect"
        ).value;


    if (!district || !place) {

        return;

    }


    loadStationResult(
        district,
        place
    );

}


// ============================================================
// LOAD STATION RESULT
// ============================================================

async function loadStationResult(
    district,
    place
) {

    showLoading(true);


    try {

        const response =
            await fetch(

                "/air_pollution/" +
                encodeURIComponent(
                    district
                ) +
                "/" +
                encodeURIComponent(
                    place
                )

            );


        const data =
            await response.json();


        if (data.error) {

            alert(
                data.error
            );

            return;

        }


        // Set dropdown

        document.getElementById(
            "districtSelect"
        ).value =
            district;


        await loadPlacesWithoutMap(
            district
        );


        document.getElementById(
            "placeSelect"
        ).value =
            place;


        displayResult(
            data
        );


        focusSelectedStation(
            data
        );


    }

    catch (error) {

        console.error(
            error
        );


        alert(
            "Unable to load air pollution result."
        );

    }

    finally {

        showLoading(false);

    }

}


// ============================================================
// LOAD PLACES WITHOUT CHANGING MAP
// ============================================================

async function loadPlacesWithoutMap(
    district
) {

    const response =
        await fetch(

            "/air_pollution/district/" +
            encodeURIComponent(
                district
            )

        );


    const data =
        await response.json();


    const placeSelect =
        document.getElementById(
            "placeSelect"
        );


    placeSelect.innerHTML = `

        <option value="">
            Select Place / Monitoring Station
        </option>

    `;


    (data.places || [])
        .forEach(
            function (place) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    place;


                option.textContent =
                    place;


                placeSelect.appendChild(
                    option
                );

            }
        );


    placeSelect.disabled = false;

}


// ============================================================
// MAP BUTTON
// ============================================================

function selectStationFromMap(
    district,
    station
) {

    loadStationResult(
        district,
        station
    );

}


// ============================================================
// DISPLAY RESULT
// ============================================================

function displayResult(
    data
) {

    document.getElementById(
        "resultStation"
    ).textContent =
        data.station;


    document.getElementById(
        "resultDistrict"
    ).textContent =
        data.district;


    document.getElementById(
        "topsisScore"
    ).textContent =
        Number(
            data.score
        ).toFixed(3);


    document.getElementById(
        "pm25Value"
    ).textContent =
        data.pm25;


    document.getElementById(
        "pm10Value"
    ).textContent =
        data.pm10;


    document.getElementById(
        "no2Value"
    ).textContent =
        data.no2;


    document.getElementById(
        "so2Value"
    ).textContent =
        data.so2;


    document.getElementById(
        "recommendation"
    ).textContent =
        data.recommendation;


    // --------------------------------------------
    // Risk badge
    // --------------------------------------------

    const badge =
        document.getElementById(
            "riskBadge"
        );


    badge.textContent =
        data.risk;


    badge.className =
        "risk-badge";


    if (
        data.risk === "LOW"
    ) {

        badge.classList.add(
            "risk-low"
        );

    }

    else if (
        data.risk === "MODERATE"
    ) {

        badge.classList.add(
            "risk-moderate"
        );

    }

    else {

        badge.classList.add(
            "risk-high"
        );

    }


    // --------------------------------------------
    // Chart
    // --------------------------------------------

    createPollutionChart(
        data
    );


    // --------------------------------------------
    // Scroll
    // --------------------------------------------

    document
        .getElementById(
            "resultSection"
        )
        .scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

}


// ============================================================
// BAR CHART
// ============================================================

function createPollutionChart(
    data
) {

    const canvas =
        document.getElementById(
            "pollutionChart"
        );


    if (!canvas) {

        return;

    }


    if (pollutionChart) {

        pollutionChart.destroy();

    }


    pollutionChart =
        new Chart(

            canvas,

            {

                type: "bar",


                data: {

                    labels: [

                        "PM2.5",
                        "PM10",
                        "NO₂",
                        "SO₂"

                    ],


                    datasets: [

                        {

                            label:
                                "Pollution Value (µg/m³)",


                            data: [

                                Number(
                                    data.pm25
                                ),

                                Number(
                                    data.pm10
                                ),

                                Number(
                                    data.no2
                                ),

                                Number(
                                    data.so2
                                )

                            ],


                            borderWidth: 1,

                            borderRadius: 7

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#d7e6eb",

                                font: {

                                    size: 11

                                }

                            }

                        }

                    },


                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#9fb4bd"

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
                                    "#9fb4bd"

                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            },

                            title: {

                                display: true,

                                text:
                                    "Pollution Value (µg/m³)",

                                color:
                                    "#9fb4bd"

                            }

                        }

                    }

                }

            }

        );

}


// ============================================================
// FOCUS SELECTED STATION
// ============================================================

function focusSelectedStation(
    data
) {

    const latitude =
        Number(
            data.latitude
        );


    const longitude =
        Number(
            data.longitude
        );


    if (

        Number.isNaN(latitude) ||
        Number.isNaN(longitude)

    ) {

        return;

    }


    airMap.setView(

        [
            latitude,
            longitude
        ],

        13,

        {
            animate: true
        }

    );


    markerLayer.eachLayer(
        function (layer) {

            const position =
                layer.getLatLng();


            if (

                Math.abs(
                    position.lat -
                    latitude
                ) < 0.00001

                &&

                Math.abs(
                    position.lng -
                    longitude
                ) < 0.00001

            ) {

                layer.openPopup();

            }

        }
    );

}


// ============================================================
// RESET
// ============================================================

function resetResult() {

    document.getElementById(
        "resultStation"
    ).textContent =
        "--";


    document.getElementById(
        "resultDistrict"
    ).textContent =
        "--";


    document.getElementById(
        "topsisScore"
    ).textContent =
        "--";


    document.getElementById(
        "pm25Value"
    ).textContent =
        "--";


    document.getElementById(
        "pm10Value"
    ).textContent =
        "--";


    document.getElementById(
        "no2Value"
    ).textContent =
        "--";


    document.getElementById(
        "so2Value"
    ).textContent =
        "--";


    document.getElementById(
        "recommendation"
    ).textContent =
        "Select a monitoring station to view the recommendation.";


    const badge =
        document.getElementById(
            "riskBadge"
        );


    badge.textContent =
        "--";


    badge.className =
        "risk-badge";


    if (pollutionChart) {

        pollutionChart.destroy();

        pollutionChart = null;

    }

}


// ============================================================
// LOADING
// ============================================================

function showLoading(
    show
) {

    const loading =
        document.getElementById(
            "loading"
        );


    if (!loading) {

        return;

    }


    loading.style.display =
        show
            ? "block"
            : "none";

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

    return String(value)

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


// ============================================================
// JAVASCRIPT STRING ESCAPE
// ============================================================

function escapeJs(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );

}