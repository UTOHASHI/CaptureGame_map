from flask import render_template, Flask
from game import create_app

app = create_app()  # create_app 内で Blueprints 登録＆DB初期化

@app.route("/")
def index():
    return render_template("index.html")  # project-root/templates/index.html



if __name__ == "__main__":
    app.run(debug=True)
