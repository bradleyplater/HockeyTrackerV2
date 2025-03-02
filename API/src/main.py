import json
from flask import Flask

app = Flask(__name__)

@app.route('/liveness', methods=['GET'])
def liveness():
    return "We are live baby!", 200

if __name__ == '__main__':
    app.run(port=5000)