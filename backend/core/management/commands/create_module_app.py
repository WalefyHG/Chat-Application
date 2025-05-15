import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Cria um app Django diretamente na pasta 'modules', com a estrutura básica."

    def add_arguments(self, parser):
        parser.add_argument('app_name', type=str, help='Nome do app a ser criado')

    def handle(self, *args, **kwargs):
        app_name = kwargs['app_name']
        
        # Diretório base para os módulos
        base_dir = os.path.join(os.getcwd(), "modules")
        
        # Criar a pasta 'modules' se não existir
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)
            self.stdout.write(self.style.SUCCESS(f"Criada a pasta 'modules' em {base_dir}"))

        # Diretório do novo app dentro de 'modules'
        app_dir = os.path.join(base_dir, app_name)
        
        if os.path.exists(app_dir):
            self.stdout.write(self.style.ERROR(f"O app '{app_name}' já existe em 'modules'!"))
            return

        # Criar a estrutura básica do app
        os.makedirs(app_dir)
        os.makedirs(os.path.join(app_dir, "migrations"))
        with open(os.path.join(app_dir, "__init__.py"), "w") as f:
            pass  # Arquivo vazio
        with open(os.path.join(app_dir, "admin.py"), "w") as f:
            f.write("from django.contrib import admin\n")
        with open(os.path.join(app_dir, "apps.py"), "w") as f:
            f.write(
                f"from django.apps import AppConfig\n\n"
                f"class {app_name.capitalize()}Config(AppConfig):\n"
                f"    default_auto_field = 'django.db.models.BigAutoField'\n"
                f"    name = 'modules.{app_name}'\n"
            )
        with open(os.path.join(app_dir, "models.py"), "w") as f:
            f.write("from django.db import models\n")
        with open(os.path.join(app_dir, "tests.py"), "w") as f:
            f.write("from django.test import TestCase\n")
        with open(os.path.join(app_dir, "views.py"), "w") as f:
            f.write("from django.shortcuts import render\n")
        with open(os.path.join(app_dir, "migrations", "__init__.py"), "w") as f:
            pass  # Arquivo vazio

        # Criar os novos arquivos: repository.py, schemas.py e controllers.py
        self.create_repository(app_dir)
        self.create_schemas(app_dir)
        self.create_controllers(app_dir)
        self.create_services(app_dir)

        self.stdout.write(self.style.SUCCESS(f"App '{app_name}' criado com sucesso em 'modules/{app_name}'"))

        # Adicionar o app no settings.py
        self.add_to_settings(f"modules.{app_name}")

    def create_repository(self, app_dir):
        repository_file = os.path.join(app_dir, "repository.py")
        with open(repository_file, "w") as f:
            f.write(
                "# Repository"
            )
        self.stdout.write(self.style.SUCCESS(f"Arquivo 'repository.py' criado em '{app_dir}'"))

    def create_schemas(self, app_dir):
        schemas_file = os.path.join(app_dir, "schemas.py")
        with open(schemas_file, "w") as f:
            f.write(
                "# Schemas "
            )
        self.stdout.write(self.style.SUCCESS(f"Arquivo 'schemas.py' criado em '{app_dir}'"))

    def create_controllers(self, app_dir):
        controllers_file = os.path.join(app_dir, "controllers.py")
        with open(controllers_file, "w") as f:
            f.write(
                "# Controllers"
            )
        self.stdout.write(self.style.SUCCESS(f"Arquivo 'controllers.py' criado em '{app_dir}'"))
    def create_services(self, app_dir):
        services_file = os.path.join(app_dir, "services.py")
        with open(services_file, "w") as f:
            f.write(
                "# Services"
            )
        self.stdout.write(self.style.SUCCESS(f"Arquivo 'services.py' criado em '{app_dir}'"))

    def add_to_settings(self, app_path):
        # Ajuste para localizar o settings.py dentro de 'core'
        settings_file = os.path.join(os.getcwd(), "core", "settings.py")

        if not os.path.exists(settings_file):
            self.stdout.write(self.style.ERROR("O arquivo settings.py não foi encontrado no diretório 'core'."))
            return

        with open(settings_file, "r") as file:
            lines = file.readlines()

        # Verificar se já existe uma lista LOCAL_APPS ou algo similar
        local_apps_found = False
        local_apps_start = None
        local_apps_end = None

        for i, line in enumerate(lines):
            if "LOCAL_APPS" in line:  # Encontrar onde começa a lista
                local_apps_start = i
                local_apps_found = True
                continue
            
            if local_apps_found and line.strip() == "]":  # Fim da lista
                local_apps_end = i
                break

        if not local_apps_found:
            self.stdout.write(self.style.ERROR("A lista LOCAL_APPS não foi encontrada no settings.py."))
            return

        # Inserir o app na lista LOCAL_APPS
        inserted = False
        for i in range(local_apps_start + 1, local_apps_end):
            if lines[i].strip() == "]":  # Fim da lista
                lines.insert(i, f"    '{app_path}',\n")
                inserted = True
                break

        if not inserted:
            # Se não encontrou a posição para inserir, tenta adicionar no final da lista
            if local_apps_end:
                lines.insert(local_apps_end, f"    '{app_path}',\n")
                inserted = True

        if inserted:
            with open(settings_file, "w") as file:
                file.writelines(lines)
            self.stdout.write(self.style.SUCCESS(f"App '{app_path}' adicionado à LOCAL_APPS no settings.py."))
        else:
            self.stdout.write(self.style.ERROR("Não foi possível adicionar o app à LOCAL_APPS."))