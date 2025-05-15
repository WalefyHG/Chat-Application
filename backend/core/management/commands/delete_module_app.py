import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Exclui um app da pasta 'modules' e remove a entrada correspondente de LOCAL_APPS no settings.py."

    def add_arguments(self, parser):
        parser.add_argument('app_name', type=str, help='Nome do app a ser excluído')

    def handle(self, *args, **kwargs):
        app_name = kwargs['app_name']
        
        # Diretório base para os módulos
        base_dir = os.path.join(os.getcwd(), "modules", app_name)
        
        # Verificar se o app existe
        if not os.path.exists(base_dir):
            self.stdout.write(self.style.ERROR(f"O app '{app_name}' não existe em 'modules'."))
            return

        # Excluir o diretório do app
        self.delete_app_directory(base_dir)

        # Remover o app do settings.py
        self.remove_from_settings(f"modules.{app_name}")

        self.stdout.write(self.style.SUCCESS(f"App '{app_name}' excluído com sucesso."))

    def delete_app_directory(self, app_dir):
        """Remove o diretório do app e seus arquivos."""
        import shutil
        shutil.rmtree(app_dir)
        self.stdout.write(self.style.SUCCESS(f"Pasta '{app_dir}' excluída com sucesso."))

    def remove_from_settings(self, app_path):
        """Remove a entrada do app no LOCAL_APPS do settings.py."""
        settings_file = os.path.join(os.getcwd(), "core", "settings.py")

        if not os.path.exists(settings_file):
            self.stdout.write(self.style.ERROR("O arquivo settings.py não foi encontrado no diretório 'core'."))
            return

        with open(settings_file, "r") as file:
            lines = file.readlines()

        # Buscar e remover a entrada do app no LOCAL_APPS
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

        # Verificar se a entrada está presente e removê-la
        new_lines = []
        app_removed = False
        for i in range(local_apps_start + 1, local_apps_end):
            if f"'{app_path}'" in lines[i]:
                app_removed = True
                continue
            new_lines.append(lines[i])

        if app_removed:
            # Reescrever as linhas removendo a entrada do app
            lines = lines[:local_apps_start + 1] + new_lines + lines[local_apps_end:]
            with open(settings_file, "w") as file:
                file.writelines(lines)
            self.stdout.write(self.style.SUCCESS(f"Entrada '{app_path}' removida de LOCAL_APPS no settings.py."))
        else:
            self.stdout.write(self.style.ERROR(f"App '{app_path}' não encontrado em LOCAL_APPS no settings.py."))