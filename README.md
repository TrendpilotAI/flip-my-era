# Flip My Era

A modern web application that allows users to transform their stories across different eras and styles.

## Features

- **Google Authentication**: Secure sign-in with Google OAuth
- **Story Generation**: Create stories in different eras and styles
- **User Dashboard**: Manage your stories and account settings
- **Subscription Plans**: Access premium features with different subscription tiers

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase for authentication and database
- **Deployment**: Netlify
- **AI Integration**: OpenAI/Groq for story generation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation

1. Clone the repository:
```sh
git clone https://github.com/TrendpilotAI/flip-my-era.git
cd flip-my-era
```

2. Install dependencies:
```sh
npm install
```

3. Create a `.env` file based on `.env.example`:
```sh
cp .env.example .env
```

4. Fill in the environment variables in the `.env` file:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=http://localhost:8080
```

5. Start the development server:
```sh
npm run dev
```

6. Open [http://localhost:8080](http://localhost:8080) in your browser.

## Deployment

The application is configured for deployment on Netlify. The `netlify.toml` file contains the necessary configuration.

To deploy:

1. Push your changes to the main branch
2. Netlify will automatically build and deploy the application

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_URL`: The URL of your application (for OAuth redirects)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
