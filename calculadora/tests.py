from django.test import TestCase

class CalculadoraPageTests(TestCase):
	def test_home_displays_calculator(self):
		response = self.client.get('/')

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Calculadora Interactiva')
