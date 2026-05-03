# Conduit

A self-hosted CI/CD pipeline visualizer and dashboard.

## Installation

### Linux (One-Liner)

The easiest way to install Conduit on Linux is via our automated script. This will clone the repository, check for dependencies, prompt you for ports, and build everything for you. **After installation, the source code is automatically removed to keep your system clean.**

```bash
curl -fsSL https://raw.githubusercontent.com/vedpatil1345/Conduit/V1/install.sh | bash
```

### Manual Installation (Linux)

If you have already cloned the repository, you can run the installer locally:

```bash
chmod +x install.sh
./install.sh
```

**Features of the Installer:**
- **Custom Ports:** Choose your preferred backend and frontend ports.
- **Auto-Cleanup:** Moves artifacts to a `dist/` folder and deletes source directories to save space.
- **Startup Support:** Optionally adds Conduit to your system's startup apps via a `systemd` user service.

Once installed, you can start the application manually using:
```bash
./start.sh
```

**Prerequisites:**
- Java 17 or higher
- Node.js 20 or higher
- `pnpm` (will be installed automatically if missing)

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
