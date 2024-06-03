import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from requests import post


@csrf_exempt
def err404(request):
    return JsonResponse({'error': '404 Not Found'}, status=404)


@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    data = json.loads(request.body.decode(request.encoding or 'utf-8'))
    if 'username' not in data or 'password' not in data or 'email' not in data:
        return JsonResponse({'error': 'Invalid request'}, status=400)

    username = data['username']
    password = data['password']
    email = data['email']
    if len(username) < 4 or len(username) > 150:
        return JsonResponse({'error': 'Invalid username'}, status=400)
    if len(password) < 8:
        return JsonResponse({'error': 'Invalid password'}, status=400)
    if len(email) < 6 or len(email) > 254:
        return JsonResponse({'error': 'Invalid email'}, status=400)

    if len(User.objects.filter(username=username)) > 0:
        return JsonResponse({'error': 'Username already exists'}, status=400)
    if len(User.objects.filter(email=email)) > 0:
        return JsonResponse({'error': 'Email already exists'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.save()
    return JsonResponse({'success': 'User created'})


@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    data = json.loads(request.body.decode(request.encoding or 'utf-8'))
    if 'username' not in data or 'password' not in data:
        return JsonResponse({'error': 'Invalid request'}, status=400)

    username = data['username']
    password = data['password']
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    auth_login(request, user)
    return JsonResponse({'success': 'Logged in'})


@csrf_exempt
def logout(request):
    auth_logout(request)
    return JsonResponse({'success': 'Logged out'})


@csrf_exempt
def profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    return JsonResponse({'username': request.user.username, 'email': request.user.email})