# 🚀 Conduit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java Version](https://img.shields.io/badge/Java-21-blue.svg)](https://openjdk.org/projects/jdk/21/)
[![Node Version](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-1.2.0-orange.svg)](https://github.com/vedpatil1345/Conduit)

**Conduit** is an enterprise-grade CI/CD visibility platform designed for high-security environments. It provides a centralized, real-time dashboard for monitoring complex pipeline infrastructures while maintaining a zero-trust security model.

---

## 🛡️ Security Architecture

Conduit is engineered with a **Security-First** philosophy, ensuring your pipeline metadata and integration secrets remain compromised.

*   **AES-256 Data Transit**: Every request and response between the frontend and backend is encrypted using AES-256-CBC, preventing man-in-the-middle attacks even on internal networks.
*   **Granular RBAC**: A robust Role-Based Access Control system enforces strict boundaries between `ADMIN`, `MANAGER`, `DEVELOPER`, and `VIEWER` personas.
*   **Encrypted Data Residency**: All persistent data (pipelines, users, runs) is stored in the local `~/.conduit/data` directory using AES-256 encrypted JSON files—no external database required.
*   **Advanced Authentication**: Leverages JWT (RS256) for session management and BCrypt for password hashing with enforced complexity policies.

---

## ✨ Features at a Glance

*   **Live Stream Visualization**: Real-time updates on build progress and deployment status.
*   **Cross-Platform Deployments**: Native support for Linux service integration and Windows standalone executables.
*   **Zero-Database Footprint**: Self-contained storage logic makes Conduit extremely easy to migrate and back up.
*   **Responsive UI**: A premium, mobile-friendly dashboard built with Next.js 15 and TailwindCSS.

---

## 🚀 Deployment Options

### 🐧 1. Linux Production Script (Recommended)
Best for dedicated Linux servers or VPS environments.

```bash
# 1. Download the production installer
curl -fsSL -O https://raw.githubusercontent.com/vedpatil1345/Conduit/V1/install.sh

# 2. Execute the installer
bash install.sh
```

> [!IMPORTANT]
> **Production Note**: The installer builds optimized production artifacts into a `dist/` directory and removes the source code to maintain a clean, secure environment.

### 🐳 2. Containerized Deployment (Docker)
Ideal for orchestrated environments or rapid scaling.

```bash
# Launch the full stack in detached mode
docker-compose up -d
```

### 🪟 3. Windows Standalone Executable
For offline or air-gapped environments, you can package Conduit into a single `.exe` file.

1.  **Build Core Artifacts**:
    *   Backend: `./mvnw clean package`
    *   Frontend: `pnpm install && pnpm run build`
2.  **Package with PyInstaller**:
    ```powershell
    python -m PyInstaller --onefile --windowed --name "Conduit" `
      --add-data "con-frontend/.next;frontend/.next" `
      --add-data "con-frontend/package.json;frontend" `
      --add-data "con-frontend/public;frontend/public" `
      --add-data "con-bakcend/target/*.jar;backend" `
      setup.py
    ```

---

## 🏁 Quick Start

After installation, Conduit will initialize your secure environment. Use the following default credentials for the initial setup:

| Field | Initial Value |
|---|---|
| **Username** | `admin` |
| **Password** | `Admin@123` |
| **Data Directory** | `~/.conduit/` |

*Immediately upon login, navigate to **Settings** to rotate your administrative credentials.*

---

## 🏗️ Technical Specifications

| Component | Technology |
|---|---|
| **Backend Framework** | Spring Boot 3.4 (Java 21) |
| **Frontend Framework** | Next.js 15 (TypeScript) |
| **Styling** | Vanilla CSS + TailwindCSS |
| **Identity Management** | Spring Security + JWT |
| **Encryption Standard** | AES-256-CBC (PKCS5Padding) |

---

## 🤝 Contributing

We welcome contributions from the community. For major changes, please open an issue first to discuss what you would like to change. 

Please ensure you follow the security guidelines when submitting PRs related to the encryption or authentication layers.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
