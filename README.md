# Control de Asistencia 👨💼👩💼

![Node.js CI](https://github.com/tu-usuario/control-asistencia/workflows/Node.js%20CI/badge.svg)
![Docker](https://img.shields.io/badge/Docker-Compose-%232496ED.svg?logo=docker)

Sistema de control de asistencia con:
- **Frontend**: Aplicación React/Vite para gestión de empleados
- **Backend**: API REST con NestJS para lógica de negocio
- **Infraestructura**: Configuración Docker lista para producción

## Requisitos 📋
- Node.js v18+
- pnpm v8+
- Docker y Docker Compose

## Instalación ⚙️
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/control-asistencia
cd control-asistencia

# Instalar dependencias
pnpm install
```

## Ejecución 🚀
```bash
# Desarrollo (ambas aplicaciones)
pnpm run dev

# Producción con Docker
docker-compose up --build
```

## Estructura del proyecto 📂
```
attendance-control/
├── apps/
│   ├── client/      # Aplicación React (Vite)
│   └── server/     # API NestJS
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json    # Comandos globales
```

## Configuración Docker 🐳
El archivo `docker-compose.yml` incluye:
- Servicio para el frontend
- Servicio para el backend
- Base de datos PostgreSQL

## Documentación específica 📘
- [Frontend](/apps/client/README.md)
- [Backend](/apps/server/README.md)

## Licencia 📄
MIT © [Tu Nombre] 2024