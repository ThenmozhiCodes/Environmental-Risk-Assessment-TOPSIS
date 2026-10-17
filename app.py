import sqlite3
import random
import pandas as pd
import numpy as np

from air_pollution import air_pollution_bp
from soil_quality import soil_bp
from rainfall_risk import rainfall_bp
from crop_area import crop_area_bp


from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    jsonify
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)





app = Flask(__name__)

app.register_blueprint(soil_bp)
app.register_blueprint(rainfall_bp)
app.register_blueprint(crop_area_bp)
app.register_blueprint(air_pollution_bp)

app.secret_key = "ecorisk_secret_key"

DATABASE = "ecorisk.db"
def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            mobile TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# ==========================
# AIR POLLUTION DATASET
# ==========================

AIR_DATASET = "static/dataset/air_pollution.xlsx"





# ==========================
# DISTRICT NAME CONVERSION
# ==========================

district_mapping = {

    "Chennai": "Madras",
    "Trichy": "Tiruchirappalli",
    "Tuticorin": "Thoothukudi",
    "Kanyakumari": "Nagercoil"

}

# ==========================
# Database Connection
# ==========================

def get_db_connection():

    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row

    return conn

# ==========================
# Landing Page
# ==========================

@app.route("/")
def landing():
    return render_template("landing.html")


# ==========================
# Register
# ==========================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        fullname = request.form.get("fullname")
        email = request.form.get("email")
        mobile = request.form.get("mobile")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if not fullname or not email or not mobile or not password or not confirm_password:
            flash("Please fill all fields.", "danger")
            return redirect(url_for("register"))

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect(url_for("register"))

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email=?", (email,))
        if cursor.fetchone():
            conn.close()
            flash("Email already registered.", "danger")
            return redirect(url_for("register"))

        cursor.execute("SELECT * FROM users WHERE mobile=?", (mobile,))
        if cursor.fetchone():
            conn.close()
            flash("Mobile number already registered.", "danger")
            return redirect(url_for("register"))

        hashed_password = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users(fullname,email,mobile,password)
            VALUES(?,?,?,?)
        """, (fullname, email, mobile, hashed_password))

        conn.commit()
        conn.close()

        flash("Registration Successful. Please Login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


# ==========================
# Login
# ==========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email=?", (email,))
        user = cursor.fetchone()

        conn.close()

        if user and check_password_hash(user["password"], password):

            session["user_id"] = user["id"]
            session["fullname"] = user["fullname"]
            session["email"] = user["email"]

            flash("Login Successful.", "success")

            return redirect(url_for("index"))

        flash("Invalid Email or Password.", "danger")
        return redirect(url_for("login"))

    return render_template("login.html")




# ==========================
# Forgot Password
# ==========================

@app.route("/forgot_password", methods=["GET", "POST"])
def forgot_password():

    if request.method == "GET":

        # Clear old reset sessions whenever the page opens
        session.pop("generated_otp", None)
        session.pop("otp_verified", None)
        session.pop("reset_email", None)

        return render_template(
            "forgot_password.html",
            show_otp=False
        )

    email = request.form.get("email")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    if not user:

        flash("Email is not registered.", "danger")

        return render_template(
            "forgot_password.html",
            show_otp=False
        )

    # Clear old OTP before creating a new one
    session.pop("generated_otp", None)
    session.pop("otp_verified", None)

    otp = str(random.randint(100000, 999999))

    session["generated_otp"] = otp
    session["reset_email"] = email

    return render_template(
        "forgot_password.html",
        show_otp=True,
        otp=otp
    )
@app.route("/verify_otp", methods=["POST"])
def verify_otp():

    entered_otp = request.form.get("otp")

    generated_otp = session.get("generated_otp")

    if generated_otp is None:

        flash("OTP expired. Please generate a new OTP.", "danger")

        return redirect(url_for("forgot_password"))

    if entered_otp == generated_otp:

        session["otp_verified"] = True

        session.pop("generated_otp", None)

        flash("OTP Verified Successfully.", "success")

        return redirect(url_for("reset_password"))

    flash("Wrong OTP! Please generate a new OTP.", "danger")

    session.pop("generated_otp", None)
    session.pop("otp_verified", None)
    session.pop("reset_email", None)

    return redirect(url_for("forgot_password"))
    
    
    
# ==========================
# Reset Password
# ==========================



@app.route("/reset_password", methods=["GET", "POST"])
def reset_password():

    # User must verify OTP first
    if not session.get("otp_verified"):
        flash("Please verify OTP first.", "danger")
        return redirect(url_for("forgot_password"))

    if request.method == "POST":

        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        # Password validation
        if password != confirm_password:

            flash("Passwords do not match.", "danger")

            return redirect(url_for("reset_password"))

        # Hash the new password
        hashed_password = generate_password_hash(password)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update password
        cursor.execute(
            "UPDATE users SET password=? WHERE email=?",
            (
                hashed_password,
                session["reset_email"]
            )
        )

        conn.commit()

        # Get user details for automatic login
        cursor.execute(
            "SELECT * FROM users WHERE email=?",
            (
                session["reset_email"],
            )
        )

        user = cursor.fetchone()

        conn.close()

        # Login automatically
        session["user_id"] = user["id"]
        session["fullname"] = user["fullname"]
        session["email"] = user["email"]

        # Remove reset session values
        session.pop("generated_otp", None)
        session.pop("reset_email", None)
        session.pop("otp_verified", None)

        flash("🎉 Password Reset Successfully! Welcome Back.", "success")

        return redirect(url_for("index"))

    return render_template("reset_password.html")

# ==========================
# Home Page
# ==========================

@app.route("/index")
def index():

    if "user_id" not in session:

        flash("Please Login First.", "warning")

        return redirect(url_for("login"))

    return render_template(
        "index.html",
        fullname=session["fullname"]
    )
    
    
# ==========================
# Air Pollution
# ==========================

@app.route("/air_pollution")
def air_pollution():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "air_pollution.html",
        fullname=session["fullname"]
    )


# ==========================
# Rainfall Risk
# ==========================

@app.route("/rainfall_risk")
def rainfall_risk():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "rainfall_risk.html",
        fullname=session["fullname"]
    )


# ==========================
# crop_area Change
# ==========================

@app.route("/crop_area")
def crop_area():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "crop_area.html",
        fullname=session["fullname"]
    )


# ==========================
# Industrial Impact
# ==========================

@app.route("/industrial_impact")
def industrial_impact():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "industrial_impact.html",
        fullname=session["fullname"]
    )

# ==========================
# Soil Quality
# ==========================

@app.route("/soil_quality")
def soil_quality():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "soil_quality.html",
        fullname=session["fullname"]
    )


# ==========================
# Noise Pollution
# ==========================

@app.route("/noise_pollution")
def noise_pollution():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "noise_pollution.html",
        fullname=session["fullname"]
    )


# ==========================
# Flood Risk
# ==========================

@app.route("/flood_risk")
def flood_risk():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "flood_risk.html",
        fullname=session["fullname"]
    )
    
   # ==========================
# Waste Management
# ==========================

@app.route("/waste_management")
def waste_management():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "waste_management.html",
        fullname=session["fullname"]
    ) 
  


# ==========================
# Biodiversity
# ==========================

@app.route("/biodiversity")
def biodiversity():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "biodiversity.html",
        fullname=session["fullname"]
    )

# ==========================
# Forest Cover
# ==========================

@app.route("/forest_cover")
def forest_cover():

    if "user_id" not in session:
        flash("Please Login First.", "warning")
        return redirect(url_for("login"))

    return render_template(
        "forest_cover.html",
        fullname=session["fullname"]
    )

        
    

# ==========================
# Logout
# ==========================

@app.route("/logout")
def logout():

    session.clear()

    flash("Logged Out Successfully.", "success")

    return redirect(url_for("landing"))


# ==========================
# Run
# ==========================
with app.app_context():
    init_db()
    
if __name__ == "__main__":

    app.run(debug=True)
