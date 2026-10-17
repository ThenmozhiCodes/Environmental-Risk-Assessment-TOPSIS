# ============================================================
# ECORISK - AIR POLLUTION RISK ASSESSMENT
# DATASET BASED - TAMIL NADU ONLY
# DISTRICT + PLACE / MONITORING STATION + TOPSIS
# ============================================================

from flask import Blueprint, render_template, jsonify, session, redirect, url_for

import pandas as pd
import numpy as np
import os


# ============================================================
# BLUEPRINT
# ============================================================

air_pollution_bp = Blueprint(
    "air_pollution",
    __name__
)


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)


# ============================================================
# DATASET
# ============================================================

DATASET_PATHS = [

    os.path.join(
        BASE_DIR,
        "Air_Pollution(2).csv"
    ),

    os.path.join(
        BASE_DIR,
        "Air_Pollution.csv"
    ),

    os.path.join(
        BASE_DIR,
        "static",
        "Air_Pollution(2).csv"
    ),

    os.path.join(
        BASE_DIR,
        "static",
        "Air_Pollution.csv"
    ),

    os.path.join(
        BASE_DIR,
        "static",
        "dataset",
        "Air_Pollution(2).csv"
    ),

    os.path.join(
        BASE_DIR,
        "static",
        "dataset",
        "Air_Pollution.csv"
    ),

    os.path.join(
        BASE_DIR,
        "datasets",
        "Air_Pollution(2).csv"
    ),

    os.path.join(
        BASE_DIR,
        "datasets",
        "Air_Pollution.csv"
    )

]


# ============================================================
# FIND DATASET
# ============================================================

def get_dataset_path():

    for path in DATASET_PATHS:

        if os.path.isfile(path):

            return path


    # Search project folder

    for root, dirs, files in os.walk(BASE_DIR):

        for file in files:

            if file.lower() in [
                "air_pollution.csv",
                "air_pollution(2).csv"
            ]:

                return os.path.join(
                    root,
                    file
                )


    return None


# ============================================================
# TAMIL NADU CITY -> DISTRICT
# ============================================================
#
# The uploaded dataset has CITY but does not have
# a separate District column.
#
# Therefore:
#
# Chennai       -> Chennai
# Coimbatore    -> Coimbatore
# Cuddalore     -> Cuddalore
# Gummidipoondi -> Tiruvallur
# Thoothukudi   -> Thoothukudi
#
# ============================================================

CITY_TO_DISTRICT = {

    "Chennai": "Chennai",

    "Coimbatore": "Coimbatore",

    "Cuddalore": "Cuddalore",

    "Gummidipoondi": "Tiruvallur",

    "Thoothukudi": "Thoothukudi"

}


# ============================================================
# TOPSIS POLLUTANTS
# ============================================================

POLLUTANTS = [

    "PM2.5",
    "PM10",
    "NO2",
    "SO2"

]


# ============================================================
# TOPSIS WEIGHTS
# ============================================================

WEIGHTS = np.array(
    [
        0.30,   # PM2.5
        0.30,   # PM10
        0.20,   # NO2
        0.20    # SO2
    ],
    dtype=float
)


# ============================================================
# LOAD DATASET
# ============================================================

def load_air_pollution_data():

    dataset_path = get_dataset_path()


    if dataset_path is None:

        raise FileNotFoundError(
            "Air Pollution CSV dataset was not found."
        )


    # --------------------------------------------------------
    # READ CSV
    # --------------------------------------------------------

    df = pd.read_csv(
        dataset_path
    )


    # --------------------------------------------------------
    # CLEAN COLUMN NAMES
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )


    # --------------------------------------------------------
    # REQUIRED COLUMNS
    # --------------------------------------------------------

    required_columns = [

        "state",
        "city",
        "station",
        "latitude",
        "longitude",
        "pollutant_id",
        "pollutant_avg"

    ]


    missing = [

        col

        for col in required_columns

        if col not in df.columns

    ]


    if missing:

        raise ValueError(
            "Missing columns in Air Pollution dataset: "
            + ", ".join(missing)
        )


    # ========================================================
    # TAMIL NADU ONLY
    # ========================================================

    df["state"] = (
        df["state"]
        .fillna("")
        .astype(str)
        .str.strip()
    )


    df = df[
        df["state"]
        .str.lower()
        .eq("tamil nadu")
    ].copy()


    # ========================================================
    # CLEAN CITY
    # ========================================================

    df["city"] = (
        df["city"]
        .fillna("")
        .astype(str)
        .str.strip()
    )


    # ========================================================
    # KEEP ONLY THE TAMIL NADU PLACES PRESENT
    # IN THE DATASET
    # ========================================================

    df = df[
        df["city"].isin(
            CITY_TO_DISTRICT.keys()
        )
    ].copy()


    # ========================================================
    # DISTRICT
    # ========================================================

    df["district"] = (
        df["city"]
        .map(CITY_TO_DISTRICT)
    )


    # ========================================================
    # STATION
    # ========================================================

    df["station"] = (
        df["station"]
        .fillna("")
        .astype(str)
        .str.strip()
    )


    # ========================================================
    # POLLUTANT ID
    # ========================================================

    df["pollutant_id"] = (
        df["pollutant_id"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.upper()
    )


    # ========================================================
    # NORMALIZE POLLUTANT NAMES
    # ========================================================

    df["pollutant_id"] = (
        df["pollutant_id"]
        .replace({

            "PM25": "PM2.5",

            "PM2_5": "PM2.5",

            "PM2.5": "PM2.5",

            "PM10": "PM10",

            "NO2": "NO2",

            "SO2": "SO2"

        })
    )


    # ========================================================
    # NUMERIC VALUES
    # ========================================================

    df["pollutant_avg"] = pd.to_numeric(
        df["pollutant_avg"],
        errors="coerce"
    )


    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce"
    )


    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce"
    )


    # ========================================================
    # ONLY TOPSIS POLLUTANTS
    # ========================================================

    df = df[
        df["pollutant_id"].isin(
            POLLUTANTS
        )
    ].copy()


    # Remove invalid coordinates

    df = df.dropna(
        subset=[
            "latitude",
            "longitude"
        ]
    )


    return df


# ============================================================
# PREPARE ONE ROW PER MONITORING STATION
# ============================================================

def prepare_station_data():

    df = load_air_pollution_data()


    # ========================================================
    # PIVOT POLLUTANTS
    # ========================================================

    station_df = (

        df.pivot_table(

            index=[
                "district",
                "city",
                "station",
                "latitude",
                "longitude"
            ],

            columns="pollutant_id",

            values="pollutant_avg",

            aggfunc="mean"

        )

        .reset_index()

    )


    # ========================================================
    # ENSURE ALL POLLUTANTS EXIST
    # ========================================================

    for pollutant in POLLUTANTS:

        if pollutant not in station_df.columns:

            station_df[pollutant] = np.nan


    # ========================================================
    # FILL MISSING VALUES
    #
    # Use Tamil Nadu station mean for the particular
    # pollutant.
    # ========================================================

    for pollutant in POLLUTANTS:

        station_df[pollutant] = pd.to_numeric(
            station_df[pollutant],
            errors="coerce"
        )


        mean_value = (
            station_df[pollutant]
            .mean()
        )


        if pd.isna(mean_value):

            mean_value = 0


        station_df[pollutant] = (
            station_df[pollutant]
            .fillna(mean_value)
        )


    return station_df


# ============================================================
# TOPSIS
# ============================================================

def calculate_topsis(df):

    if df.empty:

        return np.array([])


    # ========================================================
    # MATRIX
    # ========================================================

    matrix_df = (

        df[POLLUTANTS]

        .apply(
            pd.to_numeric,
            errors="coerce"
        )

        .fillna(0)

    )


    matrix = np.asarray(
        matrix_df.values,
        dtype=float
    )


    # ========================================================
    # VECTOR NORMALIZATION
    # ========================================================

    denominator = np.sqrt(
        np.sum(
            np.square(matrix),
            axis=0
        )
    )


    denominator = np.where(
        denominator == 0,
        1.0,
        denominator
    )


    normalized = (
        matrix / denominator
    )


    # ========================================================
    # WEIGHTED NORMALIZED MATRIX
    # ========================================================

    weighted = (
        normalized *
        WEIGHTS
    )


    # ========================================================
    # IDEAL BEST
    #
    # Higher pollution = higher risk
    # ========================================================

    ideal_best = np.max(
        weighted,
        axis=0
    )


    # ========================================================
    # IDEAL WORST
    # ========================================================

    ideal_worst = np.min(
        weighted,
        axis=0
    )


    # ========================================================
    # DISTANCE FROM HIGH-RISK IDEAL
    # ========================================================

    distance_best = np.sqrt(
        np.sum(
            np.square(
                weighted -
                ideal_best
            ),
            axis=1
        )
    )


    # ========================================================
    # DISTANCE FROM LOW-RISK IDEAL
    # ========================================================

    distance_worst = np.sqrt(
        np.sum(
            np.square(
                weighted -
                ideal_worst
            ),
            axis=1
        )
    )


    # ========================================================
    # TOPSIS SCORE
    #
    # 0 -> lower pollution
    # 1 -> higher pollution
    # ========================================================

    total_distance = (
        distance_best +
        distance_worst
    )


    scores = np.divide(

        distance_worst,

        total_distance,

        out=np.zeros_like(
            distance_worst,
            dtype=float
        ),

        where=(
            total_distance != 0
        )

    )


    return scores


# ============================================================
# RISK CLASSIFICATION
# ============================================================

def get_risk_level(score):

    score = float(score)


    if score < 0.35:

        return (

            "LOW",

            "Air quality is relatively satisfactory. "
            "Continue regular air-quality monitoring, "
            "maintain pollution-control measures and "
            "protect existing green areas."

        )


    elif score < 0.65:

        return (

            "MODERATE",

            "Moderate air-pollution risk detected. "
            "Improve traffic and industrial emission control, "
            "increase green-cover development and continue "
            "regular air-quality monitoring."

        )


    else:

        return (

            "HIGH",

            "High air-pollution risk detected. "
            "Strengthen industrial and traffic emission controls, "
            "increase pollution monitoring and reduce prolonged "
            "outdoor exposure during polluted conditions."

        )


# ============================================================
# COMPLETE STATION RESULTS
# ============================================================

def get_all_station_results():

    station_df = (
        prepare_station_data()
    )


    # ========================================================
    # TOPSIS FOR ALL TN STATIONS
    # ========================================================

    station_df["TOPSIS"] = (
        calculate_topsis(
            station_df
        )
    )


    results = []


    for _, row in station_df.iterrows():

        score = float(
            row["TOPSIS"]
        )


        risk, recommendation = (
            get_risk_level(
                score
            )
        )


        results.append({

            "district":
                str(row["district"]),

            "city":
                str(row["city"]),

            "station":
                str(row["station"]),

            "latitude":
                float(row["latitude"]),

            "longitude":
                float(row["longitude"]),

            "pm25":
                round(
                    float(row["PM2.5"]),
                    2
                ),

            "pm10":
                round(
                    float(row["PM10"]),
                    2
                ),

            "no2":
                round(
                    float(row["NO2"]),
                    2
                ),

            "so2":
                round(
                    float(row["SO2"]),
                    2
                ),

            "score":
                round(
                    score,
                    3
                ),

            "risk":
                risk,

            "recommendation":
                recommendation

        })


    return results


# ============================================================
# PAGE
# ============================================================

@air_pollution_bp.route(
    "/air_pollution"
)
def air_pollution():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )


    return render_template(

        "air_pollution.html",

        fullname=session.get(
            "fullname",
            ""
        )

    )


# ============================================================
# ALL DISTRICTS
# ============================================================

@air_pollution_bp.route(
    "/air_pollution/districts"
)
def get_districts():

    try:

        station_df = (
            prepare_station_data()
        )


        districts = sorted(

            station_df["district"]

            .dropna()

            .astype(str)

            .str.strip()

            .unique()

            .tolist()

        )


        return jsonify({

            "districts":
                districts

        })


    except Exception as e:

        print(
            "AIR DISTRICT ERROR:",
            e
        )


        return jsonify({

            "districts": [],

            "error": str(e)

        }), 500


# ============================================================
# PLACES / STATIONS FOR DISTRICT
# ============================================================

@air_pollution_bp.route(
    "/air_pollution/district/<path:district>"
)
def get_district_places(district):

    try:

        station_df = (
            prepare_station_data()
        )


        district_clean = (
            str(district)
            .strip()
            .lower()
        )


        selected = station_df[

            station_df["district"]
            .astype(str)
            .str.strip()
            .str.lower()
            ==
            district_clean

        ]


        places = sorted(

            selected["station"]

            .dropna()

            .astype(str)

            .str.strip()

            .unique()

            .tolist()

        )


        return jsonify({

            "district":
                district,

            "places":
                places

        })


    except Exception as e:

        print(
            "AIR PLACE ERROR:",
            e
        )


        return jsonify({

            "places": [],

            "error": str(e)

        }), 500


# ============================================================
# ALL TN STATIONS FOR MAP
# ============================================================

@air_pollution_bp.route(
    "/air_pollution/stations"
)
def get_all_stations():

    try:

        results = (
            get_all_station_results()
        )


        return jsonify({

            "stations":
                results

        })


    except Exception as e:

        print(
            "AIR STATION ERROR:",
            e
        )


        return jsonify({

            "stations": [],

            "error": str(e)

        }), 500


# ============================================================
# DISTRICT STATIONS
# ============================================================

@air_pollution_bp.route(
    "/air_pollution/stations/<path:district>"
)
def get_district_stations(district):

    try:

        results = (
            get_all_station_results()
        )


        district_clean = (
            str(district)
            .strip()
            .lower()
        )


        filtered = [

            item

            for item in results

            if (
                item["district"]
                .strip()
                .lower()
                ==
                district_clean
            )

        ]


        return jsonify({

            "stations":
                filtered

        })


    except Exception as e:

        return jsonify({

            "stations": [],

            "error": str(e)

        }), 500


# ============================================================
# SELECTED STATION
# ============================================================

@air_pollution_bp.route(
    "/air_pollution/<path:district>/<path:place>"
)
def get_air_pollution_result(
    district,
    place
):

    try:

        results = (
            get_all_station_results()
        )


        district_clean = (
            str(district)
            .strip()
            .lower()
        )


        place_clean = (
            str(place)
            .strip()
            .lower()
        )


        selected = None


        for item in results:

            if (

                item["district"]
                .strip()
                .lower()
                ==
                district_clean

                and

                item["station"]
                .strip()
                .lower()
                ==
                place_clean

            ):

                selected = item

                break


        if selected is None:

            return jsonify({

                "error":
                    "Selected monitoring station "
                    "is not available in the Tamil Nadu dataset."

            }), 404


        return jsonify(
            selected
        )


    except Exception as e:

        print(
            "AIR RESULT ERROR:",
            e
        )


        return jsonify({

            "error": str(e)

        }), 500