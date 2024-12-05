from flask import Flask, jsonify

app = Flask(__name__)

# Root route
@app.route('/')
def home():
    return "<h1>Welcome to the Flask App</h1>"


if __name__ == '__main__':
    app.run(debug=True)
