# ============================================================
# SOIL QUALITY MODEL
# ============================================================

from flask import Blueprint, jsonify
import pandas as pd
import numpy as np
import os


# ============================================================
# BLUEPRINT
# ============================================================

soil_bp = Blueprint(
    "soil_quality",
    __name__
)


# ============================================================
# DATASET PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

SOIL_DATASET = os.path.join(
    BASE_DIR,
    "soil_dataset.xlsx"
)


# ============================================================
# LOAD AND CLEAN DATA
# ============================================================

def load_soil_data():

    df = pd.read_excel(
        SOIL_DATASET,
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
    # Clean District
    # --------------------------------------------------------

    df["District"] = (
        df["District"]
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Clean Block / Place
    # --------------------------------------------------------

    df["Block"] = (
        df["Block"]
        .astype(str)
        .str.strip()
    )

    # --------------------------------------------------------
    # Count columns
    # --------------------------------------------------------

    count_columns = [
        "2023-24 Count",
        "2024-25 Count",
        "2025-26 Count",
        "2026-27 Count"
    ]

    # --------------------------------------------------------
    # Convert count columns to numeric
    # --------------------------------------------------------

    for col in count_columns:

        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

    # --------------------------------------------------------
    # Fill missing values
    # --------------------------------------------------------

    for col in count_columns:

        df[col] = df[col].fillna(
            df[col].mean()
        )

    return df


# ============================================================
# TOPSIS CALCULATION
# ============================================================

def calculate_topsis(df):

    # --------------------------------------------------------
    # TOPSIS Criteria
    # --------------------------------------------------------

    criteria = [
        "2023-24 Count",
        "2024-25 Count",
        "2025-26 Count",
        "2026-27 Count"
    ]

    # --------------------------------------------------------
    # Decision Matrix
    # --------------------------------------------------------

    decision_matrix = (
        df[criteria]
        .to_numpy(dtype=float)
    )

    # --------------------------------------------------------
    # Weights
    # --------------------------------------------------------

    weights = np.array([
        0.25,
        0.25,
        0.25,
        0.25
    ], dtype=float)

    # --------------------------------------------------------
    # Vector Normalization
    # --------------------------------------------------------

    squared_matrix = (
        decision_matrix ** 2
    )

    column_sum = (
        squared_matrix.sum(axis=0)
    )

    denominator = np.sqrt(
        column_sum
    )

    # Avoid division by zero

    denominator[
        denominator == 0
    ] = 1.0

    normalized = (
        decision_matrix /
        denominator
    )

    # --------------------------------------------------------
    # Weighted Normalized Matrix
    # --------------------------------------------------------

    weighted = (
        normalized *
        weights
    )

    # --------------------------------------------------------
    # Ideal Best
    # --------------------------------------------------------

    ideal_best = (
        weighted.max(axis=0)
    )

    # --------------------------------------------------------
    # Ideal Worst
    # --------------------------------------------------------

    ideal_worst = (
        weighted.min(axis=0)
    )

    # ========================================================
    # POSITIVE SEPARATION
    # ========================================================

    positive_difference = (
        weighted -
        ideal_best
    )

    positive_squared = (
        positive_difference ** 2
    )

    positive_sum = (
        positive_squared.sum(axis=1)
    )

    s_positive = np.sqrt(
        positive_sum
    )

    # ========================================================
    # NEGATIVE SEPARATION
    # ========================================================

    negative_difference = (
        weighted -
        ideal_worst
    )

    negative_squared = (
        negative_difference ** 2
    )

    negative_sum = (
        negative_squared.sum(axis=1)
    )

    s_negative = np.sqrt(
        negative_sum
    )

    # ========================================================
    # TOPSIS SCORE
    # ========================================================

    score_denominator = (
        s_positive +
        s_negative
    )

    # Avoid division by zero

    score_denominator[
        score_denominator == 0
    ] = 1.0

    scores = (
        s_negative /
        score_denominator
    )

    return scores


# ============================================================
# TOPSIS LEVEL CLASSIFICATION
# ============================================================

def get_topsis_level(
    score,
    all_scores
):

    # --------------------------------------------------------
    # Convert scores to NumPy array
    # --------------------------------------------------------

    valid_scores = np.array(
        all_scores,
        dtype=float
    )

    # --------------------------------------------------------
    # Remove invalid values
    # --------------------------------------------------------

    valid_scores = valid_scores[
        np.isfinite(valid_scores)
    ]

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if len(valid_scores) == 0:

        return (
            "MODERATE",
            "Soil assessment could not be classified."
        )

    # --------------------------------------------------------
    # Calculate score distribution
    # --------------------------------------------------------

    low_limit = np.percentile(
        valid_scores,
        33.33
    )

    high_limit = np.percentile(
        valid_scores,
        66.67
    )

    # ========================================================
    # LOW
    # ========================================================

    if score <= low_limit:

        level = "LOW"

        recommendation = (
            "The location has a lower soil "
            "assessment index compared with "
            "other locations. Regular soil "
            "assessment and suitable soil "
            "management practices are recommended."
        )

    # ========================================================
    # MODERATE
    # ========================================================

    elif score <= high_limit:

        level = "MODERATE"

        recommendation = (
            "The location has a moderate soil "
            "assessment index. Continue regular "
            "soil monitoring and follow balanced "
            "and sustainable soil management "
            "practices."
        )

    # ========================================================
    # HIGH
    # ========================================================

    else:

        level = "HIGH"

        recommendation = (
            "The location has a higher soil "
            "assessment index compared with "
            "other locations. Continue regular "
            "monitoring and maintain sustainable "
            "soil management practices."
        )

    return (
        level,
        recommendation
    )


# ============================================================
# GET ALL DISTRICTS
# ============================================================

@soil_bp.route(
    "/soil_api/districts"
)
def get_districts():

    try:

        df = load_soil_data()

        districts = sorted(
            df["District"]
            .dropna()
            .unique()
            .tolist()
        )

        return jsonify({

            "success": True,

            "districts": districts

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# GET BLOCKS / PLACES INSIDE DISTRICT
# ============================================================

@soil_bp.route(
    "/soil_api/blocks/<district>"
)
def get_blocks(district):

    try:

        df = load_soil_data()

        # ----------------------------------------------------
        # Find selected district
        # ----------------------------------------------------

        selected = df[
            df["District"]
            .str.strip()
            .str.lower()
            ==
            district.strip().lower()
        ]

        # ----------------------------------------------------
        # District not found
        # ----------------------------------------------------

        if selected.empty:

            return jsonify({

                "success": False,

                "message":
                    "District not found"

            }), 404

        # ----------------------------------------------------
        # Get places / blocks
        # ----------------------------------------------------

        blocks = sorted(
            selected["Block"]
            .dropna()
            .astype(str)
            .str.strip()
            .unique()
            .tolist()
        )

        return jsonify({

            "success": True,

            "district":
                selected["District"].iloc[0],

            "blocks":
                blocks

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500


# ============================================================
# TOPSIS RESULT FOR SELECTED BLOCK / PLACE
# ============================================================

@soil_bp.route(
    "/soil_api/block_result/<district>/<block>"
)
def block_result(
    district,
    block
):

    try:

        # ====================================================
        # LOAD DATASET
        # ====================================================

        df = load_soil_data()

        # ====================================================
        # CALCULATE TOPSIS FOR ALL PLACES
        # ====================================================

        topsis_scores = calculate_topsis(
            df
        )

        df["TOPSIS"] = topsis_scores

        # ====================================================
        # ALL TOPSIS SCORES
        # ====================================================

        all_scores = (
            df["TOPSIS"]
            .to_numpy(dtype=float)
        )

        # ====================================================
        # SELECT DISTRICT
        # ====================================================

        selected_district = df[
            df["District"]
            .str.strip()
            .str.lower()
            ==
            district.strip().lower()
        ].copy()

        # ----------------------------------------------------
        # District not found
        # ----------------------------------------------------

        if selected_district.empty:

            return jsonify({

                "success": False,

                "message":
                    "District not found"

            }), 404

        # ====================================================
        # SELECT BLOCK / PLACE
        # ====================================================

        selected = selected_district[
            selected_district["Block"]
            .str.strip()
            .str.lower()
            ==
            block.strip().lower()
        ]

        # ----------------------------------------------------
        # Block not found
        # ----------------------------------------------------

        if selected.empty:

            return jsonify({

                "success": False,

                "message":
                    "Place / Block not found"

            }), 404

        # ====================================================
        # SELECT FIRST MATCHING ROW
        # ====================================================

        row = selected.iloc[0]

        # ====================================================
        # TOPSIS SCORE
        # ====================================================

        topsis = float(
            row["TOPSIS"]
        )

        topsis = round(
            topsis,
            3
        )

        # ====================================================
        # CLASSIFICATION
        # ====================================================

        level, recommendation = (
            get_topsis_level(
                topsis,
                all_scores
            )
        )

        # ====================================================
        # RETURN RESULT
        # ====================================================

        return jsonify({

            "success": True,

            "district":
                str(
                    row["District"]
                ),

            "block":
                str(
                    row["Block"]
                ),

            # ------------------------------------------------
            # YEAR 2023-24
            # ------------------------------------------------

            "year_2023_24":
                round(
                    float(
                        row["2023-24 Count"]
                    ),
                    2
                ),

            # ------------------------------------------------
            # YEAR 2024-25
            # ------------------------------------------------

            "year_2024_25":
                round(
                    float(
                        row["2024-25 Count"]
                    ),
                    2
                ),

            # ------------------------------------------------
            # YEAR 2025-26
            # ------------------------------------------------

            "year_2025_26":
                round(
                    float(
                        row["2025-26 Count"]
                    ),
                    2
                ),

            # ------------------------------------------------
            # YEAR 2026-27
            # ------------------------------------------------

            "year_2026_27":
                round(
                    float(
                        row["2026-27 Count"]
                    ),
                    2
                ),

            # ------------------------------------------------
            # TOPSIS
            # ------------------------------------------------

            "topsis":
                topsis,

            # ------------------------------------------------
            # LEVEL
            # ------------------------------------------------

            "level":
                level,

            # ------------------------------------------------
            # RECOMMENDATION
            # ------------------------------------------------

            "recommendation":
                recommendation

        })

    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500