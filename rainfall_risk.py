# ============================================================
# RAINFALL RISK ASSESSMENT
# ============================================================

from flask import Blueprint, render_template, jsonify
import pandas as pd
import numpy as np
import os


# ============================================================
# BLUEPRINT
# ============================================================

rainfall_bp = Blueprint(
    "rainfall",
    __name__
)


# ============================================================
# DATASET PATH
# ============================================================

RAINFALL_DATASET = os.path.join(
    "static",
    "dataset",
    "Environmental_Risk_Assessment_Dataset(1).xlsx"
)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

RAINFALL_COLUMNS = [
    "Mean_Annual_Rainfall_mm",
    "SW_Monsoon_mm",
    "NE_Monsoon_mm",
    "Winter_Rainfall_mm",
    "Summer_Rainfall_mm"
]


# ============================================================
# LOAD DATASET
# ============================================================

def load_rainfall_data():

    if not os.path.exists(RAINFALL_DATASET):
        raise FileNotFoundError(
            "Rainfall dataset not found: "
            + RAINFALL_DATASET
        )

    # --------------------------------------------------------
    # Read Excel
    # --------------------------------------------------------

    excel_file = pd.ExcelFile(
        RAINFALL_DATASET,
        engine="openpyxl"
    )

    # Use the first sheet automatically.
    # This avoids the previous worksheet-name problem.
    sheet_name = excel_file.sheet_names[0]

    df = pd.read_excel(
        RAINFALL_DATASET,
        sheet_name=sheet_name,
        engine="openpyxl"
    )

    # --------------------------------------------------------
    # Clean column names
    # --------------------------------------------------------

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Check required columns
    # --------------------------------------------------------

    required_columns = [
        "District",
        "Taluk"
    ] + RAINFALL_COLUMNS

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing columns: "
            + ", ".join(missing_columns)
        )

    # --------------------------------------------------------
    # Clean District and Taluk
    # IMPORTANT:
    # Convert to string BEFORE using strip()
    # This fixes:
    # 'float' object has no attribute 'strip'
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
    # Remove empty District/Taluk rows
    # --------------------------------------------------------

    df = df[
        (df["District"] != "") &
        (df["Taluk"] != "") &
        (df["District"].str.lower() != "nan") &
        (df["Taluk"].str.lower() != "nan")
    ].copy()

    # --------------------------------------------------------
    # Convert rainfall columns to numeric
    # --------------------------------------------------------

    for col in RAINFALL_COLUMNS:

        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

        # Replace missing values by column mean
        mean_value = df[col].mean()

        if pd.isna(mean_value):
            mean_value = 0

        df[col] = df[col].fillna(
            mean_value
        )

    # --------------------------------------------------------
    # Remove duplicate District + Taluk rows
    # --------------------------------------------------------

    df = df.drop_duplicates(
        subset=["District", "Taluk"]
    ).reset_index(drop=True)

    return df


# ============================================================
# RISK CLASSIFICATION
# ============================================================

def get_risk_level(score):

    score = float(score)

    if score < 0.35:

        return (
            "LOW",
            "Rainfall conditions are relatively stable. "
            "Continue regular water-resource monitoring "
            "and maintain existing rainwater management measures."
        )

    elif score < 0.65:

        return (
            "MODERATE",
            "Moderate rainfall risk detected. "
            "Improve rainwater harvesting, drainage management "
            "and seasonal water-resource planning."
        )

    else:

        return (
            "HIGH",
            "High rainfall risk detected. "
            "Strengthen flood preparedness, drainage systems, "
            "rainwater management and water-resource planning."
        )


# ============================================================
# TOPSIS CALCULATION
# ============================================================

def calculate_topsis(df):

    # --------------------------------------------------------
    # Check data
    # --------------------------------------------------------

    if df.empty:
        return np.array([])

    # --------------------------------------------------------
    # Create numeric matrix
    # --------------------------------------------------------

    matrix_df = df[
        RAINFALL_COLUMNS
    ].apply(
        pd.to_numeric,
        errors="coerce"
    )

    matrix_df = matrix_df.fillna(0)

    # Explicit NumPy conversion
    matrix = np.asarray(
        matrix_df.values,
        dtype=float
    )

    # --------------------------------------------------------
    # Weights
    # --------------------------------------------------------

    weights = np.array(
        [0.20, 0.20, 0.20, 0.20, 0.20],
        dtype=float
    )

    # --------------------------------------------------------
    # NORMALIZATION
    # --------------------------------------------------------

    # IMPORTANT:
    # Use np.sum instead of .sum()
    # to avoid the previous int/.sum problem.
    squared_sum = np.sum(
        np.square(matrix),
        axis=0
    )

    denominator = np.sqrt(
        squared_sum
    )

    denominator = np.where(
        denominator == 0,
        1.0,
        denominator
    )

    normalized = (
        matrix / denominator
    )

    # --------------------------------------------------------
    # WEIGHTED NORMALIZED MATRIX
    # --------------------------------------------------------

    weighted = (
        normalized * weights
    )

    # --------------------------------------------------------
    # IDEAL BEST / WORST
    #
    # Higher rainfall = higher rainfall risk
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
    # DISTANCES
    # --------------------------------------------------------

    positive_distance = np.sqrt(
        np.sum(
            np.square(
                weighted - ideal_best
            ),
            axis=1
        )
    )

    negative_distance = np.sqrt(
        np.sum(
            np.square(
                weighted - ideal_worst
            ),
            axis=1
        )
    )

    # --------------------------------------------------------
    # TOPSIS SCORE
    # --------------------------------------------------------

    distance_sum = (
        positive_distance +
        negative_distance
    )

    scores = np.divide(
        negative_distance,
        distance_sum,
        out=np.zeros_like(
            negative_distance,
            dtype=float
        ),
        where=distance_sum != 0
    )

    return scores


# ============================================================
# RAINFALL PAGE
# ============================================================

@rainfall_bp.route("/rainfall_risk")
def rainfall_risk():

    return render_template(
        "rainfall_risk.html"
    )


# ============================================================
# GET ALL DISTRICTS
# ============================================================

@rainfall_bp.route("/rainfall/districts")
def get_districts():

    try:

        df = load_rainfall_data()

        districts = (
            df["District"]
            .dropna()
            .astype(str)
            .str.strip()
            .drop_duplicates()
            .sort_values()
            .tolist()
        )

        return jsonify({
            "districts": districts
        })

    except Exception as e:

        print(
            "DISTRICT ERROR:",
            str(e)
        )

        return jsonify({
            "districts": [],
            "error": str(e)
        }), 500


# ============================================================
# GET TALUKS FOR DISTRICT
# ============================================================

@rainfall_bp.route(
    "/rainfall/district/<path:district>"
)
def get_district_taluks(district):

    try:

        df = load_rainfall_data()

        district_clean = (
            str(district)
            .strip()
            .lower()
        )

        district_df = df[
            df["District"]
            .astype(str)
            .str.strip()
            .str.lower()
            == district_clean
        ].copy()

        if district_df.empty:

            return jsonify({
                "district": district,
                "taluks": []
            })

        taluks = (
            district_df["Taluk"]
            .dropna()
            .astype(str)
            .str.strip()
            .replace("nan", "")
        )

        taluks = [
            t for t in taluks
            if t != ""
        ]

        taluks = sorted(
            list(set(taluks))
        )

        return jsonify({
            "district": district,
            "taluks": taluks
        })

    except Exception as e:

        print(
            "TALUK ERROR:",
            str(e)
        )

        return jsonify({
            "district": district,
            "taluks": [],
            "error": str(e)
        }), 500


# ============================================================
# GET RAINFALL RESULT
# ============================================================

@rainfall_bp.route(
    "/rainfall/<path:district>/<path:taluk>"
)
def rainfall_data(district, taluk):

    try:

        # ----------------------------------------------------
        # Load complete dataset
        # ----------------------------------------------------

        df = load_rainfall_data()

        # ----------------------------------------------------
        # Calculate TOPSIS for ALL TALUKS
        #
        # This is important.
        # TOPSIS should compare all alternatives.
        # ----------------------------------------------------

        df["TOPSIS"] = calculate_topsis(
            df
        )

        # ----------------------------------------------------
        # Clean selected values
        # ----------------------------------------------------

        district_clean = (
            str(district)
            .strip()
            .lower()
        )

        taluk_clean = (
            str(taluk)
            .strip()
            .lower()
        )

        # ----------------------------------------------------
        # Find selected row
        # ----------------------------------------------------

        selected = df[
            (df["District"]
             .astype(str)
             .str.strip()
             .str.lower()
             == district_clean)
            &
            (df["Taluk"]
             .astype(str)
             .str.strip()
             .str.lower()
             == taluk_clean)
        ]

        if selected.empty:

            return jsonify({

                "district": district,

                "taluk": taluk,

                "error":
                    "Selected district/taluk not found"

            }), 404

        # ----------------------------------------------------
        # Selected row
        # ----------------------------------------------------

        row = selected.iloc[0]

        score = float(
            row["TOPSIS"]
        )

        score = round(
            score,
            3
        )

        # ----------------------------------------------------
        # Risk
        # ----------------------------------------------------

        risk, recommendation = (
            get_risk_level(score)
        )

        # ----------------------------------------------------
        # Return JSON
        # ----------------------------------------------------

        return jsonify({

            "district":
                str(row["District"]),

            "taluk":
                str(row["Taluk"]),

            "annualRainfall":
                round(
                    float(
                        row[
                            "Mean_Annual_Rainfall_mm"
                        ]
                    ),
                    2
                ),

            "swMonsoon":
                round(
                    float(
                        row[
                            "SW_Monsoon_mm"
                        ]
                    ),
                    2
                ),

            "neMonsoon":
                round(
                    float(
                        row[
                            "NE_Monsoon_mm"
                        ]
                    ),
                    2
                ),

            "winter":
                round(
                    float(
                        row[
                            "Winter_Rainfall_mm"
                        ]
                    ),
                    2
                ),

            "summer":
                round(
                    float(
                        row[
                            "Summer_Rainfall_mm"
                        ]
                    ),
                    2
                ),

            "score":
                score,

            "risk":
                risk,

            "recommendation":
                recommendation

        })

    except Exception as e:

        print(
            "RAINFALL RESULT ERROR:",
            str(e)
        )

        return jsonify({
            "error": str(e)
        }), 500