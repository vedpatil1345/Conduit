# Conduit

A self-hosted CI/CD pipeline visualizer and dashboard.

## Getting Started

When you start the Conduit backend for the very first time, it automatically initializes your data directory (`~/.conduit/`) and creates a default administrator account.

**Default Login Credentials:**

- **Username:** `admin`
- **Password:** `admin`

### Post-Installation Setup

1. Log in with the default credentials above.
2. Go to **Settings** and immediately change your password.
3. Go to **Team** to create accounts for your colleagues, assigning them roles like `MANAGER`, `DEVELOPER`, or `VIEWER`.

## Building the Windows Installer (`.exe`)

To package both the Frontend and Backend into a single, offline-capable Windows installer, follow these steps:

### 1. Build the Backend (Java)

Navigate to the `con-bakcend` directory and compile the `.jar` file:

```powershell
cd con-bakcend
.\mvnw clean package -DskipTests
cd ..
```

### 2. Build the Frontend (Next.js)

Navigate to the `con-frontend` directory and create a production build:

```powershell
cd con-frontend
pnpm install
pnpm run build
cd ..
```

### 3. Package the Executable (PyInstaller)

Make sure you have PyInstaller installed (`pip install pyinstaller`).

> [!WARNING]
> If you have `pnpm dev` running, **stop it** before proceeding! Otherwise, PyInstaller will hit a `PermissionError` trying to read `.next/dev/lock`.

Run the following command from the root project directory to create the `ConduitWindowsInstaller.exe`:

```powershell
pip install PyInstaller
python -m PyInstaller --onefile --windowed --name "ConduitWindowsInstaller" --add-data "con-frontend/.next;frontend/.next" --add-data "con-frontend/package.json;frontend" --add-data "con-frontend/public;frontend/public" --add-data "con-bakcend/target/*.jar;backend" setup.py
```

### 4. Locate your Installer

Once finished, your new standalone executable will be located in the `dist\` folder:
`dist\ConduitWindowsInstaller.exe`
