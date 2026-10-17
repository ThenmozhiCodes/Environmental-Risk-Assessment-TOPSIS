# ============================================================
# ECORISK - crop_area ASSESSMENT
# District + Taluk + TOPSIS + Map
# ============================================================

from flask import Blueprint, render_template, jsonify
import pandas as pd
import numpy as np
import os


crop_area_bp = Blueprint(
    "crop_area",
    __name__,
    url_prefix="/crop_area"
)


# ============================================================
# DATASET PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "static",
    "dataset",
    "Environmental_Risk_Assessment_Dataset(1).xlsx"
)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

REQUIRED_COLUMNS = [
    "District",
    "Taluk",
    "Rice_Area_ha",
    "Groundnut_Area_ha",
    "Sugarcane_Area_ha"
]


# ============================================================
# CLEAN DATASET
# ============================================================

def load_crop_dataset():

    if not os.path.exists(DATASET_PATH):

        raise FileNotFoundError(
            "Dataset not found: " + DATASET_PATH
        )

    df = pd.read_excel(
        DATASET_PATH
    )

    # --------------------------------------------------------
    # Remove completely empty rows
    # --------------------------------------------------------

    df = df.dropna(
        how="all"
    ).copy()

    # --------------------------------------------------------
    # Clean column names
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Check columns
    # --------------------------------------------------------

    missing = [
        col
        for col in REQUIRED_COLUMNS
        if col not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing columns: "
            + ", ".join(missing)
        )

    # --------------------------------------------------------
    # Clean District / Taluk
    # --------------------------------------------------------

    df["District"] = (
        df["District"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    df["Taluk"] = (
        df["Taluk"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Remove invalid rows
    # --------------------------------------------------------

    df = df[
        (df["District"] != "")
        &
        (df["Taluk"] != "")
        &
        (~df["District"].str.lower().eq("district"))
    ].copy()

    # --------------------------------------------------------
    # Numeric crop columns
    # --------------------------------------------------------

    numeric_columns = [
        "Rice_Area_ha",
        "Groundnut_Area_ha",
        "Sugarcane_Area_ha"
    ]

    for col in numeric_columns:

        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

        df[col] = (
            df[col]
            .fillna(0)
        )

    # --------------------------------------------------------
    # TOTAL crop_area
    # --------------------------------------------------------

    df["Total_crop_area_ha"] = (
        df["Rice_Area_ha"]
        +
        df["Groundnut_Area_ha"]
        +
        df["Sugarcane_Area_ha"]
    )

    return df


# ============================================================
# NORMALIZE TEXT
# ============================================================

def normalize_text(value):

    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("-", "")
        .replace("_", "")
    )


# ============================================================
# TOPSIS
# ============================================================

def calculate_topsis(df):

    criteria = [
        "Rice_Area_ha",
        "Groundnut_Area_ha",
        "Sugarcane_Area_ha",
        "Total_crop_area_ha"
    ]

    matrix = (
        df[criteria]
        .astype(float)
        .to_numpy()
    )

    # --------------------------------------------------------
    # Vector normalization
    # --------------------------------------------------------

    denominator = np.sqrt(
        np.sum(
            matrix ** 2,
            axis=0
        )
    )

    # Avoid division by zero
    denominator[
        denominator == 0
    ] = 1

    normalized = (
        matrix /
        denominator
    )

    # --------------------------------------------------------
    # Equal weights
    # --------------------------------------------------------

    weights = np.array([
        0.25,
        0.25,
        0.25,
        0.25
    ])

    weighted = (
        normalized *
        weights
    )

    # --------------------------------------------------------
    # All are BENEFIT criteria
    # Higher crop_area = higher assessment index
    # --------------------------------------------------------

    ideal_best = np.max(
        weighted,
        axis=0
    )

    ideal_worst = np.min(
        weighted,
        axis=0
    )

    # --------------------------------------------------------
    # Distance from ideal best
    # --------------------------------------------------------

    distance_best = np.sqrt(
        np.sum(
            (weighted - ideal_best) ** 2,
            axis=1
        )
    )

    # --------------------------------------------------------
    # Distance from ideal worst
    # --------------------------------------------------------

    distance_worst = np.sqrt(
        np.sum(
            (weighted - ideal_worst) ** 2,
            axis=1
        )
    )

    # --------------------------------------------------------
    # TOPSIS SCORE
    # --------------------------------------------------------

    denominator_score = (
        distance_best
        +
        distance_worst
    )

    denominator_score[
        denominator_score == 0
    ] = 1

    score = (
        distance_worst /
        denominator_score
    )

    return score


# ============================================================
# RISK / ASSESSMENT LEVEL
# ============================================================

def get_assessment_level(score):

    if score >= 0.66:

        return "HIGH"

    elif score >= 0.33:

        return "MODERATE"

    else:

        return "LOW"


# ============================================================
# RECOMMENDATION
# ============================================================

def get_recommendation(level):

    if level == "HIGH":

        return (
            "The location has a higher crop_area assessment "
            "index compared with other locations. Maintain "
            "sustainable crop planning, efficient irrigation "
            "and balanced land utilization practices."
        )

    elif level == "MODERATE":

        return (
            "The location has a moderate crop_area assessment "
            "index. Continue balanced crop planning and improve "
            "efficient use of available agricultural land and "
            "water resources."
        )

    else:

        return (
            "The location has a lower crop_area assessment "
            "index compared with other locations. Consider "
            "suitable crop diversification and sustainable "
            "agricultural practices to improve productive "
            "land utilization."
        )


# ============================================================
# PAGE
# ============================================================

@crop_area_bp.route("/")
def crop_area_page():

    fullname = "User"

    return render_template(
        "crop_area.html",
        fullname=fullname
    )


# ============================================================
# DISTRICTS
# ============================================================

@crop_area_bp.route("/districts")
def get_districts():

    try:

        df = load_crop_dataset()

        districts = sorted(
            df["District"]
            .dropna()
            .astype(str)
            .str.strip()
            .unique()
            .tolist()
        )

        return jsonify({
            "districts": districts
        })

    except Exception as e:

        print(
            "CROP DISTRICT ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# TALUKS
# ============================================================

@crop_area_bp.route(
    "/district/<district>"
)
def get_taluks(district):

    try:

        df = load_crop_dataset()

        requested = normalize_text(
            district
        )

        df["District_Normalized"] = (
            df["District"]
            .apply(normalize_text)
        )

        filtered = df[
            df["District_Normalized"]
            == requested
        ]

        taluks = sorted(
            filtered["Taluk"]
            .dropna()
            .astype(str)
            .str.strip()
            .unique()
            .tolist()
        )

        return jsonify({
            "district": district,
            "taluks": taluks
        })

    except Exception as e:

        print(
            "CROP TALUK ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# crop_area RESULT + TOPSIS
# ============================================================

@crop_area_bp.route(
    "/<district>/<taluk>"
)
def get_crop_result(
    district,
    taluk
):

    try:

        df = load_crop_dataset()

        # ----------------------------------------------------
        # Find selected row
        # ----------------------------------------------------

        district_normalized = normalize_text(
            district
        )

        taluk_normalized = normalize_text(
            taluk
        )

        df["District_Normalized"] = (
            df["District"]
            .apply(normalize_text)
        )

        df["Taluk_Normalized"] = (
            df["Taluk"]
            .apply(normalize_text)
        )

        # ----------------------------------------------------
        # Calculate TOPSIS for ALL locations
        # ----------------------------------------------------

        df["TOPSIS_Score"] = (
            calculate_topsis(df)
        )

        # ----------------------------------------------------
        # Find requested location
        # ----------------------------------------------------

        selected = df[
            (df["District_Normalized"]
             == district_normalized)
            &
            (df["Taluk_Normalized"]
             == taluk_normalized)
        ]

        if selected.empty:

            return jsonify({
                "error":
                    "Selected district/taluk not found"
            }), 404

        row = selected.iloc[0]

        score = float(
            row["TOPSIS_Score"]
        )

        level = get_assessment_level(
            score
        )

        recommendation = (
            get_recommendation(level)
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "district":
                str(row["District"]),

            "taluk":
                str(row["Taluk"]),

            "rice":
                float(row["Rice_Area_ha"]),

            "groundnut":
                float(row["Groundnut_Area_ha"]),

            "sugarcane":
                float(row["Sugarcane_Area_ha"]),

            "totalCropArea":
                float(row["Total_crop_area_ha"]),

            "score":
                score,

            "risk":
                level,

            "recommendation":
                recommendation

        })

    except Exception as e:

        print(
            "CROP RESULT ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500