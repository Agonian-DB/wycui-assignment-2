ifeq ($(OS),Windows_NT)
    # Windows specific settings
    FLASK_RUN=flask run --host=0.0.0.0 --port=3000
    SET_ENV=set FLASK_APP=app.py
    PYTHON=python
else
    # Linux/Unix/MacOS settings
    FLASK_RUN=FLASK_APP=app.py flask run --host=0.0.0.0 --port=3000
    SET_ENV=export FLASK_APP=app.py
    PYTHON=python3
endif

# Install the dependencies
install:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

# Run the Flask application
run:
	$(SET_ENV) && $(FLASK_RUN)
