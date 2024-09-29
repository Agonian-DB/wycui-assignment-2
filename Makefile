# Makefile

# Installs the required dependencies using pip
install:
	pip install -r requirements.txt

# Runs the web application locally on http://localhost:3000
run:
	FLASK_APP=app.py flask run --host=0.0.0.0 --port=3000
