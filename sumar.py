import os

def sumar_numeros(a, b):
    return a + b

if __name__ == "__main__":
    # Obtener valores de las variables de entorno (por defecto 0 si no se envían)
    num1 = float(os.getenv("NUM1", 0))
    num2 = float(os.getenv("NUM2", 0))
    
    resultado = sumar_numeros(num1, num2)
    
    print("--- EJECUTANDO SUMA EN GITHUB ACTIONS ---")
    print(f"La suma de {num1} + {num2} es: {resultado}")