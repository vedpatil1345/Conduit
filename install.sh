#!/bin/bash

# Conduit Linux Installation Script (No Docker)
# This script clones the repository (if needed), builds the project,
# cleans up the source code, and optionally adds the app to startup.

set -e

echo "------------------------------------------------"
echo "🚀 Starting Conduit Installation for Linux..."
echo "------------------------------------------------"

# --- Bootstrap: Ensure we are in the project directory ---
if [ ! -d "con-bakcend" ] || [ ! -d "con-frontend" ]; then
    echo "📦 Project files not found in current directory."
    if [ -d "Conduit" ]; then
        echo "📂 Found 'Conduit' directory. Entering it..."
        cd Conduit
    else
        echo "🌐 Cloning Conduit repository from GitHub..."
        git clone https://github.com/vedpatil1345/Conduit.git
        cd Conduit
    fi
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Dependency Checks
echo "🔍 Checking dependencies..."

# Check for git
if ! command_exists git; then
    echo "❌ Error: git is not installed. Please install git."
    exit 1
fi

# Check for Java 17+
if command_exists java; then
    # Extract major version
    JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}' | cut -d. -f1)
    # For versions like 1.8.x, the major version is the second field
    if [[ "$JAVA_VER" == "1" ]]; then
        JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}' | cut -d. -f2)
    fi

    if [[ "$JAVA_VER" -lt 17 ]]; then
        echo "❌ Error: Java 17 or higher is required. Found version: $JAVA_VER"
        exit 1
    fi
    echo "✅ Java version $JAVA_VER found."
else
    echo "❌ Error: Java 17+ is not installed. Please install OpenJDK 17 or higher."
    exit 1
fi

# Check for Node.js 20+
if command_exists node; then
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_VER" -lt 20 ]]; then
        echo "❌ Error: Node.js 20 or higher is required. Found version: $NODE_VER"
        exit 1
    fi
    echo "✅ Node.js version $(node -v) found."
else
    echo "❌ Error: Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

# Check for pnpm
if ! command_exists pnpm; then
    echo "📦 pnpm not found. Attempting to install via npm..."
    npm install -g pnpm || { echo "❌ Failed to install pnpm. Please install it manually: https://pnpm.io/installation"; exit 1; }
fi
echo "✅ pnpm version $(pnpm -v) found."

# 2. Configuration
echo "------------------------------------------------"
echo "⚙️  Configuration"
echo "------------------------------------------------"

# Prompt for Backend Port
read -p "Enter Backend Port [default: 8080]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8080}

# Prompt for Frontend Port
read -p "Enter Frontend Port [default: 3000]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Prompt for Secret Key (used for AES-256 API encryption)
echo ""
echo "🔑 Encryption Secret Key"
echo "   This key is shared between the backend and frontend for AES-256 request/response encryption."
echo "   Requirements: exactly 32 characters. Leave blank to auto-generate a secure key."
read -s -p "Enter Secret Key [leave blank to auto-generate]: " SECRET_KEY
echo ""
if [[ -z "$SECRET_KEY" ]]; then
    # Generate a random 32-character hex key
    SECRET_KEY=$(openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | head -c 32)
    echo "🔑 Auto-generated secret key."
elif [[ ${#SECRET_KEY} -ne 32 ]]; then
    echo "❌ Error: Secret key must be exactly 32 characters. Got ${#SECRET_KEY}."
    exit 1
fi

echo "Using Backend Port:  $BACKEND_PORT"
echo "Using Frontend Port: $FRONTEND_PORT"
echo "Secret Key:          [set - not displayed for security]"

# 3. Build Backend
echo "🏗️  Building Backend (Java)..."
cd con-bakcend
chmod +x mvnw
./mvnw clean package -DskipTests
cd ..
echo "✅ Backend build successful."

# 4. Build Frontend
echo "🏗️  Building Frontend (Next.js)..."
cd con-frontend
pnpm install
# Pass the backend URL and secret key to the build process
export NEXT_PUBLIC_API_URL="http://127.0.0.1:$BACKEND_PORT"
export NEXT_PUBLIC_SECRET_KEY="$SECRET_KEY"
pnpm run build
cd ..
echo "✅ Frontend build successful."

# 5. Preparing Distribution
echo "🧹 Cleaning up source code and preparing distribution..."

# Create distribution directory
mkdir -p dist/backend
mkdir -p dist/frontend

# Copy Backend Artifact
cp con-bakcend/target/*.jar dist/backend/conduit-backend.jar

# Copy Frontend Artifacts (Next.js standalone mode)
if [ -d "con-frontend/.next/standalone" ]; then
    cp -r con-frontend/.next/standalone/* dist/frontend/
    cp -r con-frontend/public dist/frontend/public
    mkdir -p dist/frontend/.next
    cp -r con-frontend/.next/static dist/frontend/.next/static
else
    echo "❌ Error: Frontend build did not produce standalone output."
    exit 1
fi

# 6. Create Run Script
echo "📝 Creating start.sh..."
INSTALL_DIR=$(pwd)
cat <<EOF > start.sh
#!/bin/bash
# Conduit Start Script

# Configuration
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
NEXT_PUBLIC_API_URL="http://127.0.0.1:\$BACKEND_PORT"

# Secrets — injected at install time, never stored in source code
export CONDUIT_SECRET_KEY="$SECRET_KEY"

# Function to stop everything on exit
cleanup() {
    echo "Stopping Conduit..."
    kill \$BACKEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend on port \$BACKEND_PORT..."
java -Dserver.port=\$BACKEND_PORT -jar $INSTALL_DIR/dist/backend/conduit-backend.jar &
BACKEND_PID=\$!

echo "Starting Frontend on port \$FRONTEND_PORT..."
cd $INSTALL_DIR/dist/frontend
export NEXT_PUBLIC_API_URL=\$NEXT_PUBLIC_API_URL
export PORT=\$FRONTEND_PORT
node server.js &
FRONTEND_PID=\$!

wait \$BACKEND_PID \$FRONTEND_PID
EOF

chmod +x start.sh

# 7. Startup Application Setup
echo "------------------------------------------------"
read -p "Do you want to add Conduit to startup? [y/N]: " ADD_TO_STARTUP
if [[ "$ADD_TO_STARTUP" =~ ^[Yy]$ ]]; then
    if command_exists systemctl; then
        echo "⚙️  Setting up systemd user service..."
        mkdir -p ~/.config/systemd/user
        cat <<EOF > ~/.config/systemd/user/conduit.service
[Unit]
Description=Conduit CI/CD Dashboard
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start.sh
Environment="CONDUIT_SECRET_KEY=$SECRET_KEY"
Restart=always

[Install]
WantedBy=default.target
EOF
        systemctl --user daemon-reload
        systemctl --user enable conduit.service
        echo "✅ Startup service enabled! Conduit will start automatically on login."
        echo "💡 Note: To manage the service, use: systemctl --user [start|stop|restart|status] conduit.service"
    else
        echo "⚠️  systemctl not found. Skipping startup setup."
    fi
fi

# 8. Final Cleanup
echo "🗑️  Removing source code directories..."
rm -rf con-bakcend con-frontend
rm -f ConduitWindowsInstaller.spec docker-compose.yml setup.py LICENSE .hintrc .gitignore .gitattributes

echo "------------------------------------------------"
echo "🎉 Installation Complete!"
echo "------------------------------------------------"
echo "The source code has been removed. Only 'dist' and 'start.sh' remain."
echo ""
echo "To run Conduit manually, use:"
echo "  ./start.sh"
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "------------------------------------------------"
