# Web pública y portal real en Hostinger

El workflow **Deploy live website to Hostinger** verifica y compila `main` con Node 22,
API `https://api.eclipse-business.com`, modo `live` y sin basePath. Publica el contenido
de `out/` en `/home/u902414219/domains/eclipse-business.com/public_html` por SSH con
verificación de la clave del servidor. No publica nada desde una PR.

GitHub Pages conserva su workflow y su versión demo. GitHub Actions es quien compila
y transfiere los archivos a Hostinger; no se copian archivos desde GitHub Pages.

## Preparar la conexión una vez

1. Activar SSH en hPanel y registrar una clave pública Ed25519 dedicada al despliegue.
2. Conectar desde Codespaces verificando la huella del servidor con Hostinger.
3. Confirmar la carpeta remota con `pwd` y `ls -ld ~/domains/eclipse-business.com/public_html`.
4. Revisar `ls -la ~/domains/eclipse-business.com/public_html`. Si existe un `.htaccess`
   no vacío, revisar sus reglas y respaldarlo antes de retirarlo o adoptar la configuración
   administrada de este despliegue. El script se detiene sin cambiar el sitio si encuentra
   uno no administrado. También se detiene ante enlaces simbólicos.
5. En **Settings → Secrets and variables → Actions → Secrets**, crear:

   | Secret | Contenido |
   | --- | --- |
   | `HOSTINGER_SSH_KEY` | Clave privada completa dedicada a este sitio, incluidas sus líneas BEGIN/END. |
   | `HOSTINGER_KNOWN_HOSTS` | Entrada de `known_hosts` del servidor ya verificado, para `[185.239.210.183]:65002`. |

   Abrir la clave privada en el editor de Codespaces para copiarla directamente al secret.
   No usar capturas ni pegarla en chats, commits o variables públicas. La clave pública
   `.pub` se registra en Hostinger, no sirve como `HOSTINGER_SSH_KEY`.

   Después de cerrar la sesión SSH con `exit`, recuperar la entrada pública verificada:

   ```bash
   ssh-keygen -F '[185.239.210.183]:65002' -f ~/.ssh/known_hosts
   ```

   No generar confianza automáticamente con `ssh-keyscan` durante el workflow.

6. Crear la variable de repositorio **`HOSTINGER_DEPLOY_ENABLED=true`** solo cuando estén
   listos los dos secrets y se haya revisado la carpeta remota. Sin ella, se construye el
   artefacto pero se omite la publicación.
7. Una vez fusionada la PR, ejecutar **Actions → Deploy live website to Hostinger → Run
   workflow → main**. Los siguientes pushes a `main` despliegan automáticamente. Las
   ejecuciones de otras ramas nunca publican, aunque se lancen manualmente.

El entorno `hostinger-production` puede configurarse con revisores requeridos para
añadir aprobación manual antes de publicar; por defecto el despliegue es automático.
El número comercial puede fijarse posteriormente en la variable `NEXT_PUBLIC_WHATSAPP`.
Hasta entonces conserva el placeholder, según el alcance inicial del despliegue.

## Qué cambia en el hosting

- La raíz sirve la web pública. `/portal/` y sus subrutas redirigen con 302 a las rutas
  españolas existentes en `/es/portal/`, conservando el query string.
- `DirectoryIndex index.html` da prioridad al export sobre la bienvenida PHP de Hostinger.
- Antes de copiar, se crea un respaldo completo en el directorio privado del dominio
  `.eclipse-deploy/backups/<release>.tar.gz`, fuera de `public_html`. Los assets se copian
  primero; se conservan assets anteriores y archivos ajenos al export, sin `--delete`.
- Los archivos públicos se publican con permisos 644 y sus directorios con 755; se
  corrigen también los archivos existentes de una publicación anterior. Los respaldos
  conservan permisos privados. La recuperación preserva los modos del archivo original
  y utiliza un manifiesto privado, compatible con shells sin `/dev/fd`.
- Se serializan despliegues y se verifica la raíz, el portal real, la redirección y la
  salud de la API. Si falla la copia o los chequeos posteriores, se restaura el respaldo
  y se retiran los archivos introducidos por esa publicación.
- Las comprobaciones no crean cuentas ni intentan login. Tras el primer despliegue,
  verificar también la navegación y las recargas desde Safari/iPad, y limpiar la caché
  de Hostinger si continúa mostrando la bienvenida.

Los respaldos y las carpetas de staging se conservan para recuperación. Vigilar el
espacio de hosting y retirar versiones antiguas manualmente después de guardar un
respaldo independiente. No borrar la versión actual ni su respaldo mientras pueda
necesitarse un rollback.

## Recuperación manual

El identificador de release y la ruta del respaldo aparecen en el log de publicación.
Desde una copia del repositorio que corresponda a esa ejecución, restaurar por SSH:

```bash
ssh -p 65002 -i ~/.ssh/eclipse_hostinger_actions -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes u902414219@185.239.210.183 \
  'bash -s -- rollback /home/u902414219/domains/eclipse-business.com/public_html IDENTIFICADOR_DE_RELEASE' \
  < scripts/hostinger-publish.sh
```

Esto restaura archivos; no elimina cuentas ni modifica Neon o Render. Si aparece un
lock después de una interrupción, confirmar que no siga ejecutándose otra publicación
antes de retirar exclusivamente `.eclipse-deploy/lock` y reintentar.

SMTP sigue desactivado en la API: este despliegue no habilita por sí solo los correos
de verificación o recuperación de clientes. Las credenciales de administrador no se
usan en el formulario de clientes. Los JWT, el JSON de administradores y las URLs de
PostgreSQL permanecen en Render; no se necesitan en este workflow.
