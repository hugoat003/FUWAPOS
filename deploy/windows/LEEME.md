# Instalar FUWA POS en la mini PC de caja

Deja el equipo de forma que **al encenderlo arranque solo**: servidor, impresión,
respaldo automático y la app a pantalla completa. Nadie tiene que abrir nada.

## Antes de empezar

- **Node.js 22 LTS** instalado — [nodejs.org](https://nodejs.org)
- El proyecto copiado en el equipo, por ejemplo `C:\fuwa`
- Las dos impresoras conectadas (la de caja por USB, la de cocina en la red)

## 1. Instalar

PowerShell **como administrador**, en la carpeta del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File deploy\windows\instalar.ps1
```

Instala dependencias, compila la app, crea el `.env`, abre el puerto en el
firewall y registra el arranque automático.

## 2. Editar el `.env`

Se creó a partir de `.env.example`. Los tres valores que importan:

```ini
PRINTER_CAJA=windows://RPT009               # nombre del recurso compartido
PRINTER_COCINA=tcp://192.168.1.50:9100      # IP fija de la de cocina
BACKUP_COPIA=C:\Users\Caja\Mi unidad\Respaldos FUWA
```

`instalar.ps1` ya añadió `NODE_ENV=production`, `HOST=0.0.0.0` y `PORT=5174`.

⚠ **No quites `HOST=0.0.0.0`.** Sin esa línea el servidor escucha solo en
`localhost` y **ninguna tablet puede conectarse**, aunque en la caja todo se vea
perfecto. Es el fallo más confuso de todo el montaje.

## 3. Impresora de caja (USB)

1. Instalarla con el driver **"Generic / Text Only"** — con el driver propio de
   3nstar, el spooler intenta rasterizar los comandos ESC/POS y salen jeroglíficos.
2. Propiedades → Compartir → nombre `RPT009` (el mismo del `.env`).

## 4. Inicio de sesión automático (opcional)

El arranque va atado a la **sesión del usuario**, no al arranque de Windows: tanto
la unidad de Google Drive (respaldo) como la impresora compartida (ticket de caja)
solo existen dentro de una sesión iniciada. Un servicio de Windows correría como
SYSTEM y no vería ninguna de las dos.

Eso significa que el sistema arranca **cuando alguien inicia sesión**. Hay dos
formas de resolverlo, y las dos son válidas:

**A) Alguien teclea la contraseña cada mañana.** No hay que configurar nada. Es
lo más seguro y añade cinco segundos a la apertura.

**B) Inicio de sesión automático**, para que al encender no haya que teclear nada:

```
netplwiz  →  desmarcar "Los usuarios deben escribir su nombre y contraseña"
```

Windows pide la contraseña una vez y la guarda para escribirla sola al arrancar.
**La cuenta sigue teniendo contraseña**; lo que cambia es que Windows la teclea
por ti. Quien encienda el equipo entra directo al escritorio.

Si eliges (B), dos precauciones que valen la pena:

- Que la cuenta de la caja sea **usuario estándar, no administrador**, y que la
  cuenta de administrador sea otra, con su propia contraseña. Así, quien encienda
  el equipo no puede instalar nada ni tocar la configuración.
- El **PIN de FUWA es independiente** de Windows: entrar al escritorio no da
  acceso a las ventas. Con un matiz: la sesión de FUWA dura **12 h de
  inactividad**, así que si el equipo se reinicia dentro de ese plazo la app
  vuelve con la sesión del último empleado ya abierta. Al día siguiente
  (más de 12 h cerrados) sí pide PIN. Si prefieres que lo pida **siempre** al
  arrancar, se puede bajar ese plazo o cerrar sesión al apagar: dímelo.

Lo que el inicio automático no protege es el archivo de la base
(`server\data\fuwa.db`) frente a alguien con acceso físico al equipo. Para una
mini PC detrás del mostrador es un riesgo razonable; si el equipo va a estar a la
vista del público, mejor la opción (A).

## 5. IP fija a la mini PC

Las tablets se conectan a ella por IP. Si el router se la cambia, **todas pierden
el servidor a la vez** y no se puede cobrar. Lo más simple es una reserva por
DHCP en el router.

Al arrancar, el servidor imprime en el log las direcciones donde lo ven las
tablets:

```
FUWA POS · servidor de datos en http://0.0.0.0:5174
  desde las tablets: http://192.168.1.20:5174
```

## Probar sin reiniciar

```powershell
Start-ScheduledTask -TaskName "FUWA POS"
```

## Ver qué está pasando

Hay tres archivos en `server\data\logs\` y **cada uno sirve para algo distinto**:

| Archivo | Qué contiene | Cuándo mirarlo |
|---|---|---|
| `fuwa-AAAA-MM-DD.log` | Arranque, reintentos, caídas | No abre la app al encender |
| `servidor.out.log` | Impresoras, respaldos, IP de las tablets | Las comandas o el respaldo fallan |
| `servidor.err.log` | Errores del servidor | Se cae o no levanta |

El comando útil es este — es el equivalente a quedarse mirando el archivo mientras
pasan cosas:

```powershell
Get-Content "server\data\logs\servidor.out.log" -Tail 30 -Wait
```

`-Tail 30` muestra las últimas 30 líneas y `-Wait` deja la ventana abierta
escribiendo las nuevas según ocurren. Se sale con **Ctrl+C**.

Sirve para, en otra ventana, hacer algo en la app y ver el efecto al instante:
mandar una comanda a cocina, o darle *Respaldar ahora*. Si no aparece nada, el
problema es que la acción nunca llegó al servidor.

## Detener para mantenimiento

```powershell
powershell -ExecutionPolicy Bypass -File deploy\windows\detener.ps1
```

Vuelve solo al reiniciar, o con `Start-ScheduledTask`.

## Actualizar a una versión nueva

```powershell
powershell -ExecutionPolicy Bypass -File deploy\windows\detener.ps1
git pull                 # o copiar los archivos nuevos
npm ci
npm run build
Start-ScheduledTask -TaskName "FUWA POS"
```

El `.env` y `server\data\` (base, respaldos) no se tocan.

## Quitar el arranque automático

```powershell
powershell -ExecutionPolicy Bypass -File deploy\windows\desinstalar.ps1
```

No borra datos.

---

## Si algo no arranca

| Síntoma | Causa habitual |
|---|---|
| La app abre pero dice "sin conexión" | Falta `dist\`. Corre `npm run build`. |
| En la caja funciona, las tablets no | Falta `HOST=0.0.0.0` en `.env`, o el firewall. |
| No sale la comanda de cocina | IP equivocada. *Ajustes → Impresoras → Probar cocina* dice si la IP existe o si no hay nadie ahí. Las comandas **no se pierden**: quedan en cola y salen al corregirla. |
| El ticket de caja sale con símbolos raros | La impresora no está con el driver "Generic / Text Only". |
| El respaldo no llega a Drive | La carpeta no es accesible. *Herramientas → Respaldo automático* lo dice al arrancar. |
| No arranca nada al encender | No hay inicio de sesión automático (paso 4), o la tarea está deshabilitada: `Get-ScheduledTask -TaskName "FUWA POS"`. |

Nada de esto pone en riesgo los datos: la base está en `server\data\fuwa.db` y
hay una copia diaria en `server\data\backups\`.
