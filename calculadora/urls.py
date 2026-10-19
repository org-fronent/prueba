from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Carga la función index de views.py
]