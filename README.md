# Gearly Frontend

Gearly Frontend is a React application built with Vite. It serves as the frontend client for the Gearly platform, featuring authentication and a dashboard for API testing and monitoring.

## Features

- **Authentication**: User login and registration (`LandingAuth`).
- **Dashboard**: Protected route that allows authenticated users to view logs and test API endpoints.
- **API Integration**: Connects to the backend via Axios with a structured API service layer.
- **Modern UI**: Styled with Tailwind CSS/custom CSS and Lucide React icons.

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd gearly-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To create a production build, run:
```bash
npm run build
```

This will generate a `dist` folder containing the optimized production files.

## Project Structure

- `src/pages/`: Contains main page components (`LandingAuth`, `Dashboard`).
- `src/services/`: API service configuration and token management (`api.js`).
- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks.
- `src/utils/`: Utility functions.
