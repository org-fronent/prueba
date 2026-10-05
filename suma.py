# sumar.py

def sumar_numeros(a, b):
    return a + b

if __name__ == "__main__":
    num1 = 15
    num2 = 25
    resultado = sumar_numeros(num1, num2)
    
    print(f"--- EJECUTANDO SUMA EN GITHUB ACTIONS ---")
    print(f"La suma de {num1} + {num2} es: {resultado}")