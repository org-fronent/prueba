import os

def generar_html():
    num1 = float(os.getenv("NUM1", 0))
    num2 = float(os.getenv("NUM2", 0))
    resultado = num1 + num2

    contenido = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Suma Actualizada</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #eef2f3;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .card {{
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
            text-align: center;
        }}
        h1 {{ color: #2c3e50; }}
        .resultado {{ font-size: 3rem; color: #2980b9; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="card">
        <h1>Resultado de la Suma</h1>
        <p>El resultado de sumar <strong>{num1}</strong> + <strong>{num2}</strong> es:</p>
        <div class="resultado">{resultado}</div>
    </div>
</body>
</html>
"""

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(contenido)

if __name__ == "__main__":
    generar_html()