import os
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse, FileResponse

from ft_django.settings import BASE_DIR


def index(request):
	return render(request, 'index.html')


@csrf_exempt
def static(request):
	pathes = request.path.split('/')[2:]

	def find_static_file(pathes):
		directory = os.path.join(BASE_DIR, 'game_app/static/')
		for path in pathes:
			for dir_path, dir_names, file_names in os.walk(directory):
				if str(dir_path) == str(directory):
					if path == pathes[-1]:
						if path in file_names:
							return os.path.join(dir_path, path)
						return None
					if path in dir_names:
						directory = os.path.join(dir_path, path)
						break
					return None

	file_path = find_static_file(pathes)
	content, mime_type = None, None
	if file_path:
		try:
			with open(file_path, 'r') as file:
				content = file.read()
			if file_path.endswith('.html'):
				mime_type = 'text/html'
			elif file_path.endswith('.css'):
				mime_type = 'text/css'
			elif file_path.endswith('.js'):
				mime_type = 'text/javascript'
			elif file_path.endswith('.png'):
				mime_type = 'image/png'
			elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
				mime_type = 'image/jpeg'
			elif file_path.endswith('.svg'):
				mime_type = 'image/svg+xml'
			elif file_path.endswith('.json'):
				mime_type = 'application/json'
			else:
				mime_type = 'text/plain'
		except Exception as e:
			print(e)
			content = None

	if content:
		return HttpResponse(content, content_type=f'{mime_type}; charset=utf8')
	return JsonResponse({"ok": False, "message": f"Error loading '{request.path}'"})
